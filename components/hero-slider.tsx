"use client"

import type { Slide } from "./hero-slider-pro"
import { HeroSliderPro } from "./hero-slider-pro"

const slides: Slide[] = [
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
  return <HeroSliderPro slides={slides} interval={6000} />
}
