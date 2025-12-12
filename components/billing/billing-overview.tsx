"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { 
  Crown, 
  Zap, 
  Database, 
  BarChart3, 
  Calendar,
  CreditCard,
  Download,
  AlertCircle
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

interface SubscriptionData {
  tier: string
  status: string
  currentPeriodEnd: string
  nextBillingDate: string
  amount: number
  currency: string
  usage: {
    codeConversions: { used: number; limit: number }
    benchmarks: { used: number; limit: number }
    dataFiles: { used: number; limit: number }
    storage: { used: number; limit: number }
    workflows?: { used: number; limit: number }
  }
}

export function BillingOverview() {
  const router = useRouter()
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Fetch billing data from backend
  const fetchBillingData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch('/api/billing/overview', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('qorscend_token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          // Transform API response to match component interface
          const subscriptionData: SubscriptionData = {
            tier: data.data.subscription?.tier || 'free',
            status: data.data.subscription?.status || 'active',
            currentPeriodEnd: data.data.subscription?.currentPeriodEnd || new Date().toISOString(),
            nextBillingDate: data.data.subscription?.nextBillingDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            amount: data.data.subscription?.amount || 0,
            currency: data.data.subscription?.currency || 'USD',
            usage: data.data.usage || {
              codeConversions: { used: 0, limit: 10 },
              benchmarks: { used: 0, limit: 5 },
              dataFiles: { used: 0, limit: 5 },
              storage: { used: 0, limit: 100 },
              workflows: { used: 0, limit: 3 }
            }
          }
          setSubscription(subscriptionData)
        } else {
          throw new Error(data.error || 'Invalid response from server')
        }
      } else {
        let errorMessage = 'Failed to fetch billing data'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorData.message || errorMessage
        } catch {}
        setError(errorMessage)
        console.error('Failed to fetch billing data:', response.statusText)
        toast({
          title: "Failed to Load Billing Data",
          description: errorMessage,
          variant: "destructive",
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error fetching billing data'
      setError(errorMessage)
      console.error('Error fetching billing data:', error)
      toast({
        title: "Error Loading Billing Data",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleChangePlan = async () => {
    if (!subscription) return
    
    try {
      setIsLoading(true)
      setError(null)
      const plan = subscription.tier === 'pro' ? 'enterprise' : 'pro'
      const res = await fetch('/api/billing/subscription/change', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('qorscend_token')}`
        },
        body: JSON.stringify({ planId: plan.toLowerCase() })
      })
      
      if (!res.ok) {
        let errorMessage = 'Failed to change plan'
        try {
          const errorData = await res.json()
          errorMessage = errorData.error || errorData.message || errorMessage
        } catch {
          errorMessage = res.statusText || errorMessage
        }
        throw new Error(errorMessage)
      }
      
      toast({
        title: "Plan Changed Successfully",
        description: `Your subscription has been changed to ${plan} plan.`,
      })
      
      await fetchBillingData()
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to change plan'
      setError(errorMessage)
      console.error(e)
      toast({
        title: "Plan Change Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelSubscription = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const res = await fetch('/api/billing/subscription/cancel', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('qorscend_token')}`
        }
      })
      
      if (!res.ok) {
        let errorMessage = 'Failed to cancel subscription'
        try {
          const errorData = await res.json()
          errorMessage = errorData.error || errorData.message || errorMessage
        } catch {
          errorMessage = res.statusText || errorMessage
        }
        throw new Error(errorMessage)
      }
      
      toast({
        title: "Subscription Cancelled",
        description: "Your subscription has been cancelled successfully.",
      })
      
      await fetchBillingData()
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to cancel subscription'
      setError(errorMessage)
      console.error(e)
      toast({
        title: "Cancellation Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchBillingData()
  }, [])

  const getUsagePercentage = (used: number, limit: number) => {
    return Math.round((used / limit) * 100)
  }

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return "text-red-500"
    if (percentage >= 75) return "text-yellow-500"
    return "text-green-500"
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "past_due":
        return "bg-red-100 text-red-800"
      case "canceled":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatStatus = (status?: string) => {
    if (!status || typeof status !== "string") return "Unknown"
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  // Show loading state
  if (isLoading && !subscription) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center justify-center">
              <div className="text-muted-foreground">Loading billing information...</div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show error state
  if (error && !subscription) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-8">
            <div className="flex flex-col items-center justify-center gap-4">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <div className="text-center">
                <p className="font-medium text-red-600">Failed to load billing data</p>
                <p className="text-sm text-muted-foreground mt-2">{error}</p>
              </div>
              <Button onClick={fetchBillingData} variant="outline">Retry</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show default state if subscription is still null
  if (!subscription) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center justify-center">
              <div className="text-muted-foreground">No subscription data available</div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-yellow-500" />
                {subscription.tier.charAt(0).toUpperCase() + subscription.tier.slice(1)} Plan
              </CardTitle>
              <CardDescription>
                Your current subscription plan and billing information
              </CardDescription>
            </div>
            <Badge className={getStatusColor(subscription.status)}>
              {formatStatus(subscription.status)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <CreditCard className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Billing Amount</p>
                <p className="text-lg font-bold">
                  ${subscription.amount}/{subscription.currency === "USD" ? "month" : "mo"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Next Billing</p>
                <p className="text-lg font-bold">
                  {new Date(subscription.nextBillingDate).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Download className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Auto-Renewal</p>
                <p className="text-lg font-bold text-green-600">Enabled</p>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleChangePlan} disabled={isLoading || !subscription}>Change Plan</Button>
            <Button variant="outline" onClick={handleCancelSubscription} disabled={isLoading || !subscription}>Cancel Subscription</Button>
          </div>
        </CardContent>
      </Card>

      {/* Usage Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Usage This Month</CardTitle>
          <CardDescription>
            Track your usage across different features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Code Conversions */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-blue-500" />
                <span className="font-medium">Code Conversions</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {subscription.usage.codeConversions.used} / {subscription.usage.codeConversions.limit === Infinity ? '∞' : subscription.usage.codeConversions.limit}
              </span>
            </div>
            <Progress 
              value={getUsagePercentage(
                subscription.usage.codeConversions.used, 
                subscription.usage.codeConversions.limit === Infinity ? subscription.usage.codeConversions.used : subscription.usage.codeConversions.limit
              )} 
              className="h-2"
            />
            <p className={`text-xs ${getUsageColor(getUsagePercentage(
              subscription.usage.codeConversions.used, 
              subscription.usage.codeConversions.limit === Infinity ? 0 : subscription.usage.codeConversions.limit
            ))}`}>
              {subscription.usage.codeConversions.limit === Infinity ? 'Unlimited' : `${getUsagePercentage(
                subscription.usage.codeConversions.used, 
                subscription.usage.codeConversions.limit
              )}% used`}
            </p>
          </div>

          {/* Benchmarks */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-green-500" />
                <span className="font-medium">Benchmarks</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {subscription.usage.benchmarks.used} / {subscription.usage.benchmarks.limit === Infinity ? '∞' : subscription.usage.benchmarks.limit}
              </span>
            </div>
            <Progress 
              value={getUsagePercentage(
                subscription.usage.benchmarks.used, 
                subscription.usage.benchmarks.limit === Infinity ? subscription.usage.benchmarks.used : subscription.usage.benchmarks.limit
              )} 
              className="h-2"
            />
            <p className={`text-xs ${getUsageColor(getUsagePercentage(
              subscription.usage.benchmarks.used, 
              subscription.usage.benchmarks.limit === Infinity ? 0 : subscription.usage.benchmarks.limit
            ))}`}>
              {subscription.usage.benchmarks.limit === Infinity ? 'Unlimited' : `${getUsagePercentage(
                subscription.usage.benchmarks.used, 
                subscription.usage.benchmarks.limit
              )}% used`}
            </p>
          </div>

          {/* Data Files */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-purple-500" />
                <span className="font-medium">Data Files</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {subscription.usage.dataFiles.used} / {subscription.usage.dataFiles.limit === Infinity ? '∞' : subscription.usage.dataFiles.limit}
              </span>
            </div>
            <Progress 
              value={getUsagePercentage(
                subscription.usage.dataFiles.used, 
                subscription.usage.dataFiles.limit === Infinity ? subscription.usage.dataFiles.used : subscription.usage.dataFiles.limit
              )} 
              className="h-2"
            />
            <p className={`text-xs ${getUsageColor(getUsagePercentage(
              subscription.usage.dataFiles.used, 
              subscription.usage.dataFiles.limit === Infinity ? 0 : subscription.usage.dataFiles.limit
            ))}`}>
              {subscription.usage.dataFiles.limit === Infinity ? 'Unlimited' : `${getUsagePercentage(
                subscription.usage.dataFiles.used, 
                subscription.usage.dataFiles.limit
              )}% used`}
            </p>
          </div>

          {/* Storage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Download className="h-4 w-4 text-orange-500" />
                <span className="font-medium">Storage</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {subscription.usage.storage.used >= 1000 
                  ? `${(subscription.usage.storage.used / 1000).toFixed(2)} GB` 
                  : `${subscription.usage.storage.used.toFixed(2)} MB`} / {
                  subscription.usage.storage.limit === Infinity 
                    ? '∞' 
                    : subscription.usage.storage.limit >= 1000
                      ? `${(subscription.usage.storage.limit / 1000).toFixed(0)} GB`
                      : `${subscription.usage.storage.limit} MB`
                }
              </span>
            </div>
            <Progress 
              value={getUsagePercentage(
                subscription.usage.storage.used, 
                subscription.usage.storage.limit === Infinity ? subscription.usage.storage.used : subscription.usage.storage.limit
              )} 
              className="h-2"
            />
            <p className={`text-xs ${getUsageColor(getUsagePercentage(
              subscription.usage.storage.used, 
              subscription.usage.storage.limit === Infinity ? 0 : subscription.usage.storage.limit
            ))}`}>
              {subscription.usage.storage.limit === Infinity ? 'Unlimited' : `${getUsagePercentage(
                subscription.usage.storage.used, 
                subscription.usage.storage.limit
              )}% used`}
            </p>
          </div>

          {/* Workflows */}
          {subscription.usage.workflows && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-purple-500" />
                  <span className="font-medium">Workflows</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {subscription.usage.workflows.used} / {subscription.usage.workflows.limit === Infinity ? '∞' : subscription.usage.workflows.limit}
                </span>
              </div>
              <Progress 
                value={getUsagePercentage(
                  subscription.usage.workflows.used, 
                  subscription.usage.workflows.limit === Infinity ? subscription.usage.workflows.used : subscription.usage.workflows.limit
                )} 
                className="h-2"
              />
              <p className={`text-xs ${getUsageColor(getUsagePercentage(
                subscription.usage.workflows.used, 
                subscription.usage.workflows.limit === Infinity ? 0 : subscription.usage.workflows.limit
              ))}`}>
                {subscription.usage.workflows.limit === Infinity ? 'Unlimited' : `${getUsagePercentage(
                  subscription.usage.workflows.used, 
                  subscription.usage.workflows.limit
                )}% used`}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Need More?</CardTitle>
            <CardDescription>
              Upgrade your plan for higher limits and more features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => router.push('/dashboard/billing?tab=plans')}>Upgrade Plan</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Billing Support</CardTitle>
            <CardDescription>
              Get help with billing questions or issues
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" onClick={() => window.location.href = 'mailto:support@qorscend.com?subject=Billing%20support'}>Contact Support</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
