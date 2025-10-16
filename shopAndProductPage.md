Below are production-ready files for a Next.js (App Router, TS) + shadcn/ui storefront. They match your existing API contracts (`/api/wishlist`, `/api/cart/items`) and the variations schema you posted.

> **Structure**
```
/components/product-card.tsx
/components/product-gallery.tsx
/components/product-detail-client.tsx
/app/product/[id]/page.tsx        // or use [slug]
/lib/products.ts                  // tiny fetcher used by the page
/lib/types.ts                     // Product type (if you don't already have one)
```

---

### /components/product-card.tsx
```tsx
"use client"

import type React from "react"
import Link from "next/link"
import Image from "next/image"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Eye, Heart, ShoppingCart } from "lucide-react"
import type { Product } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

interface ProductCardProps {
  product: Product & { _id: string }
  onQuickView?: (product: Product & { _id: string }) => void
}

export function ProductCard({ product, onQuickView }: ProductCardProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  const [isWishlisted, setIsWishlisted] = useState(false)
  const [showVariations, setShowVariations] = useState(false)
  const [selectedColor, setSelectedColor] = useState("")
  const [selectedSize, setSelectedSize] = useState("")

  useEffect(() => {
    const checkWishlist = async () => {
      try {
        const res = await fetch("/api/wishlist", { cache: "no-store", next: { revalidate: 0 } })
        if (!res.ok) return
        const data = await res.json()
        setIsWishlisted(Boolean(data.productIds?.includes(product._id)))
      } catch (_) {}
    }

    if (session) checkWishlist()

    if (product.variations?.colors?.length) setSelectedColor(product.variations.colors[0])
    if (product.variations?.sizes?.length) setSelectedSize(product.variations.sizes[0])
  }, [product._id, product.variations, session])

  const checkStock = (color: string, size: string) => {
    const v = product.variations?.variants?.find((x) => x.color === color && x.size === size)
    return v?.stock ?? 0
  }

  const handleAddToWishlist = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!session) return router.push("/auth/login")

    try {
      const response = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product._id }),
      })
      if (!response.ok) throw new Error("wishlist")
      const data = await response.json()
      const nowIn = Boolean(data.productIds?.includes(product._id))
      setIsWishlisted(nowIn)
      window.dispatchEvent(new Event("wishlistUpdated"))
      toast({
        title: nowIn ? "Added to wishlist" : "Removed from wishlist",
        description: product.name,
        className: nowIn
          ? "bg-pink-50 border-pink-200 text-pink-800"
          : "bg-gray-50 border-gray-200",
      })
    } catch (err) {
      toast({ title: "Error", description: "Could not update wishlist", variant: "destructive" })
    }
  }

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!session) return router.push("/auth/login")

    const hasOptions =
      (product.variations?.colors?.length ?? 0) > 0 || (product.variations?.sizes?.length ?? 0) > 0

    if (hasOptions && (!selectedColor || !selectedSize)) {
      setShowVariations(true)
      return toast({ title: "Select options", description: "Choose color and size" })
    }

    if (hasOptions && checkStock(selectedColor, selectedSize) <= 0) {
      return toast({ title: "Out of stock", description: "Selected variant is unavailable", variant: "destructive" })
    }

    const cartItem = {
      productId: product._id,
      name: product.name,
      price: product.price,
      image: product.images?.[0]?.url || "",
      quantity: 1,
      variant: { color: selectedColor || "", size: selectedSize || "" },
    }

    try {
      const res = await fetch("/api/cart/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cartItem),
      })
      if (!res.ok) throw new Error("cart")
      window.dispatchEvent(new Event("cartUpdated"))
      setShowVariations(false)
      toast({
        title: "Added to cart",
        description: product.name,
        className: "bg-green-50 border-green-200 text-green-800",
      })
    } catch (err) {
      toast({ title: "Error", description: "Could not add item to cart", variant: "destructive" })
    }
  }

  const handleBuyNow = async (e: React.MouseEvent) => {
    await handleAddToCart(e)
    // If cart add succeeded, go to checkout
    router.push("/checkout")
  }

  const hasOptions =
    (product.variations?.colors?.length ?? 0) > 0 || (product.variations?.sizes?.length ?? 0) > 0

  return (
    <Link href={`/product/${product.slug ?? product._id}`} className="block">
      <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 bg-white border border-gray-100 rounded-lg max-w-sm">
        <div className="relative aspect-[4/5] overflow-hidden">
          <Image
            src={product.images?.[0]?.url || "/placeholder.svg?height=400&width=300&query=dress"}
            alt={product.name}
            fill
            sizes="(max-width:768px) 100vw, 33vw"
            className="object-cover group-hover:scale-110 transition-transform duration-500"
          />

          <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button
              onClick={(e) => {
                e.preventDefault()
                onQuickView?.(product)
              }}
              className="w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-gray-50"
              aria-label="Quick View"
            >
              <Eye className="h-4 w-4 text-gray-600" />
            </button>
            <button
              onClick={handleAddToCart}
              className="w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-gray-50"
              aria-label="Add to Cart"
            >
              <ShoppingCart className="h-4 w-4 text-gray-600" />
            </button>
            <button
              onClick={handleAddToWishlist}
              className={`w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-gray-50 ${
                isWishlisted ? "text-rose-500" : "text-gray-600"
              }`}
              aria-label="Add to Wishlist"
            >
              <Heart className={`h-4 w-4 ${isWishlisted ? "fill-current" : ""}`} />
            </button>
          </div>

          {hasOptions && (
            <div className="absolute top-2 left-2 bg-primary/80 text-white text-xs px-2 py-1 rounded-md backdrop-blur-sm">
              Options
            </div>
          )}
        </div>

        <CardContent className="p-4">
          <h3 className="font-medium text-base mb-1 line-clamp-1 text-gray-900 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          <p className="text-gray-500 text-sm mb-3 line-clamp-2 leading-relaxed">{product.description}</p>

          {/* Inline quick options (only when user hovered state toggles) */}
          {showVariations && hasOptions && (
            <div className="space-y-3 mb-4">
              {product.variations?.colors?.length ? (
                <div>
                  <div className="text-xs text-gray-500 mb-1.5 font-medium">Select Color</div>
                  <div className="flex flex-wrap gap-2">
                    {product.variations.colors.map((color) => {
                      const disabled = Boolean(selectedSize && checkStock(color, selectedSize) <= 0)
                      return (
                        <button
                          key={color}
                          onClick={(e) => {
                            e.preventDefault()
                            if (!disabled) setSelectedColor(color)
                          }}
                          disabled={disabled}
                          className={`w-8 h-8 rounded-full border relative flex items-center justify-center ${
                            selectedColor === color
                              ? "ring-2 ring-primary ring-offset-2 border-white"
                              : "border-gray-200 hover:border-primary"
                          } ${disabled ? "opacity-40 cursor-not-allowed" : "hover:scale-110 transition-transform"}`}
                          style={{
                            backgroundColor:
                              color === "Emerald Green" ? "#50C878" : color === "Deep Maroon" ? "#800000" : color.toLowerCase(),
                          }}
                          title={color}
                          type="button"
                        >
                          {selectedColor === color && <span className="text-white drop-shadow-md text-xs">✓</span>}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ) : null}

              {product.variations?.sizes?.length ? (
                <div>
                  <div className="text-xs text-gray-500 mb-1.5 font-medium">Select Size</div>
                  <div className="flex flex-wrap gap-1.5">
                    {product.variations.sizes.map((size) => {
                      const disabled = Boolean(selectedColor && checkStock(selectedColor, size) <= 0)
                      return (
                        <button
                          key={size}
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            if (!disabled) setSelectedSize(size)
                          }}
                          disabled={disabled}
                          className={`min-w-[2.5rem] h-7 rounded border text-xs font-medium ${
                            selectedSize === size
                              ? "bg-primary text-white border-primary"
                              : "border-gray-200 text-gray-700 hover:border-primary hover:text-primary"
                          } ${disabled ? "opacity-40 cursor-not-allowed" : "hover:border-primary transition-colors"}`}
                        >
                          {size}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          )}

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <p className="text-lg font-semibold text-gray-900">₹{product.price.toFixed(2)}</p>
            </div>
            <Button size="sm" onClick={handleBuyNow} className="bg-primary hover:bg-primary/90 text-white">
              Buy Now
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
```

