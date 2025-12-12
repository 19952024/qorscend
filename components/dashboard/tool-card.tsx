import type React from "react"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Check } from "lucide-react"

interface ToolCardProps {
  title: string
  description: string
  icon: React.ReactNode
  features: string[]
  href: string
  status: string
  statusColor: string
}

export function ToolCard({ title, description, icon, features, href, status, statusColor }: ToolCardProps) {
  return (
    <Card className="group hover:shadow-lg transition-all duration-200 hover:border-primary/20">
      <CardHeader className="space-y-3">
        <div className="flex items-center gap-3 min-h-[3rem]">
          <div className="p-2 rounded-full bg-primary/10 text-primary flex-shrink-0 flex items-center justify-center">{icon}</div>
          <CardTitle className="text-lg whitespace-nowrap flex-shrink-0">{title}</CardTitle>
          <Badge className="bg-primary text-primary-foreground border-0 flex-shrink-0 whitespace-nowrap">
            {status}
          </Badge>
        </div>
        <CardDescription className="text-sm">{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="text-muted-foreground">{feature}</span>
            </li>
          ))}
        </ul>
        <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-md">
          <Link href={href} className="flex items-center justify-center gap-2">
            Launch Tool
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
