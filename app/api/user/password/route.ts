import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { getDatabase } from "@/lib/mongodb"
import { getCurrentDateIST } from "@/lib/date-utils"
import { ObjectId } from "mongodb"
import bcrypt from "bcryptjs"
import type { User } from "@/lib/types"

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { currentPassword, newPassword } = body

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { error: "New password must be at least 6 characters long" },
        { status: 400 }
      )
    }

    const db = await getDatabase()
    
    // Get user from database
    const user = await db.collection("users").findOne({
      _id: new ObjectId(session.user.id)
    }) as User | null

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Check if user is Google user without password (first time setting password)
    const isGoogleUserFirstPassword = user.provider === "google" && !user.password

    // If user already has a password (not first time), verify current password
    if (!isGoogleUserFirstPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: "Current password is required" },
          { status: 400 }
        )
      }

      if (!user.password) {
        return NextResponse.json(
          { error: "No password set for this account" },
          { status: 400 }
        )
      }

      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password)
      
      if (!isCurrentPasswordValid) {
        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 400 }
        )
      }
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    // Update user password in database
    const updateResult = await db.collection("users").findOneAndUpdate(
      { _id: new ObjectId(session.user.id) },
      { 
        $set: { 
          password: hashedPassword,
          updatedAt: getCurrentDateIST()
        }
      },
      { returnDocument: "after" }
    )

    if (!updateResult) {
      return NextResponse.json(
        { error: "Failed to update password" },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      message: isGoogleUserFirstPassword 
        ? "Password set successfully! You can now login with email and password."
        : "Password updated successfully!"
    })

  } catch (error) {
    console.error("Password update error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}