---

### /components/product-gallery.tsx
```tsx
"use client"
import Image from "next/image"
import { useState } from "react"

interface GalleryProps {
  images: { url: string; alt?: string }[]
}

export default function ProductGallery({ images }: GalleryProps) {
  const [active, setActive] = useState(0)
  const safe = images?.length ? images : [{ url: "/placeholder.svg?height=800&width=600" }]

  return (
    <div className="grid gap-4 sm:grid-cols-[96px_1fr]">
      <div className="order-2 sm:order-1 flex sm:flex-col gap-2 sm:max-h-[520px] overflow-auto pr-1">
        {safe.map((img, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`relative h-20 w-20 rounded border ${i === active ? "border-primary" : "border-gray-200"}`}
            aria-label={`View image ${i + 1}`}
          >
            <Image src={img.url} alt={img.alt ?? "Product image"} fill sizes="80px" className="object-cover rounded" />
          </button>
        ))}
      </div>
      <div className="order-1 sm:order-2 relative aspect-[4/5] w-full overflow-hidden rounded-lg border border-gray-200">
        <Image
          src={safe[active].url}
          alt={safe[active].alt ?? "Product image"}
          fill
          sizes="(max-width:768px) 100vw, 50vw"
          className="object-cover"
          priority
        />
      </div>
    </div>
  )
}
```

