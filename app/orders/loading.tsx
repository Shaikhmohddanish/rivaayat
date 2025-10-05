import { Card, CardContent } from "@/components/ui/card"

export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header Shimmer */}
          <div className="mb-8 space-y-3">
            <div className="h-9 rounded-xl shimmer w-52"></div>
            <div className="h-5 rounded-lg shimmer w-72"></div>
          </div>

          {/* Orders Shimmer */}
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden elegant-shadow border-0 bg-card/50">
                <div className="bg-gradient-to-r from-muted/20 to-muted/40 p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-3">
                      <div className="h-6 rounded-lg shimmer w-36"></div>
                      <div className="h-4 rounded-md shimmer w-52"></div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="h-7 rounded-full shimmer w-24"></div>
                      <div className="h-9 rounded-xl shimmer w-28"></div>
                    </div>
                  </div>
                </div>
                <CardContent className="pt-6">
                  <div className="space-y-5">
                    {[1, 2].map((j) => (
                      <div key={j} className="flex items-center gap-4">
                        <div className="w-18 h-18 rounded-xl shimmer-card"></div>
                        <div className="flex-1 space-y-3">
                          <div className="h-5 rounded-lg shimmer w-3/4"></div>
                          <div className="h-4 rounded-md shimmer w-2/3"></div>
                          <div className="h-3 rounded shimmer w-1/2"></div>
                        </div>
                        <div className="text-right space-y-2">
                          <div className="h-6 rounded-lg shimmer w-20"></div>
                          <div className="h-3 rounded shimmer w-16"></div>
                        </div>
                      </div>
                    ))}
                    <div className="border-t border-border/20 pt-5">
                      <div className="flex justify-between items-center">
                        <div className="space-y-2">
                          <div className="h-4 rounded shimmer w-28"></div>
                          <div className="h-3 rounded shimmer w-24"></div>
                        </div>
                        <div className="text-right space-y-2">
                          <div className="h-7 rounded-lg shimmer w-24"></div>
                          <div className="h-3 rounded shimmer w-16"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}