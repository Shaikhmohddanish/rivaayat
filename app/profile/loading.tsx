import { ShimmerProfileCard, ShimmerAddressCard, ShimmerHeading } from "@/components/ui/shimmer"

export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Profile Card Shimmer */}
          <ShimmerProfileCard />
          
          {/* Addresses Section Shimmer */}
          <div className="space-y-4">
            <ShimmerHeading className="w-48" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <ShimmerAddressCard key={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
