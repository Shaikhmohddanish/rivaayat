type CloudinaryMode = "fit" | "fill"

interface CloudinaryTransformOptions {
  width: number
  height?: number
  mode?: CloudinaryMode
}

const CLOUDINARY_HOST = "res.cloudinary.com"

function isCloudinaryHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value)
    return parsed.hostname.includes(CLOUDINARY_HOST)
  } catch {
    return false
  }
}

function sanitizePublicId(publicIdOrUrl: string): string {
  if (!publicIdOrUrl) return ""

  if (/^https?:\/\//i.test(publicIdOrUrl) && !isCloudinaryHttpUrl(publicIdOrUrl)) {
    return ""
  }

  // Keep local/static paths untouched.
  if (publicIdOrUrl.startsWith("/")) {
    return ""
  }

  if (!publicIdOrUrl.includes("/upload/")) {
    return publicIdOrUrl.replace(/^\/+/, "").split("?")[0].split("#")[0]
  }

  const uploadIndex = publicIdOrUrl.indexOf("/upload/")
  const rawAfterUpload = publicIdOrUrl.slice(uploadIndex + "/upload/".length)
  const withoutVersion = rawAfterUpload.replace(/^v\d+\//, "").split("?")[0].split("#")[0]
  return withoutVersion.replace(/^\/+/, "")
}

export function getCloudinaryImageUrl(src: string, options: CloudinaryTransformOptions): string {
  if (!src) return src

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  if (!cloudName) return src

  const publicId = sanitizePublicId(src)
  if (!publicId) return src

  const mode = options.mode || "fill"
  const parts = ["f_auto", "q_auto:good", "dpr_auto"]

  // g_auto (gravity) only applies to fill/crop modes, not fit
  if (mode === "fill") {
    parts.push("g_auto")
  }

  parts.push(`c_${mode}`, `w_${options.width}`)

  if (options.height) {
    parts.push(`h_${options.height}`)
  }

  return `https://${CLOUDINARY_HOST}/${cloudName}/image/upload/${parts.join(",")}/${publicId}`
}
