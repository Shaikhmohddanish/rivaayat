import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import type { User } from "@/lib/types"

// PATCH /api/admin/users/[id] - Admin only endpoint to update user
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { name, role, image, disabled } = body

    const updateFields: Partial<User> = {
      updatedAt: new Date(),
    }

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length === 0) {
        return NextResponse.json({ error: "Name must be a non-empty string" }, { status: 400 })
      }
      updateFields.name = name.trim()
    }

    if (role !== undefined) {
      if (role !== "user" && role !== "admin") {
        return NextResponse.json({ error: "Role must be 'user' or 'admin'" }, { status: 400 })
      }
      updateFields.role = role
    }

    if (image !== undefined) {
      updateFields.image = image
    }
    
    // Handle disabled status
    if (disabled !== undefined) {
      if (typeof disabled !== "boolean") {
        return NextResponse.json({ error: "Disabled must be a boolean value" }, { status: 400 })
      }
      updateFields.disabled = disabled
    }

    const client = await clientPromise
    const db = client.db("rivaayat")

    const result = await db
      .collection<User>("users")
      .findOneAndUpdate(
        { _id: new ObjectId(params.id) as any },
        { $set: updateFields },
        { returnDocument: "after", projection: { password: 0 } },
      )

    if (!result) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      _id: result._id?.toString(),
      name: result.name,
      email: result.email,
      role: result.role,
      image: result.image,
      provider: result.provider,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    })
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
  }
}
