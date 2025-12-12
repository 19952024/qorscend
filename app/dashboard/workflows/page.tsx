"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { WorkflowBuilder } from "@/components/workflows/workflow-builder"
import { WorkflowHistory } from "@/components/workflows/workflow-history"
import { WorkflowTemplates } from "@/components/workflows/workflow-templates"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Play, History, FileText, Zap } from "lucide-react"

export interface WorkflowStep {
  id: string
  type: 'convert' | 'benchmark' | 'clean'
  name: string
  description: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  config: any
  result?: any
  error?: string
}

export interface Workflow {
  id: string
  name: string
  description: string
  steps: WorkflowStep[]
  status: 'draft' | 'running' | 'completed' | 'failed'
  createdAt: Date
  completedAt?: Date
  userId: string
}

interface WorkflowStats {
  activeWorkflows: number
  completed: number
  successRate: string
  avgRuntime: string
}

export default function WorkflowsPage() {
  const [activeWorkflow, setActiveWorkflow] = useState<Workflow | null>(null)
  const [activeTab, setActiveTab] = useState("builder")
  const [stats, setStats] = useState<WorkflowStats>({
    activeWorkflows: 0,
    completed: 0,
    successRate: '0%',
    avgRuntime: '0m'
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [recentlySelectedTemplate, setRecentlySelectedTemplate] = useState(false)

  // Update stats when a new workflow is created
  const handleWorkflowUpdate = (workflow: Workflow | null) => {
    setActiveWorkflow(workflow)
    
    // Update stats if this is a new workflow
    if (workflow && workflow.status === 'draft') {
      setStats(prev => ({
        ...prev,
        activeWorkflows: prev.activeWorkflows + 1
      }))
    }
  }

  // Handle workflow selection from history
  const handleWorkflowSelect = (workflow: Workflow) => {
    setActiveWorkflow(workflow)
    setActiveTab("builder")
    toast.success(`Viewing workflow: ${workflow.name}`)
  }

  // Fetch workflow statistics
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/workflows/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('qorscend_token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setStats(data.data)
        }
      } else {
        console.error('Failed to fetch workflow stats:', response.statusText)
      }
    } catch (error) {
      console.error('Error fetching workflow stats:', error)
    }
  }

  useEffect(() => {
    fetchStats()
    setIsLoading(false)
  }, [])

  // Listen for workflow changes to refresh stats
  useEffect(() => {
    const handleWorkflowChange = () => {
      fetchStats()
    }

    window.addEventListener('workflow-created', handleWorkflowChange)
    window.addEventListener('workflow-updated', handleWorkflowChange)
    window.addEventListener('workflow-deleted', handleWorkflowChange)

    return () => {
      window.removeEventListener('workflow-created', handleWorkflowChange)
      window.removeEventListener('workflow-updated', handleWorkflowChange)
      window.removeEventListener('workflow-deleted', handleWorkflowChange)
    }
  }, [])

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">Workflows</h1>
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                Beta
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Create automated pipelines combining code conversion, benchmarking, and data analysis.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">Workflows</h1>
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              Beta
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Create automated pipelines combining code conversion, benchmarking, and data analysis.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Play className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-medium">Active Workflows</p>
                  <p className="text-2xl font-bold">{stats.activeWorkflows}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-accent" />
                <div>
                  <p className="text-sm font-medium">Completed</p>
                  <p className="text-2xl font-bold">{stats.completed}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-sm font-medium">Success Rate</p>
                  <p className="text-2xl font-bold">{stats.successRate}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-500" />
                <div>
                  <p className="text-sm font-medium">Avg Runtime</p>
                  <p className="text-2xl font-bold">{stats.avgRuntime}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="builder">Workflow Builder</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="builder" className="space-y-6">
            <WorkflowBuilder 
              activeWorkflow={activeWorkflow}
              onWorkflowUpdate={handleWorkflowUpdate}
              recentlySelectedTemplate={recentlySelectedTemplate}
            />
          </TabsContent>

          <TabsContent value="templates" className="space-y-6">
            <WorkflowTemplates 
              onTemplateSelect={handleWorkflowUpdate} 
              onTemplateSelected={() => {
                // Show a helpful message to guide user to the builder tab
                toast.success("Template loaded! Switch to the 'Workflow Builder' tab to customize and run your workflow.")
                setRecentlySelectedTemplate(true)
                // Reset the flag after 5 seconds
                setTimeout(() => setRecentlySelectedTemplate(false), 5000)
              }}
            />
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <WorkflowHistory onWorkflowSelect={handleWorkflowSelect} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
