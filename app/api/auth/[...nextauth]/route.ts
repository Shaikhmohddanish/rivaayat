import NextAuth, { type NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { getDatabase } from "@/lib/mongodb"
import { getCurrentDateIST } from "@/lib/date-utils"
import bcrypt from "bcryptjs"
import type { User } from "@/lib/types"

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password required")
        }

        try {
          const db = await getDatabase()
          const user = await db.collection<User>("users").findOne({
            email: credentials.email,
          })

          if (!user || !user.password) {
            throw new Error("Invalid credentials")
          }

          const isValid = await bcrypt.compare(credentials.password, user.password)

          if (!isValid) {
            throw new Error("Invalid credentials")
          }

          return {
            id: user._id!.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
            image: user.image,
          }
        } catch (error) {
          console.error('Auth error:', error)
          throw new Error("Authentication failed")
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          const db = await getDatabase()
          const existingUser = await db.collection<User>("users").findOne({
            email: user.email!,
          })

          if (!existingUser) {
            await db.collection<User>("users").insertOne({
              name: user.name!,
              email: user.email!,
              role: "user",
              image: user.image,
              provider: "google",
              createdAt: getCurrentDateIST(),
              updatedAt: getCurrentDateIST(),
            })
          }
        } catch (error) {
          console.error('Database error during signIn:', error)
          // Still allow sign in even if database save fails
        }
      }
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        try {
          const db = await getDatabase()
          const dbUser = await db.collection<User>("users").findOne({
            email: user.email!,
          })
          if (dbUser) {
            token.role = dbUser.role
            token.id = dbUser._id!.toString()
          } else {
            // Fallback for new users
            token.role = "user"
            token.id = user.id || user.email
          }
        } catch (error) {
          console.error('Database error during JWT:', error)
          token.role = "user"
          token.id = user.id || user.email
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as "user" | "admin"
        session.user.id = token.id as string
      }
      return session
    },
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
