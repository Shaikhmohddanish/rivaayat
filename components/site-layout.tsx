import type React from "react"
import type { SiteSettings } from "@/lib/types"
import { OfferBar } from "./offer-bar"
import { Header } from "./header"
import { Footer } from "./footer"

interface SiteLayoutProps {
  children: React.ReactNode
  siteSettings: SiteSettings
}

export function SiteLayout({ children, siteSettings }: SiteLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen w-full overflow-x-hidden">
      <OfferBar message={siteSettings?.promoBanner?.message} isEnabled={siteSettings?.promoBanner?.isEnabled} />
      <Header siteSettings={siteSettings} />
      <main id="main-content" tabIndex={-1} className="flex-1 w-full">{children}</main>
      <Footer siteSettings={siteSettings} />
    </div>
  )
}
