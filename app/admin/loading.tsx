export default function Loading() {
  return (
    <div className="container mx-auto py-4 sm:py-8 px-4">
      <div className="mb-4 sm:mb-8">
        <div className="h-8 sm:h-10 bg-muted rounded-md w-40 mb-2" />
        <div className="h-4 bg-muted rounded-md w-60" />
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-card rounded-lg border p-3 sm:p-6 animate-pulse">
            <div className="h-8 sm:h-12 w-8 sm:w-12 bg-muted rounded-lg mb-2 sm:mb-4" />
            <div className="h-3 sm:h-4 bg-muted rounded w-16 sm:w-24 mb-1 sm:mb-2" />
            <div className="h-6 sm:h-8 bg-muted rounded w-12 sm:w-16" />
          </div>
        ))}
      </div>
      
      <div className="mt-6 sm:mt-8 grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-card rounded-lg border p-4 sm:p-6 animate-pulse">
          <div className="h-6 sm:h-7 bg-muted rounded w-32 mb-4" />
          <div className="space-y-2">
            <div className="h-16 sm:h-20 bg-muted rounded-lg" />
            <div className="h-16 sm:h-20 bg-muted rounded-lg" />
          </div>
        </div>
        
        <div className="bg-card rounded-lg border p-4 sm:p-6 animate-pulse">
          <div className="h-6 sm:h-7 bg-muted rounded w-32 mb-4" />
          <div className="h-16 sm:h-40 bg-muted rounded-lg" />
        </div>
      </div>
    </div>
  )
}
