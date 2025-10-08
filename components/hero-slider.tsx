"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

const slides = [
  {
    image: "/elegant-ladies-dress-fashion-banner.jpg",
    title: "Discover Timeless Elegance",
    description: "Exquisite dresses crafted for the sophisticated woman",
    cta: "Shop Collection",
    href: "/shop",
  },
  {
    image: "/summer-collection-ladies-dresses.jpg",
    title: "Summer Collection 2024",
    description: "Breathe in the beauty of fresh, feminine styles",
    cta: "View Collection",
    href: "/shop",
  },
  {
    image: "/exclusive-designer-dresses.jpg",
    title: "Exclusive Designer Pieces",
    description: "Limited edition dresses for special moments",
    cta: "Explore Now",
    href: "/shop",
  },
]

export function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 5000)

    return () => clearInterval(timer)
  }, [])

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
  }

  const goToPrevious = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
  }

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length)
  }

  return (
    <section className="relative h-[500px] md:h-[600px] w-full overflow-hidden">
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-all duration-1000 overflow-hidden ${
            index === currentSlide ? "opacity-100 scale-100" : "opacity-0 scale-105"
          }`}
        >
          <Image
            src={slide.image || "/placeholder.svg"}
            alt={slide.title}
            fill
            className="object-cover w-full h-full"
            priority={index === 0}
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-black/20 flex items-center justify-center">
            <div className="text-center text-white space-y-6 px-4 max-w-4xl">
              <h1 className="text-4xl md:text-6xl font-bold text-balance font-display elegant-text-shadow">
                {slide.title}
              </h1>
              <p className="text-lg md:text-xl text-balance opacity-95 leading-relaxed">
                {slide.description}
              </p>
              <div className="pt-2">
                <Link 
                  href={slide.href} 
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 elegant-gradient hover:opacity-90 hover:scale-105 text-white h-12 px-8 elegant-shadow"
                >
                  {slide.cta}
                </Link>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Arrows */}
      <button
        onClick={goToPrevious}
        className="absolute left-6 top-1/2 -translate-y-1/2 glass-effect hover:bg-white/30 text-white rounded-full p-3 transition-all duration-300 hover:scale-110 elegant-shadow"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button
        onClick={goToNext}
        className="absolute right-6 top-1/2 -translate-y-1/2 glass-effect hover:bg-white/30 text-white rounded-full p-3 transition-all duration-300 hover:scale-110 elegant-shadow"
        aria-label="Next slide"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-3 rounded-full transition-all duration-300 elegant-shadow ${
              index === currentSlide 
                ? "bg-white w-10 opacity-100" 
                : "bg-white/60 w-3 hover:bg-white/80"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  )
}
