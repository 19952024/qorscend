"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowUpDown, Filter, Star, Loader2, AlertCircle } from "lucide-react"
import { useProviderData } from "@/hooks/use-provider-data"

interface Backend {
  id?: string
  name: string
  provider: string
  qubits: number
  queueTime: number
  costPerShot: number
  errorRate: number
  availability: number
  score?: number
  status?: string
  lastUpdated?: string
}

export function ProviderComparison() {
  const { data, loading, error, refetch } = useProviderData()
  const [sortBy, setSortBy] = useState("score")
  const [filterBy, setFilterBy] = useState("all")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  // Transform the data from the shared hook
  const backends: Backend[] = useMemo(() => {
    if (!data?.providers) return []
    
    const transformedBackends: Backend[] = []
    data.providers.forEach((provider: any) => {
      provider.backends.forEach((backend: any, index: number) => {
        // Calculate a simple score based on metrics (lower queue time, cost, error rate, higher availability = better score)
        const score = Math.max(0, 10 - 
          (backend.queueTime / 60) * 0.5 - // Queue time penalty (minutes)
          backend.costPerShot * 100 - // Cost penalty
          backend.errorRate * 50 - // Error rate penalty
          (100 - backend.availability) * 0.02 // Availability penalty
        )
        
        transformedBackends.push({
          id: `${provider.name}-${backend.name}-${index}`,
          name: backend.name,
          provider: provider.name,
          qubits: backend.qubits,
          queueTime: backend.queueTime,
          costPerShot: backend.costPerShot,
          errorRate: backend.errorRate,
          availability: backend.availability,
          score: Math.round(score * 10) / 10, // Round to 1 decimal place
          status: backend.status || provider.status,
          lastUpdated: backend.lastUpdated
        })
      })
    })
    
    return transformedBackends
  }, [data])

  const filteredAndSortedBackends = backends
    .filter((backend) => {
      if (filterBy === "all") return true
      return backend.provider.toLowerCase().includes(filterBy.toLowerCase())
    })
    .sort((a, b) => {
      const aValue = a[sortBy as keyof typeof a]
      const bValue = b[sortBy as keyof typeof b]

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortOrder === "asc" ? aValue - bValue : bValue - aValue
      }

      return sortOrder === "asc"
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue))
    })

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(column)
      setSortOrder("desc")
    }
  }

  const formatTime = (seconds: number) => {
    if (seconds === 0) return "N/A"
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    return `${minutes}m`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading provider comparison data...</span>
        </div>
      </div>
    )
  }

  if (error && backends.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-2">
          <AlertCircle className="h-8 w-8 mx-auto text-destructive" />
          <p className="text-destructive">Error loading comparison data: {error}</p>
          <Button onClick={refetch} variant="outline">
            Retry
          </Button>
        </div>
      </div>
    )
  }

  // Show warning if using cached data
  const showCachedWarning = error && error.includes('cached data')

  if (backends.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-2">
          <p className="text-muted-foreground">No backend data available for comparison</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {showCachedWarning && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-500" />
            <p className="text-sm text-yellow-600">
              {error} - Data may be outdated. <Button onClick={refetch} variant="link" className="p-0 h-auto text-yellow-600 underline">Try refreshing</Button>
            </p>
          </div>
        </div>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Provider Comparison</CardTitle>
          <CardDescription>
            Compare quantum backends across different metrics and find the best option for your needs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium">Filter by:</span>
              <Select value={filterBy} onValueChange={setFilterBy}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Providers</SelectItem>
                  <SelectItem value="IBM Quantum">IBM Quantum</SelectItem>
                  <SelectItem value="Google Quantum AI">Google Quantum AI</SelectItem>
                  <SelectItem value="Amazon Braket">Amazon Braket</SelectItem>
                  <SelectItem value="Xanadu">Xanadu</SelectItem>
                  <SelectItem value="Rigetti">Rigetti</SelectItem>
                  <SelectItem value="IonQ">IonQ</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Backend</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("qubits")}
                      className="h-auto p-0 font-medium"
                    >
                      Qubits
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("queueTime")}
                      className="h-auto p-0 font-medium"
                    >
                      Queue Time
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("costPerShot")}
                      className="h-auto p-0 font-medium"
                    >
                      Cost/Shot
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("errorRate")}
                      className="h-auto p-0 font-medium"
                    >
                      Error Rate
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("availability")}
                      className="h-auto p-0 font-medium"
                    >
                      Availability
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("score")}
                      className="h-auto p-0 font-medium"
                    >
                      Score
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedBackends.map((backend) => (
                  <TableRow key={backend.id}>
                    <TableCell className="font-medium">{backend.name}</TableCell>
                    <TableCell>{backend.provider}</TableCell>
                    <TableCell>{backend.qubits}</TableCell>
                    <TableCell>{formatTime(backend.queueTime)}</TableCell>
                    <TableCell>${backend.costPerShot.toFixed(3)}</TableCell>
                    <TableCell>{(backend.errorRate * 100).toFixed(1)}%</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{backend.availability}%</span>
                        <div className="w-16 bg-secondary rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{ width: `${backend.availability}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span className="font-medium">{backend.score}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
