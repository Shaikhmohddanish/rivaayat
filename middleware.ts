import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const isAdmin = token?.role === "admin"
    const isAdminRoute = req.nextUrl.pathname.startsWith("/admin")

    // Protect admin routes
    if (isAdminRoute && !isAdmin) {
      return NextResponse.redirect(new URL("/", req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to non-protected routes
        if (!req.nextUrl.pathname.startsWith("/admin")) {
          return true
        }
        // Require authentication for admin routes
        return !!token
      },
    },
  },
)

export const config = {
  matcher: ["/admin/:path*", "/cart", "/checkout", "/orders/:path*", "/wishlist"],
}
