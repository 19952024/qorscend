"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Code2, BarChart3, Database, Zap } from "lucide-react"
import Link from "next/link"

const workflows = [
  {
    id: 1,
    title: "Code → Benchmark → Analyze",
    description: "Convert quantum code, benchmark performance, then analyze results",
    steps: [
      { tool: "QCode Convert", icon: Code2, href: "/dashboard/qcode-convert" },
      { tool: "QBenchmark Live", icon: BarChart3, href: "/dashboard/qbenchmark-live" },
      { tool: "QData Clean", icon: Database, href: "/dashboard/qdata-clean" },
    ],
    difficulty: "Beginner",
    time: "15 min",
  },
  {
    id: 2,
    title: "Multi-Library Comparison",
    description: "Compare the same algorithm across different quantum libraries",
    steps: [
      { tool: "QCode Convert", icon: Code2, href: "/dashboard/qcode-convert" },
      { tool: "QBenchmark Live", icon: BarChart3, href: "/dashboard/qbenchmark-live" },
    ],
    difficulty: "Intermediate",
    time: "10 min",
  },
  {
    id: 3,
    title: "Data Analysis Pipeline",
    description: "Process experimental data and create comprehensive visualizations",
    steps: [{ tool: "QData Clean", icon: Database, href: "/dashboard/qdata-clean" }],
    difficulty: "Beginner",
    time: "5 min",
  },
]

export function WorkflowSuggestions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          Suggested Workflows
        </CardTitle>
        <CardDescription>Common workflows to get the most out of QORSCEND tools</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {workflows.map((workflow) => (
            <div key={workflow.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium">{workflow.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{workflow.description}</p>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline">{workflow.difficulty}</Badge>
                  <Badge variant="secondary">{workflow.time}</Badge>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {workflow.steps.map((step, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Link href={step.href}>
                      <Button variant="outline" size="sm" className="h-8 border-border text-foreground hover:bg-primary/10 hover:text-primary hover:border-primary cursor-pointer transition-colors">
                        <step.icon className="h-3 w-3 mr-1" />
                        {step.tool}
                      </Button>
                    </Link>
                    {index < workflow.steps.length - 1 && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
