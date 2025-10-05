"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, MapPin, Phone, Mail, Calendar, Settings, Lock } from "lucide-react"
import { ProfileForm } from "@/components/profile-form"
import { AddressManager } from "@/components/address-manager"
import { PasswordUpdate } from "@/components/password-update"
import { ShimmerHeading, ShimmerText, ShimmerButton } from "@/components/ui/shimmer"
import type { User as UserType, Address } from "@/lib/types"

export default function ProfilePage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [userData, setUserData] = useState<UserType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (status === "loading") return
    
    if (!session) {
      router.push("/auth/login")
      return
    }

    fetchUserData()
  }, [session, status, router])

  const fetchUserData = async () => {
    try {
      setLoading(true)
      
      // Fetch user profile data
      const userResponse = await fetch("/api/user/profile")
      const userData = await userResponse.json()

      if (!userResponse.ok) {
        throw new Error(userData.error || "Failed to fetch profile")
      }
      
      // Fetch user addresses separately
      const addressesResponse = await fetch("/api/user/addresses")
      const addressesData = await addressesResponse.json()
      
      // Combine user data with addresses
      setUserData({ 
        ...userData, 
        addresses: addressesData.addresses || [] 
      })
    } catch (error) {
      console.error("Error fetching profile:", error)
      setError(error instanceof Error ? error.message : "Failed to load profile")
    } finally {
      setLoading(false)
    }
  }

  // Show authentication prompt if not logged in
  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <User className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Sign In Required</h2>
            <p className="text-muted-foreground mb-6">
              Please sign in to access your profile and manage your account.
            </p>
            <Button asChild className="w-full elegant-gradient text-white">
              <a href="/auth/login">Sign In</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleProfileUpdate = async (profileData: { name: string; email: string; phone?: string; dateOfBirth?: string; image?: string }) => {
    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update profile")
      }

      setUserData(data.user)
      
      // Update session if name or image changed
      if (profileData.name || profileData.image) {
        await update({
          name: data.user.name,
          image: data.user.image
        })
      }

      return { success: true }
    } catch (error) {
      console.error("Error updating profile:", error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to update profile" 
      }
    }
  }

  const handleAddressUpdate = async (addresses: Address[]) => {
    try {
      // Get fresh addresses from API
      const response = await fetch("/api/user/addresses")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch addresses")
      }

      // Update user data with latest addresses
      setUserData(prev => prev ? { ...prev, addresses: data.addresses } : null)
      return { success: true }
    } catch (error) {
      console.error("Error updating addresses:", error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to update addresses" 
      }
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Header Shimmer */}
            <div className="space-y-4">
              <ShimmerHeading className="w-48 h-9" />
              <ShimmerText className="w-80 h-5" />
            </div>

            {/* Tabs Shimmer */}
            <div className="space-y-6">
              <div className="flex gap-4">
                <ShimmerButton className="w-32 h-10" />
                <ShimmerButton className="w-32 h-10" />
              </div>
              
              <div className="bg-card/50 rounded-2xl p-8 elegant-shadow border-0 space-y-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="space-y-3">
                    <ShimmerText className="w-24 h-5" />
                    <div className="h-10 rounded-xl shimmer w-full" />
                  </div>
                ))}
                <ShimmerButton className="w-32 h-12" />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto text-center">
            <CardContent className="pt-6">
              <Settings className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h2 className="text-lg font-semibold mb-2">Error Loading Profile</h2>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={fetchUserData} variant="outline">
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!userData) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2 elegant-gradient bg-clip-text text-transparent">
              My Profile
            </h1>
            <p className="text-muted-foreground">
              Manage your account information and addresses
            </p>
          </div>

          {/* Profile Overview Card */}
          <Card className="mb-8 elegant-shadow border-0 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-6">
                <div className="relative">
                  {userData.image ? (
                    <img
                      src={userData.image}
                      alt={userData.name}
                      className="w-20 h-20 rounded-full object-cover elegant-shadow"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full elegant-gradient flex items-center justify-center">
                      <User className="h-10 w-10 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-semibold mb-1">{userData.name}</h2>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      {userData.email}
                    </span>
                    {userData.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        {userData.phone}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {userData.addresses?.length || 0} address{userData.addresses?.length !== 1 ? 'es' : ''} saved
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 bg-muted/50 elegant-shadow">
              <TabsTrigger 
                value="profile" 
                className="data-[state=active]:bg-primary data-[state=active]:text-white"
              >
                <User className="h-4 w-4 mr-2" />
                Personal Information
              </TabsTrigger>
              <TabsTrigger 
                value="addresses"
                className="data-[state=active]:bg-primary data-[state=active]:text-white"
              >
                <MapPin className="h-4 w-4 mr-2" />
                Addresses
              </TabsTrigger>
              <TabsTrigger 
                value="security"
                className="data-[state=active]:bg-primary data-[state=active]:text-white"
              >
                <Lock className="h-4 w-4 mr-2" />
                Security
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <Card className="elegant-shadow border-0 bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ProfileForm user={userData} onUpdate={handleProfileUpdate} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="addresses">
              <Card className="elegant-shadow border-0 bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Manage Addresses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <AddressManager 
                    addresses={userData.addresses || []} 
                    onUpdate={handleAddressUpdate}
                    user={userData}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security">
              <PasswordUpdate user={userData} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}