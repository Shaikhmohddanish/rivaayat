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
  const [colors, setColors] = useState<string[]>([""])
  const [sizes, setSizes] = useState<string[]>([""])
  
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

  const addColor = () => {
    setColors([...colors, ""])
  }

  const updateColor = (index: number, value: string) => {
    const newColors = [...colors]
    newColors[index] = value
    setColors(newColors)
  }

  const removeColor = (index: number) => {
    setColors(colors.filter((_, i) => i !== index))
  }

  const addSize = () => {
    setSizes([...sizes, ""])
  }

  const updateSize = (index: number, value: string) => {
    const newSizes = [...sizes]
    newSizes[index] = value
    setSizes(newSizes)
  }

  const removeSize = (index: number) => {
    setSizes(sizes.filter((_, i) => i !== index))
  }

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

    const variants: ProductVariant[] = []
    validColors.forEach((color) => {
      validSizes.forEach((size) => {
        variants.push({ color, size })
      })
    })

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
            variants,
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
            <div className="flex items-center justify-between">
              <Label>Colors *</Label>
              <Button type="button" variant="outline" size="sm" onClick={addColor}>
                <Plus className="h-4 w-4 mr-1" />
                Add Color
              </Button>
            </div>
            <div className="space-y-2">
              {colors.map((color, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={color}
                    onChange={(e) => updateColor(index, e.target.value)}
                    placeholder="e.g., Red, Blue, Black"
                  />
                  {colors.length > 1 && (
                    <Button type="button" variant="outline" size="icon" onClick={() => removeColor(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Sizes *</Label>
              <Button type="button" variant="outline" size="sm" onClick={addSize}>
                <Plus className="h-4 w-4 mr-1" />
                Add Size
              </Button>
            </div>
            <div className="space-y-2">
              {sizes.map((size, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={size}
                    onChange={(e) => updateSize(index, e.target.value)}
                    placeholder="e.g., S, M, L, XL"
                  />
                  {sizes.length > 1 && (
                    <Button type="button" variant="outline" size="icon" onClick={() => removeSize(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
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
