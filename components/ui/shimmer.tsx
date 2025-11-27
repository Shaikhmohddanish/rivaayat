"use client"

import { cn } from "@/lib/utils"

interface ShimmerProps {
  className?: string
  variant?: "default" | "card" | "circle" | "text"
  width?: string | number
  height?: string | number
  rounded?: "none" | "sm" | "md" | "lg" | "xl" | "full"
}

export function Shimmer({ 
  className, 
  variant = "default", 
  width, 
  height, 
  rounded = "md" 
}: ShimmerProps) {
  const baseClasses = "shimmer"
  
  const variantClasses = {
    default: "shimmer",
    card: "shimmer-card", 
    circle: "shimmer rounded-full",
    text: "shimmer"
  }
  
  const roundedClasses = {
    none: "rounded-none",
    sm: "rounded-sm", 
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl", 
    full: "rounded-full"
  }

  const style = {
    ...(width && { width: typeof width === 'number' ? `${width}px` : width }),
    ...(height && { height: typeof height === 'number' ? `${height}px` : height })
  }

  return (
    <div 
      className={cn(
        variantClasses[variant],
        roundedClasses[rounded],
        className
      )}
      style={style}
    />
  )
}

// Predefined shimmer components for common use cases
export function ShimmerText({ className, ...props }: Omit<ShimmerProps, "variant">) {
  return <Shimmer variant="text" className={cn("h-4", className)} {...props} />
}

export function ShimmerTitle({ className, ...props }: Omit<ShimmerProps, "variant">) {
  return <Shimmer variant="text" className={cn("h-6", className)} rounded="lg" {...props} />
}

export function ShimmerHeading({ className, ...props }: Omit<ShimmerProps, "variant">) {
  return <Shimmer variant="text" className={cn("h-8", className)} rounded="xl" {...props} />
}

export function ShimmerCard({ className, ...props }: Omit<ShimmerProps, "variant">) {
  return <Shimmer variant="card" className={cn("p-6", className)} rounded="xl" {...props} />
}

export function ShimmerButton({ className, ...props }: Omit<ShimmerProps, "variant">) {
  return <Shimmer variant="default" className={cn("h-10 w-24", className)} rounded="lg" {...props} />
}

export function ShimmerAvatar({ className, size = 40, ...props }: Omit<ShimmerProps, "variant"> & { size?: number }) {
  return (
    <Shimmer 
      variant="card" 
      className={cn("flex-shrink-0", className)} 
      width={size} 
      height={size} 
      rounded="full" 
      {...props} 
    />
  )
}

export function ShimmerImage({ className, ...props }: Omit<ShimmerProps, "variant">) {
  return <Shimmer variant="card" className={cn("aspect-square", className)} rounded="lg" {...props} />
}

// Complex shimmer layouts
export function ShimmerProductCard() {
  return (
    <div className="bg-card/50 rounded-2xl overflow-hidden elegant-shadow border-0">
      <ShimmerImage className="aspect-[3/4] w-full" />
      <div className="p-6 space-y-4">
        <ShimmerTitle className="w-3/4" />
        <div className="space-y-2">
          <ShimmerText className="w-full" />
          <ShimmerText className="w-2/3" />
        </div>
        <div className="flex items-center justify-between">
          <ShimmerText className="w-20 h-6" />
          <ShimmerButton />
        </div>
      </div>
    </div>
  )
}

