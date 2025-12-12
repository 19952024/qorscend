"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExternalLink, Book, Code, Zap, RefreshCw, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Library {
  name: string
  displayName: string
  description: string
  version: string
  features: string[]
  docs: string
  popularity: string
  color: string
  isActive: boolean
  metadata?: {
    lastUpdated: string
    conversionCount: number
    successRate: number
  }
}

export function LibraryGuide() {
  const [libraries, setLibraries] = useState<Library[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchLibraries = async () => {
    try {
      setLoading(true)
      setError(null)

      // Use relative API path (handled by Next.js) - connects to database
      const apiUrl = '/api/quantum-libraries'

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Libraries endpoint not available. Please ensure the database is running.')
        }
        throw new Error(`HTTP ${response.status}: Failed to fetch libraries`)
      }

      const data = await response.json()
      
      if (data.success && data.data && Array.isArray(data.data.libraries)) {
        console.log(`✅ Loaded ${data.data.libraries.length} libraries from database`)
        setLibraries(data.data.libraries)
      } else {
        throw new Error('Invalid response format from database')
      }
    } catch (err: unknown) {
      console.error('Failed to fetch libraries:', err)
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch libraries from database'
      setError(errorMessage)
      setLibraries([]) // Clear libraries on error - no fallback data
      
      toast({
        title: "Database Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLibraries()
  }, [])

  const handleRefresh = () => {
    fetchLibraries()
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Book className="h-5 w-5 text-primary" />
              Quantum Library Guide
            </CardTitle>
            <CardDescription>Learn about supported quantum computing libraries and their key features</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Loading libraries...</span>
              </div>
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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Book className="h-5 w-5 text-primary" />
                Quantum Library Guide
              </CardTitle>
              <CardDescription>Learn about supported quantum computing libraries and their key features</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="ml-2">Refresh</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-6 p-4 border border-destructive/20 bg-destructive/5 rounded-lg">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">Error loading libraries</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleRefresh}
                  >
                    Retry Connection
                  </Button>
                </div>
              )}
            </div>
          )}
          
          {libraries.length === 0 && !error && !loading && (
            <div className="text-center py-8 text-muted-foreground">
              <Book className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No quantum libraries found in database</p>
              <p className="text-sm mt-2">Libraries will appear here once they are added to the database.</p>
            </div>
          )}
          
          {libraries.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {libraries.filter(lib => lib.isActive).map((library) => (
              <Card key={library.name} className="border-2 hover:border-primary/20 transition-colors">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{library.displayName}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        v{library.version}
                      </Badge>
                      <Badge className={library.color}>{library.popularity}</Badge>
                    </div>
                  </div>
                  <CardDescription>{library.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Key Features
                    </h4>
                    <ul className="space-y-1">
                      {library.features.map((feature, index) => (
                        <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                          <div className="w-1 h-1 bg-primary rounded-full" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Code className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={library.docs}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                      Documentation
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  {library.metadata && (
                    <div className="text-xs text-muted-foreground pt-2 border-t">
                      <div>Conversions: {library.metadata.conversionCount || 0}</div>
                      <div>Success Rate: {library.metadata.successRate || 0}%</div>
                      {library.metadata.lastUpdated && (
                        <div>Last Updated: {new Date(library.metadata.lastUpdated).toLocaleDateString()}</div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
              ))}
            </div>
          )}
          
          {process.env.NODE_ENV === 'development' && (
            <div className="text-xs text-muted-foreground text-center mt-4 p-2 bg-muted rounded">
              <span>🚀 Development Mode - Connected to database | API URL: /api/quantum-libraries</span>
              {error && (
                <div className="mt-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleRefresh}
                  >
                    Retry Connection
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
