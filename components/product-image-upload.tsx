"use client"

import type React from "react"
import { useState } from "react"
import { Upload, X, Loader2, GripVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import type { ProductImage } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

interface ProductImageUploadProps {
  value: ProductImage[]
  onChange: (images: ProductImage[]) => void
  maxImages?: number
}

export function ProductImageUpload({ value = [], onChange, maxImages = 10 }: ProductImageUploadProps) {
  const { toast } = useToast()
  const [uploading, setUploading] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    if (value.length + files.length > maxImages) {
      toast({
        title: "Upload Limit",
        description: `Maximum ${maxImages} images allowed`,
        variant: "destructive"
      })
      return
    }

    setUploading(true)

    try {
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData()
        formData.append("file", file)

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) throw new Error("Upload failed")

        const data = await response.json()
        return {
          publicId: data.publicId,
          url: data.url,
          sortOrder: value.length,
        }
      })

      const newImages = await Promise.all(uploadPromises)
      const updatedImages = [...value, ...newImages].map((img, idx) => ({
        ...img,
        sortOrder: idx,
      }))
      onChange(updatedImages)
    } catch (error) {
      console.error("Upload error:", error)
      toast({
        title: "Upload Failed",
        description: "Failed to upload images",
        variant: "destructive"
      })
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = (publicId: string) => {
    const updatedImages = value
      .filter((img) => img.publicId !== publicId)
      .map((img, idx) => ({
        ...img,
        sortOrder: idx,
      }))
    onChange(updatedImages)
  }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    const newImages = [...value]
    const draggedImage = newImages[draggedIndex]
    newImages.splice(draggedIndex, 1)
    newImages.splice(index, 0, draggedImage)

    const reorderedImages = newImages.map((img, idx) => ({
      ...img,
      sortOrder: idx,
    }))

    onChange(reorderedImages)
    setDraggedIndex(index)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {value
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((image, index) => (
            <div
              key={image.publicId}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className="relative group aspect-square rounded-lg overflow-hidden border bg-muted cursor-move"
            >
              <Image src={image.url || "/placeholder.svg"} alt={`Product ${index + 1}`} fill className="object-cover" />
              <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">{index + 1}</div>
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <GripVertical className="h-6 w-6 text-white" />
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  onClick={() => handleRemove(image.publicId)}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

        {value.length < maxImages && (
          <label className="relative aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors cursor-pointer flex items-center justify-center">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleUpload}
              disabled={uploading}
              className="sr-only"
            />
            {uploading ? (
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            ) : (
              <div className="text-center">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">Upload</p>
              </div>
            )}
          </label>
        )}
      </div>
      <p className="text-sm text-muted-foreground">
        {value.length} / {maxImages} images • Drag to reorder
      </p>
    </div>
  )
}
