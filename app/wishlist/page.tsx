"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Trash2, ShoppingCart } from "lucide-react"

export default function WishlistPage() {
  const [wishlist, setWishlist] = useState<string[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedWishlist = JSON.parse(localStorage.getItem("wishlist") || "[]")
    setWishlist(savedWishlist)

    // Fetch product details
    if (savedWishlist.length > 0) {
      Promise.all(
        savedWishlist.map((id: string) =>
          fetch(`/api/products/${id}`)
            .then((res) => res.json())
            .catch(() => null),
        ),
      ).then((results) => {
        setProducts(results.filter((p) => p !== null))
        setLoading(false)
      })
    } else {
      setLoading(false)
    }
  }, [])

  const removeFromWishlist = (productId: string) => {
    const newWishlist = wishlist.filter((id) => id !== productId)
    setWishlist(newWishlist)
    setProducts(products.filter((p) => p._id !== productId))
    localStorage.setItem("wishlist", JSON.stringify(newWishlist))
  }

  const addToCart = (product: any) => {
    const cartItem = {
      productId: product._id,
      name: product.name,
      price: product.price,
      quantity: 1,
      color: product.colors[0] || "",
      size: product.sizes[0] || "",
      image: product.images[0],
    }

    const cart = JSON.parse(localStorage.getItem("cart") || "[]")
    cart.push(cartItem)
    localStorage.setItem("cart", JSON.stringify(cart))
    alert("Added to cart!")
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <p className="text-center">Loading...</p>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Your Wishlist is Empty</h1>
          <p className="text-muted-foreground">Save items you love for later</p>
          <Link href="/shop" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
            Continue Shopping
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Wishlist</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <Card key={product._id} className="group overflow-hidden">
            <Link href={`/product/${product._id}`}>
              <div className="relative aspect-[3/4] overflow-hidden">
                <Image
                  src={product.images[0] || "/placeholder.svg?height=400&width=300&query=dress"}
                  alt={product.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            </Link>
            <CardContent className="p-4 space-y-3">
              <div>
                <h3 className="font-semibold text-lg line-clamp-1">{product.name}</h3>
                <p className="text-xl font-bold text-primary">${product.price.toFixed(2)}</p>
              </div>

              <div className="flex gap-2">
                <Button onClick={() => addToCart(product)} className="flex-1">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Add to Cart
                </Button>
                <Button variant="outline" size="icon" onClick={() => removeFromWishlist(product._id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
