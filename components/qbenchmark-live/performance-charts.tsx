"use client"

import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Line, LineChart, Bar, BarChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { Loader2, AlertCircle } from "lucide-react"
import { useProviderData } from "@/hooks/use-provider-data"

interface ChartData {
  queueTimeData: any[]
  costComparisonData: any[]
  errorRateData: any[]
}

export function PerformanceCharts() {
  const { data, loading, error, refetch } = useProviderData()

  // Process data for charts using useMemo to avoid recalculation
  const chartData: ChartData = useMemo(() => {
    if (!data?.providers) {
      return {
        queueTimeData: [],
        costComparisonData: [],
        errorRateData: []
      }
    }

    const providers = data.providers
    
    // Generate cost comparison data
    const costComparisonData = providers.map((provider: any) => {
      const avgCost = provider.backends.reduce((sum: number, backend: any) => 
        sum + backend.costPerShot, 0) / provider.backends.length
      return {
        provider: provider.name,
        cost: Math.round(avgCost * 1000) / 1000 // Round to 3 decimal places
      }
    })

    // Generate error rate data
    const errorRateData = providers.map((provider: any) => {
      const avgErrorRate = provider.backends.reduce((sum: number, backend: any) => 
        sum + backend.errorRate, 0) / provider.backends.length
      return {
        provider: provider.name,
        errorRate: Math.round(avgErrorRate * 1000) / 10 // Convert to percentage with 1 decimal
      }
    })

    // Generate queue time data
    const queueTimeData = providers.map((provider: any) => {
      const avgQueueTime = provider.backends.reduce((sum: number, backend: any) => 
        sum + backend.queueTime, 0) / provider.backends.length
      return {
        provider: provider.name,
        queueTime: Math.round(avgQueueTime)
      }
    })

    return {
      queueTimeData,
      costComparisonData,
      errorRateData
    }
  }, [data])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading performance charts...</span>
        </div>
      </div>
    )
  }

  if (error && chartData.costComparisonData.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-2">
          <AlertCircle className="h-8 w-8 mx-auto text-destructive" />
          <p className="text-destructive">Error loading charts: {error}</p>
          <Button onClick={refetch} variant="outline">
            Retry
          </Button>
        </div>
      </div>
    )
  }

  // Show warning if using cached data
  const showCachedWarning = error && error.includes('cached data')

  if (chartData.costComparisonData.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-2">
          <p className="text-muted-foreground">No chart data available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {showCachedWarning && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-500" />
            <p className="text-sm text-yellow-600">
              {error} - Data may be outdated. <Button onClick={refetch} variant="link" className="p-0 h-auto text-yellow-600 underline">Try refreshing</Button>
            </p>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Queue Time Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Queue Time Comparison</CardTitle>
            <CardDescription>Average queue times across providers</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                queueTime: {
                  label: "Queue Time (seconds)",
                  color: "hsl(var(--chart-1))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.queueTimeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="provider" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="queueTime" fill="var(--color-queueTime)" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Cost Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Cost Comparison</CardTitle>
            <CardDescription>Average cost per shot across providers</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                cost: {
                  label: "Cost per Shot ($)",
                  color: "hsl(var(--chart-2))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.costComparisonData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="provider" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="cost" fill="var(--color-cost)" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Error Rate Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Error Rate Comparison</CardTitle>
          <CardDescription>Average error rates across providers</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              errorRate: {
                label: "Error Rate (%)",
                color: "hsl(var(--chart-3))",
              },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.errorRateData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="provider" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="errorRate" fill="var(--color-errorRate)" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
