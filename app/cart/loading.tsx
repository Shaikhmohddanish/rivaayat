import { ShimmerHeading, ShimmerText, ShimmerButton, ShimmerCard, ShimmerProductCard } from "@/components/ui/shimmer"

export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Header Shimmer */}
          <div className="text-center space-y-4">
            <ShimmerHeading className="w-48 h-9 mx-auto" />
            <ShimmerText className="w-80 h-5 mx-auto" />
          </div>

          {/* Cart Items Shimmer */}
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card/50 rounded-2xl p-6 elegant-shadow border-0">
                <div className="flex gap-6">
                  <div className="w-24 h-24 rounded-xl shimmer-card flex-shrink-0" />
                  <div className="flex-1 space-y-4">
                    <div className="flex justify-between">
                      <div className="space-y-2">
                        <ShimmerHeading className="w-48 h-6" />
                        <ShimmerText className="w-32 h-4" />
                        <ShimmerText className="w-24 h-4" />
                      </div>
                      <div className="text-right space-y-2">
                        <ShimmerText className="w-16 h-6" />
                        <div className="w-6 h-6 rounded shimmer" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded shimmer" />
                        <ShimmerText className="w-8 h-6" />
                        <div className="w-8 h-8 rounded shimmer" />
                      </div>
                      <ShimmerText className="w-20 h-6" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary Card Shimmer */}
          <div className="bg-card/50 rounded-2xl p-6 elegant-shadow border-0">
            <div className="space-y-6">
              <ShimmerHeading className="w-32 h-6" />
              <div className="space-y-4">
                <div className="flex justify-between">
                  <ShimmerText className="w-16 h-4" />
                  <ShimmerText className="w-20 h-4" />
                </div>
                <div className="flex justify-between">
                  <ShimmerText className="w-20 h-4" />
                  <ShimmerText className="w-12 h-4" />
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between">
                    <ShimmerText className="w-12 h-6" />
                    <ShimmerText className="w-24 h-6" />
                  </div>
                </div>
              </div>
              <ShimmerButton className="w-full h-12" />
            </div>
          </div>

          {/* Recommended Products */}
          <div className="space-y-6">
            <ShimmerHeading className="w-56 h-7" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[1, 2].map((i) => (
                <div key={i} className="space-y-4">
                  <div className="aspect-[3/4] w-full rounded-xl shimmer-card" />
                  <div className="space-y-2">
                    <ShimmerText className="w-3/4 h-5" />
                    <ShimmerText className="w-1/2 h-4" />
                    <ShimmerText className="w-20 h-6" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}