---

### /components/product-detail-client.tsx
```tsx
"use client"
import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Heart, ShoppingCart } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import type { Product } from "@/lib/types"

interface Props {
  product: Product & { _id: string }
}

export default function ProductDetailClient({ product }: Props) {
  const { toast } = useToast()
  const router = useRouter()
  const { data: session } = useSession()

  const [selectedColor, setSelectedColor] = useState<string>("")
  const [selectedSize, setSelectedSize] = useState<string>("")
  const [isWishlisted, setIsWishlisted] = useState(false)

  const colors = product.variations?.colors ?? []
  const sizes = product.variations?.sizes ?? []

  useEffect(() => {
    if (colors.length) setSelectedColor(colors[0])
    if (sizes.length) setSelectedSize(sizes[0])

    const load = async () => {
      if (!session) return
      try {
        const res = await fetch("/api/wishlist", { cache: "no-store", next: { revalidate: 0 } })
        if (!res.ok) return
        const data = await res.json()
        setIsWishlisted(Boolean(data.productIds?.includes(product._id)))
      } catch {}
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product._id, session])

  const stockFor = (c: string, s: string) =>
    product.variations?.variants?.find((v) => v.color === c && v.size === s)?.stock ?? 0

  const currentStock = useMemo(() => stockFor(selectedColor, selectedSize), [selectedColor, selectedSize])

  async function addToCart() {
    if (!session) return router.push("/auth/login")
    const hasOptions = colors.length > 0 || sizes.length > 0
    if (hasOptions && (!selectedColor || !selectedSize))
      return toast({ title: "Select options", description: "Choose color and size" })

    if (hasOptions && currentStock <= 0)
      return toast({ title: "Out of stock", description: "Selected variant is unavailable", variant: "destructive" })

    const cartItem = {
      productId: product._id,
      name: product.name,
      price: product.price,
      image: product.images?.[0]?.url || "",
      quantity: 1,
      variant: { color: selectedColor || "", size: selectedSize || "" },
    }

    const res = await fetch("/api/cart/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cartItem),
    })

    if (!res.ok) return toast({ title: "Error", description: "Could not add to cart", variant: "destructive" })

    window.dispatchEvent(new Event("cartUpdated"))
    toast({ title: "Added to cart", description: product.name })
  }

  async function buyNow() {
    await addToCart()
    router.push("/checkout")
  }

  async function toggleWishlist() {
    if (!session) return router.push("/auth/login")
    const res = await fetch("/api/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: product._id }),
    })
    if (!res.ok) return toast({ title: "Error", description: "Could not update wishlist", variant: "destructive" })
    const data = await res.json()
    const now = Boolean(data.productIds?.includes(product._id))
    setIsWishlisted(now)
    window.dispatchEvent(new Event("wishlistUpdated"))
    toast({ title: now ? "Added to wishlist" : "Removed from wishlist", description: product.name })
  }

  return (
    <div className="space-y-4">
      {/* Price + Title */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
        <p className="text-muted-foreground mt-1">{product.description}</p>
        <div className="flex items-end gap-3 mt-4">
          <span className="text-3xl font-semibold">₹{product.price.toFixed(2)}</span>
          {product.mrp && (
            <span className="text-sm line-through text-muted-foreground">₹{product.mrp.toFixed(2)}</span>
          )}
        </div>
      </div>

      {/* Options */}
      {(colors.length > 0 || sizes.length > 0) && (
        <div className="space-y-5">
          {colors.length > 0 && (
            <div>
              <div className="text-xs text-gray-500 mb-1.5 font-medium">Select Color</div>
              <div className="flex flex-wrap gap-2">
                {colors.map((c) => {
                  const disabled = Boolean(selectedSize && stockFor(c, selectedSize) <= 0)
                  return (
                    <button
                      key={c}
                      onClick={() => !disabled && setSelectedColor(c)}
                      disabled={disabled}
                      className={`w-9 h-9 rounded-full border ${
                        selectedColor === c ? "ring-2 ring-primary ring-offset-2 border-white" : "border-gray-200"
                      } ${disabled ? "opacity-40 cursor-not-allowed" : "hover:scale-110 transition-transform"}`}
                      style={{
                        backgroundColor: c === "Emerald Green" ? "#50C878" : c === "Deep Maroon" ? "#800000" : c.toLowerCase(),
                      }}
                      title={c}
                      aria-label={c}
                    />
                  )
                })}
              </div>
            </div>
          )}

          {sizes.length > 0 && (
            <div>
              <div className="text-xs text-gray-500 mb-1.5 font-medium">Select Size</div>
              <div className="flex flex-wrap gap-2">
                {sizes.map((s) => {
                  const disabled = Boolean(selectedColor && stockFor(selectedColor, s) <= 0)
                  return (
                    <button
                      key={s}
                      onClick={() => !disabled && setSelectedSize(s)}
                      disabled={disabled}
                      className={`min-w-[2.5rem] h-8 rounded border text-xs font-medium ${
                        selectedSize === s
                          ? "bg-primary text-white border-primary"
                          : "border-gray-200 text-gray-800 hover:border-primary"
                      } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
                    >
                      {s}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Stock note */}
          {colors.length > 0 && sizes.length > 0 && (
            <p className="text-xs text-muted-foreground">Stock: {currentStock > 0 ? currentStock : "Out of stock"}</p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3 pt-2">
        <Button onClick={addToCart} className="gap-2">
          <ShoppingCart className="h-4 w-4" /> Add to cart
        </Button>
        <Button variant="secondary" onClick={buyNow}>
          Buy now
        </Button>
        <Button variant="outline" onClick={toggleWishlist} className={isWishlisted ? "text-rose-600" : ""}>
          <Heart className={`h-4 w-4 mr-2 ${isWishlisted ? "fill-current" : ""}`} />
          {isWishlisted ? "Wishlisted" : "Wishlist"}
        </Button>
      </div>

      {/* Details */}
      <div className="prose prose-sm max-w-none mt-6">
        {product.detailsHtml ? (
          <div dangerouslySetInnerHTML={{ __html: product.detailsHtml }} />
        ) : (
          <ul>
            <li>Brand: {product.brand ?? "—"}</li>
            <li>Color(s): {colors.join(", ") || "—"}</li>
            <li>Sizes: {sizes.join(", ") || "—"}</li>
            <li>Material: {product.material ?? "—"}</li>
          </ul>
        )}
      </div>
    </div>
  )
}
```

---

### /app/product/[id]/page.tsx
```tsx
import type { Metadata } from "next"
import ProductGallery from "@/components/product-gallery"
import ProductDetailClient from "@/components/product-detail-client"
import { getProduct } from "@/lib/products"

