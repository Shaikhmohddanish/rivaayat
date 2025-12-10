import type React from "react"
import type { Metadata, Viewport } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { SiteLayout } from "@/components/site-layout"
import { Providers } from "@/components/providers"
import { Toaster } from "@/components/ui/toaster"
import { WhatsAppFloatingButton } from "@/components/whatsapp-float"
import { getSiteSettings } from "@/lib/site-settings"
import "./globals.css"

// Revalidate every 60 seconds for site settings changes
export const revalidate = 60

export const metadata: Metadata = {
  title: "Rivaayat - Ladies Dresses",
  description: "Shop the latest collection of ladies dresses",
  generator: "v0.app",
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/logo.png',
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const siteSettings = await getSiteSettings()

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans overflow-x-hidden ${GeistSans.variable} ${GeistMono.variable}`}>
        {/* Skip link for keyboard users */}
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <Providers>
          <Suspense fallback={null}>
            <SiteLayout siteSettings={siteSettings}>{children}</SiteLayout>
          </Suspense>
          <Toaster />
        </Providers>
        <Analytics />
        <WhatsAppFloatingButton
          enabled={siteSettings.whatsapp?.isEnabled}
          helperText={siteSettings.whatsapp?.helperText}
          defaultMessage={siteSettings.whatsapp?.defaultMessage}
          phoneNumber={siteSettings.whatsapp?.number || siteSettings.contactPhone}
        />
      </body>
    </html>
  )
}
