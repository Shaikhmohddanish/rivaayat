"use client"

import { useEffect, useState } from "react"
import { Package, Users, ShoppingBag, Tag } from "lucide-react"

interface Stats {
  products: number
  users: number
  orders: number
  coupons: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    products: 0,
    users: 0,
    orders: 0,
    coupons: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const [productsRes, usersRes] = await Promise.all([fetch("/api/admin/products"), fetch("/api/admin/users")])

      const products = productsRes.ok ? await productsRes.json() : []
      const users = usersRes.ok ? await usersRes.json() : []

      setStats({
        products: products.length,
        users: users.length,
        orders: 0,
        coupons: 0,
      })
    } catch (error) {
      console.error("Error fetching stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      name: "Total Products",
      value: stats.products,
      icon: Package,
      color: "text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-200",
    },
    {
      name: "Total Users",
      value: stats.users,
      icon: Users,
      color: "text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200",
    },
    {
      name: "Total Orders",
      value: stats.orders,
      icon: ShoppingBag,
      color: "text-purple-600 bg-purple-100 dark:bg-purple-900 dark:text-purple-200",
    },
    {
      name: "Active Coupons",
      value: stats.coupons,
      icon: Tag,
      color: "text-orange-600 bg-orange-100 dark:bg-orange-900 dark:text-orange-200",
    },
  ]

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to your admin dashboard</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-card rounded-lg border p-6 animate-pulse">
              <div className="h-12 w-12 bg-muted rounded-lg mb-4" />
              <div className="h-4 bg-muted rounded w-24 mb-2" />
              <div className="h-8 bg-muted rounded w-16" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat) => (
            <div key={stat.name} className="bg-card rounded-lg border p-6">
              <div className={`inline-flex p-3 rounded-lg ${stat.color} mb-4`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <p className="text-sm text-muted-foreground mb-1">{stat.name}</p>
              <p className="text-3xl font-bold">{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <a href="/admin/products/new" className="block p-4 rounded-lg border hover:bg-muted transition-colors">
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Add New Product</p>
                  <p className="text-sm text-muted-foreground">Create a new product listing</p>
                </div>
              </div>
            </a>
            <a href="/admin/users" className="block p-4 rounded-lg border hover:bg-muted transition-colors">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Manage Users</p>
                  <p className="text-sm text-muted-foreground">View and edit user accounts</p>
                </div>
              </div>
            </a>
          </div>
        </div>

        <div className="bg-card rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          <div className="text-center py-8 text-muted-foreground">
            <p>No recent activity</p>
          </div>
        </div>
      </div>
    </div>
  )
}
