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
  const { data: session, status } = useSession()

  const [selectedColor, setSelectedColor] = useState<string>("")
  const [selectedSize, setSelectedSize] = useState<string>("")
  const [isWishlisted, setIsWishlisted] = useState(false)

  const colors = product.variations?.colors ?? []
  const sizes = product.variations?.sizes ?? []

  useEffect(() => {
    if (colors.length) setSelectedColor(colors[0])
    if (sizes.length) setSelectedSize(sizes[0])

    const load = async () => {
      // Only load wishlist if authenticated
      if (status !== "authenticated" || !session) return
      
      try {
        const res = await fetch("/api/wishlist", { cache: "no-store" })
        if (!res.ok) return
        const data = await res.json()
        setIsWishlisted(Boolean(data.productIds?.includes(product._id)))
      } catch (error) {
        // Silently fail - wishlist status not critical
        console.debug("Failed to load wishlist status:", error)
      }
    }
    load()
  }, [product._id, session, status, colors, sizes])

  const stockFor = (c: string, s: string) =>
    product.variations?.variants?.find((v) => v.color === c && v.size === s)?.stock ?? 0

  const currentStock = useMemo(() => stockFor(selectedColor, selectedSize), [selectedColor, selectedSize])

  async function addToCart() {
    // Check authentication status
    if (status === "loading") return false
    if (status === "unauthenticated" || !session) {
      router.push("/auth/login")
      return false
    }
    
    const hasOptions = colors.length > 0 || sizes.length > 0
    if (hasOptions && (!selectedColor || !selectedSize)) {
      toast({ title: "Select options", description: "Choose color and size" })
      return false
    }

    if (hasOptions && currentStock <= 0) {
      toast({ title: "Out of stock", description: "Selected variant is unavailable", variant: "destructive" })
      return false
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

      if (!res.ok) {
        toast({ title: "Error", description: "Could not add to cart", variant: "destructive" })
        return false
      }

      window.dispatchEvent(new Event("cartUpdated"))
      toast({ title: "Added to cart", description: product.name })
      return true
    } catch (error) {
      toast({ title: "Error", description: "Could not add to cart", variant: "destructive" })
      return false
    }
  }

  async function buyNow() {
    // Check authentication status
    if (status === "loading") return
    if (status === "unauthenticated" || !session) {
      return router.push("/auth/login")
    }
    
    const hasOptions = colors.length > 0 || sizes.length > 0
    if (hasOptions && (!selectedColor || !selectedSize)) {
      return toast({ title: "Select options", description: "Choose color and size" })
    }

    if (hasOptions && currentStock <= 0) {
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
      // Add to cart first
      const res = await fetch("/api/cart/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cartItem),
      })

      if (!res.ok) {
        toast({ title: "Error", description: "Could not add to cart", variant: "destructive" })
        return
      }

      // Dispatch cart update event
      window.dispatchEvent(new Event("cartUpdated"))

      // Small delay to ensure cart is updated, then redirect to checkout
      setTimeout(() => {
        router.push("/checkout")
      }, 300)
      
    } catch (error) {
      toast({ title: "Error", description: "Could not process your request", variant: "destructive" })
    }
  }

  async function toggleWishlist() {
    // Check authentication status
    if (status === "loading") return
    if (status === "unauthenticated" || !session) {
      return router.push("/auth/login")
    }
    
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
                          : "border-gray-200 text-white hover:border-primary"
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
            {product.material && <li>Material: {product.material ?? "—"}</li>}
          </ul>
        )}
      </div>
    </div>
  )
}