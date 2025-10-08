export default function Loading() {
  return (
    <div className="space-y-8">
      {/* Header Shimmer */}
      <div className="space-y-4">
        <div className="h-9 rounded-xl shimmer w-64"></div>
        <div className="h-5 rounded-lg shimmer w-80"></div>
      </div>
      
      {/* Products Controls Shimmer */}
      <div className="flex items-center justify-between mb-6">
        <div className="relative w-64">
          <div className="h-10 rounded-md shimmer w-full"></div>
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-28 rounded-md shimmer"></div>
          <div className="h-10 w-32 rounded-md shimmer"></div>
        </div>
      </div>
      
      {/* Products Grid Shimmer */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-card/50 rounded-2xl border-0 elegant-shadow overflow-hidden">
            <div className="aspect-[4/3] relative">
              <div className="h-full w-full shimmer"></div>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="h-6 rounded-lg shimmer w-32"></div>
                <div className="h-6 rounded-full shimmer w-16"></div>
              </div>
              <div className="h-4 rounded shimmer w-full"></div>
              <div className="h-4 rounded shimmer w-2/3"></div>
              <div className="flex items-center justify-between mt-2">
                <div className="h-7 rounded-lg shimmer w-20"></div>
                <div className="h-8 rounded-lg shimmer w-20"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
