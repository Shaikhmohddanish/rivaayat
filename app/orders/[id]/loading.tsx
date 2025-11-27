import { ShimmerOrderDetails } from "@/components/ui/shimmer"

export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <ShimmerOrderDetails />
      </div>
    </div>
  )
}
