const FALLBACK_SITE_URL = "https://rivaayatposhak.co.in"

function normalizeSiteUrl(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value
}

export function getSiteUrl(): string {
  const configured =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    FALLBACK_SITE_URL

  try {
    return normalizeSiteUrl(new URL(configured).toString())
  } catch {
    return FALLBACK_SITE_URL
  }
}

export function toAbsoluteUrl(pathOrUrl: string): string {
  if (!pathOrUrl) return getSiteUrl()

  try {
    return new URL(pathOrUrl).toString()
  } catch {
    return new URL(pathOrUrl, getSiteUrl()).toString()
  }
}
