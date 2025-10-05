import "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: "user" | "admin"
      image?: string
    }
  }

  interface User {
    id: string
    email: string
    name: string
    role: "user" | "admin"
    image?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: "user" | "admin"
  }
}
