"use client"
import Image from "next/image"
import { useState } from "react"

interface GalleryProps {
  images: { url: string; alt?: string }[]
}

export default function ProductGallery({ images }: GalleryProps) {
  const [active, setActive] = useState(0)
  const safe = images?.length ? images : [{ url: "/placeholder.svg?height=800&width=600" }]

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
            <Image src={img.url} alt={img.alt ?? "Product image"} fill sizes="80px" className="object-cover rounded" />
          </button>
        ))}
      </div>
      <div className="order-1 sm:order-2 relative aspect-[4/5] w-full overflow-hidden rounded-lg border border-gray-200">
        <Image
          src={safe[active].url}
          alt={safe[active].alt ?? "Product image"}
          fill
          sizes="(max-width:768px) 100vw, 50vw"
          className="object-cover"
          priority
        />
      </div>
    </div>
  )
}