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
          // Make email search case-insensitive
          const user = await db.collection<User>("users").findOne({
            email: { $regex: `^${credentials.email}$`, $options: 'i' }
          })

          if (!user || !user.password) {
            throw new Error("Invalid credentials")
          }
          
          // Check if the user account is disabled
          if (user.disabled === true) {
            throw new Error("Account disabled. Your account has been suspended by an administrator.")
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
          // Make email search case-insensitive
          const existingUser = await db.collection<User>("users").findOne({
            email: { $regex: `^${user.email!}$`, $options: 'i' }
          })
          
          // Check if existing user is disabled
          if (existingUser && existingUser.disabled === true) {
            throw new Error("Account disabled. Your account has been suspended by an administrator.")
          }

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
          // Make email search case-insensitive
          const dbUser = await db.collection<User>("users").findOne({
            email: { $regex: `^${user.email!}$`, $options: 'i' }
          })
          if (dbUser) {
            // Check if user has been disabled since their last authentication
            if (dbUser.disabled === true) {
              throw new Error("Account disabled. Your account has been suspended by an administrator.")
            }
            
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
        try {
          // Extra security - verify the user isn't disabled on every request
          const db = await getDatabase()
          const user = await db.collection<User>("users").findOne({ 
            _id: token.id as string 
          });

          if (user?.disabled === true) {
            // Return the session but mark it for logout processing on the client
            session.user.disabled = true;
            return session;
          }
          
          session.user.role = token.role as "user" | "admin"
          session.user.id = token.id as string
        } catch (error) {
          // If there's an error, still allow the session but log the error
          console.error("Session error:", error);
        }
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
