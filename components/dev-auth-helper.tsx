"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, AlertCircle, RefreshCw } from "lucide-react"

export function DevAuthHelper() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Demo token (this would normally come from a secure source)
  const DEMO_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4YWEwMjQ2M2Y1NDcxZDc0ZGFjOTFiZiIsImlhdCI6MTc1NTk3ODI2MiwiZXhwIjoxNzU2NTgzMDYyfQ.2ERjZLqHvH4BHBYHbb6ll_PACJID-p1Itm1MWNL2v_E"

  useEffect(() => {
    // Check if user is already authenticated
    const token = localStorage.getItem('qorscend_token')
    setIsAuthenticated(!!token)
    setIsLoading(false)
  }, [])

  const authenticateDemo = async () => {
    try {
      setIsLoading(true)
      
      // Set the demo token
      localStorage.setItem('qorscend_token', DEMO_TOKEN)
      
      // Test the token by making a request to the backend
      const response = await fetch(`/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${DEMO_TOKEN}`
        }
      })

      if (response.ok) {
        setIsAuthenticated(true)
        // Reload the page to refresh the data
        window.location.reload()
      } else {
        throw new Error('Authentication failed')
      }
    } catch (error) {
      console.error('Authentication error:', error)
      localStorage.removeItem('qorscend_token')
      setIsAuthenticated(false)
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('qorscend_token')
    setIsAuthenticated(false)
    window.location.reload()
  }

  // Only show in development mode
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  if (isLoading) {
    return (
      <Card className="mb-4">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-4">
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            <span className="text-sm">Checking authentication...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              <CheckCircle className="h-5 w-5 text-green-500" />
              Development Mode - Authenticated
            </>
          ) : (
            <>
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              Development Mode - Not Authenticated
            </>
          )}
        </CardTitle>
        <CardDescription>
          {isAuthenticated 
            ? "You are authenticated as demo user. Quantum data should be visible."
            : "Click below to authenticate as demo user and see quantum data."
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isAuthenticated ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Demo User: demo@qorscend.com
            </p>
            <Button onClick={logout} variant="outline" size="sm">
              Logout Demo User
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              This will authenticate you as the demo user to see quantum experiment data.
            </p>
            <Button onClick={authenticateDemo} disabled={isLoading}>
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  Authenticating...
                </>
              ) : (
                "Authenticate as Demo User"
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
