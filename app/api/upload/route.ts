import { NextResponse } from "next/server"
import { v2 as cloudinary } from "cloudinary"

const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024 // 8MB
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"])

const cloudinaryCloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME

cloudinary.config({
  cloud_name: cloudinaryCloudName,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(request: Request) {
  try {
    if (!cloudinaryCloudName || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return NextResponse.json({ error: "Upload service is not configured" }, { status: 500 })
    }

    const formData = await request.formData()
    const file = formData.get("file")

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload JPG, PNG, WEBP, GIF, or AVIF images." },
        { status: 415 },
      )
    }

    if (file.size <= 0) {
      return NextResponse.json({ error: "Empty files cannot be uploaded" }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "File size must be 8MB or less" },
        { status: 413 },
      )
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: "rivaayat",
            resource_type: "image",
          },
          (error: unknown, result: unknown) => {
            if (error) reject(error)
            else resolve(result as { secure_url: string; public_id: string })
          },
        )
        .end(buffer)
    })

    return NextResponse.json({
      url: result.secure_url,
      publicId: result.public_id,
      bytes: file.size,
    })
  } catch (error) {
    console.error("Upload error:", error)

    if (error && typeof error === "object" && "message" in error) {
      return NextResponse.json(
        { error: String((error as { message?: string }).message || "Upload failed") },
        { status: 500 },
      )
    }

    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
