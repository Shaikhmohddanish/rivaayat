"use client"

import { useEffect, useState } from "react"
import { Package, Users, ShoppingBag, Tag, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAdminCache } from "@/hooks/use-admin-cache"
import { ADMIN_CACHE_KEYS } from "@/lib/admin-cache"

interface Stats {
  products: number
  users: number
  orders: number
  coupons: number
}

export default function AdminDashboard() {
  // Use our admin cache hook for dashboard stats
  const [stats, loading, error, refreshStats] = useAdminCache<Stats>(
    ADMIN_CACHE_KEYS.DASHBOARD_STATS,
    async () => {
      // 🚀 OPTIMIZATION: Single API call for all dashboard stats
      const response = await fetch("/api/admin/dashboard")
      
      if (!response.ok) {
        throw new Error("Failed to fetch dashboard stats")
      }

      return await response.json()
    }
  )
  
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  // Function to manually refresh dashboard stats
  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refreshStats()
    setTimeout(() => setIsRefreshing(false), 500)
  }

  // Listen for admin stats updates and refresh automatically
  useEffect(() => {
    const handleAdminStatsUpdate = () => {
      console.log('Admin stats updated, refreshing dashboard...')
      refreshStats()
    }

    window.addEventListener('adminStatsUpdated', handleAdminStatsUpdate)
    
    return () => {
      window.removeEventListener('adminStatsUpdated', handleAdminStatsUpdate)
    }
  }, [refreshStats])

  // Add refresh button to the dashboard
  const refreshButton = (
    <div className="mb-4 flex justify-end">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleRefresh} 
        disabled={isRefreshing || loading}
      >
        <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        {isRefreshing ? 'Refreshing...' : 'Refresh Stats'}
      </Button>
    </div>
  )

  const statCards = [
    {
      name: "Total Products",
      value: stats?.products || 0,
      icon: Package,
      color: "text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-200",
    },
    {
      name: "Total Users",
      value: stats?.users || 0,
      icon: Users,
      color: "text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200",
    },
    {
      name: "Total Orders",
      value: stats?.orders || 0,
      icon: ShoppingBag,
      color: "text-purple-600 bg-purple-100 dark:bg-purple-900 dark:text-purple-200",
    },
    {
      name: "Active Coupons",
      value: stats?.coupons || 0,
      icon: Tag,
      color: "text-orange-600 bg-orange-100 dark:bg-orange-900 dark:text-orange-200",
    },
  ]

  return (
    <div className="container mx-auto py-4 sm:py-8 px-4">
      <div className="flex justify-between items-center mb-4 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Welcome to your admin dashboard</p>
        </div>
        {refreshButton}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-card rounded-lg border p-3 sm:p-6">
              <div className="h-8 sm:h-12 w-8 sm:w-12 shimmer rounded-lg mb-2 sm:mb-4" />
              <div className="h-3 sm:h-4 shimmer rounded w-16 sm:w-24 mb-1 sm:mb-2" />
              <div className="h-6 sm:h-8 shimmer rounded w-12 sm:w-16" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {statCards.map((stat) => (
            <div key={stat.name} className="bg-card rounded-lg border p-3 sm:p-6">
              <div className={`inline-flex p-2 sm:p-3 rounded-lg ${stat.color} mb-2 sm:mb-4`}>
                <stat.icon className="h-4 w-4 sm:h-6 sm:w-6" />
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mb-0 sm:mb-1">{stat.name}</p>
              <p className="text-xl sm:text-3xl font-bold">{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 sm:mt-8 grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-card rounded-lg border p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Quick Actions</h2>
          <div className="space-y-2 sm:space-y-3">
            <a href="/admin/products/new" className="block p-3 sm:p-4 rounded-lg border hover:bg-muted transition-colors">
              <div className="flex items-center gap-3">
                <Package className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                <div>
                  <p className="font-medium text-sm sm:text-base">Add New Product</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Create a new product listing</p>
                </div>
              </div>
            </a>
            <a href="/admin/users" className="block p-3 sm:p-4 rounded-lg border hover:bg-muted transition-colors">
              <div className="flex items-center gap-3">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                <div>
                  <p className="font-medium text-sm sm:text-base">Manage Users</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">View and edit user accounts</p>
                </div>
              </div>
            </a>
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Recent Activity</h2>
          <div className="text-center py-4 sm:py-8 text-muted-foreground">
            <p className="text-sm sm:text-base">No recent activity</p>
          </div>
        </div>
      </div>
    </div>
  )
}
