import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { cartDb } from "@/lib/db"

export async function GET() {
  try {
    const user = await requireAuth()
    const cart = await cartDb.findByUserId(user.id)

    return NextResponse.json({
      items: cart?.items || [],
    })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }
    console.error("Get cart error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
