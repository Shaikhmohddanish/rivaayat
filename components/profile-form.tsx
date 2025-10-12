"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Upload, User, Loader2 } from "lucide-react"
import { formatDateForInput, parseInputDate, getCurrentDateIST } from "@/lib/date-utils"
import type { User as UserType } from "@/lib/types"

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional().refine(date => !date || /^\d{4}-\d{2}-\d{2}$/.test(date), {
    message: "Date must be in YYYY-MM-DD format"
  }),
})

type ProfileFormData = z.infer<typeof profileSchema>

interface ProfileFormProps {
  user: UserType
  onUpdate: (data: { name: string; email: string; phone?: string; dateOfBirth?: string; image?: string }) => Promise<{ success: boolean; error?: string }>
}

export function ProfileForm({ user, onUpdate }: ProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [imageUploading, setImageUploading] = useState(false)
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      dateOfBirth: user.dateOfBirth ? formatDateForInput(user.dateOfBirth) : "",
    },
  })

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true)
    try {
      // Scroll to top immediately when submission starts
      window.scrollTo({ top: 0, behavior: 'smooth' })
      
      // Send the data directly to the API without date conversion
      const result = await onUpdate({
        name: data.name,
        email: data.email,
        phone: data.phone,
        dateOfBirth: data.dateOfBirth
      })

      if (result.success) {
        // Clear all user-related cache to ensure fresh data
        if (typeof window !== 'undefined') {
          // Find and clear any user profile related cache entries
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('user:profile:')) {
              localStorage.removeItem(key);
            }
          }
        }
        
        toast({
          title: "Profile Updated Successfully",
          description: "Your profile information has been saved and updated.",
          duration: 3000,
          variant: "default",
        })
      } else {
        toast({
          title: "Update Failed",
          description: result.error || "Failed to update profile",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      
      // Ensure we're at the top of the page after the form submission completes
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please select an image file",
        variant: "destructive",
      })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      })
      return
    }

    setImageUploading(true)
    try {
      // Clear any cached user profile data before uploading
      if (typeof window !== 'undefined') {
        // Find and clear any user profile related cache entries
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('user:profile:')) {
            localStorage.removeItem(key);
          }
        }
      }
      
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload/avatar', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload image')
      }

      // Keep the existing user data and just update the image
      // Get the imageUrl from the response
      if (!data.imageUrl) {
        throw new Error("No image URL returned from server");
      }
      
      const result = await onUpdate({ 
        name: user.name,
        email: user.email,
        phone: user.phone,
        dateOfBirth: user.dateOfBirth as string,
        image: data.imageUrl
      })

      if (result.success) {
        // Scroll to top to ensure user sees the success message
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        toast({
          title: "Profile Picture Updated",
          description: "Your profile picture has been updated successfully.",
          duration: 3000,
          variant: "default",
        })
      } else {
        toast({
          title: "Update Failed",
          description: result.error || "Failed to update profile picture",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      
      // More detailed error message for the user
      let errorMessage = "Failed to upload image";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        errorMessage = String(error.message);
      }
      
      toast({
        title: "Upload Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setImageUploading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Profile Picture Section */}
      <Card className="bg-muted/30 border-0">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="relative">
              <Avatar className="w-24 h-24 elegant-shadow">
                <AvatarImage src={user.image} alt={user.name} />
                <AvatarFallback className="text-lg elegant-gradient text-white">
                  {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {imageUploading && (
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                  <Loader2 className="h-6 w-6 text-white animate-spin" />
                </div>
              )}
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="font-semibold mb-2">Profile Picture</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Upload a new profile picture. JPG, PNG or GIF (max 5MB)
              </p>
              <div className="relative">
                <input
                  type="file"
                  id="avatar-upload"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={imageUploading}
                />
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={imageUploading}
                  className="elegant-hover"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {imageUploading ? "Uploading..." : "Change Picture"}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Full Name *
            </Label>
            <Input
              id="name"
              {...register("name")}
              className="elegant-hover focus:ring-primary"
              placeholder="Enter your full name"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email Address *
            </Label>
            <Input
              id="email"
              type="email"
              {...register("email")}
              className="elegant-hover focus:ring-primary bg-muted/50"
              placeholder="Enter your email"
              disabled={true}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Email cannot be changed once set
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-medium">
              Phone Number
            </Label>
            <Input
              id="phone"
              type="tel"
              {...register("phone")}
              className="elegant-hover focus:ring-primary"
              placeholder="Enter your phone number"
            />
            {errors.phone && (
              <p className="text-sm text-destructive">{errors.phone.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateOfBirth" className="text-sm font-medium">
              Date of Birth
            </Label>
            <Input
              id="dateOfBirth"
              type="date"
              {...register("dateOfBirth")}
              className="elegant-hover focus:ring-primary"
            />
            {errors.dateOfBirth && (
              <p className="text-sm text-destructive">{errors.dateOfBirth.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Dates are stored and displayed in IST (Indian Standard Time)
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            type="submit"
            disabled={!isDirty || isLoading}
            className="elegant-gradient text-white hover:opacity-90 w-full sm:w-auto"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
          
          <Button
            type="button"
            variant="outline"
            onClick={() => window.location.reload()}
            className="elegant-hover w-full sm:w-auto"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}