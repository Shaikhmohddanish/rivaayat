"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Plus, Edit, Ban } from "lucide-react"
import type { Coupon } from "@/lib/types"

export default function AdminCouponsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [coupons, setCoupons] = useState<(Coupon & { _id: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<(Coupon & { _id: string }) | null>(null)
  const [formData, setFormData] = useState({
    code: "",
    discountPercent: 0,
    isActive: true,
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login")
    } else if (status === "authenticated" && session?.user?.role !== "admin") {
      router.push("/")
    }
  }, [status, session, router])

  useEffect(() => {
    if (session?.user?.role === "admin") {
      fetchCoupons()
    }
  }, [session])

  const fetchCoupons = async () => {
    try {
      const response = await fetch("/api/admin/coupons")
      if (response.ok) {
        const data = await response.json()
        setCoupons(data)
      }
    } catch (error) {
      console.error("Failed to fetch coupons:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async () => {
    if (!formData.code || formData.discountPercent <= 0) {
      alert("Please fill in all fields")
      return
    }

    try {
      const response = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        await fetchCoupons()
        setIsAddDialogOpen(false)
        setFormData({ code: "", discountPercent: 0, isActive: true })
      } else {
        const data = await response.json()
        alert(data.error || "Failed to create coupon")
      }
    } catch (error) {
      console.error("Failed to create coupon:", error)
      alert("Failed to create coupon")
    }
  }

  const handleEdit = (coupon: Coupon & { _id: string }) => {
    setEditingCoupon(coupon)
    setFormData({
      code: coupon.code,
      discountPercent: coupon.discountPercent,
      isActive: coupon.isActive,
    })
  }

  const handleUpdate = async () => {
    if (!editingCoupon) return

    try {
      const response = await fetch(`/api/admin/coupons/${editingCoupon._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        await fetchCoupons()
        setEditingCoupon(null)
        setFormData({ code: "", discountPercent: 0, isActive: true })
      } else {
        alert("Failed to update coupon")
      }
    } catch (error) {
      console.error("Failed to update coupon:", error)
      alert("Failed to update coupon")
    }
  }

  const handleToggleActive = async (coupon: Coupon & { _id: string }) => {
    try {
      const response = await fetch(`/api/admin/coupons/${coupon._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !coupon.isActive }),
      })

      if (response.ok) {
        await fetchCoupons()
      } else {
        alert("Failed to update coupon")
      }
    } catch (error) {
      console.error("Failed to update coupon:", error)
      alert("Failed to update coupon")
    }
  }

  if (loading || status === "loading") {
    return (
      <div className="container mx-auto py-8 px-4">
        <p>Loading...</p>
      </div>
    )
  }

  if (session?.user?.role !== "admin") {
    return null
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Coupon Management</h1>
          <p className="text-muted-foreground">Create and manage discount coupons</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Coupon
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Coupon</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Coupon Code</Label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g., WELCOME10"
                />
              </div>
              <div className="space-y-2">
                <Label>Discount Percent</Label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={formData.discountPercent}
                  onChange={(e) => setFormData({ ...formData, discountPercent: Number(e.target.value) })}
                  placeholder="e.g., 10"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Active</Label>
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
              </div>
              <Button onClick={handleAdd} className="w-full">
                Create Coupon
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {coupons.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">No coupons found. Create your first coupon!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {coupons.map((coupon) => (
            <Card key={coupon._id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{coupon.code}</CardTitle>
                  <Badge variant={coupon.isActive ? "default" : "secondary"}>
                    {coupon.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-2xl font-bold text-primary">{coupon.discountPercent}% OFF</p>
                    <p className="text-sm text-muted-foreground">
                      Created {new Date(coupon.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 bg-transparent"
                          onClick={() => handleEdit(coupon)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Coupon</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label>Coupon Code</Label>
                            <Input
                              value={formData.code}
                              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                              placeholder="e.g., WELCOME10"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Discount Percent</Label>
                            <Input
                              type="number"
                              min="1"
                              max="100"
                              value={formData.discountPercent}
                              onChange={(e) => setFormData({ ...formData, discountPercent: Number(e.target.value) })}
                              placeholder="e.g., 10"
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label>Active</Label>
                            <Switch
                              checked={formData.isActive}
                              onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                            />
                          </div>
                          <Button onClick={handleUpdate} className="w-full">
                            Save Changes
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button
                      size="sm"
                      variant={coupon.isActive ? "destructive" : "default"}
                      className="flex-1"
                      onClick={() => handleToggleActive(coupon)}
                    >
                      <Ban className="mr-2 h-4 w-4" />
                      {coupon.isActive ? "Disable" : "Enable"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
