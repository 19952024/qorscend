"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Crown, Star, Zap } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Plan {
  id: string
  name: string
  description: string
  price: number
  currency: string
  interval: string
  features: string[]
  limits: {
    codeConversions: number
    benchmarks: number
    dataFiles: number
    storage: number // GB
    workflows: number
    support: string
  }
  popular?: boolean
  current?: boolean
}

export function SubscriptionPlans() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [selectedPlan, setSelectedPlan] = useState<string>("pro")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Fetch plans from backend and mark current plan based on overview
  const fetchPlans = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const [plansRes, overviewRes] = await Promise.all([
        fetch('/api/billing/plans', { cache: 'no-store' }),
        fetch('/api/billing/overview', { headers: { 'Authorization': `Bearer ${localStorage.getItem('qorscend_token')}` }, cache: 'no-store' })
      ])

      if (!plansRes.ok) {
        let errorMessage = 'Failed to fetch plans'
        try {
          const errorData = await plansRes.json()
          errorMessage = errorData.error || errorData.message || errorMessage
        } catch {}
        throw new Error(errorMessage)
      }
      const plansJson = await plansRes.json()
      const currentTier = overviewRes.ok ? (await overviewRes.json()).data?.subscription?.tier : undefined

      if (plansJson.success) {
        const transformedPlans = plansJson.data.map((plan: any) => ({
          ...plan,
          limits: {
            codeConversions: plan.limits.codeConversions,
            benchmarks: plan.limits.benchmarks,
            dataFiles: plan.limits.dataFiles,
            storage: plan.limits.storage,
            workflows: plan.limits.workflows,
            support: plan.id === 'free' ? 'Community' : plan.id === 'pro' ? 'Priority' : 'Dedicated'
          },
          popular: plan.id === 'pro',
          current: plan.id === (currentTier || 'free')
        }))
        setPlans(transformedPlans)
        if (currentTier) setSelectedPlan(currentTier)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error fetching plans'
      setError(errorMessage)
      console.error('Error fetching plans:', error)
      toast({
        title: "Failed to Load Plans",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPlans()
  }, [])

  const handlePlanChange = async (planId: string) => {
    try {
      setIsLoading(true)
      setError(null)
      const isFree = planId === 'free'
      const endpoint = isFree ? '/api/billing/subscription/change' : '/api/billing/subscription/upgrade'
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('qorscend_token')}`
        },
        body: JSON.stringify({ planId })
      })
      
      if (!res.ok) {
        // Extract exact error message from response
        let errorMessage = `Failed to ${isFree ? 'change' : 'upgrade'} plan`
        try {
          const errorData = await res.json()
          errorMessage = errorData.error || errorData.message || errorMessage
        } catch {
          // If response is not JSON, use status text
          errorMessage = res.statusText || errorMessage
        }
        throw new Error(errorMessage)
      }

      const responseData = await res.json()
      
      // Show success notification
      toast({
        title: "Subscription Updated",
        description: `Successfully ${isFree ? 'changed' : 'upgraded'} to ${planId} plan.`,
      })

      // Optimistically update UI to mark the chosen plan as current
      setPlans(prev => prev.map(p => ({ ...p, current: p.id === planId })))
      setSelectedPlan(planId)

      // Refresh from server (no-store) to ensure DB source of truth
      await fetchPlans()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `Failed to ${planId === 'free' ? 'change' : 'upgrade'} plan`
      setError(errorMessage)
      console.error('Failed to change plan:', error)
      toast({
        title: "Subscription Change Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Choose Your Plan</h2>
        <p className="text-muted-foreground">
          Select the plan that best fits your quantum computing needs
        </p>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card 
            key={plan.id} 
            className={`relative ${
              plan.popular ? 'ring-2 ring-primary' : ''
            } ${plan.current ? 'border-primary' : ''}`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground">
                  <Star className="h-3 w-3 mr-1" />
                  Most Popular
                </Badge>
              </div>
            )}
            
            {plan.current && (
              <div className="absolute -top-3 right-4">
                <Badge variant="secondary">
                  <Check className="h-3 w-3 mr-1" />
                  Current
                </Badge>
              </div>
            )}

            <CardHeader className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                {plan.id === "enterprise" && <Crown className="h-5 w-5 text-yellow-500" />}
                {plan.id === "pro" && <Zap className="h-5 w-5 text-blue-500" />}
                <CardTitle className="text-xl">{plan.name}</CardTitle>
              </div>
              <CardDescription>{plan.description}</CardDescription>
              <div className="mt-4">
                <span className="text-3xl font-bold">
                  ${plan.price}
                </span>
                <span className="text-muted-foreground">/{plan.interval}</span>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Limits Summary */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Code Conversions:</span>
                  <span className="font-medium">
                    {plan.limits.codeConversions === -1 ? 'Unlimited' : plan.limits.codeConversions}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Benchmarks:</span>
                  <span className="font-medium">
                    {plan.limits.benchmarks === -1 ? 'Unlimited' : plan.limits.benchmarks}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Data Files:</span>
                  <span className="font-medium">
                    {plan.limits.dataFiles === -1 ? 'Unlimited' : plan.limits.dataFiles}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Storage:</span>
                  <span className="font-medium">
                    {plan.limits.storage >= 1000 
                      ? `${(plan.limits.storage / 1000).toFixed(0)} GB` 
                      : `${plan.limits.storage} MB`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Workflows:</span>
                  <span className="font-medium">
                    {plan.limits.workflows === -1 ? 'Unlimited' : plan.limits.workflows}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Support:</span>
                  <span className="font-medium">{plan.limits.support}</span>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-2">
                <h4 className="font-medium">Features:</h4>
                <ul className="space-y-1">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button */}
              <Button 
                className="w-full mt-6"
                variant={plan.current ? "outline" : "default"}
                disabled={plan.current || isLoading}
                onClick={() => handlePlanChange(plan.id)}
              >
                {isLoading ? (
                  "Processing..."
                ) : plan.current ? (
                  "Current Plan"
                ) : plan.price === 0 ? (
                  "Downgrade to Free"
                ) : (
                  `Upgrade to ${plan.name}`
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* FAQ Section */}
      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">Can I change my plan anytime?</h4>
            <p className="text-sm text-muted-foreground">
              Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium">What happens if I exceed my limits?</h4>
            <p className="text-sm text-muted-foreground">
              You'll receive a notification when you're close to your limits. You can upgrade your plan to continue using the service.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium">Is there a free trial?</h4>
            <p className="text-sm text-muted-foreground">
              Yes, all paid plans come with a 14-day free trial. No credit card required to start.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium">Can I cancel anytime?</h4>
            <p className="text-sm text-muted-foreground">
              Absolutely. You can cancel your subscription at any time and continue using the service until the end of your billing period.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
