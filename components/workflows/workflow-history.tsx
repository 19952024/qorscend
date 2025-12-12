"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  Search, 
  Filter, 
  Play, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Eye,
  Download,
  Trash2,
  RefreshCw
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"
import type { Workflow } from "@/app/dashboard/workflows/page"

interface WorkflowHistoryProps {
  onWorkflowSelect: (workflow: Workflow) => void
}

export function WorkflowHistory({ onWorkflowSelect }: WorkflowHistoryProps) {
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [workflowToDelete, setWorkflowToDelete] = useState<Workflow | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Fetch workflows from backend
  const fetchWorkflows = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }
      if (searchTerm) {
        params.append('search', searchTerm)
      }

      const response = await fetch(`/api/workflows?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('qorscend_token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          const list = Array.isArray(data.data?.workflows) ? data.data.workflows : []
          // Transform backend data to match frontend interface
          const transformedWorkflows = list.map((wf: any) => ({
            id: wf._id || wf.id || '',
            name: wf.name || 'Untitled workflow',
            description: wf.description || '',
            steps: Array.isArray(wf.steps) ? wf.steps : [],
            status: wf.status || 'completed',
            createdAt: wf.createdAt ? new Date(wf.createdAt) : new Date(),
            completedAt: wf.completedAt ? new Date(wf.completedAt) : undefined,
            userId: wf.user || wf.userId || 'unknown'
          }))
          setWorkflows(transformedWorkflows)
        } else {
          setError(data.error || 'Failed to fetch workflows')
        }
      } else {
        setError('Failed to fetch workflows')
        console.error('Failed to fetch workflows:', response.statusText)
      }
    } catch (error) {
      setError('Error fetching workflows')
      console.error('Error fetching workflows:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Delete workflow
  const deleteWorkflow = async (workflowId: string) => {
    setIsDeleting(true)
    try {
      const token = localStorage.getItem('qorscend_token')
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }
      
      // Only add authorization header if token exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(`/api/workflows/${workflowId}`, {
        method: 'DELETE',
        headers
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          // Remove from local state
          setWorkflows(prev => prev.filter(wf => wf.id !== workflowId))
          setDeleteDialogOpen(false)
          setWorkflowToDelete(null)
          // Dispatch event to notify other components
          window.dispatchEvent(new CustomEvent('workflow-deleted', { detail: { workflowId } }))
          toast.success('Workflow deleted successfully')
        } else {
          throw new Error(data.error || 'Failed to delete workflow')
        }
      } else {
        // Try to parse error response
        let errorMessage = 'Failed to delete workflow'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorData.message || errorMessage
        } catch {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage
        }
        
        // Handle specific error cases
        if (response.status === 401) {
          errorMessage = 'Authentication required. Please log in again.'
        } else if (response.status === 404) {
          errorMessage = 'Workflow not found. It may have already been deleted.'
        } else if (response.status === 403) {
          errorMessage = 'You do not have permission to delete this workflow.'
        }
        
        throw new Error(errorMessage)
      }
    } catch (error) {
      console.error('Error deleting workflow:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete workflow. Please try again.'
      toast.error('Delete Failed', {
        description: errorMessage
      })
      setError(errorMessage)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteClick = (workflow: Workflow) => {
    setWorkflowToDelete(workflow)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (workflowToDelete) {
      deleteWorkflow(workflowToDelete.id)
    }
  }

  useEffect(() => {
    fetchWorkflows()
  }, [statusFilter])

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchWorkflows()
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  // Listen for workflow changes (create, update, delete)
  useEffect(() => {
    const handleWorkflowChange = () => {
      fetchWorkflows()
    }

    // Listen for custom events
    window.addEventListener('workflow-created', handleWorkflowChange)
    window.addEventListener('workflow-updated', handleWorkflowChange)
    window.addEventListener('workflow-deleted', handleWorkflowChange)

    return () => {
      window.removeEventListener('workflow-created', handleWorkflowChange)
      window.removeEventListener('workflow-updated', handleWorkflowChange)
      window.removeEventListener('workflow-deleted', handleWorkflowChange)
    }
  }, [])

  const filteredWorkflows = workflows.filter(workflow => {
    const matchesSearch = workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         workflow.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || workflow.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusIcon = (status: Workflow['status']) => {
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

  const getStatusColor = (status: Workflow['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/10 text-green-500'
      case 'running':
        return 'bg-blue-500/10 text-blue-500'
      case 'failed':
        return 'bg-red-500/10 text-red-500'
      default:
        return 'bg-gray-500/10 text-gray-500'
    }
  }

  if (isLoading && workflows.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Workflow History</h2>
        </div>
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Workflow History</h2>
        <Button onClick={fetchWorkflows} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search workflows..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="running">Running</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Workflow List */}
      <div className="grid gap-4">
        {filteredWorkflows.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">
                {isLoading ? 'Loading workflows...' : 'No workflows found'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredWorkflows.map((workflow) => (
            <Card key={workflow.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg">{workflow.name}</h3>
                      <Badge className={getStatusColor(workflow.status)}>
                        {getStatusIcon(workflow.status)}
                        {workflow.status}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground">{workflow.description}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Created {formatDistanceToNow(workflow.createdAt)} ago</span>
                      {workflow.completedAt && (
                        <span>Completed {formatDistanceToNow(workflow.completedAt)} ago</span>
                      )}
                      <span>{workflow.steps.length} steps</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onWorkflowSelect(workflow)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClick(workflow)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workflow</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{workflowToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete} 
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
