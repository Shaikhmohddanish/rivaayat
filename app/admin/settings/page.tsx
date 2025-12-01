"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { DEFAULT_MAX_ONLINE_PAYMENT_AMOUNT, RAZORPAY_ORDER_AMOUNT_HARD_LIMIT } from "@/lib/payment-limits"

interface FormState {
  promoMessage: string
  promoEnabled: boolean
  announcementHeadline: string
  announcementHighlight: string
  announcementSubtext: string
  announcementBadge: string
  announcementShipping: string
  announcementEnabled: boolean
  contactPhone: string
  contactEmail: string
  freeShippingThreshold: number
  flatShippingFee: number
  maxOnlinePaymentAmount: number
  activePromoCouponCode: string
  whatsappHelper: string
  whatsappMessage: string
  whatsappNumber: string
  whatsappEnabled: boolean
}

const defaultFormState: FormState = {
  promoMessage: "",
  promoEnabled: true,
  announcementHeadline: "",
  announcementHighlight: "",
  announcementSubtext: "",
  announcementBadge: "",
  announcementShipping: "",
  announcementEnabled: true,
  contactPhone: "+918097787110",
  contactEmail: "sales@rivaayatposhak.co.in",
  freeShippingThreshold: 1499,
  flatShippingFee: 200,
  maxOnlinePaymentAmount: DEFAULT_MAX_ONLINE_PAYMENT_AMOUNT,
  activePromoCouponCode: "",
  whatsappHelper: "Need help styling your look?",
  whatsappMessage: "Hi Rivaayat team, I'd love to chat!",
  whatsappNumber: "918097787110",
  whatsappEnabled: true,
}

