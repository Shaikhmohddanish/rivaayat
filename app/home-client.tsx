"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import type { Product } from "@/lib/types"
import { HeroSliderPro, type Slide } from "@/components/hero-slider-pro"
import { ProductCard } from "@/components/product-card"
import { QuickViewModal } from "@/components/quick-view-modal"
import { TrendingUp } from "lucide-react"

interface HomePageClientProps {
  featuredProducts: (Product & { _id: string })[]
  newProducts: (Product & { _id: string })[]
  trendingProducts: (Product & { _id: string })[]
}

export function HomePageClient({ featuredProducts, newProducts, trendingProducts }: HomePageClientProps) {
  const [quickViewProduct, setQuickViewProduct] = useState<(Product & { _id: string }) | null>(null)

  const slides: Slide[] = [
    {
      image: "/elegant-ladies-dress-fashion-banner.jpg",
      title: "Discover Timeless Elegance",
      description: "Exquisite dresses crafted for the sophisticated woman",
      cta: "Shop Collection",
      href: "/shop",
    },
    {
      image: "/summer-collection-ladies-dresses.jpg",
      title: "Summer Collection 2024",
      description: "Breathe in the beauty of fresh, feminine styles",
      cta: "View Collection",
      href: "/shop",
    },
    {
      image: "/exclusive-designer-dresses.jpg",
      title: "Exclusive Designer Pieces",
      description: "Limited edition dresses for special moments",
      cta: "Explore Now",
      href: "/shop",
    },
  ]

  return (
    <div className="w-full overflow-x-hidden max-w-full">
      <HeroSliderPro slides={slides} interval={6000} />

      {/* Featured Products */}
      <section className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold">Featured Products</h2>
          <Link
            href="/shop"
            className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4"
          >
            View All
          </Link>
        </div>

        {featuredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product._id} product={product} onQuickView={setQuickViewProduct} />
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-12">No featured products available</p>
        )}
      </section>

      {/* Trending */}
      <section className="bg-background py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 mb-4">
              <TrendingUp className="w-6 h-6 text-primary" />
              <span className="text-sm font-medium uppercase tracking-wider text-muted-foreground">What's Hot Right Now</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-balance">Trending Products</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
              Discover the most popular pieces loved by our community. These styles are flying off the shelves.
            </p>
          </div>

          {trendingProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {trendingProducts.map((product) => (
                <ProductCard key={product._id} product={product} onQuickView={setQuickViewProduct} />
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-12">No trending products available</p>
          )}

          <div className="text-center mt-12">
            <Link
              href="/shop"
              className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8"
            >
              Explore All Products
            </Link>
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      <section className="bg-muted py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold">New Arrivals</h2>
            <Link
              href="/shop"
              className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4"
            >
              View All
            </Link>
          </div>

          {newProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {newProducts.map((product) => (
                <ProductCard key={product._id} product={product} onQuickView={setQuickViewProduct} />
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-12">No new products available</p>
          )}
        </div>
      </section>

      <QuickViewModal product={quickViewProduct} open={!!quickViewProduct} onClose={() => setQuickViewProduct(null)} />
    </div>
  )
}
