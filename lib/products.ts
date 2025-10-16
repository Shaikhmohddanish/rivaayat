import "server-only"
import type { Product } from "@/lib/types"

export async function getProduct(idOrSlug: string): Promise<(Product & { _id: string }) | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
    const res = await fetch(`${baseUrl}/api/products/${idOrSlug}`, {
      // Ensure latest data for stock
      cache: "no-store",
    })
    if (!res.ok) return null
    const data = await res.json()
    // API returns product directly, not wrapped
    return data as (Product & { _id: string })
  } catch (e) {
    console.error("Error fetching product:", e)
    return null
  }
}