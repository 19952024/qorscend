"use client"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { ProviderOverview } from "@/components/qbenchmark-live/provider-overview"
import { PerformanceCharts } from "@/components/qbenchmark-live/performance-charts"
import { ProviderComparison } from "@/components/qbenchmark-live/provider-comparison"
import { LiveMetrics } from "@/components/qbenchmark-live/live-metrics"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function QBenchmarkLivePage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">QBenchmark Live™</h1>
          <p className="text-muted-foreground">
            Real-time quantum provider performance metrics, costs, and availability comparison.
          </p>
        </div>

        {/* Live Metrics Overview */}
        <LiveMetrics />

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Provider Overview</TabsTrigger>
            <TabsTrigger value="comparison">Compare Providers</TabsTrigger>
            <TabsTrigger value="analytics">Performance Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <ProviderOverview />
          </TabsContent>

          <TabsContent value="comparison" className="space-y-6">
            <ProviderComparison />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <PerformanceCharts />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
