export default function Loading() {
  return (
    <div className="space-y-8">
      {/* Header Shimmer */}
      <div className="space-y-4">
        <div className="h-9 rounded-xl shimmer w-52"></div>
        <div className="h-5 rounded-lg shimmer w-80"></div>
      </div>
      
      {/* Orders Table Shimmer */}
      <div className="bg-card/50 rounded-2xl border-0 elegant-shadow overflow-hidden">
        <div className="p-6 border-b border-border/20">
          <div className="h-6 rounded-lg shimmer w-40"></div>
        </div>
        
        <div className="divide-y divide-border/20">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="space-y-2">
                  <div className="h-5 rounded-lg shimmer w-36"></div>
                  <div className="h-4 rounded shimmer w-48"></div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-7 rounded-full shimmer w-24"></div>
                  <div className="h-8 rounded-lg shimmer w-20"></div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="h-4 rounded shimmer w-24"></div>
                  <div className="h-6 rounded-lg shimmer w-32"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 rounded shimmer w-20"></div>
                  <div className="h-5 rounded-lg shimmer w-28"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 rounded shimmer w-16"></div>
                  <div className="h-5 rounded-lg shimmer w-24"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
