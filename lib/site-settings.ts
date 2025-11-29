import { getDatabase } from "@/lib/mongodb"
import type { SiteSettings } from "@/lib/types"

const COLLECTION_NAME = "site_settings"
const SETTINGS_ID = "default"

const DEFAULT_SITE_SETTINGS: SiteSettings = {
  _id: SETTINGS_ID,
  contactPhone: "+918097787110",
  contactEmail: "sales@rivaayatposhak.co.in",
  freeShippingThreshold: 1499,
  activePromoCouponCode: "",
  announcementBar: {
    isEnabled: true,
    headline: "Festive Offer:",
    highlight: "Flat 10% off",
    subtext: "with code",
    badgeText: "RIVAA10",
    shippingText: "Free shipping over ₹1499",
  },
  promoBanner: {
    isEnabled: true,
    message: "✨ Free shipping on orders over ₹1500 | Use code: WELCOME10 for 10% off your first dress ✨",
  },
  whatsapp: {
    isEnabled: true,
    helperText: "Need help styling your look?",
    defaultMessage: "Hi Rivaayat team, I'd love to chat!",
    number: "918097787110",
  },
}

function normalizeSiteSettings(doc?: Partial<SiteSettings> | null): SiteSettings {
  const merged: SiteSettings = {
    ...DEFAULT_SITE_SETTINGS,
    ...doc,
    freeShippingThreshold: doc?.freeShippingThreshold ?? DEFAULT_SITE_SETTINGS.freeShippingThreshold,
    announcementBar: {
      ...DEFAULT_SITE_SETTINGS.announcementBar,
      ...(doc?.announcementBar ?? {}),
    },
    promoBanner: {
      ...DEFAULT_SITE_SETTINGS.promoBanner,
      ...(doc?.promoBanner ?? {}),
    },
    whatsapp: {
      ...DEFAULT_SITE_SETTINGS.whatsapp,
      ...(doc?.whatsapp ?? {}),
    },
  }

  return {
    ...merged,
    createdAt: doc?.createdAt ? new Date(doc.createdAt).toISOString() : merged.createdAt,
    updatedAt: doc?.updatedAt ? new Date(doc.updatedAt).toISOString() : merged.updatedAt,
  }
}

function mergeSettings(base: SiteSettings, updates: Partial<SiteSettings>): SiteSettings {
  return normalizeSiteSettings({
    ...base,
    ...updates,
    freeShippingThreshold: updates.freeShippingThreshold ?? base.freeShippingThreshold,
    announcementBar: {
      ...base.announcementBar,
      ...(updates.announcementBar ?? {}),
    },
    promoBanner: {
      ...base.promoBanner,
      ...(updates.promoBanner ?? {}),
    },
    whatsapp: {
      ...base.whatsapp,
      ...(updates.whatsapp ?? {}),
    },
  })
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const db = await getDatabase()
  const collection = db.collection<SiteSettings>(COLLECTION_NAME)

  const existing = await collection.findOne({ _id: SETTINGS_ID })
  if (!existing) {
    const now = new Date()
    const doc: SiteSettings = {
      ...DEFAULT_SITE_SETTINGS,
      createdAt: now,
      updatedAt: now,
    }
    await collection.insertOne(doc)
    return normalizeSiteSettings(doc)
  }

  return normalizeSiteSettings(existing)
}

export async function updateSiteSettings(updates: Partial<SiteSettings>): Promise<SiteSettings> {
  const current = await getSiteSettings()
  const merged = mergeSettings(current, updates)
  const db = await getDatabase()
  const collection = db.collection<SiteSettings>(COLLECTION_NAME)
  const now = new Date()

  const docToSave: SiteSettings = {
    ...merged,
    _id: SETTINGS_ID,
    createdAt: current.createdAt ?? now,
    updatedAt: now,
  }

  await collection.updateOne(
    { _id: SETTINGS_ID },
    {
      $set: {
        ...docToSave,
        createdAt: docToSave.createdAt instanceof Date ? docToSave.createdAt : new Date(docToSave.createdAt ?? now),
        updatedAt: now,
      },
    },
    { upsert: true },
  )

  return normalizeSiteSettings({ ...docToSave, updatedAt: now })
}

export { DEFAULT_SITE_SETTINGS }
