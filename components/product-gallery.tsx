"use client"
import Image from "next/image"
import { useState, useEffect, useCallback, useMemo } from "react"
import { getCloudinaryImageUrl } from "@/lib/cloudinary-image"
import { useIsMobile } from "@/hooks/use-mobile"

interface GalleryProps {
  images: { url: string; alt?: string }[]
}

export default function ProductGallery({ images }: GalleryProps) {
  const [active, setActive] = useState(0)
  const isMobile = useIsMobile()
  const safe = images?.length ? images : [{ url: "/placeholder.svg?height=800&width=600" }]

  // Build all full-size URLs once
  const fullSizeUrls = useMemo(() => {
    return safe.map((img) =>
      img.url
        ? getCloudinaryImageUrl(img.url, {
            width: isMobile ? 900 : 1400,
            height: isMobile ? 1200 : 1867,
            mode: "fit",
          })
        : "/placeholder.svg?height=800&width=600"
    )
  }, [safe, isMobile])

  // Preload all gallery images so switching is instant
  useEffect(() => {
    fullSizeUrls.forEach((url, i) => {
      if (i === 0) return // first image already loads via priority
      const img = new window.Image()
      img.src = url
    })
  }, [fullSizeUrls])

  return (
    <div className="grid gap-4 sm:grid-cols-[96px_1fr]">
      <div className="order-2 sm:order-1 flex sm:flex-col gap-2 sm:max-h-[520px] overflow-auto pr-1">
        {safe.map((img, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`relative h-20 w-20 rounded border ${i === active ? "border-primary" : "border-gray-200"}`}
            aria-label={`View image ${i + 1}`}
          >
            <Image
              src={img.url ? getCloudinaryImageUrl(img.url, { width: 160, height: 160, mode: "fill" }) : "/placeholder.svg"}
              alt={img.alt ?? "Product image"}
              fill
              sizes="80px"
              className="object-cover rounded"
            />
          </button>
        ))}
      </div>
      <div className="order-1 sm:order-2 relative aspect-[3/4] w-full overflow-hidden rounded-lg border border-gray-200 bg-muted/30">
        <Image
          src={fullSizeUrls[active]}
          alt={safe[active].alt ?? "Product image"}
          fill
          sizes="(max-width:768px) 100vw, 50vw"
          className="object-contain"
          priority
        />
      </div>
    </div>
  )
}