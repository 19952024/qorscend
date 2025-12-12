import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface StatsCardProps {
  title: string
  value: string
  change: string
  icon: React.ReactNode
  description: string
}

export function StatsCard({ title, value, change, icon, description }: StatsCardProps) {
  const isPositive = change.startsWith("+")

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">
          <span className={isPositive ? "text-accent" : "text-destructive"}>{change}</span> from {description}
        </p>
      </CardContent>
    </Card>
  )
}
