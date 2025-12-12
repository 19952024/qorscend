"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Settings, Play, CheckCircle, AlertTriangle, Filter, RefreshCw, BarChart3 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { DataFile } from "@/app/dashboard/qdata-clean/page"

interface DataProcessorProps {
  file: DataFile
  onProcess: (processedFile: DataFile) => void
}

const processingOptions = [
  { id: "remove_nulls", label: "Remove null/empty values", description: "Clean up missing data points" },
  { id: "normalize_numbers", label: "Normalize numerical values", description: "Scale values to 0-1 range" },
  {
    id: "remove_outliers",
    label: "Remove statistical outliers",
    description: "Filter extreme values using IQR method",
  },
  { id: "standardize_format", label: "Standardize data format", description: "Ensure consistent data types" },
  { id: "aggregate_duplicates", label: "Aggregate duplicate entries", description: "Combine similar measurements" },
]

export function DataProcessor({ file, onProcess }: DataProcessorProps) {
  // Get storage key for this specific file
  const getStorageKey = (key: string) => `qdata_processor_${file.id}_${key}`
  
  // Initialize state with localStorage values or defaults
  const [selectedOptions, setSelectedOptions] = useState<string[]>(() => {
    const saved = localStorage.getItem(getStorageKey('selectedOptions'))
    return saved ? JSON.parse(saved) : ["remove_nulls", "standardize_format"]
  })
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [fileData, setFileData] = useState<any[]>([])
  const [metadata, setMetadata] = useState<any>({})
  const [previewData, setPreviewData] = useState<any[]>([])
  const [lastLoaded, setLastLoaded] = useState<number>(0)
  const { toast } = useToast()

  // Save processing options to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(getStorageKey('selectedOptions'), JSON.stringify(selectedOptions))
  }, [selectedOptions, file.id])

  // Fetch file data from backend
  const loadFileData = async (forceRefresh = false) => {
    try {
      // Check if we have recent data and don't need to refresh
      const now = Date.now()
      const dataAge = now - lastLoaded
      const hasRecentData = dataAge < 5 * 60 * 1000 // 5 minutes
      
      if (!forceRefresh && hasRecentData && fileData.length > 0) {
        console.log('Using cached processor data, last loaded:', new Date(lastLoaded).toLocaleTimeString())
        return
      }

      setIsLoading(true);
      const token = localStorage.getItem('qorscend_token');
      const headers: Record<string, string> = {};
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || ''
      const response = await fetch(`${baseUrl}/api/qdata-clean/files/${file.id}/data`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error('Failed to load file data');
      }

      const result = await response.json();
      const newData = result.data.parsedData || [];
      const newMetadata = result.data.metadata || {};
      
      setFileData(newData);
      setMetadata(newMetadata);
      setPreviewData(newData.slice(0, 10));
      setLastLoaded(now);
      
      console.log(`Processor data loaded successfully: ${newData.length} rows, last loaded: ${new Date(now).toLocaleTimeString()}`);
    } catch (error) {
      console.error('Error loading file data:', error);
      toast({
        title: "Error",
        description: "Failed to load file data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load data when component mounts
  useEffect(() => {
    loadFileData();
  }, [file.id]);

  // Auto-refresh data every 10 minutes to keep it fresh
  useEffect(() => {
    const interval = setInterval(() => {
      if (fileData.length > 0) {
        loadFileData();
      }
    }, 10 * 60 * 1000); // 10 minutes

    return () => clearInterval(interval);
  }, [fileData.length]);

  const handleOptionChange = (optionId: string, checked: boolean) => {
    setSelectedOptions((prev) => (checked ? [...prev, optionId] : prev.filter((id) => id !== optionId)))
  }

  const processData = async () => {
    setIsProcessing(true)

    try {
      const token = localStorage.getItem('qorscend_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || ''
      const response = await fetch(`${baseUrl}/api/qdata-clean/process/${file.id}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          processingOptions: selectedOptions
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to process data: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      
      // Update local state with processed data
      setFileData(result.data.processedData);
      setMetadata(result.data.metadata);
      setPreviewData(result.data.processedData.slice(0, 10));

      const processedFile: DataFile = {
        ...file,
        data: result.data.processedData,
        processed: true,
      }

      onProcess(processedFile)
      setIsProcessing(false)

      toast({
        title: "Data Processing Complete",
        description: `Applied ${result.data.processingSteps} processing steps to ${file.name}`,
      })
    } catch (error) {
      console.error('Error processing data:', error);
      toast({
        title: "Error",
        description: "Failed to process data",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  }

  const getDataQualityScore = () => {
    return metadata.qualityScore || 0;
  }

  interface ColumnInfo {
    name: string;
    type: string;
    nullCount: number;
    uniqueValues: number;
  }

  const getColumnInfo = (): ColumnInfo[] => {
    if (!metadata.columns || metadata.columns.length === 0) return []

    return metadata.columns.map((column: string) => {
      const values = fileData.map((row: any) => row[column]).filter((val) => val !== null && val !== "")
      const nullCount = fileData.length - values.length
      const dataType = metadata.dataTypes?.[column] || 'text'

      return {
        name: column,
        type: dataType,
        nullCount,
        uniqueValues: new Set(values).size,
      }
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading file data for processing...</p>
                <p className="text-xs text-muted-foreground mt-2">This may take a moment for large files</p>
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
                <p className="text-muted-foreground">No data available for processing</p>
                <p className="text-xs text-muted-foreground mt-2">Please ensure the file has been uploaded successfully</p>
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
      {/* Data Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Data Overview
          </CardTitle>
          <CardDescription>Review your data quality and structure before processing</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Total Records</div>
              <div className="text-2xl font-bold">{metadata.recordCount?.toLocaleString() || '0'}</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Data Quality Score</div>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold">{getDataQualityScore()}%</div>
                {getDataQualityScore() >= 80 ? (
                  <CheckCircle className="h-5 w-5 text-accent" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                )}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Columns</div>
              <div className="text-2xl font-bold">{metadata.columns?.length || '0'}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Column Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Column Analysis</CardTitle>
          <CardDescription>Detailed breakdown of your data structure</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Column Name</TableHead>
                  <TableHead>Data Type</TableHead>
                  <TableHead>Unique Values</TableHead>
                  <TableHead>Missing Values</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getColumnInfo().map((column) => (
                  <TableRow key={column.name}>
                    <TableCell className="font-medium">{column.name}</TableCell>
                    <TableCell>
                      <Badge variant={column.type === "numeric" ? "default" : "secondary"}>{column.type}</Badge>
                    </TableCell>
                    <TableCell>{column.uniqueValues}</TableCell>
                    <TableCell>
                      {column.nullCount > 0 ? (
                        <Badge variant="destructive">{column.nullCount}</Badge>
                      ) : (
                        <Badge className="bg-accent text-accent-foreground">0</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Processing Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-accent" />
            Processing Options
          </CardTitle>
          <CardDescription>Select data cleaning and normalization steps to apply</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {processingOptions.map((option) => (
              <div key={option.id} className="flex items-start space-x-3">
                <Checkbox
                  id={option.id}
                  checked={selectedOptions.includes(option.id)}
                  onCheckedChange={(checked) => handleOptionChange(option.id, checked as boolean)}
                />
                <div className="space-y-1">
                  <label htmlFor={option.id} className="text-sm font-medium cursor-pointer">
                    {option.label}
                  </label>
                  <p className="text-xs text-muted-foreground">{option.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t space-y-3">
            <Button onClick={processData} disabled={isProcessing || selectedOptions.length === 0} className="w-full">
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing Data...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Process Data ({selectedOptions.length} steps)
                </>
              )}
            </Button>
            
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

      {/* Data Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Data Preview</CardTitle>
          <CardDescription>First 10 rows of your dataset</CardDescription>
        </CardHeader>
        <CardContent>
          {previewData.length > 0 ? (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                                      {Object.keys(previewData[0] || {}).map((column: string) => (
                    <TableHead key={column}>{column}</TableHead>
                  ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.map((row, index) => (
                    <TableRow key={index}>
                                              {Object.values(row).map((value, cellIndex) => (
                          <TableCell key={cellIndex} className="font-mono text-xs max-w-xs">
                            <div className="truncate" title={typeof value === 'object' && value !== null 
                              ? JSON.stringify(value, null, 2)
                              : String(value)
                            }>
                              {typeof value === 'object' && value !== null 
                                ? JSON.stringify(value)
                                : String(value)
                              }
                            </div>
                          </TableCell>
                        ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No data available for preview
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
