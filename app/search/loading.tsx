export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Search Header Shimmer */}
      <div className="mb-8">
        <div className="h-9 rounded-xl shimmer w-64 mb-6"></div>
        
        {/* Search Bar Shimmer */}
        <div className="relative mb-6">
          <div className="h-12 rounded-md shimmer w-full"></div>
        </div>

        {/* Search Info Shimmer */}
        <div className="flex items-center justify-between mb-4">
          <div className="h-5 rounded shimmer w-48"></div>
          <div className="flex items-center gap-2">
            <div className="h-8 rounded-md shimmer w-20"></div>
            <div className="h-8 rounded-md shimmer w-16"></div>
          </div>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Filters Sidebar Shimmer */}
        <aside className="w-80 hidden lg:block">
          <div className="bg-card/50 rounded-2xl border-0 elegant-shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-6 rounded shimmer w-16"></div>
              <div className="h-8 rounded shimmer w-12"></div>
            </div>

            {/* Sort Shimmer */}
            <div className="space-y-3 mb-6">
              <div className="h-4 rounded shimmer w-16"></div>
              <div className="h-10 rounded-md shimmer w-full"></div>
            </div>

            {/* Category Shimmer */}
            <div className="space-y-3 mb-6">
              <div className="h-4 rounded shimmer w-20"></div>
              <div className="h-10 rounded-md shimmer w-full"></div>
            </div>

            {/* Price Range Shimmer */}
            <div className="space-y-3">
              <div className="h-4 rounded shimmer w-24"></div>
              <div className="h-6 rounded shimmer w-full"></div>
            </div>
          </div>
        </aside>

        {/* Results Shimmer */}
        <main className="flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
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
        </main>
      </div>
    </div>
  )
}