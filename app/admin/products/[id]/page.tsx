"use client"

import type React from "react"

import { useEffect, useRef, useState, use } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
  const [categories, setCategories] = useState<Array<{ _id: string; name: string }>>([])

  // Prevent re-loading (and resetting) the form when NextAuth refreshes the session object.
  const lastLoadedProductIdRef = useRef<string | null>(null)
  
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
    originalPrice: "",
    discountedPrice: "",
    category: "",
    isFeatured: false,
    isActive: true,
    isDraft: false,
  })
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [images, setImages] = useState<ProductImage[]>([])
  const [colors, setColors] = useState<string[]>([])
  const [sizes, setSizes] = useState<string[]>([])
  const [variants, setVariants] = useState<ProductVariant[]>([])

  const originalPriceValue = Number.parseFloat(formData.originalPrice || "0")
  const discountedPriceValue = Number.parseFloat(
    formData.discountedPrice || formData.originalPrice || "0",
  )
  const discountPercent =
    Number.isFinite(originalPriceValue) && Number.isFinite(discountedPriceValue) &&
    originalPriceValue > 0 && discountedPriceValue > 0 && discountedPriceValue < originalPriceValue
      ? Math.round(((originalPriceValue - discountedPriceValue) / originalPriceValue) * 100)
      : 0

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login")
      return
    }

    if (status !== "authenticated") return

    if (session?.user?.role !== "admin") {
      router.push("/")
      return
    }

    // Only fetch once per productId to avoid wiping in-progress edits.
    if (lastLoadedProductIdRef.current === productId) return
    lastLoadedProductIdRef.current = productId

    fetchCategories()
    fetchProduct()
  }, [status, session?.user?.role, productId, router])

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories")
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      }
    } catch (error) {
      console.error("Error fetching categories:", error)
    }
  }

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/admin/products/${productId}`)
      if (response.ok) {
        const data = await response.json()
        setProduct(data)
        const inferredOriginal = data.originalPrice ?? data.mrp ?? data.price ?? 0
        const inferredDiscounted = data.discountedPrice ?? data.price ?? inferredOriginal
        setFormData({
          name: data.name || "",
          description: data.description || "",
          originalPrice: inferredOriginal ? inferredOriginal.toString() : "",
          discountedPrice: inferredDiscounted ? inferredDiscounted.toString() : "",
          category: data.category || "",
          isFeatured: data.isFeatured || false,
          isActive: data.isActive !== undefined ? data.isActive : true,
          isDraft: data.isDraft || false,
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
    setFormData((prev) => ({
      ...prev,
      name,
    }))
    // Update slug with our hook
    setSlugName(name)
  }

  // No longer need the individual add/update/remove functions for colors and sizes
  // as our new components handle this internally

  const handleSubmit = async (e: React.FormEvent, saveAsDraft: boolean = false) => {
    e.preventDefault()
    e.stopPropagation()

    const validColors = colors.filter((c) => c.trim() !== "")
    const validSizes = sizes.filter((s) => s.trim() !== "")

    // If saving as draft, only require name
    if (!saveAsDraft) {
      // Full validation for publishing
      if (!formData.name || !slug || !formData.description || !formData.originalPrice || !formData.discountedPrice) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields",
          variant: "destructive"
        })
        return
      }

      if (!Number.isFinite(originalPriceValue) || originalPriceValue <= 0) {
        toast({
          title: "Invalid Original Price",
          description: "Enter a valid amount greater than zero",
          variant: "destructive",
        })
        return
      }

      if (!Number.isFinite(discountedPriceValue) || discountedPriceValue <= 0) {
        toast({
          title: "Invalid Discounted Price",
          description: "Enter a valid amount greater than zero",
          variant: "destructive",
        })
        return
      }

      if (discountedPriceValue > originalPriceValue) {
        toast({
          title: "Invalid Discount",
          description: "Discounted price cannot be higher than original price",
          variant: "destructive",
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

      if (validColors.length === 0 || validSizes.length === 0) {
        toast({
          title: "Variations Required",
          description: "Please add at least one color and one size",
          variant: "destructive"
        })
        return
      }
    } else {
      // Minimal validation for draft
      if (!formData.name || formData.name.trim() === "") {
        toast({
          title: "Validation Error",
          description: "Product name is required even for drafts",
          variant: "destructive"
        })
        return
      }
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

    const normalizedOriginalPrice = Number.isFinite(originalPriceValue) && originalPriceValue > 0
      ? originalPriceValue
      : 0
    const normalizedDiscountedPrice = Number.isFinite(discountedPriceValue) && discountedPriceValue > 0
      ? discountedPriceValue
      : normalizedOriginalPrice

    try {
      const isNewProduct = productId === "new"
      const url = isNewProduct ? "/api/admin/products" : `/api/admin/products/${productId}`
      const method = isNewProduct ? "POST" : "PATCH"
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || "",
          category: formData.category || undefined,
          isFeatured: formData.isFeatured,
          isActive: formData.isActive,
          isDraft: saveAsDraft,
          slug: slug || "", // Use our managed slug
          price: normalizedDiscountedPrice,
          originalPrice: normalizedOriginalPrice,
          discountedPrice: normalizedDiscountedPrice,
          images: images || [],
          variations: {
            colors: validColors || [],
            sizes: validSizes || [],
            variants: updatedVariants || [],
          },
        }),
      })

      if (response.ok) {
        const successMessage = saveAsDraft 
          ? (isNewProduct ? "Product saved as draft" : "Draft saved successfully")
          : (isNewProduct ? "Product created successfully" : "Product updated successfully")
        toast({
          title: "Success",
          description: successMessage,
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

  const handleDelete = async () => {
    if (!product || productId === "new") return

    setDeleting(true)
    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Product deleted successfully",
          variant: "default"
        })
        router.push("/admin/products")
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to delete product",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error deleting product:", error)
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive"
      })
    } finally {
      setDeleting(false)
      setShowDeleteDialog(false)
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
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">{productId === "new" ? "Add New Product" : "Edit Product"}</h1>
          <div className="flex gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={(e) => handleSubmit(e as any, true)} 
              disabled={saving}
            >
              {saving ? "Saving..." : "Save as Draft"}
            </Button>
            {productId !== "new" && (
              <Button 
                variant="destructive" 
                onClick={() => setShowDeleteDialog(true)}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete Product"}
              </Button>
            )}
          </div>
        </div>
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
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Enter product description"
              rows={4}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="originalPrice">Original Price (₹) *</Label>
              <Input
                id="originalPrice"
                type="number"
                step="0.01"
                min="0"
                value={formData.originalPrice}
                onChange={(e) => setFormData((prev) => ({ ...prev, originalPrice: e.target.value }))}
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="discountedPrice">Discounted Price (₹) *</Label>
              <Input
                id="discountedPrice"
                type="number"
                step="0.01"
                min="0"
                value={formData.discountedPrice}
                onChange={(e) => setFormData((prev) => ({ ...prev, discountedPrice: e.target.value }))}
                placeholder="0.00"
                required
              />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {discountPercent > 0 && Number.isFinite(discountedPriceValue)
              ? `Customers see ₹${discountedPriceValue.toFixed(2)} (${discountPercent}% off)`
              : "Set discounted price lower than original to highlight savings."}
          </p>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="featured">Featured Product</Label>
              <p className="text-sm text-muted-foreground">Display this product prominently</p>
            </div>
            <Switch
              id="featured"
              checked={formData.isFeatured}
              onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isFeatured: checked }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="active">Active Product</Label>
              <p className="text-sm text-muted-foreground">Enable or disable product visibility</p>
            </div>
            <Switch
              id="active"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isActive: checked }))}
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
          <Button 
            type="button" 
            variant="outline" 
            onClick={(e) => handleSubmit(e as any, true)} 
            disabled={saving}
            className="flex-1"
          >
            {saving ? "Saving..." : "Save as Draft"}
          </Button>
          <Button type="submit" disabled={saving} className="flex-1">
            {saving ? "Publishing..." : (productId === "new" ? "Publish Product" : "Update & Publish")}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/admin/products">Cancel</Link>
          </Button>
        </div>
      </form>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete this product? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
