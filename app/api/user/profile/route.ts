import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { getCurrentDateIST } from "@/lib/date-utils"
import { MongoClient, ObjectId } from "mongodb"

const uri = process.env.MONGODB_URI
if (!uri) {
  throw new Error('Please add your MongoDB URI to .env.local')
}

const client = new MongoClient(uri)

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    await client.connect()
    const db = client.db("rivaayat")
    const users = db.collection("users")

    const user = await users.findOne(
      { email: session.user.email },
      { 
        projection: { 
          name: 1, 
          email: 1, 
          image: 1, 
          phone: 1, 
          dateOfBirth: 1, 
          addresses: 1,
          provider: 1,
          password: 1
        } 
      }
    )

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      image: user.image,
      phone: user.phone || "",
      dateOfBirth: user.dateOfBirth || "",
      addresses: user.addresses || [],
      provider: user.provider || "credentials",
      password: !!user.password // Return boolean indicating if password exists
    })

  } catch (error) {
    console.error("Error fetching user profile:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  } finally {
    await client.close()
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, phone, dateOfBirth, image } = body

    // Validate required fields
    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        { error: "Name is required and must be at least 2 characters" },
        { status: 400 }
      )
    }

    // Validate phone if provided
    if (phone && !/^\+?[\d\s\-\(\)]+$/.test(phone)) {
      return NextResponse.json(
        { error: "Invalid phone number format" },
        { status: 400 }
      )
    }

    // Validate date of birth if provided
    if (dateOfBirth && !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth.toString())) {
      return NextResponse.json(
        { error: "Invalid date format. Use YYYY-MM-DD" },
        { status: 400 }
      )
    }

    await client.connect()
    const db = client.db("rivaayat")
    const users = db.collection("users")

    const updateData: any = {
      name: name.trim(),
      updatedAt: getCurrentDateIST()
    }

    if (phone !== undefined) updateData.phone = phone
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth
    if (image !== undefined) updateData.image = image

    const result = await users.updateOne(
      { email: session.user.email },
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Fetch updated user data
    const updatedUser = await users.findOne(
      { email: session.user.email },
      { 
        projection: { 
          name: 1, 
          email: 1, 
          image: 1, 
          phone: 1, 
          dateOfBirth: 1, 
          addresses: 1,
          provider: 1,
          password: 1
        } 
      }
    )

    return NextResponse.json({
      success: true,
      user: {
        _id: updatedUser?._id,
        name: updatedUser?.name,
        email: updatedUser?.email,
        image: updatedUser?.image,
        phone: updatedUser?.phone || "",
        dateOfBirth: updatedUser?.dateOfBirth || "",
        addresses: updatedUser?.addresses || [],
        provider: updatedUser?.provider || "credentials",
        password: !!updatedUser?.password
      }
    })

  } catch (error) {
    console.error("Error updating user profile:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  } finally {
    await client.close()
  }
}