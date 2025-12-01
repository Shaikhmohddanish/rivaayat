import { NextResponse } from "next/server"
import { getSiteSettings } from "@/lib/site-settings"

export async function GET() {
  try {
    const settings = await getSiteSettings()

    return NextResponse.json({
      contactPhone: settings.contactPhone,
      contactEmail: settings.contactEmail,
      freeShippingThreshold: settings.freeShippingThreshold,
      flatShippingFee: settings.flatShippingFee,
      maxOnlinePaymentAmount: settings.maxOnlinePaymentAmount,
      announcementBar: settings.announcementBar,
      promoBanner: settings.promoBanner,
      whatsapp: settings.whatsapp,
      activePromoCouponCode: settings.activePromoCouponCode,
    })
  } catch (error) {
    console.error("Failed to fetch public site settings", error)
    return NextResponse.json({ error: "Unable to load site settings" }, { status: 500 })
  }
}
