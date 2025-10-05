import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { v2 as cloudinary } from "cloudinary"
import { MongoClient } from "mongodb"

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const uri = process.env.MONGODB_URI
if (!uri) {
  throw new Error('Please add your MongoDB URI to .env.local')
}

const client = new MongoClient(uri)

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "File must be an image" },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be less than 5MB" },
        { status: 400 }
      )
    }

    // Connect to MongoDB first so we can properly close it even if Cloudinary upload fails
    await client.connect()
    const db = client.db("rivaayat")
    const users = db.collection("users")

    // Convert file to base64
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = `data:${file.type};base64,${buffer.toString("base64")}`

    // Upload to Cloudinary
    let uploadResponse;
    try {
      uploadResponse = await cloudinary.uploader.upload(base64, {
        folder: "rivaayat/avatars",
        transformation: [
          { width: 200, height: 200, crop: "fill", gravity: "face" },
          { quality: "auto", fetch_format: "auto" }
        ],
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
      });
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      // Make sure we close MongoDB connection before returning error
      await client.close();
      return NextResponse.json(
        { error: "Failed to upload image to cloud storage" },
        { status: 500 }
      );
    }

    const result = await users.updateOne(
      { email: session.user.email },
      { 
        $set: { 
          image: uploadResponse.secure_url,
          updatedAt: new Date()
        } 
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      imageUrl: uploadResponse.secure_url,
      url: uploadResponse.secure_url, // Adding url as an alternative property name for compatibility
      publicId: uploadResponse.public_id
    })

  } catch (error) {
    console.error("Error uploading avatar:", error)
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    )
  } finally {
    await client.close()
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const publicId = searchParams.get("publicId")

    if (!publicId) {
      return NextResponse.json(
        { error: "Public ID is required" },
        { status: 400 }
      )
    }

    // Delete from Cloudinary
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      console.error("Error deleting image from Cloudinary:", error);
      // Continue execution even if delete fails
    }

    // Update user's image in database
    await client.connect()
    const db = client.db("rivaayat")
    const users = db.collection("users")

    const result = await users.updateOne(
      { email: session.user.email },
      { 
        $unset: { image: "" },
        $set: { updatedAt: new Date() }
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Avatar deleted successfully"
    })

  } catch (error) {
    console.error("Error deleting avatar:", error)
    return NextResponse.json(
      { error: "Failed to delete image" },
      { status: 500 }
    )
  } finally {
    await client.close()
  }
}