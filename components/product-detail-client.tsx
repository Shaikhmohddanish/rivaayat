"use client"
import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Heart, ShoppingCart, Plus, Minus } from "lucide-react"
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
  const [quantity, setQuantity] = useState(1)
  const [isAddingToCart, setIsAddingToCart] = useState(false)

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

  const incrementQuantity = () => {
    setQuantity(prev => {
      const hasOptions = colors.length > 0 || sizes.length > 0
      if (hasOptions && currentStock > 0) {
        return Math.min(prev + 1, currentStock)
      }
      return prev + 1
    })
  }

  const decrementQuantity = () => {
    setQuantity(prev => Math.max(1, prev - 1))
  }

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

    // Check if requested quantity is available
    if (hasOptions && quantity > currentStock) {
      toast({ 
        title: "Insufficient stock", 
        description: `Only ${currentStock} items available`, 
        variant: "destructive" 
      })
      return false
    }

    setIsAddingToCart(true)
    
    const cartItem = {
      productId: product._id,
      name: product.name,
      price: product.price,
      image: product.images?.[0]?.url || "",
      quantity: quantity,
      variant: { color: selectedColor || "", size: selectedSize || "" },
    }

    try {
      const res = await fetch("/api/cart/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cartItem),
      })

      if (!res.ok) {
        const error = await res.json()
        toast({ title: "Error", description: error.error || "Could not add to cart", variant: "destructive" })
        return false
      }

      window.dispatchEvent(new Event("cartUpdated"))
      toast({ title: "Added to cart", description: `${quantity} × ${product.name}` })
      setQuantity(1) // Reset quantity after adding
      return true
    } catch (error) {
      toast({ title: "Error", description: "Could not add to cart", variant: "destructive" })
      return false
    } finally {
      setIsAddingToCart(false)
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

    // Check if requested quantity is available
    if (hasOptions && quantity > currentStock) {
      return toast({ 
        title: "Insufficient stock", 
        description: `Only ${currentStock} items available`, 
        variant: "destructive" 
      })
    }

    setIsAddingToCart(true)
    
    const cartItem = {
      productId: product._id,
      name: product.name,
      price: product.price,
      image: product.images?.[0]?.url || "",
      quantity: quantity,
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
        const error = await res.json()
        toast({ title: "Error", description: error.error || "Could not add to cart", variant: "destructive" })
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
    } finally {
      setIsAddingToCart(false)
    }
  }

  async function toggleWishlist() {
    // Check authentication status
    if (status === "loading") return
    if (status === "unauthenticated" || !session) {
      return router.push("/auth/login")
    }
    
    // 🚀 Optimistic update - Update UI immediately for instant feedback
    const previousState = isWishlisted
    const newState = !isWishlisted
    setIsWishlisted(newState)
    
    // Update cache immediately
    try {
      const { getCachedWishlist, updateWishlistCache } = await import("@/lib/wishlist-cache")
      const cached = getCachedWishlist()
      if (cached) {
        const newProductIds = newState 
          ? [...cached.productIds, product._id]
          : cached.productIds.filter(id => id !== product._id)
        updateWishlistCache(newProductIds)
      }
    } catch (e) {
      console.debug("Wishlist cache update skipped:", e)
    }
    
    // Dispatch event immediately
    window.dispatchEvent(new Event("wishlistUpdated"))
    
    // Show toast immediately
    toast({ 
      title: newState ? "Added to wishlist" : "Removed from wishlist", 
      description: product.name 
    })
    
    // Sync with API in background
    try {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product._id }),
      })
      
      if (!res.ok) {
        // Revert on failure
        setIsWishlisted(previousState)
        toast({ 
          title: "Error", 
          description: "Could not update wishlist. Please try again.", 
          variant: "destructive" 
        })
        
        // Revert cache
        try {
          const { getCachedWishlist, updateWishlistCache } = await import("@/lib/wishlist-cache")
          const cached = getCachedWishlist()
          if (cached) {
            const revertedIds = previousState 
              ? [...cached.productIds, product._id]
              : cached.productIds.filter(id => id !== product._id)
            updateWishlistCache(revertedIds)
          }
        } catch (e) {
          console.debug("Wishlist cache revert skipped:", e)
        }
        
        window.dispatchEvent(new Event("wishlistUpdated"))
      }
    } catch (error) {
      // Revert on error
      setIsWishlisted(previousState)
      toast({ 
        title: "Error", 
        description: "Network error. Please check your connection.", 
        variant: "destructive" 
      })
    }
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

      {/* Quantity Selector */}
      <div className="space-y-2">
        <label className="text-xs text-gray-500 font-medium">Quantity</label>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon"
            onClick={decrementQuantity}
            disabled={quantity <= 1 || isAddingToCart}
            className="h-9 w-9"
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="w-12 text-center font-semibold text-lg">{quantity}</span>
          <Button 
            variant="outline" 
            size="icon"
            onClick={incrementQuantity}
            disabled={isAddingToCart || (colors.length > 0 && sizes.length > 0 && quantity >= currentStock)}
            className="h-9 w-9"
          >
            <Plus className="h-4 w-4" />
          </Button>
          {colors.length > 0 && sizes.length > 0 && currentStock > 0 && (
            <span className="text-xs text-muted-foreground ml-2">
              {currentStock} available
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 pt-2">
        <Button onClick={addToCart} className="gap-2" disabled={isAddingToCart}>
          <ShoppingCart className="h-4 w-4" /> 
          {isAddingToCart ? "Adding..." : "Add to cart"}
        </Button>
        <Button variant="secondary" onClick={buyNow} disabled={isAddingToCart}>
          {isAddingToCart ? "Processing..." : "Buy now"}
        </Button>
        <Button variant="outline" onClick={toggleWishlist} className={isWishlisted ? "text-rose-600" : ""} disabled={isAddingToCart}>
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
            {product.brand &&<li>Brand: {product.brand ?? "—"}</li>}
            <li>Color(s): {colors.join(", ") || "—"}</li>
            <li>Sizes: {sizes.join(", ") || "—"}</li>
            {product.material && <li>Material: {product.material ?? "—"}</li>}
          </ul>
        )}
      </div>
    </div>
  )
}