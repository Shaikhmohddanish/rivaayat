import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { getCurrentDateIST } from "@/lib/date-utils"
import { getDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
    
    const db = await getDatabase()
    const users = db.collection("users")

    let user = await users.findOne(
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

    // If user doesn't exist, create a basic profile from session data
    if (!user) {
      const newUser = {
        email: session.user.email,
        name: session.user.name || "",
        image: session.user.image || "",
        phone: "",
        dateOfBirth: "",
        addresses: [],
        provider: "credentials",
        createdAt: getCurrentDateIST(),
        updatedAt: getCurrentDateIST()
      }
      
      const insertResult = await users.insertOne(newUser as any)
      
      // Fetch the newly created user to get the complete document with _id
      user = await users.findOne(
        { _id: insertResult.insertedId },
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
    }

    // Format user response
    const userResponse = {
      _id: user?._id,
      name: user?.name,
      email: user?.email,
      image: user?.image,
      phone: user?.phone || "",
      dateOfBirth: user?.dateOfBirth || "",
      addresses: user?.addresses || [],
      provider: user?.provider || "credentials",
      password: !!user?.password // Return boolean indicating if password exists
    };
    
    return NextResponse.json(userResponse)

  } catch (error) {
    console.error("Error fetching user profile:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
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

    const db = await getDatabase()
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

    // Format user response
    const userResponse = {
      _id: updatedUser?._id,
      name: updatedUser?.name,
      email: updatedUser?.email,
      image: updatedUser?.image,
      phone: updatedUser?.phone || "",
      dateOfBirth: updatedUser?.dateOfBirth || "",
      addresses: updatedUser?.addresses || [],
      provider: updatedUser?.provider || "credentials",
      password: !!updatedUser?.password
    };
    
    return NextResponse.json({
      success: true,
      user: userResponse
    })

  } catch (error) {
    console.error("Error updating user profile:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}