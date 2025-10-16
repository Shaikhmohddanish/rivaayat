"use client"

import type React from "react"

import { useState } from "react"
import { Upload, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { useToast } from "@/hooks/use-toast"

interface ImageUploadProps {
  value: string[]
  onChange: (urls: string[]) => void
  maxImages?: number
}

export function ImageUpload({ value = [], onChange, maxImages = 5 }: ImageUploadProps) {
  const { toast } = useToast()
  const [uploading, setUploading] = useState(false)

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
        return data.url
      })

      const urls = await Promise.all(uploadPromises)
      onChange([...value, ...urls])
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