export default function SiteSettingsPage() {
  const [form, setForm] = useState<FormState>(defaultFormState)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [coupons, setCoupons] = useState<Array<{ _id: string; code: string; isActive: boolean }>>([])
  const { toast } = useToast()
  const formId = "site-settings-form"
  const razorpayCapDisplay = new Intl.NumberFormat("en-IN").format(RAZORPAY_ORDER_AMOUNT_HARD_LIMIT)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const [settingsResponse, couponsResponse] = await Promise.all([
          fetch("/api/admin/site-settings"),
          fetch("/api/admin/coupons")
        ])
        
        if (!settingsResponse.ok) {
          throw new Error("Failed to load settings")
        }
        
        const data = await settingsResponse.json()
        const couponsData = couponsResponse.ok ? await couponsResponse.json() : []
        
        setCoupons(couponsData.filter((c: any) => c.isActive))
        
        setForm({
          promoMessage: data?.promoBanner?.message ?? defaultFormState.promoMessage,
          promoEnabled: data?.promoBanner?.isEnabled ?? true,
          announcementHeadline: data?.announcementBar?.headline ?? "",
          announcementHighlight: data?.announcementBar?.highlight ?? "",
          announcementSubtext: data?.announcementBar?.subtext ?? "",
          announcementBadge: data?.announcementBar?.badgeText ?? "",
          announcementShipping: data?.announcementBar?.shippingText ?? "",
          announcementEnabled: data?.announcementBar?.isEnabled ?? true,
          contactPhone: data?.contactPhone ?? defaultFormState.contactPhone,
          contactEmail: data?.contactEmail ?? defaultFormState.contactEmail,
          freeShippingThreshold: data?.freeShippingThreshold ?? defaultFormState.freeShippingThreshold,
          flatShippingFee: data?.flatShippingFee ?? defaultFormState.flatShippingFee,
          maxOnlinePaymentAmount: data?.maxOnlinePaymentAmount ?? defaultFormState.maxOnlinePaymentAmount,
          activePromoCouponCode: data?.activePromoCouponCode ?? defaultFormState.activePromoCouponCode,
          whatsappHelper: data?.whatsapp?.helperText ?? defaultFormState.whatsappHelper,
          whatsappMessage: data?.whatsapp?.defaultMessage ?? defaultFormState.whatsappMessage,
          whatsappNumber: data?.whatsapp?.number ?? defaultFormState.whatsappNumber,
          whatsappEnabled: data?.whatsapp?.isEnabled ?? true,
        })
      } catch (error) {
        console.error(error)
        toast({
          title: "Unable to load",
          description: "We couldn't fetch the current site settings.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [toast])

  const handleInputChange = (field: keyof FormState) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = event.target.value
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleToggle = (field: keyof FormState) => (checked: boolean) => {
    setForm((prev) => ({ ...prev, [field]: checked }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)

    try {
      const payload = {
        contactPhone: form.contactPhone,
        contactEmail: form.contactEmail,
        freeShippingThreshold: form.freeShippingThreshold,
        flatShippingFee: form.flatShippingFee,
        maxOnlinePaymentAmount: form.maxOnlinePaymentAmount,
        activePromoCouponCode: form.activePromoCouponCode,
        promoBanner: {
          message: form.promoMessage,
          isEnabled: form.promoEnabled,
        },
        announcementBar: {
          headline: form.announcementHeadline,
          highlight: form.announcementHighlight,
          subtext: form.announcementSubtext,
          badgeText: form.announcementBadge,
          shippingText: form.announcementShipping,
          isEnabled: form.announcementEnabled,
        },
        whatsapp: {
          helperText: form.whatsappHelper,
          defaultMessage: form.whatsappMessage,
          number: form.whatsappNumber,
          isEnabled: form.whatsappEnabled,
        },
      }

      const response = await fetch("/api/admin/site-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error("Failed to save settings")
      }

      const updated = await response.json()
      setForm({
        promoMessage: updated?.promoBanner?.message ?? form.promoMessage,
        promoEnabled: updated?.promoBanner?.isEnabled ?? form.promoEnabled,
        announcementHeadline: updated?.announcementBar?.headline ?? form.announcementHeadline,
        announcementHighlight: updated?.announcementBar?.highlight ?? form.announcementHighlight,
        announcementSubtext: updated?.announcementBar?.subtext ?? form.announcementSubtext,
        announcementBadge: updated?.announcementBar?.badgeText ?? form.announcementBadge,
        announcementShipping: updated?.announcementBar?.shippingText ?? form.announcementShipping,
        announcementEnabled: updated?.announcementBar?.isEnabled ?? form.announcementEnabled,
        contactPhone: updated?.contactPhone ?? form.contactPhone,
        contactEmail: updated?.contactEmail ?? form.contactEmail,
        freeShippingThreshold: updated?.freeShippingThreshold ?? form.freeShippingThreshold,
        flatShippingFee: updated?.flatShippingFee ?? form.flatShippingFee,
        maxOnlinePaymentAmount: updated?.maxOnlinePaymentAmount ?? form.maxOnlinePaymentAmount,
        activePromoCouponCode: updated?.activePromoCouponCode ?? form.activePromoCouponCode,
        whatsappHelper: updated?.whatsapp?.helperText ?? form.whatsappHelper,
        whatsappMessage: updated?.whatsapp?.defaultMessage ?? form.whatsappMessage,
        whatsappNumber: updated?.whatsapp?.number ?? form.whatsappNumber,
        whatsappEnabled: updated?.whatsapp?.isEnabled ?? form.whatsappEnabled,
      })

      toast({
        title: "Settings saved",
        description: "Your storefront announcements have been updated.",
      })
    } catch (error) {
      console.error(error)
      toast({
        title: "Save failed",
        description: "Please try again in a moment.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-1">Site Settings</h1>
          <p className="text-muted-foreground">Control announcement bars, support contact, and WhatsApp CTA.</p>
        </div>
        <Button type="submit" form={formId} disabled={saving || loading}>
          {saving ? "Saving..." : "Save changes"}
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-6">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="h-48 rounded-xl border shimmer" />
          ))}
        </div>
      ) : (
        <form className="grid gap-6" onSubmit={handleSubmit} id={formId}>
          <Card>
            <CardHeader>
              <CardTitle>Promo Banner</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="font-medium">Show banner</Label>
                <Switch checked={form.promoEnabled} onCheckedChange={handleToggle("promoEnabled")} />
              </div>
              <div className="space-y-2">
                <Label>Banner message</Label>
                <Textarea
                  value={form.promoMessage}
                  onChange={handleInputChange("promoMessage")}
                  placeholder="✨ Free shipping on orders over ₹1500 | Use code: WELCOME10 ✨"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Announcement Bar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="font-medium">Show announcement bar</Label>
                <Switch checked={form.announcementEnabled} onCheckedChange={handleToggle("announcementEnabled")} />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Headline</Label>
                  <Input value={form.announcementHeadline} onChange={handleInputChange("announcementHeadline")} placeholder="Festive Offer:" />
                </div>
                <div className="space-y-2">
                  <Label>Highlight</Label>
                  <Input value={form.announcementHighlight} onChange={handleInputChange("announcementHighlight")} placeholder="Flat 10% off" />
                </div>
                <div className="space-y-2">
                  <Label>Subtext</Label>
                  <Input value={form.announcementSubtext} onChange={handleInputChange("announcementSubtext")} placeholder="with code" />
                </div>
                <div className="space-y-2">
                  <Label>Badge / Code</Label>
                  <Select 
                    value={form.announcementBadge || "none"} 
                    onValueChange={(value) => setForm(prev => ({ ...prev, announcementBadge: value === "none" ? "" : value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a coupon code" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {coupons.map((coupon) => (
                        <SelectItem key={coupon._id} value={coupon.code}>
                          {coupon.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Select from active coupons only</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Shipping / helper text</Label>
                <Input value={form.announcementShipping} onChange={handleInputChange("announcementShipping")} placeholder="Free shipping over ₹1499" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Support phone (displayed with tel link)</Label>
                  <Input value={form.contactPhone} onChange={handleInputChange("contactPhone")} placeholder="+918097787110" />
                </div>
                <div className="space-y-2">
                  <Label>Contact email</Label>
                  <Input value={form.contactEmail} onChange={handleInputChange("contactEmail")} placeholder="sales@rivaayatposhak.co.in" type="email" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Shipping & Promotions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Free shipping threshold (₹)</Label>
                <Input 
                  type="number" 
                  value={form.freeShippingThreshold} 
                  onChange={(e) => setForm(prev => ({ ...prev, freeShippingThreshold: Number(e.target.value) }))} 
                  placeholder="1499" 
                />
                <p className="text-xs text-muted-foreground">Minimum order value for free shipping</p>
              </div>
              <div className="space-y-2">
                <Label>Flat shipping fee (₹)</Label>
                <Input
                  type="number"
                  value={form.flatShippingFee}
                  onChange={(e) => setForm((prev) => ({ ...prev, flatShippingFee: Number(e.target.value) }))}
                  placeholder="200"
                />
                <p className="text-xs text-muted-foreground">Fee applied when order is below the free-shipping threshold</p>
              </div>
              <div className="space-y-2">
                <Label>Max online payment amount (₹)</Label>
                <Input
                  type="number"
                  value={form.maxOnlinePaymentAmount}
                  onChange={(e) => {
                    const entered = Number(e.target.value)
                    const safeValue = Number.isFinite(entered) ? entered : 0
                    const clamped = Math.min(Math.max(safeValue, 0), RAZORPAY_ORDER_AMOUNT_HARD_LIMIT)
                    setForm((prev) => ({ ...prev, maxOnlinePaymentAmount: clamped }))
                  }}
                  placeholder={DEFAULT_MAX_ONLINE_PAYMENT_AMOUNT.toString()}
                />
                <p className="text-xs text-muted-foreground">
                  Orders above this amount require offline handling. Razorpay caps a single online payment at ₹{razorpayCapDisplay}.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Active promo coupon code</Label>
                <Select 
                  value={form.activePromoCouponCode || "none"} 
                  onValueChange={(value) => setForm(prev => ({ ...prev, activePromoCouponCode: value === "none" ? "" : value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an active coupon" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {coupons.map((coupon) => (
                      <SelectItem key={coupon._id} value={coupon.code}>
                        {coupon.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Select from active coupons only. Use this in announcement bar badge.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>WhatsApp Integration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <Label className="font-medium">Enable floating WhatsApp button</Label>
                <Switch checked={form.whatsappEnabled} onCheckedChange={handleToggle("whatsappEnabled")} />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>WhatsApp number (digits only)</Label>
                  <Input value={form.whatsappNumber} onChange={handleInputChange("whatsappNumber")} placeholder="918097787110" />
                </div>
                <div className="space-y-2">
                  <Label>Helper text</Label>
                  <Input value={form.whatsappHelper} onChange={handleInputChange("whatsappHelper")} placeholder="Need help styling your look?" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Prefilled WhatsApp message</Label>
                <Textarea
                  value={form.whatsappMessage}
                  onChange={handleInputChange("whatsappMessage")}
                  rows={3}
                  placeholder="Hi Rivaayat team, I'd love to chat!"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={saving} form={formId}>
              {saving ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
