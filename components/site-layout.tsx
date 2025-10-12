import type React from "react"
import { OfferBar } from "./offer-bar"
import { Header } from "./header"
import { Footer } from "./footer"

export function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen w-full overflow-x-hidden">
      <OfferBar />
      <Header />
      <main className="flex-1 w-full">{children}</main>
      <Footer />
    </div>
  )
}
