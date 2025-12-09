import { NextResponse, type NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { revalidatePath, revalidateTag } from "next/cache"
import { authOptions } from "@/lib/auth"
import { clampOnlinePaymentLimit } from "@/lib/payment-limits"
import { getSiteSettings, updateSiteSettings } from "@/lib/site-settings"
import type { SiteSettings } from "@/lib/types"

async function assertAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  }
  if (session.user.role !== "admin") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  }
  return { session }
}

export async function GET() {
  const auth = await assertAdmin()
  if (auth.error) return auth.error

  try {
    const settings = await getSiteSettings()
    return NextResponse.json(settings)
  } catch (error) {
    console.error("Failed to fetch site settings", error)
    return NextResponse.json({ error: "Failed to fetch site settings" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const auth = await assertAdmin()
  if (auth.error) return auth.error

  try {
    const payload = (await request.json()) as Partial<SiteSettings>

    const sanitized: Partial<SiteSettings> = {}

    if (typeof payload.contactPhone === "string") {
      sanitized.contactPhone = payload.contactPhone.trim()
    }

    if (typeof payload.contactEmail === "string") {
      sanitized.contactEmail = payload.contactEmail.trim()
    }

    if (typeof payload.freeShippingThreshold === "number") {
      sanitized.freeShippingThreshold = Number(payload.freeShippingThreshold) || 1499
    }

    if (typeof payload.flatShippingFee === "number") {
      const fee = Number(payload.flatShippingFee)
      sanitized.flatShippingFee = Number.isFinite(fee) && fee >= 0 ? fee : 200
    }

    if (typeof payload.maxOnlinePaymentAmount === "number") {
      const maxAmount = Number(payload.maxOnlinePaymentAmount)
      sanitized.maxOnlinePaymentAmount = clampOnlinePaymentLimit(maxAmount)
    }

    if (typeof payload.activePromoCouponCode === "string") {
      sanitized.activePromoCouponCode = payload.activePromoCouponCode.trim()
    }

    if (payload.announcementBar) {
      sanitized.announcementBar = {
        ...payload.announcementBar,
        headline: payload.announcementBar.headline?.trim() ?? "",
        highlight: payload.announcementBar.highlight?.trim() ?? "",
        subtext: payload.announcementBar.subtext?.trim() || undefined,
        badgeText: payload.announcementBar.badgeText?.trim() || undefined,
        shippingText: payload.announcementBar.shippingText?.trim() || undefined,
        isEnabled: payload.announcementBar.isEnabled ?? true,
      }
    }

    if (payload.promoBanner) {
      sanitized.promoBanner = {
        ...payload.promoBanner,
        message: payload.promoBanner.message?.trim() ?? "",
        isEnabled: payload.promoBanner.isEnabled ?? true,
      }
    }

    if (payload.whatsapp) {
      sanitized.whatsapp = {
        ...payload.whatsapp,
        helperText: payload.whatsapp.helperText?.trim() ?? "",
        defaultMessage: payload.whatsapp.defaultMessage?.trim() ?? "",
        number: payload.whatsapp.number?.replace(/[^\d]/g, "") ?? "",
        isEnabled: payload.whatsapp.isEnabled ?? true,
      }
    }

    const updated = await updateSiteSettings(sanitized)
    
    // Revalidate the site settings cache tag
    revalidateTag('site-settings')
    
    // Revalidate all pages that use site settings
    revalidatePath("/", "layout")
    revalidatePath("/")
    revalidatePath("/shop")
    revalidatePath("/about")
    
    return NextResponse.json(updated)
  } catch (error) {
    console.error("Failed to update site settings", error)
    return NextResponse.json({ error: "Failed to update site settings" }, { status: 500 })
  }
}
