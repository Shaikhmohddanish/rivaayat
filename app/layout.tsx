import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { SiteLayout } from "@/components/site-layout"
import { Providers } from "@/components/providers"
import "./globals.css"

export const metadata: Metadata = {
  title: "Rivaayat - Ladies Dresses",
  description: "Shop the latest collection of ladies dresses",
  generator: "v0.app",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans overflow-x-hidden ${GeistSans.variable} ${GeistMono.variable}`}>
        <Providers>
          <Suspense fallback={null}>
            <SiteLayout>{children}</SiteLayout>
          </Suspense>
        </Providers>
        <Analytics />
      </body>
    </html>
  )
}
