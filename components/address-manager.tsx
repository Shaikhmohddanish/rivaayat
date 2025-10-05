"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Plus, Edit, Trash2, MapPin, Home, Building, Loader2 } from "lucide-react"
import type { Address, User } from "@/lib/types"
import { indianStates } from "@/lib/indian-states"

const addressSchema = z.object({
  type: z.enum(["home", "work", "billing", "shipping"]),
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  company: z.string().optional(),
  addressLine1: z.string().min(5, "Address is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(2, "City is required"),
  state: z.string().refine(val => indianStates.includes(val), {
    message: "Please select a valid Indian state",
  }),
  postalCode: z.string().length(6, "PIN code must be 6 digits").regex(/^[1-9][0-9]{5}$/, "Invalid PIN code format"),
  country: z.literal("India"),
  phone: z.string().optional().refine(val => !val || /^[6-9]\d{9}$/.test(val), {
    message: "Please enter a valid 10-digit Indian phone number",
  }),
  isDefault: z.boolean().default(false),
})

type AddressFormData = z.infer<typeof addressSchema>

interface AddressManagerProps {
  addresses: Address[]
  user: User
  onUpdate: (addresses: Address[]) => Promise<{ success: boolean; error?: string }>
}

export function AddressManager({ addresses, user, onUpdate }: AddressManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      type: "home",
      firstName: user.name?.split(' ')[0] || '',
      lastName: user.name?.split(' ').slice(1).join(' ') || '',
      country: "India",
      isDefault: false,
    },
  })

  const watchedType = watch("type")

  const openAddDialog = () => {
    setEditingAddress(null)
    reset({
      type: "home",
      firstName: user.name?.split(' ')[0] || '',
      lastName: user.name?.split(' ').slice(1).join(' ') || '',
      company: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      postalCode: "",
      country: "India",
      phone: user.phone || "",
      isDefault: addresses.length === 0, // First address is default
    })
    setIsDialogOpen(true)
  }

  const openEditDialog = (address: Address) => {
    setEditingAddress(address)
    reset({
      type: address.type,
      firstName: address.firstName,
      lastName: address.lastName,
      company: address.company || "",
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 || "",
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: "India", // Fixed: Always set to India
      phone: address.phone || "",
      isDefault: address.isDefault,
    })
    setIsDialogOpen(true)
  }

  const onSubmit = async (data: AddressFormData) => {
    setIsLoading(true)
    try {
      let result;

      if (editingAddress) {
        // Update existing address - use PUT with all addresses
        const updatedAddresses = addresses.map(addr => 
          addr._id === editingAddress._id 
            ? { ...addr, ...data }
            : data.isDefault ? { ...addr, isDefault: false } : addr
        )
        
        const response = await fetch('/api/user/addresses', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ addresses: updatedAddresses })
        })
        
        result = await response.json()
      } else {
        // Add new address - use POST for just this address
        const response = await fetch('/api/user/addresses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address: data })
        })
        
        result = await response.json()
      }

      if (result.success) {
        // Refresh addresses via onUpdate to update parent component
        if (result.addresses) {
          await onUpdate(result.addresses)
        } else {
          // If no addresses in response, do a full refresh
          const getAddressesResponse = await fetch('/api/user/addresses')
          const addressesData = await getAddressesResponse.json()
          await onUpdate(addressesData.addresses)
        }
        
        toast({
          title: editingAddress ? "Address Updated" : "Address Added",
          description: `Address has been ${editingAddress ? "updated" : "added"} successfully.`,
        })
        setIsDialogOpen(false)
      } else {
        toast({
          title: "Failed",
          description: result.error || `Failed to ${editingAddress ? "update" : "add"} address`,
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
    }
  }

  const handleDelete = async (addressId: string) => {
    setIsLoading(true)
    try {
      // Use the DELETE API endpoint directly
      const response = await fetch(`/api/user/addresses?id=${addressId}`, {
        method: 'DELETE',
      })
      
      const result = await response.json()

      if (result.success) {
        // Update parent component with the returned addresses
        await onUpdate(result.addresses)
        
        toast({
          title: "Address Deleted",
          description: "Address has been deleted successfully.",
        })
      } else {
        toast({
          title: "Delete Failed",
          description: result.error || "Failed to delete address",
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
    }
  }

  const handleSetDefault = async (addressId: string) => {
    setIsLoading(true)
    try {
      const updatedAddresses = addresses.map(addr => ({
        ...addr,
        isDefault: addr._id === addressId
      }))

      // Use PUT API directly
      const response = await fetch('/api/user/addresses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addresses: updatedAddresses })
      })
      
      const result = await response.json()

      if (result.success) {
        // Update parent with returned addresses
        await onUpdate(result.addresses)
        
        toast({
          title: "Default Address Updated",
          description: "Default address has been changed successfully.",
        })
      } else {
        toast({
          title: "Update Failed",
          description: result.error || "Failed to update default address",
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
    }
  }

  const getAddressTypeIcon = (type: string) => {
    switch (type) {
      case "home": return <Home className="h-4 w-4" />
      case "work": return <Building className="h-4 w-4" />
      default: return <MapPin className="h-4 w-4" />
    }
  }

  const getAddressTypeColor = (type: string) => {
    switch (type) {
      case "home": return "bg-green-100 text-green-800 border-green-200"
      case "work": return "bg-blue-100 text-blue-800 border-blue-200"
      case "billing": return "bg-purple-100 text-purple-800 border-purple-200"
      case "shipping": return "bg-orange-100 text-orange-800 border-orange-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <div className="space-y-6">
      {/* Add Address Button */}
      <Button 
        onClick={openAddDialog}
        className="elegant-gradient text-white hover:opacity-90"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add New Address
      </Button>

      {/* Address List */}
      {addresses.length === 0 ? (
        <Card className="text-center py-12 bg-muted/30 border-0">
          <CardContent>
            <MapPin className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Addresses Added</h3>
            <p className="text-muted-foreground mb-6">
              Add your first address to make checkout faster and easier.
            </p>
            <Button onClick={openAddDialog} variant="outline" className="elegant-hover">
              <Plus className="h-4 w-4 mr-2" />
              Add Address
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {addresses.map((address) => (
            <Card 
              key={address._id} 
              className={`relative elegant-shadow border-0 bg-card/80 backdrop-blur-sm transition-all duration-300 ${
                address.isDefault ? 'ring-2 ring-primary' : ''
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Badge 
                        variant="outline" 
                        className={`${getAddressTypeColor(address.type)} capitalize`}
                      >
                        {getAddressTypeIcon(address.type)}
                        <span className="ml-1">{address.type}</span>
                      </Badge>
                      {address.isDefault && (
                        <Badge className="bg-primary text-white">
                          Default
                        </Badge>
                      )}
                    </div>
                    
                    <div className="space-y-1 text-sm">
                      <p className="font-medium">
                        {address.firstName} {address.lastName}
                      </p>
                      {address.company && (
                        <p className="text-muted-foreground">{address.company}</p>
                      )}
                      <p>{address.addressLine1}</p>
                      {address.addressLine2 && <p>{address.addressLine2}</p>}
                      <p>
                        {address.city}, {address.state} {address.postalCode}
                      </p>
                      <p>{address.country}</p>
                      {address.phone && (
                        <p className="text-muted-foreground">{address.phone}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openEditDialog(address)}
                      className="elegant-hover"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    
                    {!address.isDefault && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleSetDefault(address._id!)}
                        disabled={isLoading}
                        className="elegant-hover"
                      >
                        Set Default
                      </Button>
                    )}
                    
                    {addresses.length > 1 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(address._id!)}
                        disabled={isLoading}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Address Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAddress ? "Edit Address" : "Add New Address"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Address Type *</Label>
                <Select
                  onValueChange={(value) => setValue("type", value as any)}
                  defaultValue={watchedType}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="home">Home</SelectItem>
                    <SelectItem value="work">Work</SelectItem>
                    <SelectItem value="billing">Billing</SelectItem>
                    <SelectItem value="shipping">Shipping</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="isDefault">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isDefault"
                      {...register("isDefault")}
                      disabled={addresses.length === 0}
                    />
                    <span>Set as default address</span>
                  </div>
                </Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  {...register("firstName")}
                  className="elegant-hover"
                />
                {errors.firstName && (
                  <p className="text-sm text-destructive">{errors.firstName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  {...register("lastName")}
                  className="elegant-hover"
                />
                {errors.lastName && (
                  <p className="text-sm text-destructive">{errors.lastName.message}</p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="company">Company (Optional)</Label>
                <Input
                  id="company"
                  {...register("company")}
                  className="elegant-hover"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="addressLine1">Address Line 1 *</Label>
                <Input
                  id="addressLine1"
                  {...register("addressLine1")}
                  className="elegant-hover"
                  placeholder="Street address, P.O. box"
                />
                {errors.addressLine1 && (
                  <p className="text-sm text-destructive">{errors.addressLine1.message}</p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="addressLine2">Address Line 2 (Optional)</Label>
                <Input
                  id="addressLine2"
                  {...register("addressLine2")}
                  className="elegant-hover"
                  placeholder="Apartment, suite, unit, building, floor, etc."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  {...register("city")}
                  className="elegant-hover"
                />
                {errors.city && (
                  <p className="text-sm text-destructive">{errors.city.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State/Union Territory *</Label>
                <Select 
                  onValueChange={(value) => setValue("state", value)}
                  defaultValue={watch("state")}
                >
                  <SelectTrigger id="state" className="elegant-hover">
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {indianStates.map((state) => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.state && (
                  <p className="text-sm text-destructive">{errors.state.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="postalCode">PIN Code *</Label>
                <Input
                  id="postalCode"
                  {...register("postalCode")}
                  className="elegant-hover"
                  maxLength={6}
                  placeholder="6-digit PIN code"
                />
                {errors.postalCode && (
                  <p className="text-sm text-destructive">{errors.postalCode.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country *</Label>
                <Input
                  id="country"
                  value="India"
                  disabled
                  className="elegant-hover bg-muted/50"
                  {...register("country")}
                />
                <p className="text-xs text-muted-foreground">Shipping available only in India</p>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="phone">Phone Number (Optional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  {...register("phone")}
                  className="elegant-hover"
                  placeholder="10-digit mobile number"
                  maxLength={10}
                />
                {errors.phone && (
                  <p className="text-sm text-destructive">{errors.phone.message}</p>
                )}
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={isLoading}
                className="elegant-gradient text-white hover:opacity-90"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {editingAddress ? "Updating..." : "Adding..."}
                  </>
                ) : (
                  editingAddress ? "Update Address" : "Add Address"
                )}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="elegant-hover"
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}