"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Download, FileText, Database, ImageIcon, CheckCircle, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { DataFile } from "@/app/dashboard/qdata-clean/page"

interface DataExporterProps {
  file: DataFile
}

const exportFormats = [
  { value: "csv", label: "CSV", description: "Comma-separated values", icon: FileText },
  { value: "json", label: "JSON", description: "JavaScript Object Notation", icon: Database },
  { value: "xlsx", label: "Excel", description: "Microsoft Excel format", icon: ImageIcon },
  { value: "png", label: "PNG Chart", description: "Chart as PNG image", icon: ImageIcon },
]

const exportOptions = [
  { id: "include_metadata", label: "Include metadata", description: "Add processing information and timestamps" },
  { id: "include_statistics", label: "Include statistics", description: "Add statistical summary" },
  { id: "compress_output", label: "Compress output", description: "Create ZIP archive for large files" },
]

export function DataExporter({ file }: DataExporterProps) {
  const [exportFormat, setExportFormat] = useState("csv")
  const [selectedOptions, setSelectedOptions] = useState<string[]>(["include_metadata"])
  const [isExporting, setIsExporting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [fileData, setFileData] = useState<any[]>([])
  const [metadata, setMetadata] = useState<any>({})
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Fetch file data from backend
  const loadFileData = async () => {
    try {
      setError(null);
      setIsLoading(true);
      
      const token = localStorage.getItem('qorscend_token');
      const headers: Record<string, string> = {};
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
      console.log(`🔍 Loading export data for file: ${file.id}`);
      const apiUrl = `${baseUrl}/api/qdata-clean/files/${file.id}/data`;
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Backend returned error');
      }
      
      const newData = result.data.parsedData || [];
      const newMetadata = result.data.metadata || {};
      
      console.log(`✅ Export data loaded: ${newData.length} rows`);
      
      setFileData(newData);
      setMetadata(newMetadata);
      
    } catch (error) {
      console.error('❌ Error loading export data:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Load data when component mounts
  useEffect(() => {
    loadFileData();
  }, [file.id]);

  const handleOptionChange = (optionId: string, checked: boolean) => {
    setSelectedOptions((prev) => (checked ? [...prev, optionId] : prev.filter((id) => id !== optionId)))
  }

  const generateFileName = () => {
    const timestamp = new Date().toISOString().split("T")[0]
    const baseName = file.name.replace(/\.[^/.]+$/, "")
    return `${baseName}_processed_${timestamp}.${exportFormat}`
  }

  const exportData = async () => {
    setIsExporting(true)

    try {
      const token = localStorage.getItem('qorscend_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      // Call backend export endpoint
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const response = await fetch(`${baseUrl}/api/qdata-clean/export/${file.id}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          format: exportFormat,
          options: selectedOptions,
          dataRows: fileData // send the in-memory processed data to ensure CSV/XLSX match what the UI shows
        })
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Create and download file
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = generateFileName();
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: `${generateFileName()} has been downloaded to your device.`,
      })

    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false);
    }
  }

  const getFileSize = () => {
    if (fileData.length === 0) return "0 KB";
    const dataString = JSON.stringify(fileData);
    const sizeInBytes = new Blob([dataString]).size;
    return (sizeInBytes / 1024).toFixed(1) + " KB";
  }

  const getRecordCount = () => {
    return fileData.length > 0 ? fileData.length : (file.recordCount || 0);
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading export data...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <p className="text-destructive font-medium">Failed to load export data</p>
                <p className="text-sm text-muted-foreground mt-2">{error}</p>
                <Button 
                  variant="outline" 
                  onClick={loadFileData} 
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

  return (
    <div className="space-y-6">
      {/* Export Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            Export Summary
          </CardTitle>
          <CardDescription>Review your processed data before export</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">File Name</div>
              <div className="font-medium">{file.name}</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Records</div>
              <div className="font-medium">{getRecordCount().toLocaleString()}</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Size</div>
              <div className="font-medium">{getFileSize()}</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Status</div>
              <Badge className="bg-accent text-accent-foreground">
                <CheckCircle className="h-3 w-3 mr-1" />
                Processed
              </Badge>
            </div>
          </div>
          
          {/* Data Preview */}
          {fileData.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <div className="text-sm font-medium mb-2">Data Preview (First 3 columns):</div>
              <div className="text-xs text-muted-foreground">
                {Object.keys(fileData[0] || {}).slice(0, 3).join(', ')}...
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Export Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Export Configuration</CardTitle>
          <CardDescription>Choose your export format and options</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Format Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Export Format</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {exportFormats.map((format) => (
                <div
                  key={format.value}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    exportFormat === format.value ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                  }`}
                  onClick={() => setExportFormat(format.value)}
                >
                  <div className="flex items-center gap-3">
                    <format.icon className="h-5 w-5 text-primary" />
                    <div>
                      <div className="font-medium">{format.label}</div>
                      <div className="text-sm text-muted-foreground">{format.description}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Export Options */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Export Options</label>
            <div className="space-y-3">
              {exportOptions.map((option) => (
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
          </div>

          {/* Export Button */}
          <div className="pt-4 border-t">
            <Button onClick={exportData} disabled={isExporting || fileData.length === 0} className="w-full" size="lg">
              {isExporting ? (
                "Exporting..."
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export as {exportFormat.toUpperCase()} ({generateFileName()})
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Export History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Exports</CardTitle>
          <CardDescription>Your recent data exports and downloads</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="font-medium">quantum-experiment-data_processed_2024-01-15.csv</div>
                  <div className="text-sm text-muted-foreground">Exported 2 hours ago • 500 records</div>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                <Download className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Database className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="font-medium">quantum-experiment-data_processed_2024-01-14.json</div>
                  <div className="text-sm text-muted-foreground">Exported yesterday • 500 records</div>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
