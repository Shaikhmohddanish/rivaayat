export default function Loading() {
  return (
    <div className="space-y-8">
      {/* Header Shimmer */}
      <div className="space-y-4">
        <div className="h-9 rounded-xl shimmer w-52"></div>
        <div className="h-5 rounded-lg shimmer w-72"></div>
      </div>
      
      {/* Search Shimmer */}
      <div className="mb-6">
        <div className="relative">
          <div className="h-10 rounded-md shimmer w-full"></div>
        </div>
      </div>
      
      {/* Users Table Shimmer */}
      <div className="bg-card/50 rounded-2xl border-0 elegant-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/20">
                <th className="text-left p-4 font-medium">
                  <div className="h-5 rounded shimmer w-16"></div>
                </th>
                <th className="text-left p-4 font-medium">
                  <div className="h-5 rounded shimmer w-16"></div>
                </th>
                <th className="text-left p-4 font-medium">
                  <div className="h-5 rounded shimmer w-14"></div>
                </th>
                <th className="text-left p-4 font-medium">
                  <div className="h-5 rounded shimmer w-24"></div>
                </th>
                <th className="text-left p-4 font-medium">
                  <div className="h-5 rounded shimmer w-18"></div>
                </th>
                <th className="text-right p-4 font-medium">
                  <div className="h-5 rounded shimmer w-20"></div>
                </th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <tr key={i} className="border-b border-border/20 last:border-0">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full shimmer"></div>
                      <div className="h-5 rounded shimmer w-32"></div>
                    </div>
                  </td>
                  <td className="p-4"><div className="h-5 rounded shimmer w-40"></div></td>
                  <td className="p-4"><div className="h-6 rounded-full shimmer w-16"></div></td>
                  <td className="p-4"><div className="h-5 rounded shimmer w-24"></div></td>
                  <td className="p-4"><div className="h-5 rounded shimmer w-20"></div></td>
                  <td className="p-4 text-right">
                    <div className="h-8 rounded shimmer w-8 ml-auto"></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
