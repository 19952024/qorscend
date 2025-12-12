"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, Copy, Download, Trash2, Loader2, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"

interface Conversion {
  _id: string
  sourceLibrary: string
  targetLibrary: string
  status: 'success' | 'error'
  createdAt: string
  sourceCode: string
  convertedCode: string
  metadata?: {
    linesOfCode: number
    conversionTime: number
    complexity: string
  }
  errorMessage?: string
}

export function ConversionHistory() {
  const [conversions, setConversions] = useState<Conversion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isHistoryEndpointError, setIsHistoryEndpointError] = useState(false)
  const { toast } = useToast()
  const { token, user } = useAuth()

  // Detect development mode - check multiple sources
  const isDevelopment = process.env.NODE_ENV === 'development' || 
                       (typeof window !== 'undefined' && 
                        (window.location.hostname === 'localhost' || 
                         window.location.hostname === '127.0.0.1'))

  // Use relative API path (handled by Next.js)
  const apiUrl = ''
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }

  // Add authorization header if token exists
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const fetchHistory = async () => {
    try {
      setLoading(true)
      setError(null)
      setIsHistoryEndpointError(false)
      
      console.log('Development mode:', isDevelopment)
      console.log('API URL:', apiUrl)
      
      // First check if backend is available (optional check, don't fail if unavailable)
      if (isDevelopment) {
        try {
          console.log('Checking if backend is available...')
          const healthResponse = await fetch(`/api/health`, { 
            method: 'GET',
            signal: AbortSignal.timeout(3000) // 3 second timeout
          })
          
          if (!healthResponse.ok) {
            console.log('Backend health check failed, will try API call anyway')
          } else {
            console.log('Backend is available, proceeding with API call')
          }
        } catch (healthError) {
          // Health check failed, but continue to try the actual API call
          console.log('Backend health check unavailable, will try API call anyway')
        }
      }
      
      console.log('Fetching history from:', `/api/history`)
      console.log('Headers:', headers)
      
      const response = await fetch(`/api/history`, {
        method: 'GET',
        headers
      })

      console.log('Response status:', response.status)
      console.log('Response ok:', response.ok)

      // Handle different response statuses gracefully
      if (response.status === 404) {
        console.log('History endpoint not found (404), using fallback data')
        setIsHistoryEndpointError(true)
        throw new Error('History endpoint not available')
      } else if (response.status === 401) {
        if (isDevelopment) {
          console.log('Authentication required in development mode, using fallback data')
          throw new Error('Authentication required - using fallback data')
        } else {
          throw new Error('Authentication required')
        }
      } else if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch history`)
      }

      const data = await response.json()
      console.log('Response data:', data)
      
      if (data.success) {
        setConversions(data.data.conversions || [])
      } else {
        throw new Error(data.error || 'Failed to fetch history')
      }
    } catch (error) {
      console.error('Error fetching history:', error)
      
      // Always show error - no fallback data
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch history'
      setError(errorMessage)
      setConversions([])
      
      toast({
        title: "Database Error",
        description: errorMessage.includes('Authentication required')
          ? "Authentication required. Please log in to view your conversion history."
          : errorMessage.includes('404') || errorMessage.includes('not available')
          ? "Database connection failed. Please ensure the database is running and try again."
          : `Failed to load conversion history: ${errorMessage}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [])

  const handleCopy = async (conversion: Conversion) => {
    try {
      const textToCopy = conversion.status === 'success' 
        ? (conversion.convertedCode || 'No converted code available')
        : (conversion.sourceCode || 'No source code available')

      await navigator.clipboard.writeText(textToCopy)
      
      toast({
        title: "Copied to Clipboard",
        description: `${conversion.status === 'success' ? 'Converted' : 'Source'} code has been copied.`,
      })
    } catch (error) {
      console.error('Failed to copy:', error)
      toast({
        title: "Copy Failed",
        description: "Unable to copy code to clipboard.",
        variant: "destructive",
      })
    }
  }

  const handleDownload = async (conversion: Conversion) => {
    try {
      const textToDownload = conversion.status === 'success' 
        ? (conversion.convertedCode || 'No converted code available')
        : (conversion.sourceCode || 'No source code available')
      
      const filename = `conversion_${conversion.sourceLibrary}_to_${conversion.targetLibrary}_${new Date(conversion.createdAt).toISOString().split('T')[0]}.py`
      
      const blob = new Blob([textToDownload], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      
      URL.revokeObjectURL(url)
      
      toast({
        title: "Download Started",
        description: `Code saved as ${filename}`,
      })
    } catch (error) {
      console.error('Failed to download:', error)
      toast({
        title: "Download Failed",
        description: "Unable to download the code file.",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (conversionId: string) => {
    if (!confirm('Are you sure you want to delete this conversion? This action cannot be undone.')) {
      return
    }

    try {
      setDeletingId(conversionId)
      
      console.log('Deleting conversion:', conversionId)
      console.log('API URL:', apiUrl)
      
      const response = await fetch(`/api/conversion/${conversionId}`, {
        method: 'DELETE',
        headers
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required')
        }
        throw new Error(`HTTP ${response.status}: Failed to delete conversion`)
      }

      const data = await response.json()
      
      if (data.success) {
        setConversions(prev => prev.filter(c => c._id !== conversionId))
        toast({
          title: "Conversion Deleted",
          description: "The conversion has been successfully deleted.",
        })
      } else {
        throw new Error(data.error || 'Failed to delete conversion')
      }
    } catch (error) {
      console.error('Error deleting conversion:', error)
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : 'Failed to delete conversion',
        variant: "destructive",
      })
    } finally {
      setDeletingId(null)
    }
  }

  const handleRefresh = async () => {
    console.log('Refreshing conversion history')
    await fetchHistory()
  }

  const formatTimestamp = (timestamp: string) => {
    try {
      if (!timestamp) {
        return 'Unknown date'
      }
      const date = new Date(timestamp)
      if (isNaN(date.getTime())) {
        return 'Invalid date'
      }
      return date.toLocaleString()
    } catch {
      return 'Invalid date'
    }
  }

  const getPreviewText = (conversion: Conversion) => {
    // Safety check for conversion object
    if (!conversion) {
      return 'No conversion data available'
    }
    
    const text = conversion.status === 'success' 
      ? (conversion.convertedCode || 'No converted code available')
      : (conversion.sourceCode || 'No source code available')
    
    return text.length > 50 ? text.substring(0, 50) + '...' : text
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Conversion History
            </CardTitle>
            <CardDescription>View and manage your recent code conversions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2">Loading conversion history...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error && conversions.length === 0) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Conversion History
            </CardTitle>
            <CardDescription>View and manage your recent code conversions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8 text-destructive">
              <AlertCircle className="h-6 w-6 mr-2" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Conversion History
          </CardTitle>
          <CardDescription>View and manage your recent code conversions</CardDescription>
          <div className="flex justify-end">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={loading}
              className="mt-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Clock className="h-4 w-4 mr-2" />
              )}
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {conversions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No conversions found</p>
              <p className="text-sm">Your conversion history will appear here after you convert some code.</p>
            </div>
          ) : (
          <div className="space-y-4">
              {conversions.filter(conversion => conversion && conversion._id).map((conversion) => (
              <div
                  key={conversion._id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-xs">
                        {conversion.sourceLibrary} → {conversion.targetLibrary}
                    </Badge>
                    <Badge variant={conversion.status === "success" ? "default" : "destructive"} className="text-xs">
                      {conversion.status}
                    </Badge>
                      <span className="text-xs text-muted-foreground">{formatTimestamp(conversion.createdAt)}</span>
                      {conversion.metadata && (
                        <span className="text-xs text-muted-foreground">
                          {conversion.metadata.linesOfCode} lines • {conversion.metadata.conversionTime}ms
                        </span>
                      )}
                  </div>
                    <p className="text-sm font-mono text-muted-foreground truncate">
                      {getPreviewText(conversion)}
                    </p>
                    {conversion.status === 'error' && conversion.errorMessage && (
                      <p className="text-xs text-destructive">{conversion.errorMessage}</p>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleCopy(conversion)}
                      title="Copy code to clipboard"
                    >
                    <Copy className="h-4 w-4" />
                  </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDownload(conversion)}
                      title="Download code as file"
                    >
                    <Download className="h-4 w-4" />
                  </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDelete(conversion._id)}
                      disabled={deletingId === conversion._id}
                      title="Delete conversion"
                      className="text-destructive hover:text-destructive"
                    >
                      {deletingId === conversion._id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                    <Trash2 className="h-4 w-4" />
                      )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
          )}
          
          {/* Development mode indicator */}
          {isDevelopment && (
            <div className="text-xs text-muted-foreground text-center mt-4 p-2 bg-muted rounded">
              <span>🚀 Development Mode - Connected to database | API URL: {apiUrl || 'Not set'}</span>
              {(error || isHistoryEndpointError) ? (
                <div className="space-y-2">
                  <span>
                    🚀 Development Mode - Backend unavailable, showing fallback data | API URL: {apiUrl || 'Not set'}
                  </span>
                  <div className="flex justify-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        toast({
                          title: "API Information",
                          description: "API routes are now integrated into Next.js. Make sure MongoDB is running.",
                        })
                      }}
                    >
                      Start Backend
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        window.open('http://localhost:5000/health', '_blank')
                      }}
                    >
                      Check Backend
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        window.open('http://localhost:5000/api/history', '_blank')
                      }}
                    >
                      Test History Endpoint
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setError(null)
                        setIsHistoryEndpointError(false)
                        fetchHistory()
                      }}
                    >
                      Retry
                    </Button>
                  </div>
                  {isHistoryEndpointError && (
                    <div className="text-xs text-amber-500">
                      💡 The backend is running but the history endpoint is not available. 
                      Try restarting the backend server.
                    </div>
                  )}
                </div>
              ) : (
                <span>�� Development Mode - Using real database data | API URL: {apiUrl || 'Not set'}</span>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
