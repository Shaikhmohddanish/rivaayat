"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { ProductImageUpload } from "@/components/product-image-upload"
import { ArrowLeft, Plus, X } from "lucide-react"
import Link from "next/link"
import type { Product, ProductImage, ProductVariant } from "@/lib/types"

export default function EditProductPage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [product, setProduct] = useState<Product | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    price: "",
    isFeatured: false,
  })

  const [images, setImages] = useState<ProductImage[]>([])
  const [colors, setColors] = useState<string[]>([""])
  const [sizes, setSizes] = useState<string[]>([""])

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
      const response = await fetch(`/api/admin/products/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setProduct(data)
        setFormData({
          name: data.name,
          slug: data.slug,
          description: data.description,
          price: data.price.toString(),
          isFeatured: data.isFeatured,
        })
        setImages(data.images)
        setColors(data.variations.colors)
        setSizes(data.variations.sizes)
      } else {
        alert("Product not found")
        router.push("/admin/products")
      }
    } catch (error) {
      console.error("Error fetching product:", error)
      alert("Failed to load product")
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

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
  }

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: generateSlug(name),
    })
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

    if (!formData.name || !formData.slug || !formData.description || !formData.price) {
      alert("Please fill in all required fields")
      return
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
      const response = await fetch(`/api/admin/products/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
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
        alert(error.error || "Failed to update product")
      }
    } catch (error) {
      console.error("Error updating product:", error)
      alert("Failed to update product")
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
        <h1 className="text-3xl font-bold">Edit Product</h1>
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

          <div className="space-y-2">
            <Label htmlFor="slug">Slug *</Label>
            <Input
              id="slug"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              placeholder="product-slug"
              required
            />
            <p className="text-sm text-muted-foreground">URL-friendly version of the name</p>
          </div>

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
            {saving ? "Saving..." : "Save Changes"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/admin/products">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  )
}
