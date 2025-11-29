"use client"

import type React from "react"

import { useEffect, useState, use } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { ProductImageUpload } from "@/components/product-image-upload"
import { SlugInput } from "@/components/slug-input"
import { ColorSelector, SizeSelector } from "@/components/product-variation-selectors"
import { VariantInventory } from "@/components/variant-inventory"
import { ArrowLeft, Plus, X } from "lucide-react"
import Link from "next/link"
import type { Product, ProductImage, ProductVariant } from "@/lib/types"
import { useSlug } from "@/hooks/use-slug"
import { useToast } from "@/hooks/use-toast"

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap the params Promise
  const resolvedParams = use(params);
  const productId = resolvedParams.id;
  
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [product, setProduct] = useState<Product | null>(null)
  
  // Use our slug hook with product ID for edit mode
  const { 
    slug, 
    setName: setSlugName, 
    setSlug, 
    status: slugStatus, 
    message: slugMessage, 
    isValid: isSlugValid, 
    checkSlug 
  } = useSlug('', { productId })

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    isFeatured: false,
  })

  const [images, setImages] = useState<ProductImage[]>([])
  const [colors, setColors] = useState<string[]>([])
  const [sizes, setSizes] = useState<string[]>([])
  const [variants, setVariants] = useState<ProductVariant[]>([])

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login")
    } else if (status === "authenticated" && session?.user?.role !== "admin") {
      router.push("/")
    } else if (status === "authenticated") {
      fetchProduct()
    }
  }, [status, session])

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/admin/products/${productId}`)
      if (response.ok) {
        const data = await response.json()
        setProduct(data)
        setFormData({
          name: data.name || "",
          description: data.description || "",
          price: data.price ? data.price.toString() : "",
          isFeatured: data.isFeatured || false,
        })
        // Set the slug using our hook
        setSlug(data.slug || "")
        setImages(data.images || [])
        setColors(data.variations?.colors || [])
        setSizes(data.variations?.sizes || [])
        setVariants(data.variations?.variants || [])
      } else {
        toast({
          title: "Error",
          description: "Product not found",
          variant: "destructive"
        })
        router.push("/admin/products")
      }
    } catch (error) {
      console.error("Error fetching product:", error)
      toast({
        title: "Error",
        description: "Failed to load product",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (status === "unauthenticated" || session?.user?.role !== "admin" || !product) {
    return null
  }

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
    })
    // Update slug with our hook
    setSlugName(name)
  }

  // No longer need the individual add/update/remove functions for colors and sizes
  // as our new components handle this internally

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !slug || !formData.description || !formData.price) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }
    
    // Validate the slug
    if (!isSlugValid) {
      const isAvailable = await checkSlug()
      if (!isAvailable) {
        toast({
          title: "Slug Error",
          description: "Please use a different slug. This one is already taken.",
          variant: "destructive"
        })
        return
      }
    }

    if (images.length === 0) {
      toast({
        title: "Image Required",
        description: "Please upload at least one image",
        variant: "destructive"
      })
      return
    }

    const validColors = colors.filter((c) => c.trim() !== "")
    const validSizes = sizes.filter((s) => s.trim() !== "")

    if (validColors.length === 0 || validSizes.length === 0) {
      toast({
        title: "Variations Required",
        description: "Please add at least one color and one size",
        variant: "destructive"
      })
      return
    }
    
    // Make sure all combinations have stock values
    // If any are missing, create them with stock=0
    let updatedVariants = [...variants];
    
    // Create a map of existing variants for quick lookup
    const variantMap: Record<string, ProductVariant> = {};
    updatedVariants.forEach(v => {
      variantMap[`${v.color}-${v.size}`] = v;
    });
    
    // Ensure all combinations exist
    validColors.forEach((color) => {
      validSizes.forEach((size) => {
        const key = `${color}-${size}`;
        if (!variantMap[key]) {
          updatedVariants.push({ color, size, stock: 0 });
        }
      });
    });
    
    // Filter out variants that aren't in our valid colors and sizes
    updatedVariants = updatedVariants.filter(
      v => validColors.includes(v.color) && validSizes.includes(v.size)
    );

    setSaving(true)

    try {
      const isNewProduct = productId === "new"
      const url = isNewProduct ? "/api/admin/products" : `/api/admin/products/${productId}`
      const method = isNewProduct ? "POST" : "PATCH"
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          slug, // Use our managed slug
          price: Number.parseFloat(formData.price),
          images,
          variations: {
            colors: validColors,
            sizes: validSizes,
            variants: updatedVariants,
          },
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: isNewProduct ? "Product created successfully" : "Product updated successfully",
          variant: "default"
        })
        router.push("/admin/products")
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || (isNewProduct ? "Failed to create product" : "Failed to update product"),
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error saving product:", error)
      toast({
        title: "Error",
        description: "Failed to save product",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/admin/products">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">{productId === "new" ? "Add New Product" : "Edit Product"}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-card rounded-lg border p-6 space-y-6">
          <h2 className="text-xl font-semibold">Basic Information</h2>

          <div className="space-y-2">
            <Label htmlFor="name">Product Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Enter product name"
              required
            />
          </div>

          {/* Use our new SlugInput component */}
          <SlugInput 
            slug={slug}
            onChange={setSlug}
            status={slugStatus}
            message={slugMessage}
          />

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter product description"
              rows={4}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Price ($) *</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder="0.00"
              required
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="featured">Featured Product</Label>
              <p className="text-sm text-muted-foreground">Display this product prominently</p>
            </div>
            <Switch
              id="featured"
              checked={formData.isFeatured}
              onCheckedChange={(checked) => setFormData({ ...formData, isFeatured: checked })}
            />
          </div>
        </div>

        <div className="bg-card rounded-lg border p-6 space-y-6">
          <h2 className="text-xl font-semibold">Product Images *</h2>
          <ProductImageUpload value={images} onChange={setImages} />
        </div>

        <div className="bg-card rounded-lg border p-6 space-y-6">
          <h2 className="text-xl font-semibold">Variations</h2>

          <div className="space-y-4">
            <Label>Colors *</Label>
            <ColorSelector selectedColors={colors} onChange={setColors} />
          </div>

          <div className="space-y-4">
            <Label>Sizes *</Label>
            <SizeSelector selectedSizes={sizes} onChange={setSizes} />
          </div>
          
          {colors.length > 0 && sizes.length > 0 && (
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <Label>Inventory Management</Label>
                <p className="text-sm text-muted-foreground">Enter available quantity for each variant</p>
              </div>
              <VariantInventory 
                colors={colors.filter(c => c.trim() !== "")}
                sizes={sizes.filter(s => s.trim() !== "")}
                variants={variants}
                onChange={setVariants}
              />
            </div>
          )}
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={saving} className="flex-1">
            {saving ? "Saving..." : (productId === "new" ? "Create Product" : "Save Changes")}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/admin/products">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  )
}
