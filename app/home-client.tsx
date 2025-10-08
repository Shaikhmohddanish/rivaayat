"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import type { Product } from "@/lib/types"
import { HeroSlider } from "@/components/hero-slider"
import { ProductCard } from "@/components/product-card"
import { QuickViewModal } from "@/components/quick-view-modal"
import { TrendingUp } from "lucide-react"

interface HomePageClientProps {
  featuredProducts: (Product & { _id: string })[]
  newProducts: (Product & { _id: string })[]
  trendingProducts: (Product & { _id: string })[] // Added trendingProducts prop
}

export function HomePageClient({ featuredProducts, newProducts, trendingProducts }: HomePageClientProps) {
  const [quickViewProduct, setQuickViewProduct] = useState<(Product & { _id: string }) | null>(null)

  return (
    <div className="w-full overflow-x-hidden">
      <HeroSlider />

      {/* Featured Products */}
      <section className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold">Featured Products</h2>
          <Link href="/shop" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
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

      <section className="bg-background py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 mb-4">
              <TrendingUp className="w-6 h-6 text-primary" />
              <span className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                What's Hot Right Now
              </span>
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
            <Link href="/shop" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8">
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
            <Link href="/shop" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
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
