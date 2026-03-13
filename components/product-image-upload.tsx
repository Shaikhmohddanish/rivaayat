"use client"

import type React from "react"
import { useState } from "react"
import { Upload, X, Loader2, GripVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import type { ProductImage } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { optimizeImagesForUpload } from "@/lib/client-image-optimizer"

interface ProductImageUploadProps {
  value: ProductImage[]
  onChange: (images: ProductImage[]) => void
  maxImages?: number
}

const MAX_PARALLEL_UPLOADS = 3

async function uploadProductImage(file: File): Promise<{ publicId: string; url: string }> {
  const formData = new FormData()
  formData.append("file", file)

  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data?.error || `Upload failed (${response.status})`)
  }

  if (!data?.publicId || !data?.url) {
    throw new Error("Upload response is missing image metadata")
  }

  return {
    publicId: data.publicId,
    url: data.url,
  }
}

async function uploadWithConcurrency(files: File[], maxParallel: number) {
  const queue = [...files]
  const uploaded: Array<{ publicId: string; url: string }> = []
  const failed: Array<{ fileName: string; reason: string }> = []

  const workers = Array.from({ length: Math.min(maxParallel, queue.length) }, async () => {
    while (queue.length > 0) {
      const current = queue.shift()
      if (!current) return

      try {
        const result = await uploadProductImage(current)
        uploaded.push(result)
      } catch (error) {
        failed.push({
          fileName: current.name,
          reason: error instanceof Error ? error.message : "Upload failed",
        })
      }
    }
  })

  await Promise.all(workers)
  return { uploaded, failed }
}

export function ProductImageUpload({ value = [], onChange, maxImages = 10 }: ProductImageUploadProps) {
  const { toast } = useToast()
  const [uploading, setUploading] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const remainingSlots = maxImages - value.length
    if (remainingSlots <= 0) {
      toast({
        title: "Upload Limit",
        description: `Maximum ${maxImages} images allowed`,
        variant: "destructive"
      })
      e.target.value = ""
      return
    }

    const filesToUpload = files.slice(0, remainingSlots)
    if (files.length > remainingSlots) {
      toast({
        title: "Upload Limit",
        description: `Only ${remainingSlots} image(s) can be uploaded right now`,
        variant: "destructive"
      })
    }

    setUploading(true)

    try {
      const optimizedResult = await optimizeImagesForUpload(filesToUpload)
      const { uploaded, failed } = await uploadWithConcurrency(optimizedResult.files, MAX_PARALLEL_UPLOADS)

      if (uploaded.length > 0) {
        const newImages = uploaded.map((image) => ({
          ...image,
          sortOrder: 0,
        }))

        const updatedImages = [...value, ...newImages].map((img, idx) => ({
          ...img,
          sortOrder: idx,
        }))
        onChange(updatedImages)
      }

      if (optimizedResult.optimizedCount > 0) {
        toast({
          title: "Images optimized",
          description: `${optimizedResult.optimizedCount} image(s) were optimized for faster upload while preserving quality.`,
        })
      }

      if (failed.length > 0) {
        const firstFailure = failed[0]
        toast({
          title: "Some uploads failed",
          description: `${failed.length} file(s) failed. Example: ${firstFailure.fileName} (${firstFailure.reason})`,
          variant: "destructive"
        })
      }
    } finally {
      setUploading(false)
      e.target.value = ""
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
        {[...value]
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
