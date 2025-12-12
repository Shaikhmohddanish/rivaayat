"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, Pencil, Star, RefreshCw } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import type { Product } from "@/lib/types"
import { useAdminCache } from "@/hooks/use-admin-cache"
import { ADMIN_CACHE_KEYS } from "@/lib/admin-cache"

export default function AdminProductsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  // Use admin cache for products
  const [products, loading, error, refreshProducts] = useAdminCache<Product[]>(
    ADMIN_CACHE_KEYS.PRODUCTS_ADMIN_LIST,
    async () => {
      const response = await fetch("/api/admin/products")
      if (!response.ok) {
        throw new Error("Failed to fetch products")
      }
      return response.json()
    },
    [session]
  )
  
  // Filter products based on search query
  const filteredProducts = searchQuery.trim() === "" 
    ? products || [] 
    : (products || []).filter(
        (product) => {
          const query = searchQuery.toLowerCase()
          return product.name.toLowerCase().includes(query) ||
            product.slug.toLowerCase().includes(query) ||
            product.description.toLowerCase().includes(query)
        }
      )
  
  // Redirect if not admin
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login")
    } else if (status === "authenticated" && session?.user?.role !== "admin") {
      router.push("/")
    }
  }, [status, session, router])
  
  // Function to manually refresh products
  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refreshProducts()
    setTimeout(() => setIsRefreshing(false), 500)
  }

  // We now use the loading.tsx file for the loading state
  if (status === "loading") {
    return null
  }

  if (session?.user?.role !== "admin") {
    return null
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Product Management</h1>
          <p className="text-muted-foreground">Manage your product catalog</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleRefresh} 
            disabled={isRefreshing || loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button asChild>
            <Link href="/admin/products/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Link>
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map((product) => (
          <div key={product._id} className="bg-card rounded-lg border overflow-hidden group relative">
            <div className="relative aspect-square bg-muted">
              {product.images[0] ? (
                <Image
                  src={product.images[0].url || "/placeholder.svg"}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">No image</div>
              )}
              <div className="absolute top-2 right-2 flex gap-2">
                {product.isFeatured && (
                  <div className="bg-yellow-500 text-white p-1.5 rounded-full">
                    <Star className="h-4 w-4 fill-current" />
                  </div>
                )}
                {product.isDraft && (
                  <div className="bg-blue-500 text-white px-2 py-1 rounded-md text-xs font-semibold">
                    Draft
                  </div>
                )}
                {product.isActive === false && (
                  <div className="bg-red-500 text-white px-2 py-1 rounded-md text-xs font-semibold">
                    Inactive
                  </div>
                )}
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-lg mb-1 line-clamp-1">{product.name}</h3>
              <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{product.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold">₹{product.price.toFixed(2)}</span>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/admin/products/${product._id}`}>
                    <Pencil className="h-4 w-4 mr-1" />
                    Edit
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No products found</p>
        </div>
      )}
    </div>
  )
}
