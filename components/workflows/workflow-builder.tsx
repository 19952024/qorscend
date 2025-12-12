"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { 
  Plus, 
  Trash2, 
  Play, 
  Save, 
  Code2, 
  BarChart3, 
  Database, 
  ArrowRight,
  Settings,
  CheckCircle,
  Clock,
  AlertCircle
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Workflow, WorkflowStep } from "@/app/dashboard/workflows/page"

interface WorkflowBuilderProps {
  activeWorkflow: Workflow | null
  onWorkflowUpdate: (workflow: Workflow | null) => void
  recentlySelectedTemplate?: boolean
}

const stepTypes = [
  {
    type: 'convert' as const,
    name: 'Code Conversion',
    description: 'Convert quantum code between libraries',
    icon: Code2,
    color: 'text-blue-500'
  },
  {
    type: 'benchmark' as const,
    name: 'Benchmark',
    description: 'Run performance benchmarks',
    icon: BarChart3,
    color: 'text-green-500'
  },
  {
    type: 'clean' as const,
    name: 'Data Clean',
    description: 'Process and clean data',
    icon: Database,
    color: 'text-purple-500'
  }
]

export function WorkflowBuilder({ activeWorkflow, onWorkflowUpdate, recentlySelectedTemplate }: WorkflowBuilderProps) {
  const [workflow, setWorkflow] = useState<Workflow>(activeWorkflow || {
    id: '',
    name: '',
    description: '',
    steps: [],
    status: 'draft',
    createdAt: new Date(),
    userId: ''
  })
  const [isRunning, setIsRunning] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  // Update workflow when activeWorkflow changes
  useEffect(() => {
    if (activeWorkflow) {
      setWorkflow(activeWorkflow)
    } else {
      setWorkflow({
        id: '',
        name: '',
        description: '',
        steps: [],
        status: 'draft',
        createdAt: new Date(),
        userId: ''
      })
    }
  }, [activeWorkflow])

  const addStep = (type: WorkflowStep['type']) => {
    const newStep: WorkflowStep = {
      id: `step-${Date.now()}`,
      type,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} Step`,
      description: `Configure ${type} step`,
      status: 'pending',
      config: {}
    }
    
    setWorkflow(prev => ({
      ...prev,
      steps: [...prev.steps, newStep]
    }))
  }

  const removeStep = (stepId: string) => {
    setWorkflow(prev => ({
      ...prev,
      steps: prev.steps.filter(step => step.id !== stepId)
    }))
  }

  const updateStep = (stepId: string, updates: Partial<WorkflowStep>) => {
    setWorkflow(prev => ({
      ...prev,
      steps: prev.steps.map(step => 
        step.id === stepId ? { ...step, ...updates } : step
      )
    }))
  }

  const moveStep = (stepId: string, direction: 'up' | 'down') => {
    setWorkflow(prev => {
      const steps = [...prev.steps]
      const index = steps.findIndex(step => step.id === stepId)
      
      if (direction === 'up' && index > 0) {
        [steps[index], steps[index - 1]] = [steps[index - 1], steps[index]]
      } else if (direction === 'down' && index < steps.length - 1) {
        [steps[index], steps[index + 1]] = [steps[index + 1], steps[index]]
      }
      
      return { ...prev, steps }
    })
  }

  const saveWorkflow = async () => {
    if (!workflow.name.trim()) {
      toast({
        title: "Missing Workflow Name",
        description: "Please provide a name for your workflow.",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      const method = workflow.id ? 'PUT' : 'POST'
      const url = workflow.id ? `/api/workflows/${workflow.id}` : '/api/workflows'
      
      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('qorscend_token')}`
        },
        body: JSON.stringify({
          name: workflow.name,
          description: workflow.description,
          steps: workflow.steps
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          const savedWorkflow = {
            ...workflow,
            id: data.data._id || workflow.id,
            name: data.data.name,
            description: data.data.description,
            steps: data.data.steps
          }
          
          setWorkflow(savedWorkflow)
          onWorkflowUpdate(savedWorkflow)
          
          // Dispatch event to notify other components
          window.dispatchEvent(new CustomEvent('workflow-created', { detail: { workflow: savedWorkflow } }))
          window.dispatchEvent(new CustomEvent('workflow-updated', { detail: { workflow: savedWorkflow } }))
          
        toast({
          title: "Workflow Saved",
          description: "Your workflow has been saved successfully.",
        })
        }
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save workflow')
      }
    } catch (error) {
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Failed to save workflow. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const runWorkflow = async () => {
    if (!workflow.id) {
      toast({
        title: "Save First",
        description: "Please save your workflow before running it.",
        variant: "destructive",
      })
      return
    }

    setIsRunning(true)
    try {
      const response = await fetch('/api/workflows/run', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('qorscend_token')}`
        },
        body: JSON.stringify({
          id: workflow.id,
          workflowId: workflow.id,
          name: workflow.name,
          steps: workflow.steps
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
        toast({
          title: "Workflow Started",
            description: "Your workflow is now running. Check the history tab for updates.",
          })
          
          // Update workflow status to running
          setWorkflow(prev => ({
            ...prev,
            status: 'running'
          }))
        }
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to run workflow')
      }
    } catch (error) {
      toast({
        title: "Run Failed",
        description: error instanceof Error ? error.message : "Failed to run workflow. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsRunning(false)
    }
  }

  const getStepTypeIcon = (type: WorkflowStep['type']) => {
    const stepType = stepTypes.find(st => st.type === type)
    return stepType ? stepType.icon : Settings
  }

  const getStepTypeColor = (type: WorkflowStep['type']) => {
    const stepType = stepTypes.find(st => st.type === type)
    return stepType ? stepType.color : 'text-gray-500'
  }

  const getStepStatusIcon = (status: WorkflowStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'running':
        return <Clock className="h-4 w-4 text-blue-500" />
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Template Selection Help */}
      {recentlySelectedTemplate && (
        <Card className="border-l-4 border-l-green-500 bg-green-50 dark:bg-green-950">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-green-800 dark:text-green-200">
                  Template Loaded Successfully! 🎉
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Your workflow is ready to customize. You can now modify the steps, add new ones, or run it as-is.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Workflow Summary */}
      {workflow.steps.length > 0 && (
        <Card className="border-l-4 border-l-blue-500 bg-blue-50 dark:bg-blue-950">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                <Settings className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-blue-800 dark:text-blue-200">
                  Workflow Summary
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  This workflow contains {workflow.steps.length} step{workflow.steps.length !== 1 ? 's' : ''}: {
                    workflow.steps.map((step, index) => 
                      `${step.name}${index < workflow.steps.length - 1 ? ', ' : ''}`
                    ).join('')
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Workflow Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Workflow Configuration</CardTitle>
              <CardDescription>Configure your workflow name and description</CardDescription>
            </div>
            {workflow.id && (
              <div className="flex items-center gap-2">
                <Badge variant={workflow.status === 'draft' ? 'secondary' : workflow.status === 'running' ? 'default' : workflow.status === 'completed' ? 'default' : 'destructive'}>
                  {workflow.status}
                </Badge>
                {workflow.createdAt && (
                  <span className="text-xs text-muted-foreground">
                    Created {workflow.createdAt.toLocaleDateString()}
                  </span>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="workflow-name">Workflow Name</Label>
            <Input
              id="workflow-name"
              placeholder="Enter workflow name"
              value={workflow.name}
              onChange={(e) => setWorkflow(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="workflow-description">Description</Label>
            <Textarea
              id="workflow-description"
              placeholder="Describe what this workflow does"
              value={workflow.description}
              onChange={(e) => setWorkflow(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Workflow Steps */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Workflow Steps</CardTitle>
              <CardDescription>Add and configure steps for your workflow pipeline</CardDescription>
            </div>
            {workflow.steps.length > 0 && (
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                {workflow.steps.length} step{workflow.steps.length !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add Step Buttons */}
          <div className="flex gap-3 flex-wrap">
            {stepTypes.map((stepType) => (
              <Button
                key={stepType.type}
                variant="outline"
                onClick={() => addStep(stepType.type)}
                className="flex items-center gap-2"
              >
                <stepType.icon className="h-4 w-4" />
                Add {stepType.name}
              </Button>
            ))}
          </div>

          {/* Steps List */}
          {workflow.steps.length === 0 ? (
            <div className="text-center py-12">
              <Settings className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No steps added yet. Click the buttons above to add steps to your workflow.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {workflow.steps.map((step, index) => (
                  <Card key={step.id} className="border-l-4 border-l-primary">
                    <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg bg-primary/10 ${getStepTypeColor(step.type)}`}>
                            {React.createElement(getStepTypeIcon(step.type), { className: "h-5 w-5" })}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{step.name}</h4>
                              {getStepStatusIcon(step.status)}
                            </div>
                            <p className="text-sm text-muted-foreground">{step.description}</p>
                          </div>
                        </div>
                        
                        {/* Step Configuration */}
                        <div className="ml-11 space-y-2">
                          {step.type === 'convert' && (
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-xs">Source Library</Label>
                                                                 <Select
                                   value={(step.config?.sourceLibrary) || ''}
                                   onValueChange={(value) => updateStep(step.id, { config: { ...(step.config || {}), sourceLibrary: value } })}
                                 >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select source" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="qiskit">Qiskit</SelectItem>
                                    <SelectItem value="cirq">Cirq</SelectItem>
                                    <SelectItem value="braket">Braket</SelectItem>
                                    <SelectItem value="pennylane">PennyLane</SelectItem>
                                    <SelectItem value="pyquil">PyQuil</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label className="text-xs">Target Library</Label>
                                                                 <Select
                                   value={(step.config?.targetLibrary) || ''}
                                   onValueChange={(value) => updateStep(step.id, { config: { ...(step.config || {}), targetLibrary: value } })}
                                 >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select target" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="qiskit">Qiskit</SelectItem>
                                    <SelectItem value="cirq">Cirq</SelectItem>
                                    <SelectItem value="braket">Braket</SelectItem>
                                    <SelectItem value="pennylane">PennyLane</SelectItem>
                                    <SelectItem value="pyquil">PyQuil</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          )}
                          
                          {step.type === 'benchmark' && (
                            <div>
                              <Label className="text-xs">Provider</Label>
                                                             <Select
                                 value={(step.config?.provider) || ''}
                                 onValueChange={(value) => updateStep(step.id, { config: { ...(step.config || {}), provider: value } })}
                               >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select provider" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="IBM Quantum">IBM Quantum</SelectItem>
                                  <SelectItem value="Google Quantum AI">Google Quantum AI</SelectItem>
                                  <SelectItem value="Amazon Braket">Amazon Braket</SelectItem>
                                  <SelectItem value="Xanadu">Xanadu</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                          
                          {step.type === 'clean' && (
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                                                 <Checkbox
                                   id={`remove-outliers-${step.id}`}
                                   checked={step.config?.removeOutliers || false}
                                   onCheckedChange={(checked) => updateStep(step.id, { config: { ...(step.config || {}), removeOutliers: checked } })}
                                 />
                                <Label htmlFor={`remove-outliers-${step.id}`} className="text-xs">Remove outliers</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                                                 <Checkbox
                                   id={`normalize-data-${step.id}`}
                                   checked={step.config?.normalizeData || false}
                                   onCheckedChange={(checked) => updateStep(step.id, { config: { ...(step.config || {}), normalizeData: checked } })}
                                 />
                                <Label htmlFor={`normalize-data-${step.id}`} className="text-xs">Normalize data</Label>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => moveStep(step.id, 'up')}
                            disabled={index === 0}
                          >
                            ↑
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => moveStep(step.id, 'down')}
                            disabled={index === workflow.steps.length - 1}
                          >
                            ↓
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeStep(step.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          onClick={saveWorkflow}
          disabled={isSaving || !workflow.name.trim()}
          className="flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {isSaving ? 'Saving...' : 'Save Workflow'}
        </Button>
                 <Button 
           onClick={runWorkflow} 
           disabled={isRunning || !workflow.id || workflow.steps.length === 0}
           className="flex items-center gap-2 bg-primary hover:bg-primary/90"
         >
           <Play className="h-4 w-4" />
           {isRunning ? 'Running...' : 'Run Workflow'}
         </Button>
       </div>
     </div>
   )
 }