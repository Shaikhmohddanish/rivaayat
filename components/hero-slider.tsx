"use client"

import type { Slide } from "./hero-slider-pro"
import { HeroSliderPro } from "./hero-slider-pro"

const slides: Slide[] = [
  {
    image: "/banners/desktop/hero-banner-1.png",
    mobileImage: "/banners/mobile/hero-banner-1.png",
    title: "Discover Timeless Elegance",
    description: "Exquisite dresses crafted for the sophisticated woman",
    cta: "Shop Collection",
    href: "/shop",
  },
  {
    image: "/banners/desktop/hero-banner-2.png",
    mobileImage: "/banners/mobile/hero-banner-2.png",
    title: "Luxury Traditional Wear",
    description: "Handcrafted designs with intricate golden embroidery",
    cta: "View Collection",
    href: "/shop",
  },
  {
    image: "/banners/desktop/hero-banner-3.png",
    mobileImage: "/banners/mobile/hero-banner-3.png",
    title: "Exclusive Designer Collection",
    description: "Premium ethnic wear for special occasions",
    cta: "Explore Now",
    href: "/shop",
  },
]

export function HeroSlider() {
  return <HeroSliderPro slides={slides} interval={6000} />
}
