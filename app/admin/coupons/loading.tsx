export default function Loading() {
  return (
    <div className="space-y-8">
      {/* Header Shimmer */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="h-9 rounded-xl shimmer w-52"></div>
          <div className="h-5 rounded-lg shimmer w-72 mt-2"></div>
        </div>
        <div className="h-10 w-32 rounded-md shimmer"></div>
      </div>
      
      {/* Coupons Grid Shimmer */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-card/50 rounded-2xl border-0 elegant-shadow overflow-hidden">
            <div className="p-6 border-b border-border/20">
              <div className="flex items-center justify-between">
                <div className="h-6 rounded-lg shimmer w-28"></div>
                <div className="h-6 rounded-full shimmer w-20"></div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <div className="h-4 rounded shimmer w-24"></div>
                <div className="h-6 rounded-lg shimmer w-32"></div>
              </div>
              <div className="flex gap-2 pt-2">
                <div className="h-9 w-full rounded-md shimmer"></div>
                <div className="h-9 w-full rounded-md shimmer"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
