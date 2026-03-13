import type { Metadata } from "next"
import ProductGallery from "@/components/product-gallery"
import ProductDetailClient from "@/components/product-detail-client"
import { getCloudinaryImageUrl } from "@/lib/cloudinary-image"
import { getProduct } from "@/lib/products"
import { getSiteUrl, toAbsoluteUrl } from "@/lib/site-url"

interface PageProps {
  params: Promise<{ id: string }>
}

const BRAND_NAME = "Rivaayat"
const DEFAULT_IMAGE_PATH = "/logo.png"

function stripHtml(input?: string) {
  if (!input) return ""
  return input.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
}

function truncate(input: string, limit: number) {
  if (input.length <= limit) return input
  return `${input.slice(0, Math.max(0, limit - 1)).trimEnd()}...`
}

function getEffectivePrice(product: Awaited<ReturnType<typeof getProduct>>) {
  if (!product) return null
  const amount = Number(product.discountedPrice ?? product.price ?? product.originalPrice)
  return Number.isFinite(amount) ? amount : null
}

function getProductShareDescription(product: NonNullable<Awaited<ReturnType<typeof getProduct>>>, amount: number | null) {
  const base = truncate(stripHtml(product.description) || `${product.name} by ${BRAND_NAME}.`, 140)
  if (amount === null) return base
  return truncate(`${base} Price: INR ${amount.toLocaleString("en-IN")}.`, 180)
}

function getProductShareImage(product: Awaited<ReturnType<typeof getProduct>>) {
  if (!product?.images?.[0]?.url) {
    return toAbsoluteUrl(DEFAULT_IMAGE_PATH)
  }

  const transformed = getCloudinaryImageUrl(product.images[0].url, {
    width: 1200,
    height: 630,
    mode: "fill",
  })

  return toAbsoluteUrl(transformed || product.images[0].url)
}

function getProductAvailability(product: NonNullable<Awaited<ReturnType<typeof getProduct>>>) {
  const totalStock = product.variations?.variants?.reduce((sum, variant) => sum + (variant.stock || 0), 0) || 0
  return totalStock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
}

function getProductSchema(product: NonNullable<Awaited<ReturnType<typeof getProduct>>>) {
  const effectivePrice = getEffectivePrice(product)
  const canonicalPath = product.slug ? `/product/${product.slug}` : `/product/${product._id}`
  const canonicalUrl = toAbsoluteUrl(canonicalPath)
  const normalizedRating = Number(product.rating)
  const normalizedReviewCount = Number(product.reviewCount)
  const reviewCount = Number.isFinite(normalizedReviewCount) && normalizedReviewCount > 0
    ? Math.floor(normalizedReviewCount)
    : undefined
  const aggregateRating = Number.isFinite(normalizedRating) && normalizedRating > 0
    ? {
        "@type": "AggregateRating",
        ratingValue: Number(normalizedRating.toFixed(1)),
        bestRating: 5,
        worstRating: 1,
        ...(reviewCount ? { reviewCount } : {}),
      }
    : undefined
  const images = product.images?.length
    ? product.images
        .slice(0, 6)
        .map((image) =>
          toAbsoluteUrl(
            getCloudinaryImageUrl(image.url, {
              width: 1200,
              height: 1200,
              mode: "fill",
            }) || image.url,
          ),
        )
    : [toAbsoluteUrl(DEFAULT_IMAGE_PATH)]

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: stripHtml(product.description) || `${product.name} by ${BRAND_NAME}`,
    image: images,
    sku: product._id,
    brand: {
      "@type": "Brand",
      name: product.brand || BRAND_NAME,
    },
    category: product.category || undefined,
    url: canonicalUrl,
    ...(aggregateRating ? { aggregateRating } : {}),
    offers: {
      "@type": "Offer",
      url: canonicalUrl,
      priceCurrency: "INR",
      price: effectivePrice !== null ? String(effectivePrice) : undefined,
      availability: getProductAvailability(product),
      itemCondition: "https://schema.org/NewCondition",
    },
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const product = await getProduct(id)

  const siteUrl = getSiteUrl()
  const canonicalPath = product?.slug ? `/product/${product.slug}` : `/product/${id}`
  const canonicalUrl = toAbsoluteUrl(canonicalPath)

  if (!product || product.isDraft) {
    const notFoundTitle = `Product | ${BRAND_NAME}`
    const notFoundDescription = "Explore the latest styles from Rivaayat."

    return {
      metadataBase: new URL(siteUrl),
      title: notFoundTitle,
      description: notFoundDescription,
      alternates: { canonical: canonicalPath },
      robots: { index: false, follow: false },
      openGraph: {
        type: "website",
        url: canonicalUrl,
        title: notFoundTitle,
        description: notFoundDescription,
        siteName: BRAND_NAME,
        locale: "en_IN",
        images: [{
          url: toAbsoluteUrl(DEFAULT_IMAGE_PATH),
          width: 1200,
          height: 630,
          alt: `${BRAND_NAME} product preview`,
        }],
      },
      twitter: {
        card: "summary_large_image",
        title: notFoundTitle,
        description: notFoundDescription,
        images: [toAbsoluteUrl(DEFAULT_IMAGE_PATH)],
      },
    }
  }

  const amount = getEffectivePrice(product)
  const imageUrl = getProductShareImage(product)
  const shareTitle = amount === null
    ? `${product.name} | ${BRAND_NAME}`
    : `${product.name} | INR ${amount.toLocaleString("en-IN")} | ${BRAND_NAME}`
  const shareDescription = getProductShareDescription(product, amount)

  return {
    metadataBase: new URL(siteUrl),
    title: shareTitle,
    description: shareDescription,
    alternates: { canonical: canonicalPath },
    other: {
      "product:brand": product.brand || BRAND_NAME,
      ...(amount !== null ? { "product:price:amount": String(amount), "product:price:currency": "INR" } : {}),
    },
    openGraph: {
      type: "website",
      url: canonicalUrl,
      title: shareTitle,
      description: shareDescription,
      siteName: BRAND_NAME,
      locale: "en_IN",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: product.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: shareTitle,
      description: shareDescription,
      images: [imageUrl],
    },
  }
}

export default async function ProductPage({ params }: PageProps) {
  const { id } = await params
  const product = await getProduct(id)
  if (!product) return <div className="container py-16">Product not found.</div>

  const productSchema = getProductSchema(product)

  return (
    <div className="container px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      {/* Breadcrumbs (optional) */}
      <nav className="text-sm text-muted-foreground mb-6">
        <span>Home</span> <span className="mx-1">/</span> <span>Shop</span> <span className="mx-1">/</span>
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-8">
        <ProductGallery images={product.images || []} />
        <ProductDetailClient product={product as any} />
      </div>
    </div>
  )
}
