"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { LayoutDashboard, Package, Users, Tag, ShoppingBag, LogOut, Truck, Menu, X, RefreshCw, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { signOut } from "next-auth/react"
import { useIsMobile } from "@/hooks/use-mobile"
import { deleteLocalCachePattern } from "@/lib/local-storage"

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Products", href: "/admin/products", icon: Package },
  { name: "Orders", href: "/admin/orders", icon: ShoppingBag },
  { name: "Tracking", href: "/admin/tracking", icon: Truck },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Coupons", href: "/admin/coupons", icon: Tag },
  { name: "Site Settings", href: "/admin/settings", icon: Settings },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [isClient, setIsClient] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const isMobile = useIsMobile()
  
  // Function to refresh admin data by clearing localStorage cache
  const refreshAdminData = async () => {
    setIsRefreshing(true)
    try {
      // Clear all admin-related cache patterns
      await deleteLocalCachePattern('admin:*')
      // Force reload the current page to fetch fresh data
      router.refresh()
      // Notify the user
      setTimeout(() => setIsRefreshing(false), 1000) // Show spinner for at least 1 second
    } catch (error) {
      console.error('Error refreshing admin data:', error)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    setIsClient(true)

    if (status === "unauthenticated") {
      // Use signIn to properly handle the authentication flow
      import('next-auth/react').then(({ signIn }) => {
        signIn(undefined, { callbackUrl: '/admin' });
      });
    } else if (session?.user?.role !== "admin" && status === "authenticated") {
      router.push("/")
    }
  }, [status, session, router])

  // Show loading spinner until we're sure we're on the client
  if (!isClient || status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  // Don't render anything if not authenticated or not admin
  if (status === "unauthenticated" || (session?.user?.role !== "admin" && status === "authenticated")) {
    return null
  }

  return (
    <div className="flex min-h-screen bg-muted/30 relative">
      {/* Mobile Sidebar Toggle */}
      {isMobile && (
        <div className="fixed top-4 left-4 z-50">
          <Button 
            size="icon" 
            variant="outline" 
            className="rounded-full bg-card" 
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      )}
      
      {/* Mobile Backdrop */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`${isMobile ? 'fixed left-0 top-0 bottom-0 z-50' : 'relative'} ${isMobile && !sidebarOpen ? '-translate-x-full' : 'translate-x-0'} transition-transform duration-200 w-64 bg-card border-r flex flex-col`}>
        <div className="p-6 border-b">
          <Link href="/admin" className="flex items-center gap-2" onClick={() => isMobile && setSidebarOpen(false)}>
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold">
              R
            </div>
            <div>
              <h1 className="font-bold text-lg">Rivaayat</h1>
              <p className="text-xs text-muted-foreground">Admin Panel</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href))
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
                onClick={() => isMobile && setSidebarOpen(false)}
              >
                <item.icon className="h-5 w-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t">
          <div className="flex items-center gap-3 mb-3 px-3">
            <div className="h-8 w-8 bg-muted rounded-full flex items-center justify-center text-sm font-medium">
              {session?.user?.name?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{session?.user?.name || 'Admin'}</p>
              <p className="text-xs text-muted-foreground truncate">{session?.user?.email || ''}</p>
            </div>
          </div>
          <div className="flex gap-2 mb-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 bg-transparent"
              onClick={refreshAdminData}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full bg-transparent"
            onClick={() => {
              deleteLocalCachePattern('user:*'); // Clear user cache before signing out
              signOut({ callbackUrl: "/" });
            }}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto pt-4 pb-4 sm:py-0">{children}</main>
    </div>
  )
}
