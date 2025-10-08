"use client"

import { X } from "lucide-react"
import { useState } from "react"

export function OfferBar() {
  const [isVisible, setIsVisible] = useState(true)

  if (!isVisible) return null

  return (
    <div className="elegant-gradient text-white py-2 px-4 text-center text-sm relative">
      <p className="font-medium">✨ Free shipping on orders over ₹1500 | Use code: WELCOME10 for 10% off your first dress ✨</p>
      <button
        onClick={() => setIsVisible(false)}
        className="absolute right-4 top-1/2 -translate-y-1/2 hover:opacity-70 transition-opacity"
        aria-label="Close offer banner"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
