"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import {
  Line,
  LineChart,
  Bar,
  BarChart,
  Scatter,
  ScatterChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts"
import { BarChart3, LineChartIcon, ScatterChartIcon as ScatterIcon, Download, Settings, RefreshCw, AlertTriangle } from "lucide-react"
import type { DataFile } from "@/app/dashboard/qdata-clean/page"

interface DataVisualizerProps {
  file: DataFile
}

const chartTypes = [
  { value: "line", label: "Line Chart", icon: LineChartIcon },
  { value: "bar", label: "Bar Chart", icon: BarChart3 },
  { value: "scatter", label: "Scatter Plot", icon: ScatterIcon },
]

export function DataVisualizer({ file }: DataVisualizerProps) {
  const [chartType, setChartType] = useState("line")
  const [xAxis, setXAxis] = useState("")
  const [yAxis, setYAxis] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [fileData, setFileData] = useState<any[]>([])
  const [metadata, setMetadata] = useState<any>({})
  const [error, setError] = useState<string | null>(null)
  const [lastLoaded, setLastLoaded] = useState<number>(0)

  // Fetch file data from backend
  const loadFileData = async (forceRefresh = false) => {
    try {
      setError(null);
      setIsLoading(true);
      
      const token = localStorage.getItem('qorscend_token');
      const headers: Record<string, string> = {};
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
      console.log(`🔍 Loading data for file: ${file.id}`);
      const apiUrl = `${baseUrl}/api/qdata-clean/files/${file.id}/data`;
      console.log(`📡 API URL: ${apiUrl}`);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('📊 Backend response:', result);
      
      if (!result.success) {
        throw new Error(result.error || 'Backend returned error');
      }
      
      const newData = result.data.parsedData || [];
      const newMetadata = result.data.metadata || {};
      
      console.log(`✅ Data loaded: ${newData.length} rows, ${Object.keys(newMetadata).length} metadata fields`);
      
      setFileData(newData);
      setMetadata(newMetadata);
      setLastLoaded(Date.now());
      
      // Auto-select axes if not already selected and we have data
      if (newData.length > 0) {
        const columns = Object.keys(newData[0]);
        const numericColumns = columns.filter((key) => {
          return newData.some((row: any) => !isNaN(Number(row[key])))
        });
        
        console.log(`📋 Available columns: ${columns.join(', ')}`);
        console.log(`🔢 Numeric columns: ${numericColumns.join(', ')}`);
        
        if (!xAxis && columns.length > 0) {
          // Prefer timestamp, qubit, time, or id columns for X-axis
          const preferredXAxis = columns.find(col => 
            col.toLowerCase().includes('timestamp') || 
            col.toLowerCase().includes('qubit') ||
            col.toLowerCase().includes('time') ||
            col.toLowerCase().includes('id') ||
            col.toLowerCase().includes('index') ||
            col.toLowerCase().includes('measurement')
          );
          setXAxis(preferredXAxis || columns[0]);
          console.log(`🎯 Auto-selected X-axis: ${preferredXAxis || columns[0]}`);
        }
        
        if (!yAxis && numericColumns.length > 0) {
          // Prefer quantum-relevant metrics for Y-axis
          const preferredYAxis = numericColumns.find(col => 
            col.toLowerCase().includes('fidelity') || 
            col.toLowerCase().includes('error') ||
            col.toLowerCase().includes('coherence') ||
            col.toLowerCase().includes('rate') ||
            col.toLowerCase().includes('probability') ||
            col.toLowerCase().includes('amplitude') ||
            col.toLowerCase().includes('value') ||
            col.toLowerCase().includes('score') ||
            col.toLowerCase().includes('count')
          );
          setYAxis(preferredYAxis || numericColumns[0]);
          console.log(`🎯 Auto-selected Y-axis: ${preferredYAxis || numericColumns[0]}`);
        }
      }
      
    } catch (error) {
      console.error('❌ Error loading file data:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Load data when component mounts
  useEffect(() => {
    loadFileData();
  }, [file.id]);

  const getNumericColumns = () => {
    if (fileData.length === 0) return []
    return Object.keys(fileData[0]).filter((key) => {
      return fileData.some((row) => !isNaN(Number(row[key])))
    })
  }

  const getAllColumns = () => {
    if (fileData.length === 0) return []
    return Object.keys(fileData[0])
  }

  const prepareChartData = () => {
    if (!xAxis || !yAxis) return []

    return fileData
      .slice(0, 100) // Limit to first 100 points for performance
      .map((row, index) => {
        let xValue = row[xAxis];
        let yValue = row[yAxis];
        
        // Handle timestamp conversion for better X-axis display
        if (xAxis.toLowerCase().includes('timestamp') && xValue) {
          try {
            const date = new Date(xValue);
            if (!isNaN(date.getTime())) {
              xValue = date.toLocaleTimeString();
            }
          } catch (e) {
            // Keep original value if parsing fails
          }
        }
        
        // Handle qubit_id for better X-axis labels
        if (xAxis.toLowerCase().includes('qubit') && xValue !== undefined) {
          xValue = `Qubit ${xValue}`;
        }
        
        // Ensure Y-axis is numeric and handle edge cases
        if (yValue === null || yValue === undefined || yValue === '') {
          yValue = 0;
        } else {
          yValue = Number(yValue);
          if (isNaN(yValue)) {
            yValue = 0;
          }
        }
        
        return {
          x: xValue || index,
          y: yValue,
          name: `${xAxis}: ${xValue}, ${yAxis}: ${yValue}`,
          originalRow: row // Keep reference to original data for tooltips
        };
      })
      .filter((point) => !isNaN(point.y) && point.y !== null)
  }

  const renderChart = () => {
    const data = prepareChartData()

    if (data.length === 0) {
      return (
        <div className="h-[400px] flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Select X and Y axes to generate visualization</p>
          </div>
        </div>
      )
    }

    const chartConfig = {
      y: {
        label: yAxis,
        color: "hsl(var(--chart-1))",
      },
    }

    switch (chartType) {
      case "line":
        return (
          <ChartContainer config={chartConfig} className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="x" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="y" stroke="var(--color-y)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        )

      case "bar":
        return (
          <ChartContainer config={chartConfig} className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="x" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="y" fill="var(--color-y)" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        )

      case "scatter":
        return (
          <ChartContainer config={chartConfig} className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="x" />
                <YAxis dataKey="y" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Scatter dataKey="y" fill="var(--color-y)" />
              </ScatterChart>
            </ResponsiveContainer>
          </ChartContainer>
        )

      default:
        return null
    }
  }

  const generateStatistics = () => {
    if (!yAxis) return null

    const values = fileData.map((row) => Number(row[yAxis])).filter((val) => !isNaN(val))

    if (values.length === 0) return null

    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    const sorted = [...values].sort((a, b) => a - b)
    const median = sorted[Math.floor(sorted.length / 2)]
    const min = Math.min(...values)
    const max = Math.max(...values)
    const std = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length)

    return { mean, median, min, max, std, count: values.length }
  }

  const stats = generateStatistics()

  const exportChart = async () => {
    if (!xAxis || !yAxis) {
      return;
    }

    try {
      const token = localStorage.getItem('qorscend_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const response = await fetch(`${baseUrl}/api/qdata-clean/export-chart/${file.id}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          chartType,
          xAxis,
          yAxis,
          format: 'json'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to export chart');
      }

      // Create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${file.name.replace(/\.[^/.]+$/, '')}_chart_${xAxis}_vs_${yAxis}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting chart:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading visualization data...</p>
                <p className="text-xs text-muted-foreground mt-2">This may take a moment for large files</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error if data loading failed
  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-destructive" />
                <p className="text-destructive font-medium">Failed to load data</p>
                <p className="text-sm text-muted-foreground mt-2">{error}</p>
                <Button 
                  variant="outline" 
                  onClick={() => loadFileData(true)} 
                  className="mt-4"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry Loading
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show message if no data is available
  if (fileData.length === 0) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">No data available for visualization</p>
                <p className="text-xs text-muted-foreground mt-2">Please ensure the file has been processed first</p>
                <Button 
                  variant="outline" 
                  onClick={() => loadFileData(true)} 
                  className="mt-4"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reload Data
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Chart Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Visualization Controls
          </CardTitle>
          <CardDescription>
            Configure your data visualization settings
            {lastLoaded > 0 && (
              <span className="block text-xs text-muted-foreground mt-1">
                Last updated: {new Date(lastLoaded).toLocaleTimeString()}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Chart Type</label>
              <Select value={chartType} onValueChange={setChartType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {chartTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <type.icon className="h-4 w-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">X-Axis</label>
              <Select value={xAxis} onValueChange={setXAxis}>
                <SelectTrigger>
                  <SelectValue placeholder="Select X-axis column" />
                </SelectTrigger>
                <SelectContent>
                  {getAllColumns().map((column) => (
                    <SelectItem key={column} value={column}>
                      {column}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Y-Axis</label>
              <Select value={yAxis} onValueChange={setYAxis}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Y-axis column" />
                </SelectTrigger>
                <SelectContent>
                  {getNumericColumns().map((column) => (
                    <SelectItem key={column} value={column}>
                      {column}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => loadFileData(true)} 
              disabled={isLoading}
              className="w-full"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Chart Display */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Data Visualization</CardTitle>
              <CardDescription>
                {xAxis && yAxis ? `${yAxis} vs ${xAxis}` : "Interactive chart of your quantum data"}
                {xAxis && yAxis && (
                  <span className="block text-xs text-muted-foreground mt-1">
                    Showing {prepareChartData().length} data points
                  </span>
                )}
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={exportChart}
              disabled={!xAxis || !yAxis}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Chart
            </Button>
          </div>
        </CardHeader>
        <CardContent>{renderChart()}</CardContent>
      </Card>

      {/* Data Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Data Information
          </CardTitle>
          <CardDescription>Information about the loaded data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Total Rows</div>
                <div className="text-lg font-bold">{fileData.length}</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Available Columns</div>
                <div className="text-lg font-bold">{Object.keys(metadata.columns || {}).length}</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Data Quality Score</div>
                <div className="text-lg font-bold">{metadata.qualityScore || 'N/A'}%</div>
              </div>
            </div>
            
            {fileData.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Available Columns:</div>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(fileData[0]).map((column) => (
                    <div
                      key={column}
                      className={`px-2 py-1 rounded text-xs font-mono ${
                        column === xAxis
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          : column === yAxis
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                      }`}
                    >
                      {column}
                      {metadata.dataTypes?.[column] && (
                        <span className="ml-1 text-xs opacity-75">({metadata.dataTypes[column]})</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle>Statistical Summary</CardTitle>
            <CardDescription>Key statistics for {yAxis}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Count</div>
                <div className="text-lg font-bold">{stats.count}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Mean</div>
                <div className="text-lg font-bold">{stats.mean.toFixed(4)}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Median</div>
                <div className="text-lg font-bold">{stats.median.toFixed(4)}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Min</div>
                <div className="text-lg font-bold">{stats.min.toFixed(4)}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Max</div>
                <div className="text-lg font-bold">{stats.max.toFixed(4)}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Std Dev</div>
                <div className="text-lg font-bold">{stats.std.toFixed(4)}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
