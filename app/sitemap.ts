import type { MetadataRoute } from "next"
import { getDatabase } from "@/lib/mongodb"
import type { Product } from "@/lib/types"
import { getSiteUrl } from "@/lib/site-url"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl()

  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/about",
    "/shop",
    "/search",
    "/privacy-policy",
    "/terms-and-conditions",
    "/shipping-policy",
    "/cancellations-and-refunds",
  ].map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.7,
  }))

  try {
    const db = await getDatabase()
    const products = await db
      .collection<Product>("products")
      .find({
        isDraft: { $ne: true },
        isActive: { $ne: false },
      })
      .project({ slug: 1, updatedAt: 1, createdAt: 1 })
      .toArray()

    const productRoutes: MetadataRoute.Sitemap = products.map((product) => {
      const path = `/product/${product.slug || product._id?.toString() || ""}`
      return {
        url: `${siteUrl}${path}`,
        lastModified: product.updatedAt || product.createdAt || new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      }
    })

    return [...staticRoutes, ...productRoutes]
  } catch (error) {
    console.error("Sitemap generation failed:", error)
    return staticRoutes
  }
}