export function ShimmerOrderCard() {
  return (
    <div className="bg-card/50 rounded-2xl overflow-hidden elegant-shadow border-0">
      <div className="bg-gradient-to-r from-muted/20 to-muted/40 p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-3">
            <ShimmerTitle className="w-36" />
            <ShimmerText className="w-52" />
          </div>
          <div className="flex items-center gap-4">
            <Shimmer className="h-7 w-24" rounded="full" />
            <ShimmerButton className="h-9 w-28" />
          </div>
        </div>
      </div>
      <div className="p-6 space-y-5">
        {[1, 2].map((i) => (
          <div key={i} className="flex items-center gap-4">
            <ShimmerImage className="w-18 h-18" />
            <div className="flex-1 space-y-3">
              <ShimmerTitle className="w-3/4" />
              <ShimmerText className="w-2/3" />
              <ShimmerText className="w-1/2" />
            </div>
            <div className="text-right space-y-2">
              <ShimmerTitle className="w-20" />
              <ShimmerText className="w-16" />
            </div>
          </div>
        ))}
        <div className="border-t border-border/20 pt-5">
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <ShimmerText className="w-28" />
              <ShimmerText className="w-24" />
            </div>
            <div className="text-right space-y-2">
              <ShimmerTitle className="w-24 h-7" />
              <ShimmerText className="w-16" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Profile Card Shimmer
export function ShimmerProfileCard() {
  return (
    <div className="bg-card/50 rounded-2xl p-6 elegant-shadow border-0 space-y-6">
      <div className="flex items-center gap-6">
        <ShimmerAvatar size={80} />
        <div className="space-y-3 flex-1">
          <ShimmerHeading className="w-48" />
          <ShimmerText className="w-32" />
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-2">
            <ShimmerText className="w-20" />
            <ShimmerTitle className="w-24" />
          </div>
        ))}
      </div>
    </div>
  )
}

// Address Card Shimmer
export function ShimmerAddressCard() {
  return (
    <div className="bg-card/50 rounded-xl p-4 elegant-shadow border-0 space-y-3">
      <div className="flex justify-between items-start">
        <ShimmerTitle className="w-32" />
        <div className="flex gap-2">
          <Shimmer className="w-8 h-8" rounded="md" />
          <Shimmer className="w-8 h-8" rounded="md" />
        </div>
      </div>
      <ShimmerText className="w-full" />
      <ShimmerText className="w-4/5" />
      <ShimmerText className="w-3/5" />
    </div>
  )
}

// Order Details Shimmer
export function ShimmerOrderDetails() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-card/50 rounded-2xl p-6 elegant-shadow border-0">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
          <div className="space-y-2">
            <ShimmerHeading className="w-48" />
            <ShimmerText className="w-32" />
          </div>
          <Shimmer className="h-8 w-28" rounded="full" />
        </div>
        
        {/* Order Items */}
        <div className="space-y-4 mb-6">
          <ShimmerTitle className="w-24" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4 pb-4 border-b border-border/20">
              <Shimmer className="w-20 h-20 flex-shrink-0" rounded="lg" />
              <div className="flex-1 space-y-2">
                <ShimmerTitle className="w-48" />
                <ShimmerText className="w-32" />
                <ShimmerText className="w-24" />
              </div>
              <ShimmerTitle className="w-20" />
            </div>
          ))}
        </div>
        
        {/* Shipping & Tracking */}
        <div className="grid sm:grid-cols-2 gap-6 pt-6 border-t">
          <div className="space-y-3">
            <ShimmerTitle className="w-32" />
            <ShimmerText className="w-full" />
            <ShimmerText className="w-4/5" />
            <ShimmerText className="w-3/5" />
          </div>
          <div className="space-y-3">
            <ShimmerTitle className="w-32" />
            <ShimmerText className="w-full" />
            <ShimmerText className="w-3/4" />
          </div>
        </div>
      </div>
      
      {/* Order Summary */}
      <div className="bg-card/50 rounded-2xl p-6 elegant-shadow border-0 space-y-3">
        <ShimmerTitle className="w-32 mb-4" />
        <div className="flex justify-between">
          <ShimmerText className="w-24" />
          <ShimmerText className="w-20" />
        </div>
        <div className="flex justify-between">
          <ShimmerText className="w-24" />
          <ShimmerText className="w-20" />
        </div>
        <div className="flex justify-between pt-3 border-t">
          <ShimmerTitle className="w-24" />
          <ShimmerTitle className="w-24" />
        </div>
      </div>
    </div>
  )
}