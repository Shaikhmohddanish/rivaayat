"use client"

import type React from "react"

import { useState } from "react"
import { Upload, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { useToast } from "@/hooks/use-toast"
import { optimizeImagesForUpload } from "@/lib/client-image-optimizer"

interface ImageUploadProps {
  value: string[]
  onChange: (urls: string[]) => void
  maxImages?: number
}

const MAX_PARALLEL_UPLOADS = 3

async function uploadImage(file: File): Promise<string> {
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

  if (!data?.url) {
    throw new Error("Upload response is missing image URL")
  }

  return data.url
}

async function uploadWithConcurrency(files: File[], maxParallel: number) {
  const queue = [...files]
  const uploaded: string[] = []
  const failed: Array<{ fileName: string; reason: string }> = []

  const workers = Array.from({ length: Math.min(maxParallel, queue.length) }, async () => {
    while (queue.length > 0) {
      const current = queue.shift()
      if (!current) return

      try {
        const url = await uploadImage(current)
        uploaded.push(url)
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

export function ImageUpload({ value = [], onChange, maxImages = 5 }: ImageUploadProps) {
  const { toast } = useToast()
  const [uploading, setUploading] = useState(false)

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
        onChange([...value, ...uploaded])
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

  const handleRemove = (url: string) => {
    onChange(value.filter((v) => v !== url))
  }

  const handleReorder = (fromIndex: number, toIndex: number) => {
    const newValue = [...value]
    const [removed] = newValue.splice(fromIndex, 1)
    newValue.splice(toIndex, 0, removed)
    onChange(newValue)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {value.map((url, index) => (
          <div key={url} className="relative group aspect-square rounded-lg overflow-hidden border bg-muted">
            <Image src={url || "/placeholder.svg"} alt={`Upload ${index + 1}`} fill className="object-cover" />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="icon"
                onClick={() => handleRemove(url)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
              {index > 0 && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => handleReorder(index, index - 1)}
                  className="h-8 px-2"
                >
                  ←
                </Button>
              )}
              {index < value.length - 1 && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => handleReorder(index, index + 1)}
                  className="h-8 px-2"
                >
                  →
                </Button>
              )}
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
        {value.length} / {maxImages} images uploaded
      </p>
    </div>
  )
}
