"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, MapPin, Phone, Mail, Calendar, Settings, Lock } from "lucide-react"
import { useUserProfile, useUserAddresses } from "@/hooks/use-user-data"
import { useUserSession, updateUserSessionData } from "@/hooks/use-user-session"
import { ProfileForm } from "@/components/profile-form"
import { AddressManager } from "@/components/address-manager"
import { PasswordUpdate } from "@/components/password-update"
import { ShimmerHeading, ShimmerText, ShimmerButton } from "@/components/ui/shimmer"
import { LS_KEYS } from "@/lib/local-storage"
import type { User as UserType, Address } from "@/lib/types"

export default function ProfilePage() {
  const { userData: sessionUser, status, session, update } = useUserSession()
  const router = useRouter()
  
  // Memoize email to prevent unnecessary re-renders in child hooks
  const userEmail = useMemo(() => sessionUser?.email || null, [sessionUser?.email])
  
  const { 
    profile: userData, 
    loading: profileLoading,
    refreshProfile 
  } = useUserProfile(userEmail)
  const { 
    addresses: userAddresses, 
    loading: addressesLoading, 
    updateAddresses, 
    deleteAddress 
  } = useUserAddresses(userEmail)
  
  const [error, setError] = useState("")
  
  // Combined loading state
  const loading = profileLoading || addressesLoading

  useEffect(() => {
    if (status === "loading") return
    
    if (!session) {
      router.push("/auth/login")
      return
    }
  }, [session, status, router])

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
      // Clear all user-specific cache before making the API call
      if (session?.user?.email && typeof window !== 'undefined') {
        const profileCacheKey = `${LS_KEYS.USER_PROFILE}${session.user.email}`;
        localStorage.removeItem(profileCacheKey);
      }
      
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update profile")
      }
      
      // Update localStorage session data for instant header update
      updateUserSessionData({
        name: data.user?.name || profileData.name,
        email: data.user?.email || profileData.email,
        image: data.user?.image || profileData.image,
      });
      
      // Update session if name or image changed
      if ((profileData.name || profileData.image) && update) {
        await update({
          name: data.user?.name || profileData.name,
          image: data.user?.image || profileData.image
        })
      }
      
      // Refresh the profile data to update the UI with fresh data from server
      await refreshProfile();
      
      // Also update the router to ensure any navigation state is refreshed
      router.refresh();
      
      // Force a re-render of components that might depend on the user data
      setError(""); // Clear any errors
      
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
      const result = await updateAddresses(addresses);
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
              <Button onClick={() => window.location.reload()} variant="outline">
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

  // Combine user data with addresses for components that expect it
  const userWithAddresses = {
    ...userData,
    addresses: userAddresses || []
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-4 sm:py-8">
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
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                <div className="relative mb-4 sm:mb-0">
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
                <div className="flex-1 text-center sm:text-left">
                  <h2 className="text-2xl font-semibold mb-1">{userData.name}</h2>
                  <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
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
                      {userAddresses?.length || 0} address{userAddresses?.length !== 1 ? 'es' : ''} saved
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
                <User className="h-4 w-4 mr-0 sm:mr-2" />
                <span className="hidden sm:inline">Personal Information</span>
                <span className="inline sm:hidden">Profile</span>
              </TabsTrigger>
              <TabsTrigger 
                value="addresses"
                className="data-[state=active]:bg-primary data-[state=active]:text-white"
              >
                <MapPin className="h-4 w-4 mr-0 sm:mr-2" />
                <span className="hidden sm:inline">Addresses</span>
                <span className="inline sm:hidden">Address</span>
              </TabsTrigger>
              <TabsTrigger 
                value="security"
                className="data-[state=active]:bg-primary data-[state=active]:text-white"
              >
                <Lock className="h-4 w-4 mr-0 sm:mr-2" />
                <span className="inline">Security</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <Card className="elegant-shadow border-0 bg-card/80 backdrop-blur-sm">
                <CardHeader className="px-4 sm:px-6">
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 sm:px-6">
                  <ProfileForm user={userData} onUpdate={handleProfileUpdate} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="addresses">
              <Card className="elegant-shadow border-0 bg-card/80 backdrop-blur-sm">
                <CardHeader className="px-4 sm:px-6">
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Manage Addresses
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 sm:px-6">
                  <AddressManager 
                    addresses={userAddresses || []} 
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