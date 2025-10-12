import { ShimmerImage, ShimmerHeading, ShimmerText, ShimmerButton, ShimmerCard } from "@/components/ui/shimmer"

export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Product Images Shimmer */}
            <div className="space-y-6">
              <ShimmerImage className="aspect-[4/5] w-full rounded-2xl" />
              <div className="grid grid-cols-4 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <ShimmerImage key={i} className="aspect-square rounded-lg" />
                ))}
              </div>
            </div>

            {/* Product Details Shimmer */}
            <div className="space-y-8">
              {/* Header */}
              <div className="space-y-4">
                <ShimmerHeading className="w-3/4 h-10" />
                <ShimmerText className="w-full h-6" />
                <ShimmerText className="w-2/3 h-6" />
              </div>

              {/* Price */}
              <div className="space-y-2">
                <ShimmerText className="w-32 h-8" />
              </div>

              {/* Variants */}
              <div className="space-y-6">
                {/* Variations */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <ShimmerText className="w-16 h-5" />
                    <ShimmerButton className="w-full h-10" />
                  </div>
                  
                  <div className="space-y-2">
                    <ShimmerText className="w-12 h-5" />
                    <ShimmerButton className="w-full h-10" />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-4">
                <ShimmerButton className="w-full h-12" />
                <div className="flex gap-3">
                  <ShimmerButton className="flex-1 h-12" />
                  <ShimmerButton className="w-12 h-12" />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-4">
                <ShimmerHeading className="w-32 h-6" />
                <div className="space-y-3">
                  <ShimmerText className="w-full h-4" />
                  <ShimmerText className="w-full h-4" />
                  <ShimmerText className="w-3/4 h-4" />
                  <ShimmerText className="w-5/6 h-4" />
                </div>
              </div>

              {/* Features */}
              <ShimmerCard className="h-32" />
            </div>
          </div>

          {/* Related Products */}
          <div className="mt-16 space-y-8">
            <ShimmerHeading className="w-48 h-8" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-4">
                  <ShimmerImage className="aspect-[3/4] w-full rounded-xl" />
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