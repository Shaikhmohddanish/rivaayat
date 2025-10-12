"use client"

import type React from "react"

import { useState } from "react"
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
import type { ProductImage, ProductVariant } from "@/lib/types"
import { useSlug } from "@/hooks/use-slug"

export default function NewProductPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    isFeatured: false,
  })

  // Use our new slug hook
  const { slug, setName, setSlug, status: slugStatus, message: slugMessage, isValid: isSlugValid, checkSlug } = useSlug()

  const [images, setImages] = useState<ProductImage[]>([])
  const [colors, setColors] = useState<string[]>([])
  const [sizes, setSizes] = useState<string[]>([])
  const [variants, setVariants] = useState<ProductVariant[]>([])
  
  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (status === "unauthenticated" || session?.user?.role !== "admin") {
    router.push("/")
    return null
  }

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
    })
    // Update the slug using our new hook
    setName(name)
  }

  // No longer need the individual add/update/remove functions for colors and sizes
  // as our new components handle this internally

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !slug || !formData.description || !formData.price) {
      alert("Please fill in all required fields")
      return
    }
    
    // Validate slug availability
    if (!isSlugValid) {
      const isAvailable = await checkSlug()
      if (!isAvailable) {
        alert("Please use a different slug. This one is already taken.")
        return
      }
    }

    if (images.length === 0) {
      alert("Please upload at least one image")
      return
    }

    const validColors = colors.filter((c) => c.trim() !== "")
    const validSizes = sizes.filter((s) => s.trim() !== "")

    if (validColors.length === 0 || validSizes.length === 0) {
      alert("Please add at least one color and one size")
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
      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          slug, // Use our managed slug state
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
        router.push("/admin/products")
      } else {
        const error = await response.json()
        alert(error.error || "Failed to create product")
      }
    } catch (error) {
      console.error("Error creating product:", error)
      alert("Failed to create product")
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
        <h1 className="text-3xl font-bold">Add New Product</h1>
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
            {saving ? "Creating..." : "Create Product"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/admin/products">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  )
}
