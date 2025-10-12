import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import type { User } from "@/lib/types"

// GET /api/admin/users - Admin only endpoint to list all users
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const db = await getDatabase()

    const users = await db
      .collection<User>("users")
      .find({})
      .project({ password: 0 }) // Exclude password field
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json(
      users.map((user: any) => ({
        _id: user._id?.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.image,
        provider: user.provider,
        disabled: user.disabled || false,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })),
    )
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}
