"use client"

import { useState, useEffect, Suspense } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { BillingOverview } from "@/components/billing/billing-overview"
import { SubscriptionPlans } from "@/components/billing/subscription-plans"
import { PaymentMethods } from "@/components/billing/payment-methods"
import { BillingHistory } from "@/components/billing/billing-history"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CreditCard, DollarSign, Receipt, Settings } from "lucide-react"
import { useSearchParams, useRouter } from "next/navigation"

function BillingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialTab = searchParams.get('tab') || 'overview'
  const [tab, setTab] = useState<string>(initialTab)

  // Keep internal tab state in sync with the URL (e.g., when navigating programmatically)
  useEffect(() => {
    const current = searchParams.get('tab') || 'overview'
    if (current !== tab) setTab(current)
  }, [searchParams, tab])

  const handleTabChange = (value: string) => {
    setTab(value)
    const query = value === 'overview' ? '' : `?tab=${value}`
    router.replace(`/dashboard/billing${query}`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Billing & Subscription</h1>
        <p className="text-muted-foreground">
          Manage your subscription, payment methods, and billing history.
        </p>
      </div>

      {/* Main Content */}
      <Tabs value={tab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="payment">Payment Methods</TabsTrigger>
          <TabsTrigger value="history">Billing History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <BillingOverview />
        </TabsContent>

        <TabsContent value="plans" className="space-y-6">
          <SubscriptionPlans />
        </TabsContent>

        <TabsContent value="payment" className="space-y-6">
          <PaymentMethods />
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <BillingHistory />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default function BillingPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Billing & Subscription</h1>
            <p className="text-muted-foreground">
              Manage your subscription, payment methods, and billing history.
            </p>
          </div>
          <div className="flex items-center justify-center h-32">
            <div className="text-muted-foreground">Loading billing information...</div>
          </div>
        </div>
      }>
        <BillingContent />
      </Suspense>
    </DashboardLayout>
  )
}
