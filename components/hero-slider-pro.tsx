"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"

/** Local media-query hook (no external dependency required) */
function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false) // Default to false to avoid hydration mismatch
  
  useEffect(() => {
    // Only run on client side
    if (typeof window !== "undefined") {
      const mql = window.matchMedia(query)
      const onChange = () => setMatches(mql.matches)
      onChange() // Set initial value
      mql.addEventListener("change", onChange)
      return () => mql.removeEventListener("change", onChange)
    }
  }, [query])
  
  return matches
}

export type Slide = {
  image: string
  title: string
  description?: string
  cta?: string
  href?: string
  sublabel?: string
}

interface HeroSliderProProps {
  slides: Slide[]
  interval?: number
}

export function HeroSliderPro({ slides, interval = 6000 }: HeroSliderProProps) {
  const [current, setCurrent] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [progress, setProgress] = useState(0)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)")
  const isMobile = useMediaQuery("(max-width: 768px)")
  const count = slides.length
  
  // Added to track client-side rendering
  const [isClient, setIsClient] = useState(false)
  
  useEffect(() => {
    setIsClient(true)
  }, [])

  const updateProgress = useCallback(() => {
    if (!playing || !startTimeRef.current) return
    const elapsed = Date.now() - startTimeRef.current
    const pct = Math.min(100, (elapsed / interval) * 100)
    setProgress(pct)
    if (pct < 100) requestAnimationFrame(updateProgress)
  }, [playing, interval])

  useEffect(() => {
    const onVis = () => setPlaying(!document.hidden)
    document.addEventListener("visibilitychange", onVis)
    return () => document.removeEventListener("visibilitychange", onVis)
  }, [])

  useEffect(() => {
    if (prefersReducedMotion) return
    if (playing) {
      startTimeRef.current = Date.now()
      setProgress(0)
      requestAnimationFrame(updateProgress)
      timeoutRef.current = setTimeout(() => setCurrent((p) => (p + 1) % count), interval)
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [current, playing, interval, count, prefersReducedMotion, updateProgress])

  const prev = () => {
    setCurrent((p) => (p - 1 + count) % count)
    setPlaying(true)
  }
  const next = () => {
    setCurrent((p) => (p + 1) % count)
    setPlaying(true)
  }
  const goTo = (i: number) => {
    setCurrent(i)
    setPlaying(true)
  }

  // Touch/swipe
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const onTouchStart = (e: React.TouchEvent) => {
    setPlaying(false)
    setTouchStart(e.touches[0].clientX)
    setTouchEnd(null)
  }
  const onTouchMove = (e: React.TouchEvent) => setTouchEnd(e.touches[0].clientX)
  const onTouchEnd = () => {
    if (touchStart == null || touchEnd == null) return setPlaying(true)
    const delta = touchStart - touchEnd
    if (Math.abs(delta) > 50) (delta > 0 ? next : prev)()
    setPlaying(true)
  }

  // Keyboard arrows
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev()
      if (e.key === "ArrowRight") next()
    }
    containerRef.current?.addEventListener("keydown", onKey)
    return () => containerRef.current?.removeEventListener("keydown", onKey)
  }, [])

  return (
    <section
      ref={containerRef}
      className="relative w-full overflow-hidden min-h-[450px] max-h-[680px] h-[60vh] max-w-[100vw]"
      onMouseEnter={() => setPlaying(false)}
      onMouseLeave={() => setPlaying(true)}
      onFocus={() => setPlaying(false)}
      onBlur={() => setPlaying(true)}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      role="region"
      aria-label="Hero slider"
      tabIndex={0}
    >
      <div className="relative h-full">
        {slides.map((s, i) => (
          <div
            key={i}
            className={`absolute inset-0 transition-[opacity,transform] duration-1000 will-change-transform ${
              i === current ? "opacity-100 z-10 scale-100" : "opacity-0 z-0 scale-105"
            }`}
            aria-hidden={i !== current}
          >
            <Image
              src={s.image || "/placeholder.svg"}
              alt={s.title}
              fill
              priority={i === 0}
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30" />
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <div className="text-center text-white max-w-3xl mx-auto">
                {s.sublabel && (
                  <span className="inline-flex text-xs md:text-sm tracking-wider uppercase rounded-full border border-white/30 bg-white/10 px-3 py-1 mb-4 backdrop-blur">
                    {s.sublabel}
                  </span>
                )}
                <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold leading-tight text-balance drop-shadow">
                  {s.title}
                </h1>
                {s.description && (
                  <p className="mt-4 text-base md:text-lg lg:text-xl text-white/95 text-balance">
                    {s.description}
                  </p>
                )}
                {s.cta && s.href && (
                  <div className="pt-5">
                    <Link
                      href={s.href}
                      className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm md:text-base font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 elegant-gradient hover:opacity-90 hover:scale-[1.02] text-white h-10 md:h-12 px-6 md:px-8 shadow-lg"
                    >
                      {s.cta}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {isClient && (!isMobile || prefersReducedMotion) && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 glass-effect text-white rounded-full p-2 md:p-3 hover:bg-white/30 transition z-20"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
          </button>
          <button
            onClick={next}
            className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 glass-effect text-white rounded-full p-2 md:p-3 hover:bg-white/30 transition z-20"
            aria-label="Next slide"
          >
            <ChevronRight className="h-5 w-5 md:h-6 md:w-6" />
          </button>
        </>
      )}

      <div className="absolute bottom-5 md:bottom-6 left-1/2 -translate-x-1/2 flex gap-2 md:gap-3 z-20">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className="relative h-2.5 md:h-3 rounded-full transition-all duration-300 bg-white/60 hover:bg-white/80 overflow-hidden"
            style={{ width: i === current ? "2.5rem" : "0.6rem", opacity: i === current ? 1 : 0.6 }}
            aria-label={`Go to slide ${i + 1}`}
            aria-current={i === current}
          >
            {isClient && i === current && playing && !prefersReducedMotion && (
              <span
                className="absolute left-0 top-0 h-full bg-white"
                style={{ width: `${progress}%` }}
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            )}
          </button>
        ))}
      </div>
    </section>
  )
}
