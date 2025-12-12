"use client"

import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, DollarSign, AlertTriangle, TrendingUp, Wifi } from "lucide-react"

interface MetricData {
  avgQueueTime: number
  avgCostPerShot: number
  totalProviders: number
  activeBackends: number
  avgErrorRate: number
}

export function LiveMetrics() {
  const [metrics, setMetrics] = useState<MetricData>({
    avgQueueTime: 0,
    avgCostPerShot: 0,
    totalProviders: 0,
    activeBackends: 0,
    avgErrorRate: 0,
  })
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateCount, setUpdateCount] = useState(0)
  const [hasData, setHasData] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const connectWebSocket = () => {
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || `wss://qorscend-backend.onrender.com`
      
      // Only log connection attempts in development mode
      if (process.env.NODE_ENV === 'development') {
        console.log('Attempting WebSocket connection to:', wsUrl)
      }
      
      let connectionTimeout: NodeJS.Timeout | null = null
      
      try {
        const ws = new WebSocket(wsUrl)
        wsRef.current = ws

        // Add connection timeout
        connectionTimeout = setTimeout(() => {
          if (ws.readyState === WebSocket.CONNECTING) {
            console.log('WebSocket connection timeout, falling back to HTTP polling')
            ws.close()
            fallbackToPolling()
          }
        }, 5000) // 5 second timeout

        ws.onopen = () => {
          if (process.env.NODE_ENV === 'development') {
            console.log('WebSocket connected')
          }
          if (connectionTimeout) clearTimeout(connectionTimeout)
          setConnectionStatus('connected')
          
          // Subscribe to metrics updates
          ws.send(JSON.stringify({
            type: 'subscribe',
            subscriptions: ['metrics_update']
          }))
        }

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            
            switch (data.type) {
              case 'connection':
                console.log('WebSocket connection confirmed:', data.message)
                break
                
              case 'subscribed':
                console.log('Subscribed to:', data.subscriptions)
                break
                
              case 'metrics_update':
                setIsUpdating(true)
                setMetrics(data.data)
                const hasProviders = Boolean(data?.data?.totalProviders && data.data.totalProviders > 0)
                setHasData(hasProviders)
                setLastUpdate(hasProviders ? new Date() : null)
                setUpdateCount(prev => prev + 1)
                // Add visual feedback for real-time updates
                if (process.env.NODE_ENV === 'development') {
                  console.log('📊 Real-time metrics update:', data.data)
                }
                // Reset updating state after a brief delay
                setTimeout(() => setIsUpdating(false), 1000)
                break
                
              case 'providers_update':
                // Handle provider-specific updates
                if (process.env.NODE_ENV === 'development') {
                  console.log('🔄 Provider updates received:', data.data.providers?.length || 0)
                }
                break
                
              case 'heartbeat':
                // Keep connection alive
                break
                
              case 'pong':
                // Response to ping
                break
                
              default:
                console.log('Unknown WebSocket message:', data)
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error)
          }
        }

        ws.onclose = () => {
          if (process.env.NODE_ENV === 'development') {
            console.log('WebSocket disconnected')
          }
          if (connectionTimeout) clearTimeout(connectionTimeout)
          setConnectionStatus('disconnected')
          
          // Attempt to reconnect after 5 seconds
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current)
          }
          reconnectTimeoutRef.current = setTimeout(() => {
            setConnectionStatus('connecting')
            connectWebSocket()
          }, 5000)
        }

        ws.onerror = (error) => {
          // Only log error in development mode to avoid console spam
          if (process.env.NODE_ENV === 'development') {
            console.log('WebSocket connection failed, falling back to HTTP polling')
            console.log('💡 Real-time updates unavailable. Using HTTP polling for live metrics.')
          }
          if (connectionTimeout) clearTimeout(connectionTimeout)
          setConnectionStatus('disconnected')
          
          // Immediately fall back to HTTP polling
          fallbackToPolling()
        }

      } catch (error) {
        // Only log error in development mode to avoid console spam
        if (process.env.NODE_ENV === 'development') {
          console.log('Failed to create WebSocket connection, using HTTP polling')
        }
        if (connectionTimeout) clearTimeout(connectionTimeout)
        setConnectionStatus('disconnected')
        
        // Fallback to HTTP polling
        fallbackToPolling()
      }
    }

    const fallbackToPolling = async () => {
      // Only log in development mode
      if (process.env.NODE_ENV === 'development') {
        console.log('📡 Using HTTP polling for live metrics updates')
      }
      
      const fetchMetrics = async () => {
        try {
          const token = localStorage.getItem('qorscend_token') || ''
          const headers: Record<string, string> = {}
          if (token) headers.Authorization = `Bearer ${token}`

          const fetchJson = async (path: string) => {
            const res = await fetch(`${path}?ts=${Date.now()}`, { headers, cache: 'no-store' })
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            return res.json()
          }

          const statusJson = await fetchJson('/api/qbenchmark-live/status')
          const providersJson = await fetchJson('/api/qbenchmark-live/providers')

          let totalProviders = 0
          let avgErrorRate = 0
          let activeBackends = 0

          if (providersJson?.success) {
            const providersData = providersJson.data
            totalProviders = providersData?.totalProviders || 0
            const providersList = providersData?.providers || []
            let errorSum = 0
            let backendCount = 0
            providersList.forEach((p: any) => {
              p.backends?.forEach((b: any) => {
                backendCount += 1
                errorSum += Number(b.errorRate || 0)
                if (b.status === 'online' || p.status === 'online') activeBackends += 1
              })
            })
            if (backendCount > 0) avgErrorRate = errorSum / backendCount
          }

          const s = statusJson?.data || {}
          const finalMetrics = {
            avgQueueTime: Math.round(Number(s.averageQueueTime || 0)),
            avgCostPerShot: Number(s.averageCost || 0),
            totalProviders,
            activeBackends: activeBackends || Number(s.onlineBackends || 0),
            avgErrorRate,
          }
          const hasProviders = totalProviders > 0
          setHasData(hasProviders)
          setMetrics(finalMetrics)
          setLastUpdate(hasProviders ? new Date() : null)
          setError(null)
        } catch (error) {
          console.warn('Live metrics request failed, retaining last known values.')
          const message = error instanceof Error ? error.message : 'Live metrics unavailable'
          setError(message)
          setHasData(false)
          setLastUpdate(null)
        }
      }

      fetchMetrics()
      const interval = setInterval(fetchMetrics, 10000) // Update every 10 seconds

      return () => clearInterval(interval)
    }

    // Start WebSocket connection
    connectWebSocket()

    // Cleanup function
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [])

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.round(seconds % 60)
    if (remainingSeconds === 0) return `${minutes}m`
    return `${minutes}m ${remainingSeconds}s`
  }

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="h-3 w-3 text-green-500 animate-pulse" />
      case 'connecting':
        return <Wifi className="h-3 w-3 text-yellow-500 animate-pulse" />
      case 'disconnected':
        return <Wifi className="h-3 w-3 text-red-500" />
    }
  }

  return (
    <div className="space-y-4">
      {/* Real-time Status Indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' : connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'}`} />
          <span className="text-sm text-muted-foreground">
            {!hasData
              ? 'No live metrics available'
              : connectionStatus === 'connected'
                ? 'Real-time updates active'
                : connectionStatus === 'connecting'
                  ? 'Connecting to real-time feed...'
                  : 'Using fallback polling'}
          </span>
        </div>
        <div className="flex items-center gap-4">
          {isUpdating && (
            <div className="flex items-center gap-2 text-sm text-blue-500">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              Updating...
            </div>
          )}
          <div className="text-xs text-muted-foreground">
            Updates: {updateCount}
          </div>
          <div className="text-xs text-muted-foreground">
            {connectionStatus === 'connected' ? '~4s refresh' : '~10s refresh'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Queue Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold transition-all duration-300 ${isUpdating ? 'text-blue-500 scale-105' : ''}`}>
              {hasData ? formatTime(metrics.avgQueueTime) : '--'}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="text-xs">
                {!hasData ? 'No data' : connectionStatus === 'connected' ? 'Live' : 'Polling'}
              </Badge>
              {getConnectionIcon()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Cost/Shot</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold transition-all duration-300 ${isUpdating ? 'text-blue-500 scale-105' : ''}`}>
              {hasData ? `$${metrics.avgCostPerShot.toFixed(3)}` : '--'}
            </div>
            <p className="text-xs text-muted-foreground">Per quantum shot</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Backends</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold transition-all duration-300 ${isUpdating ? 'text-blue-500 scale-105' : ''}`}>
              {hasData ? metrics.activeBackends : '--'}
            </div>
            <p className="text-xs text-muted-foreground">
              {hasData ? `of ${metrics.totalProviders} providers` : 'No active providers'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Error Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold transition-all duration-300 ${isUpdating ? 'text-blue-500 scale-105' : ''}`}>
              {hasData ? `${(metrics.avgErrorRate * 100).toFixed(2)}%` : '--'}
            </div>
            <p className="text-xs text-muted-foreground">Across all backends</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Update</CardTitle>
            <Wifi className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {lastUpdate ? lastUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--:--:--'}
            </div>
            <p className="text-xs text-muted-foreground">
              {!hasData
                ? 'No live data'
                : connectionStatus === 'connected'
                  ? 'Real-time'
                  : 'Auto-refresh: 10s'}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
