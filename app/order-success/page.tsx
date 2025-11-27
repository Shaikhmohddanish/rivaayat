"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle } from "lucide-react"
import { Suspense } from "react"

function OrderSuccessContent() {
  const searchParams = useSearchParams()
  const trackingNumber = searchParams.get("trackingNumber")

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-2xl">Order Placed Successfully!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-center">
            <p className="text-muted-foreground">
              Thank you for your order. We'll send you a confirmation email shortly.
            </p>

            {trackingNumber && (
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm font-semibold mb-1">Your Tracking Number</p>
                <p className="text-lg font-mono">{trackingNumber}</p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild>
                <Link href="/order-tracking">Track Order</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/shop">Continue Shopping</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function OrderSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto">
            <div className="bg-card/50 rounded-2xl p-8 elegant-shadow border-0 space-y-6 animate-pulse">
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 rounded-full bg-muted"></div>
              </div>
              <div className="h-8 bg-muted rounded-lg w-3/4 mx-auto"></div>
              <div className="h-5 bg-muted rounded w-full"></div>
              <div className="h-5 bg-muted rounded w-2/3 mx-auto"></div>
              <div className="flex gap-3 justify-center mt-6">
                <div className="h-10 w-32 bg-muted rounded-lg"></div>
                <div className="h-10 w-32 bg-muted rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <OrderSuccessContent />
    </Suspense>
  )
}
