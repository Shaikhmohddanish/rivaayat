export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          {/* Icon Shimmer */}
          <div className="w-24 h-24 rounded-full shimmer-card mx-auto"></div>
          
          {/* Title Shimmer */}
          <div className="space-y-4">
            <div className="h-10 rounded-xl shimmer w-80 mx-auto"></div>
            <div className="h-6 rounded-lg shimmer w-96 mx-auto"></div>
          </div>
          
          {/* Order Details Shimmer */}
          <div className="bg-card/50 rounded-2xl p-8 elegant-shadow border-0 space-y-6">
            <div className="space-y-4">
              <div className="h-6 rounded-lg shimmer w-48 mx-auto"></div>
              <div className="h-8 rounded-xl shimmer w-32 mx-auto"></div>
            </div>
            
            <div className="border-t border-border/20 pt-6 space-y-4">
              <div className="h-5 rounded-lg shimmer w-64 mx-auto"></div>
              <div className="h-4 rounded shimmer w-72 mx-auto"></div>
            </div>
          </div>
          
          {/* Action Buttons Shimmer */}
          <div className="flex gap-4 justify-center">
            <div className="h-12 rounded-xl shimmer w-36"></div>
            <div className="h-12 rounded-xl shimmer w-32"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
