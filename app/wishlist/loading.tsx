import { ShimmerHeading, ShimmerText, ShimmerProductCard } from "@/components/ui/shimmer"

export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header Shimmer */}
          <div className="text-center space-y-4 mb-12">
            <ShimmerHeading className="w-64 h-12 mx-auto" />
            <ShimmerText className="w-96 h-6 mx-auto" />
          </div>
          
          {/* Product Grid Shimmer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <ShimmerProductCard key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
