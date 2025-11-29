export default function Loading() {
  return (
    <div className="container mx-auto py-4 sm:py-8 px-2 sm:px-4">
      {/* Header Shimmer */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div className="flex-1">
            <div className="h-8 sm:h-9 rounded-lg shimmer w-48 sm:w-64 mb-2"></div>
            <div className="h-4 sm:h-5 rounded shimmer w-64 sm:w-96"></div>
          </div>
          <div className="h-9 rounded-lg shimmer w-full sm:w-40"></div>
        </div>
      </div>
      
      {/* Orders Cards Shimmer */}
      <div className="space-y-3 sm:space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="rounded-lg border bg-card">
            {/* Card Header */}
            <div className="p-3 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex-1">
                  <div className="h-5 sm:h-6 rounded-lg shimmer w-32 mb-2"></div>
                  <div className="h-4 rounded shimmer w-24"></div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="h-6 rounded-full shimmer w-20"></div>
                  <div className="h-9 rounded-lg shimmer w-28"></div>
                  <div className="h-9 rounded-lg shimmer w-20 sm:w-28"></div>
                </div>
              </div>
            </div>
            
            {/* Card Content */}
            <div className="p-3 sm:p-6 pt-0">
              <div className="space-y-3 sm:space-y-4">
                {/* Items Section */}
                <div>
                  <div className="h-5 rounded shimmer w-16 mb-2"></div>
                  <div className="space-y-2">
                    {[1, 2].map((j) => (
                      <div key={j} className="flex flex-col sm:flex-row sm:justify-between gap-1">
                        <div className="h-4 rounded shimmer w-full sm:w-64"></div>
                        <div className="h-4 rounded shimmer w-20"></div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Tracking Section */}
                <div className="border-t pt-3 sm:pt-4">
                  <div className="h-5 rounded shimmer w-32 mb-2"></div>
                  <div className="space-y-1">
                    <div className="h-4 rounded shimmer w-40"></div>
                    <div className="h-4 rounded shimmer w-48"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