interface PageProps {
  params: { id: string }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const product = await getProduct(params.id)
  return {
    title: product ? `${product.name} — Shop` : "Product",
    description: product?.description,
    openGraph: {
      images: product?.images?.[0]?.url ? [{ url: product.images[0].url }] : undefined,
    },
  }
}

export default async function ProductPage({ params }: PageProps) {
  const product = await getProduct(params.id)
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
```

---

### /lib/products.ts
```ts
import "server-only"
import type { Product } from "@/lib/types"

// Swap this with your actual DB call. This version hits your existing API.
export async function getProduct(idOrSlug: string): Promise<(Product & { _id: string }) | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/products/${idOrSlug}`, {
      // Ensure latest data for stock
      cache: "no-store",
    })
    if (!res.ok) return null
    const data = await res.json()
    return data?.product ?? data ?? null
  } catch (e) {
    return null
  }
}
```

---

### /lib/types.ts (augment as needed)
```ts
export type Variant = {
  color: string
  size: string
  stock: number
}

export type Product = {
  _id?: string
  slug?: string
  name: string
  description: string
  price: number
  mrp?: number
  brand?: string
  material?: string
  detailsHtml?: string
  images: { url: string; alt?: string }[]
  variations: {
    colors: string[]
    sizes: string[]
    variants: Variant[]
  }
}
```

---

## Notes
- The **Card** links to `/product/[id]` (uses `slug` if present).
- The **Detail page** is SSR (good for SEO) and hydrates a client section for options, cart, and wishlist.
- Both components assume your current endpoints:
  - `POST /api/cart/items` → add item
  - `GET/POST /api/wishlist` → read/toggle
- Replace `NEXT_PUBLIC_BASE_URL` in `getProduct` if your API is internal or colocated.
- If your route is `/product/[slug]`, just rename `[id]` → `[slug]` and keep `getProduct` compatible.
```
