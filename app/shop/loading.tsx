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

          {/* Filters Shimmer */}
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Filters */}
            <div className="lg:w-64 space-y-6">
              <div className="bg-card/50 rounded-2xl p-6 elegant-shadow border-0 space-y-4">
                <ShimmerHeading className="w-24 h-6" />
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded shimmer" />
                      <ShimmerText className="w-20 h-4" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-card/50 rounded-2xl p-6 elegant-shadow border-0 space-y-4">
                <ShimmerHeading className="w-16 h-6" />
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded shimmer" />
                      <ShimmerText className="w-12 h-4" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Products Grid */}
            <div className="flex-1 space-y-6">
              {/* Search and Results Count */}
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1 h-10 rounded-xl shimmer" />
                  <div className="w-24 h-10 rounded-xl shimmer" />
                </div>
                <ShimmerText className="w-48 h-4" />
              </div>

              {/* Products Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 12 }).map((_, i) => (
                  <ShimmerProductCard key={i} />
                ))}
              </div>

              {/* Load More Button */}
              <div className="flex justify-center mt-8">
                <div className="w-32 h-12 rounded-xl shimmer" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}