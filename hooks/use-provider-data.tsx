import { useState, useEffect, useRef } from 'react'

interface Backend {
  name: string
  qubits: number
  queueTime: number
  costPerShot: number
  errorRate: number
  availability: number
  status?: string
  lastUpdated?: string
}

interface Provider {
  name: string
  status: string
  backends: Backend[]
}

interface ProviderData {
  providers: Provider[]
  totalProviders: number
  totalBackends: number
  lastUpdated: string
}

interface UseProviderDataReturn {
  data: ProviderData | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

// Global state to prevent multiple simultaneous requests
let globalData: ProviderData | null = null
let globalLoading = false
let globalError: string | null = null
let lastFetchTime = 0
let retryCount = 0
const FETCH_COOLDOWN = 10000 // 10 seconds between requests
const MAX_RETRIES = 3
const BASE_DELAY = 2000 // 2 seconds base delay for exponential backoff

// No fallback mock data - all data must come from database

export function useProviderData(): UseProviderDataReturn {
  const [data, setData] = useState<ProviderData | null>(globalData)
  const [loading, setLoading] = useState(globalLoading)
  const [error, setError] = useState<string | null>(globalError)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const fetchProviders = async (force = false, allowRetryWithoutToken = true) => {
    const now = Date.now()
    
    // Prevent too frequent requests
    if (!force && now - lastFetchTime < FETCH_COOLDOWN) {
      console.log('⏱️ Skipping fetch - too soon since last request')
      return
    }

    // If already loading, don't start another request
    if (globalLoading) {
      console.log('⏳ Skipping fetch - already loading')
      return
    }

    try {
      globalLoading = true
      setLoading(true)
      globalError = null
      setError(null)
      lastFetchTime = now

      const token = localStorage.getItem('qorscend_token') || ''
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      console.log('📡 Fetching provider data...')
      const response = await fetch(`/api/qbenchmark-live/providers?ts=${Date.now()}`, {
        headers,
        cache: 'no-store',
        next: { revalidate: 0 }
      })

      // If token is invalid/expired, retry once without it
      if (response.status === 401 && headers.Authorization && allowRetryWithoutToken) {
        console.log('🔐 Token rejected (401). Retrying without Authorization header.')
        localStorage.removeItem('qorscend_token')
        return fetchProviders(force, false)
      }

      if (!response.ok) {
        if (response.status === 429) {
          retryCount++
          if (retryCount <= MAX_RETRIES) {
            const delay = BASE_DELAY * Math.pow(2, retryCount - 1) // Exponential backoff
            console.log(`🔄 Rate limited, retrying in ${delay}ms (attempt ${retryCount}/${MAX_RETRIES})`)
            
            // Reset loading state temporarily
            globalLoading = false
            setLoading(false)
            
            // Wait and retry
            setTimeout(() => {
              fetchProviders(force)
            }, delay)
            return
          } else {
            retryCount = 0
            throw new Error('Rate limited - too many requests. Please try again later.')
          }
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // Reset retry count on success
      retryCount = 0
      const responseData = await response.json()
      
      const providers = responseData?.data?.providers
      if (responseData.success && Array.isArray(providers)) {
        if (providers.length === 0) {
          globalData = null
          setData(null)
          console.log('ℹ️ No provider data available (empty database)')
          return
        }
        globalData = responseData.data
        setData(responseData.data)
        console.log('✅ Provider data updated successfully')
      } else {
        throw new Error('Invalid response format')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch providers'
      console.error('❌ Error fetching providers:', errorMessage)
      
      // Only use cached data if it exists and error is temporary (network issue)
      // Otherwise show error - database must be available
      if (globalData && (err instanceof Error && err.message.includes('Network'))) {
        console.log('⚠️ Using cached data due to temporary network error')
        setData(globalData)
        globalError = 'Network error - showing cached data. Please check database connection.'
        setError('Network error - showing cached data. Please check database connection.')
      } else {
        globalData = null
        globalError = errorMessage
        setError(errorMessage)
        setData(null)
      }
    } finally {
      globalLoading = false
      setLoading(false)
    }
  }

  const refetch = async () => {
    retryCount = 0 // Reset retry count for manual refresh
    return fetchProviders(true) // Force refresh
  }

  useEffect(() => {
    // Initial fetch
    if (!globalData) {
      fetchProviders()
    } else {
      // Use existing data but update loading state
      setData(globalData)
      setLoading(false)
      setError(globalError)
    }

    // Set up interval for periodic updates (every 180 seconds to reduce load further)
    intervalRef.current = setInterval(() => {
      fetchProviders()
    }, 180000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  return {
    data,
    loading,
    error,
    refetch
  }
}
