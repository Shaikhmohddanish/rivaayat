"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Menu,
  Search,
  ShoppingBag,
  MapPin,
  Phone,
  ChevronDown,
  Sparkles,
  Truck,
  SunMedium,
  Moon,
  Globe2,
  IndianRupee,
  ChevronRight,
  User,
  Heart,
  Settings,
} from "lucide-react"
import { signOut, useSession } from "next-auth/react"
import { useTheme } from "next-themes"
import { deleteLocalCachePattern } from "@/lib/local-storage"
import { clearCartCache } from "@/lib/cart-cache"
import { clearWishlistCache } from "@/lib/wishlist-cache"
import { clearUserProfileCache } from "@/lib/user-profile-cache"
import { clearProductListCache } from "@/lib/product-list-cache"
import { useUserSession, clearUserSessionData } from "@/hooks/use-user-session"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from "@/components/ui/navigation-menu"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

import { AuthButton } from "@/components/auth-button"
import { CartWishlistButtons } from "@/components/cart-wishlist-buttons"
import type { SiteSettings } from "@/lib/types"

// CONFIG
const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/about", label: "About" },
  { href: "/orders", label: "Orders" },
  { href: "/order-tracking", label: "Track Order" },
]

const COLLECTIONS = [
  {
    title: "Women",
    items: [
      { label: "Sarees", href: "/shop/sarees" },
      { label: "Lehengas", href: "/shop/lehengas" },
      { label: "Anarkali", href: "/shop/anarkali" },
      { label: "Kurtas & Sets", href: "/shop/kurtas" },
      { label: "Dupattas", href: "/shop/dupattas" },
    ],
  },
  {
    title: "Men",
    items: [
      { label: "Kurta Sets", href: "/shop/men/kurta-sets" },
      { label: "Sherwanis", href: "/shop/men/sherwani" },
      { label: "Nehru Jackets", href: "/shop/men/nehru" },
      { label: "Pathani", href: "/shop/men/pathani" },
      { label: "Indo-Western", href: "/shop/men/indo-western" },
    ],
  },
  {
    title: "Accessories",
    items: [
      { label: "Jewellery", href: "/shop/accessories/jewellery" },
      { label: "Footwear", href: "/shop/accessories/footwear" },
      { label: "Bags & Potlis", href: "/shop/accessories/bags" },
      { label: "Stoles", href: "/shop/accessories/stoles" },
      { label: "Belts", href: "/shop/accessories/belts" },
    ],
  },
]

const QUICK_LINKS = [
  { label: "New Arrivals", href: "/shop?sort=new" },
  { label: "Bestsellers", href: "/shop?sort=top" },
  { label: "Under ₹1999", href: "/shop?priceMax=1999" },
  { label: "Wedding Store", href: "/collections/wedding" },
]

const DEFAULT_ANNOUNCEMENT = {
  isEnabled: true,
  headline: "Festive Offer:",
  highlight: "Flat 10% off",
  subtext: "with code",
  badgeText: "RIVAA10",
  shippingText: "Free shipping over ₹1499",
}

interface HeaderProps {
  siteSettings?: Pick<SiteSettings, "announcementBar" | "contactPhone" | "freeShippingThreshold">
}

