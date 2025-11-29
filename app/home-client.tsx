"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import type { Product } from "@/lib/types"
import { HeroSliderPro, type Slide } from "@/components/hero-slider-pro"
import { ProductCard } from "@/components/product-card"
import { QuickViewModal } from "@/components/quick-view-modal"
import { ShoppingBag, ArrowRight } from "lucide-react"
import { getCachedWishlist, updateWishlistCache } from "@/lib/wishlist-cache"

interface HomePageClientProps {
  featuredProducts: (Product & { _id: string })[]
  newProducts: (Product & { _id: string })[]
  categories: Array<{ name: string; count: number; image?: string }>
}

export function HomePageClient({ featuredProducts, newProducts, categories }: HomePageClientProps) {
  const { data: session, status } = useSession()
  const [quickViewProduct, setQuickViewProduct] = useState<(Product & { _id: string }) | null>(null)
  const [wishlistProductIds, setWishlistProductIds] = useState<string[]>([])

  // 🚀 OPTIMIZATION Item 7 & 11: Fetch wishlist once with cache support
  useEffect(() => {
    const fetchWishlist = async () => {
      if (status !== "authenticated" || !session) {
        setWishlistProductIds([])
        return
      }
      
      // Try cache first for instant display
      const cached = getCachedWishlist()
      if (cached) {
        setWishlistProductIds(cached.productIds)
        console.log("Wishlist loaded from cache:", cached.productIds.length, "items")
      }
      
      try {
        // Fetch fresh data in background
        const res = await fetch("/api/wishlist", { cache: "no-store" })
        if (!res.ok) return
        const data = await res.json()
        const freshIds = data.productIds || []
        setWishlistProductIds(freshIds)
        
        // Update cache
        updateWishlistCache(freshIds)
        console.log("Wishlist updated from API:", freshIds.length, "items")
      } catch (error) {
        console.debug("Failed to fetch wishlist:", error)
      }
    }

    fetchWishlist()
  }, [session, status])

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
              <ProductCard 
                key={product._id} 
                product={product} 
                onQuickView={setQuickViewProduct}
                wishlistProductIds={wishlistProductIds}
                onWishlistChange={setWishlistProductIds}
              />
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-12">No featured products available</p>
        )}
      </section>

      {/* Shop by Categories */}
      <section className="bg-background py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 mb-4">
              <ShoppingBag className="w-6 h-6 text-primary" />
              <span className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Discover Your Style</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-balance">Shop by Categories</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
              Explore our curated categories and find the perfect pieces that match your unique style.
            </p>
          </div>

          {categories.length > 0 ? (
            <div className="relative">
              <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
                {categories.map((category) => (
                  <Link
                    key={category.name}
                    href={`/shop?category=${encodeURIComponent(category.name)}`}
                    className="group flex-none w-64 sm:w-72 snap-start"
                  >
                    <div className="relative overflow-hidden rounded-xl bg-muted hover:shadow-xl transition-all duration-300">
                      <div className="aspect-[4/3] relative">
                        {category.image ? (
                          <img
                            src={category.image}
                            alt={category.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
                            <ShoppingBag className="w-20 h-20 text-primary/50" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-6">
                          <h3 className="text-2xl font-bold text-white mb-2">{category.name}</h3>
                          <p className="text-white/90 text-sm mb-3">{category.count} {category.count === 1 ? 'Product' : 'Products'}</p>
                          <div className="inline-flex items-center text-white text-sm font-medium bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full group-hover:bg-primary group-hover:text-white transition-all">
                            <span>Shop Now</span>
                            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-12">No categories available</p>
          )}

          <div className="text-center mt-12">
            <Link
              href="/shop"
              className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8"
            >
              View All Products
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
                <ProductCard 
                  key={product._id} 
                  product={product} 
                  onQuickView={setQuickViewProduct}
                  wishlistProductIds={wishlistProductIds}
                  onWishlistChange={setWishlistProductIds}
                />
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
