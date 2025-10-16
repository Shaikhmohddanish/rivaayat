import type { Metadata } from "next"
import ProductGallery from "@/components/product-gallery"
import ProductDetailClient from "@/components/product-detail-client"
import { getProduct } from "@/lib/products"

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const product = await getProduct(id)
  return {
    title: product ? `${product.name} — Shop` : "Product",
    description: product?.description,
    openGraph: {
      images: product?.images?.[0]?.url ? [{ url: product.images[0].url }] : undefined,
    },
  }
}

export default async function ProductPage({ params }: PageProps) {
  const { id } = await params
  const product = await getProduct(id)
  if (!product) return <div className="container py-16">Product not found.</div>

  return (
    <div className="container px-4 py-8">
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