// HEADER
export function Header({ siteSettings }: HeaderProps) {
  const router = useRouter()
  const { theme, setTheme } = useTheme()

  const [mobileOpen, setMobileOpen] = React.useState(false)
  const [searchOpen, setSearchOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [isScrolled, setIsScrolled] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 10)
    onScroll()
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])
  
  // Set mounted to true on client
  React.useEffect(() => {
    setMounted(true)
  }, [])

  const submitSearch = (q?: string) => {
    const value = (q ?? query).trim()
    if (!value) return
    router.push(`/search?q=${encodeURIComponent(value)}`)
    setQuery("")
    setSearchOpen(false)
    setMobileOpen(false)
  }

  const shippingThreshold = siteSettings?.freeShippingThreshold || 1499

  const announcement = {
    ...DEFAULT_ANNOUNCEMENT,
    ...(siteSettings?.announcementBar ?? {}),
    shippingText: siteSettings?.announcementBar?.shippingText || `Free shipping over ₹${shippingThreshold}`,
  }

  const phoneDisplay = siteSettings?.contactPhone || "+918097787110"
  const telHref = `tel:${phoneDisplay.replace(/[^+\d]/g, "")}`

  const showAnnouncement = announcement.isEnabled !== false

  return (
    <div className="sticky top-0 z-50">
      {/* Announcement Bar */}
      {showAnnouncement && (
        <div className="w-full bg-primary text-primary-foreground text-xs sm:text-sm">
          <div className="container mx-auto flex items-center justify-between px-4 py-1.5 gap-3">
            <div className="flex items-center gap-2 whitespace-nowrap">
              <Sparkles className="h-4 w-4" />
              {announcement.headline && <span className="hidden sm:inline">{announcement.headline}</span>}
              {announcement.highlight && <b>{announcement.highlight}</b>}
              {announcement.subtext && <span className="hidden sm:inline">{announcement.subtext}</span>}
              {announcement.badgeText && (
                <Badge variant="secondary" className="ml-1">{announcement.badgeText}</Badge>
              )}
            </div>
            <div className="flex items-center gap-4 text-white/90">
              {announcement.shippingText && (
                <span className="hidden md:flex items-center gap-1"><Truck className="h-4 w-4"/>{announcement.shippingText}</span>
              )}
              {announcement.shippingText && (
                <Separator orientation="vertical" className="hidden md:block h-4 bg-white/40" />
              )}
              <a href={telHref} className="flex items-center gap-1 hover:underline"><Phone className="h-4 w-4"/>{phoneDisplay}</a>
            </div>
          </div>
        </div>
      )}

      {/* Main Header */}
      <header className={`backdrop-blur supports-backdrop-filter:bg-background/60 transition-all border-b ${isScrolled ? "bg-background/95" : "bg-background/40"}`}>
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between gap-3">
            {/* Left: Logo + Mobile Menu */}
            <div className="flex items-center gap-2">
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild className="lg:hidden">
                  <Button variant="ghost" size="icon" aria-label="Open menu">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[88vw] sm:w-96 p-0 overflow-y-auto">
                  <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                  <MobileNav onNavigate={() => setMobileOpen(false)} />
                </SheetContent>
              </Sheet>

              <Link href="/" className="flex items-center gap-2 group">
                <div className="w-9 h-9 rounded-full elegant-gradient flex items-center justify-center shadow-inner">
                  <span className="text-white font-bold text-sm">R</span>
                </div>
                <span className="text-2xl font-bold elegant-text-gradient font-serif">Rivaayat</span>
              </Link>
            </div>

            {/* Center: Navigation (Desktop) */}
            <div className="hidden lg:flex">
              <NavigationMenu>
                <NavigationMenuList>
                  <NavigationMenuItem>
                    <Link href="/shop" legacyBehavior passHref>
                      <NavigationMenuLink className="px-3 py-2 rounded-md text-sm hover:bg-accent hover:text-accent-foreground">
                        Shop
                      </NavigationMenuLink>
                    </Link>
                  </NavigationMenuItem>
                  
                  {/* Hidden NavigationMenuContent to keep structure */}
                  <NavigationMenuItem className="hidden">
                    <NavigationMenuTrigger className="gap-1 hidden">
                      Hidden
                    </NavigationMenuTrigger>
                    <NavigationMenuContent className="hidden p-6">
                      <div className="grid grid-cols-2 xl:grid-cols-4 gap-8">
                        {COLLECTIONS.map((col) => (
                          <div key={col.title} className="min-w-[180px]">
                            <p className="mb-3 text-sm font-semibold text-muted-foreground">{col.title}</p>
                            <ul className="space-y-2">
                              {col.items.map((it) => (
                                <li key={it.href}>
                                  <Link href={it.href} className="group inline-flex items-center gap-1 text-sm">
                                    <ChevronRight className="h-3.5 w-3.5 opacity-50 group-hover:opacity-100 transition" />
                                    <NavigationMenuLink className="hover:underline">
                                      {it.label}
                                    </NavigationMenuLink>
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                        {/* Banner */}
                        {/* Empty div to close out structure */}
                      </div>
                    </NavigationMenuContent>
                  </NavigationMenuItem>

                  {NAV_LINKS.filter(l => l.label !== "Home" && l.label !== "Shop").map((link) => (
                    <NavigationMenuItem key={link.href}>
                      <Link href={link.href} legacyBehavior passHref>
                        <NavigationMenuLink className="px-3 py-2 rounded-md text-sm hover:bg-accent hover:text-accent-foreground">
                          {link.label}
                        </NavigationMenuLink>
                      </Link>
                    </NavigationMenuItem>
                  ))}

                  <NavigationMenuItem>
                    <NavigationMenuContent className="p-6">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {QUICK_LINKS.map((q) => (
                          <Link key={q.href} href={q.href} className="rounded-xl border p-3 hover:bg-accent">
                            <span className="text-sm font-medium">{q.label}</span>
                          </Link>
                        ))}
                      </div>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>
            </div>

            {/* Right: Search + Actions */}
            <div className="flex items-center gap-1 sm:gap-2">
              <Popover open={searchOpen} onOpenChange={setSearchOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="hidden md:inline-flex gap-2 w-[280px] justify-start">
                    <Search className="h-4 w-4" />
                    <span className="text-muted-foreground">Search ethnic wear, dresses…</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 w-[420px]" align="end">
                  <Command>
                    <CommandInput
                      placeholder="Search products, categories, looks…"
                      value={query}
                      onValueChange={setQuery}
                      onKeyDown={(e)=>{ if(e.key === "Enter") submitSearch() }}
                    />
                    <CommandList>
                      <CommandEmpty>No results. Press Enter to search.</CommandEmpty>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              <div className="flex items-center">
                <CartWishlistButtons />
              </div>

              <div className="hidden md:block">
                <AuthButton />
              </div>

              <div className="hidden md:block">
                {!mounted ? (
                  <Button variant="ghost" size="icon" aria-label="Theme">
                    <div className="h-5 w-5" />
                  </Button>
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label="Toggle theme">
                        {theme === "dark" ? <SunMedium className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setTheme("light")}>Light</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setTheme("dark")}>Dark</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setTheme("system")}>System</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>
    </div>
  )
}

// MOBILE NAV
function MobileNav({ onNavigate }: { onNavigate: () => void }) {
  const router = useRouter()
  const { userData, status, session } = useUserSession()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  
  React.useEffect(() => {
    setMounted(true)
  }, [])

  const go = (href: string) => { router.push(href); onNavigate() }
  const handleSignOut = () => { 
    // 🚀 OPTIMIZATION: Clear all caches on logout
    if (typeof window !== 'undefined') {
      // Clear session data
      clearUserSessionData();
      
      // Clear all user-related cache when logged out manually
      deleteLocalCachePattern('user:*');
      
      // Clear all optimization caches
      clearCartCache();
      clearWishlistCache();
      clearUserProfileCache();
      clearProductListCache();
    }
    
    signOut(); 
    onNavigate(); 
  }

  return (
    <div className="flex flex-col">
      <div className="p-4 pt-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2" onClick={onNavigate}>
            <div className="w-9 h-9 rounded-full elegant-gradient flex items-center justify-center">
              <span className="text-white font-bold text-sm">R</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold font-serif">Rivaayat</span>
              <span className="text-xs text-muted-foreground -mt-1">Elegant fashion for you</span>
            </div>
          </Link>

          {userData && status === "authenticated" ? (
            <div className="flex items-center">
              <Avatar className="h-8 w-8">
                <AvatarImage src={userData.image || ""} />
                <AvatarFallback>{userData.name?.charAt(0) || userData.email?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={() => go("/auth/login")}>
              <User className="h-4 w-4 mr-2" /> Login
            </Button>
          )}
        </div>
      </div>

      <Separator />

      <nav role="navigation" aria-label="Main navigation" className="p-2">
        {userData && status === "authenticated" && (
          <>
            <MobileGroup title="My Account">
              {userData.name && (
                <div className="px-4 py-2 mb-1 bg-accent/50 rounded-md flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={userData.image || ""} />
                    <AvatarFallback>{userData.name?.charAt(0) || userData.email?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                  <div className="text-sm font-medium">{userData.name}</div>
                </div>
              )}
              <Button variant="ghost" className="w-full justify-start" onClick={() => go("/profile")}>
                <User className="h-4 w-4 mr-2" /> My Profile
              </Button>
              <Button variant="ghost" className="w-full justify-start" onClick={() => go("/orders")}>
                <Truck className="h-4 w-4 mr-2" /> My Orders
              </Button>
              <Button variant="ghost" className="w-full justify-start" onClick={() => go("/wishlist")}>
                <Heart className="h-4 w-4 mr-2" /> My Wishlist
              </Button>
              {userData.role === "admin" && (
                <Button variant="ghost" className="w-full justify-start" onClick={() => go("/admin")}>
                  <Settings className="h-4 w-4 mr-2" /> Admin Dashboard
                </Button>
              )}
              <Button variant="ghost" className="w-full justify-start" onClick={handleSignOut}>
                <ChevronRight className="h-4 w-4 mr-2" /> Sign Out
              </Button>
            </MobileGroup>
            <Separator className="my-2" />
          </>
        )}

        <MobileGroup title="Shop">
          <Button variant="ghost" className="w-full justify-start" onClick={() => go("/shop")}>
            <ShoppingBag className="h-4 w-4 mr-2" /> All Products
          </Button>
        </MobileGroup>

        <Separator className="my-2" />

        <MobileGroup title="Explore">
          {NAV_LINKS.filter(n => n.label !== "Home" && n.label !== "Shop").map((l) => (
            <Button key={l.href} variant="ghost" className="w-full justify-start" onClick={() => go(l.href)}>
              {l.label}
            </Button>
          ))}
          <div className="px-4 pt-2 text-xs text-muted-foreground flex items-center gap-2">
            <MapPin className="h-4 w-4" /> Pan-India Delivery
          </div>
        </MobileGroup>

        <Separator className="my-2" />

        <MobileGroup title="Preferences">
          <div className="px-4 py-2 flex items-center justify-between">
            <span>Theme Mode</span>
            {!mounted ? (
              <Button variant="ghost" size="sm">
                <div className="h-4 w-4"></div>
                <span className="ml-2">Theme</span>
              </Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
                {theme === "light" ? <Moon className="h-4 w-4" /> : <SunMedium className="h-4 w-4" />}
                <span className="ml-2">{theme === "light" ? "Dark" : "Light"} Mode</span>
              </Button>
            )}
          </div>
        </MobileGroup>

        <div className="p-4">
          <Button asChild className="w-full">
            <Link href="/order-tracking" onClick={onNavigate}>Track your order</Link>
          </Button>
        </div>
      </nav>
    </div>
  )
}

function MobileGroup({ title, children }: React.PropsWithChildren<{ title: string }>) {
  return (
    <div className="py-3">
      <div className="px-4 text-sm font-semibold tracking-wide uppercase text-muted-foreground">{title}</div>
      <div className="mt-2 flex flex-col">{children}</div>
    </div>
  )
}
