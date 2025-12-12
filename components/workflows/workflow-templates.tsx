"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { 
  Code2, 
  BarChart3, 
  Database, 
  Zap, 
  Star,
  Clock,
  Users,
  ArrowRight
} from "lucide-react"
import type { Workflow } from "@/app/dashboard/workflows/page"

interface WorkflowTemplatesProps {
  onTemplateSelect: (workflow: Workflow) => void
  onTemplateSelected?: () => void
}

interface WorkflowTemplate {
  _id: string
  name: string
  description: string
  icon: string
  color: string
  difficulty: string
  estimatedTime: string
  popularity: number
  usageCount: number
  steps: Array<{
    id: string
    type: 'convert' | 'benchmark' | 'clean'
    name: string
    description: string
    config: any
  }>
  metadata: {
    lastUsed: string
    averageRating: number
    totalRatings: number
  }
}

// Icon mapping
const iconMap = {
  'Code2': Code2,
  'BarChart3': BarChart3,
  'Database': Database,
  'Zap': Zap,
  'Star': Star,
  'Clock': Clock,
  'Users': Users
}

export function WorkflowTemplates({ onTemplateSelect, onTemplateSelected }: WorkflowTemplatesProps) {
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([])
  const [popularTemplates, setPopularTemplates] = useState<WorkflowTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [templateToUse, setTemplateToUse] = useState<WorkflowTemplate | null>(null)

  // Fetch all templates
  const fetchTemplates = async () => {
    try {
      const url = '/api/workflows/templates?limit=10'
      console.log('Fetching templates from:', url)
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Add timeout and better error handling
        signal: AbortSignal.timeout(10000) // 10 second timeout
      })
      
      console.log('Response status:', response.status)
      console.log('Response ok:', response.ok)
      console.log('Response headers:', Object.fromEntries(response.headers.entries()))
      
      if (response.ok) {
        const data = await response.json()
        console.log('Response data:', data)
        if (data.success) {
          setTemplates(data.data)
        } else {
          setError(`API returned error: ${data.error || 'Unknown error'}`)
          console.error('API error:', data.error)
        }
      } else {
        const errorText = await response.text()
        console.log('Error response text:', errorText)
        setError(`Failed to fetch templates: ${response?.statusText || response?.status || 'Unknown error'}`)
        console.error('Failed to fetch templates:', response?.statusText || response?.status || 'Unknown network or server error')
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
      if (error.name === 'AbortError') {
        setError('Request timeout. Please try again.')
      } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
        setError('Network error. Please check your connection.')
      } else {
        setError('Error fetching templates')
      }
    }
  }

  // Fetch popular templates
  const fetchPopularTemplates = async () => {
    try {
      const url = '/api/workflows/templates/popular?limit=3'
      console.log('Fetching popular templates from:', url)
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      })
      
      console.log('Popular templates response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Popular templates response data:', data)
        if (data.success) {
          setPopularTemplates(data.data)
        } else {
          console.error('Popular templates API error:', data.error)
        }
      } else {
        const errorText = await response.text()
        console.log('Popular templates error response text:', errorText)
        console.error('Failed to fetch popular templates:', response?.statusText || response?.status || 'Unknown error')
      }
    } catch (error) {
      console.error('Error fetching popular templates:', error)
      if (error.name === 'AbortError') {
        console.error('Popular templates request timeout')
      } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
        console.error('Popular templates network error')
      }
    }
  }

  useEffect(() => {
    const loadTemplates = async () => {
      setIsLoading(true)
      setError(null)
      
            try {
        // Try to load templates directly without health check
        console.log('Loading templates directly...')
        await Promise.all([fetchTemplates(), fetchPopularTemplates()])
      } catch (error) {
        console.error('Error loading templates:', error)
        // Load demo data on failure
        console.log('Loading demo data due to API failure...')
        setTemplates([
          {
            _id: 'demo-1',
            name: 'Quick Code Conversion',
            description: 'Simple and fast code conversion between libraries',
            icon: 'Zap',
            color: 'text-yellow-500',
            difficulty: 'Beginner',
            estimatedTime: '2-5 minutes',
            popularity: 98,
            usageCount: 156,
            steps: [
              {
                id: 'step-1',
                type: 'convert' as const,
                name: 'Convert Code',
                description: 'Convert quantum code between libraries',
                config: { sourceLibrary: 'qiskit', targetLibrary: 'cirq' }
              }
            ],
            metadata: { lastUsed: '', averageRating: 4.8, totalRatings: 45 }
          },
          {
            _id: 'demo-2',
    name: 'Qiskit to Cirq with Benchmarking',
    description: 'Convert Qiskit code to Cirq and run performance benchmarks',
            icon: 'Code2',
    color: 'text-blue-500',
    difficulty: 'Beginner',
    estimatedTime: '5-10 minutes',
    popularity: 95,
            usageCount: 89,
    steps: [
      {
        id: 'step-1',
        type: 'convert' as const,
        name: 'Convert Qiskit to Cirq',
        description: 'Convert quantum code from Qiskit to Cirq format',
                config: { sourceLibrary: 'qiskit', targetLibrary: 'cirq' }
      },
      {
        id: 'step-2',
        type: 'benchmark' as const,
        name: 'Benchmark Performance',
        description: 'Run performance benchmarks on converted code',
                config: { provider: 'IBM Quantum', shots: 1000 }
              }
            ],
            metadata: { lastUsed: '', averageRating: 4.6, totalRatings: 32 }
          }
        ])
        setPopularTemplates([])
      } finally {
        setIsLoading(false)
      }
    }
    
    // Add a small delay to ensure backend is ready
    const timer = setTimeout(() => {
      loadTemplates()
    }, 1000)
    
    return () => clearTimeout(timer)
  }, [])


  const handleTemplateSelect = async (template: WorkflowTemplate) => {
    try {
      const templateId = template._id || (template as any).id
      if (!templateId) {
        console.warn('Template missing id, falling back to demo workflow.')
      }
      console.log('Using template:', template.name, 'ID:', templateId)
      setSelectedTemplateId(templateId || null)
      setTemplateToUse(null)
      setConfirmDialogOpen(false)
      
      // Check if user is authenticated
      const token = localStorage.getItem('qorscend_token')
      if (!token) {
        // For demo purposes, create a mock workflow
        const mockWorkflow: Workflow = {
          id: `demo-${Date.now()}`,
          name: `${template.name} (Demo)`,
          description: template.description,
          steps: template.steps.map((step, index) => ({
            id: `step-${index + 1}`,
            type: step.type,
            name: step.name,
            description: step.description,
            status: 'pending' as const,
            config: step.config || {}
          })),
          status: 'draft',
          createdAt: new Date(),
          userId: 'demo-user'
        }
        
        console.log('Created demo workflow:', mockWorkflow)
        onTemplateSelect(mockWorkflow)
        setSelectedTemplateId(null)
        // Dispatch event to notify other components
        window.dispatchEvent(new CustomEvent('workflow-created', { detail: { workflow: mockWorkflow } }))
        toast.success(`Template "${template.name}" loaded successfully!`)
        onTemplateSelected?.()
        return
      }

      // Use the template to create a workflow
      const response = await fetch(`/api/workflows/templates/${templateId}/use`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      console.log('Template usage response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('Template usage response data:', data)
        
        if (data.success) {
          // Transform backend workflow to frontend format
          const workflow: Workflow = {
            id: data.data._id,
            name: data.data.name,
            description: data.data.description,
            steps: data.data.steps.map((step: any) => ({
              id: step.id,
              type: step.type,
              name: step.name,
              description: step.description,
              status: step.status || 'pending',
              config: step.config || {}
            })),
            status: data.data.status,
            createdAt: new Date(data.data.createdAt),
            completedAt: data.data.completedAt ? new Date(data.data.completedAt) : undefined,
            userId: data.data.user
          }
          
          console.log('Created workflow from template:', workflow)
          onTemplateSelect(workflow)
          setSelectedTemplateId(null)
          // Dispatch event to notify other components
          window.dispatchEvent(new CustomEvent('workflow-created', { detail: { workflow } }))
          toast.success(`Template "${template.name}" loaded successfully!`)
          onTemplateSelected?.()
        } else {
          console.error('API returned error:', data.error)
          // Fallback to demo workflow
          const fallbackWorkflow: Workflow = {
            id: `fallback-${Date.now()}`,
            name: `${template.name} (Fallback)`,
            description: template.description,
            steps: template.steps.map((step, index) => ({
              id: `step-${index + 1}`,
              type: step.type,
              name: step.name,
              description: step.description,
              status: 'pending' as const,
              config: step.config || {}
            })),
            status: 'draft',
            createdAt: new Date(),
            userId: 'fallback-user'
          }
          
          console.log('Created fallback workflow:', fallbackWorkflow)
          onTemplateSelect(fallbackWorkflow)
          setSelectedTemplateId(null)
          // Dispatch event to notify other components
          window.dispatchEvent(new CustomEvent('workflow-created', { detail: { workflow: fallbackWorkflow } }))
          toast.info(`Template "${template.name}" loaded in demo mode`)
          onTemplateSelected?.()
        }
      } else {
        const errorText = await response.text()
        console.error('Failed to use template:', response.status, response.statusText, errorText)
        
        // Fallback to demo workflow
        const fallbackWorkflow: Workflow = {
          id: `fallback-${Date.now()}`,
          name: `${template.name} (Fallback)`,
          description: template.description,
          steps: template.steps.map((step, index) => ({
            id: `step-${index + 1}`,
            type: step.type,
            name: step.name,
            description: step.description,
            status: 'pending' as const,
            config: step.config || {}
          })),
          status: 'draft',
          createdAt: new Date(),
          userId: 'fallback-user'
        }
        
                  console.log('Created fallback workflow due to API error:', fallbackWorkflow)
          onTemplateSelect(fallbackWorkflow)
          setSelectedTemplateId(null)
          // Dispatch event to notify other components
          window.dispatchEvent(new CustomEvent('workflow-created', { detail: { workflow: fallbackWorkflow } }))
          toast.info(`Template "${template.name}" loaded in fallback mode`)
          onTemplateSelected?.()
        }
      } catch (error) {
        console.error('Error using template:', error)
        
        // Fallback to demo workflow on any error
        const fallbackWorkflow: Workflow = {
          id: `fallback-${Date.now()}`,
          name: `${template.name} (Fallback)`,
          description: template.description,
          steps: template.steps.map((step, index) => ({
            id: `step-${index + 1}`,
            type: step.type,
            name: step.name,
            description: step.description,
            status: 'pending' as const,
            config: step.config || {}
          })),
          status: 'draft',
          createdAt: new Date(),
          userId: 'fallback-user'
        }
        
        console.log('Created fallback workflow due to exception:', fallbackWorkflow)
        onTemplateSelect(fallbackWorkflow)
        setSelectedTemplateId(null)
        // Dispatch event to notify other components
        window.dispatchEvent(new CustomEvent('workflow-created', { detail: { workflow: fallbackWorkflow } }))
        toast.info(`Template "${template.name}" loaded in fallback mode`)
        onTemplateSelected?.()
      }
  }

  const getIconComponent = (iconName: string) => {
    return iconMap[iconName as keyof typeof iconMap] || Code2
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">Workflow Templates</h2>
          <p className="text-muted-foreground">
            Choose from pre-built templates to get started quickly
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

    if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">Workflow Templates</h2>
          <p className="text-muted-foreground">
            Choose from pre-built templates to get started quickly
          </p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            <strong>Demo Mode:</strong> Showing sample templates while backend is being configured.
          </p>
          <div className="flex gap-2 mt-2">
            <button 
              onClick={() => {
                setError(null)
                setIsLoading(true)
                setTimeout(() => {
                  fetchTemplates()
                  fetchPopularTemplates()
                  setIsLoading(false)
                }, 1000)
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Try Real Data
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Workflow Templates</h2>
        <p className="text-muted-foreground">
          Choose from pre-built templates to get started quickly
        </p>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {templates.map((template, idx) => {
          const Icon = getIconComponent(template.icon)
          const key = template._id || (template as any).id || `${template.name}-${idx}`
          
          return (
            <Card key={key} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-primary/10 ${template.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {template.description}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    {template.difficulty}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Stats */}
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{template.estimatedTime}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4" />
                    <span>{template.popularity}%</span>
                  </div>
                </div>

                {/* Steps Preview */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">Steps:</p>
                  <div className="space-y-1">
                    {template.steps.slice(0, 3).map((step, index) => (
                      <div key={step.id} className="flex items-center gap-2 text-sm">
                        <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center">
                          {index + 1}
                        </div>
                        <span className="text-muted-foreground">{step.name}</span>
                      </div>
                    ))}
                    {template.steps.length > 3 && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="w-6 h-6 rounded-full bg-muted text-muted-foreground text-xs flex items-center justify-center">
                          +{template.steps.length - 3}
                        </div>
                        <span>more steps</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Button */}
                <Button 
                  onClick={() => {
                    setTemplateToUse(template)
                    setConfirmDialogOpen(true)
                  }}
                  className="w-full"
                  variant="outline"
                  disabled={selectedTemplateId === template._id}
                >
                  {selectedTemplateId === template._id ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      Use Template
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Popular Templates Section */}
      {popularTemplates.length > 0 && (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Most Popular Templates
          </CardTitle>
          <CardDescription>
            Templates used by the community most frequently
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {popularTemplates.map((template, index) => {
                const key = template._id || (template as any).id || `${template.name}-popular-${index}`
                return (
                <div key={key} className="flex items-center gap-3 p-3 rounded-lg border">
                  <div className="text-2xl font-bold text-muted-foreground">
                    #{index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{template.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {template.popularity}% popularity
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setTemplateToUse(template)
                      setConfirmDialogOpen(true)
                    }}
                    disabled={selectedTemplateId === template._id}
                  >
                    {selectedTemplateId === template._id ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary mr-1"></div>
                        ...
                      </>
                    ) : (
                      'Use'
                    )}
                  </Button>
                </div>
              )})}
          </div>
        </CardContent>
      </Card>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Use Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to use the template "{templateToUse?.name}"? This will create a new workflow based on this template.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (templateToUse) {
                handleTemplateSelect(templateToUse)
              }
            }}>
              Use Template
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
