export default function AdminTrackingLoading() {
  return (
    <div className="container mx-auto py-4 sm:py-8 px-2 sm:px-4">
      {/* Header Shimmer */}
      <div className="mb-6 sm:mb-8">
        <div className="h-8 sm:h-10 rounded-lg shimmer w-48 sm:w-64 mb-2"></div>
        <div className="h-4 sm:h-5 rounded shimmer w-64 sm:w-96"></div>
      </div>

      {/* Stats Cards Shimmer */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border bg-card p-4 sm:p-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="h-10 sm:h-12 w-10 sm:w-12 rounded-full shimmer"></div>
              <div className="flex-1">
                <div className="h-4 rounded shimmer w-24 sm:w-32 mb-2"></div>
                <div className="h-6 sm:h-8 rounded-lg shimmer w-12 sm:w-16"></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs Shimmer */}
      <div className="space-y-4 sm:space-y-6">
        <div className="rounded-lg border bg-muted/30 p-1">
          <div className="grid grid-cols-4 gap-1">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-9 rounded-md shimmer"></div>
            ))}
          </div>
        </div>
        
        {/* Tab Content */}
        <div className="rounded-xl border bg-card">
          <div className="p-4 sm:p-6 space-y-4">
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-4">
              <div className="h-10 rounded-lg shimmer w-full sm:w-80"></div>
              <div className="h-10 rounded-lg shimmer w-full sm:w-40"></div>
            </div>
            
            {/* Order Cards */}
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-lg border bg-card/50 p-4">
                <div className="flex flex-col sm:flex-row justify-between gap-3">
                  <div className="space-y-2 flex-1">
                    <div className="h-5 rounded-lg shimmer w-32"></div>
                    <div className="h-4 rounded shimmer w-40"></div>
                    <div className="h-4 rounded shimmer w-48"></div>
                  </div>
                  <div className="flex flex-col sm:items-end gap-2">
                    <div className="h-6 rounded-full shimmer w-20"></div>
                    <div className="h-9 rounded-lg shimmer w-full sm:w-32"></div>
                  </div>
                </div>
                
                {/* Tracking Info */}
                <div className="mt-4 pt-4 border-t space-y-2">
                  <div className="h-4 rounded shimmer w-24"></div>
                  <div className="flex gap-2">
                    <div className="h-4 rounded shimmer w-32"></div>
                    <div className="h-4 rounded shimmer w-40"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}