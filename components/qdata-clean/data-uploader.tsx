"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Upload, FileText, Database, CheckCircle, AlertCircle, Trash2, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { DataFile } from "@/app/dashboard/qdata-clean/page"

interface DataUploaderProps {
  onFileUpload: (file: DataFile) => void
  uploadedFiles: DataFile[]
  onFileSelect: (file: DataFile) => void
  onRefreshFiles?: () => void
  isLoading?: boolean
}

export function DataUploader({ onFileUpload, uploadedFiles, onFileSelect, onRefreshFiles, isLoading = false }: DataUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [fileToDelete, setFileToDelete] = useState<DataFile | null>(null)
  const { toast } = useToast()

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const processFile = async (file: File): Promise<DataFile> => {
    const text = await file.text()
    let data: any[] = []

    try {
      if (file.name.endsWith(".json")) {
        const parsed = JSON.parse(text)
        data = Array.isArray(parsed) ? parsed : [parsed]
      } else if (file.name.endsWith(".csv")) {
        const lines = text.split("\n").filter((line) => line.trim())
        const headers = lines[0].split(",").map((h) => h.trim())
        data = lines.slice(1).map((line) => {
          const values = line.split(",").map((v) => v.trim())
          const obj: any = {}
          headers.forEach((header, index) => {
            obj[header] = values[index] || ""
          })
          return obj
        })
      }
    } catch (error) {
      throw new Error("Failed to parse file")
    }

    return {
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      type: file.type || "application/octet-stream",
      size: file.size,
      data,
      processed: false,
      uploadedAt: new Date(),
    }
  }

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      const files = Array.from(e.dataTransfer.files)
      await handleFiles(files)
    },
    [onFileUpload],
  )

  const handleFileInput = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || [])
      await handleFiles(files)
    },
    [onFileUpload],
  )

  const handleViewRaw = async (file: DataFile) => {
    try {
      const token = localStorage.getItem('qorscend_token');
      const headers: Record<string, string> = {};
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const response = await fetch(`${baseUrl}/api/qdata-clean/files/${file.id}/raw`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error('Failed to fetch raw content');
      }

      const result = await response.json();
      
      // Show raw content in a new window or modal
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head><title>Raw Content - ${file.name}</title></head>
            <body>
              <h1>Raw Content: ${file.name}</h1>
              <pre style="white-space: pre-wrap; font-family: monospace; padding: 20px;">${result.data.content}</pre>
            </body>
          </html>
        `);
      }
    } catch (error) {
      console.error('Error viewing raw content:', error);
      toast({
        title: "Error",
        description: "Failed to view raw content",
        variant: "destructive",
      });
    }
  };

  const handleDeleteFile = async (file: DataFile) => {
    setFileToDelete(file);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!fileToDelete) return;

    try {
      const token = localStorage.getItem('qorscend_token');
      const headers: Record<string, string> = {};
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://qorscend-backend.onrender.com'}/api/qdata-clean/files/${fileToDelete.id}`, {
        method: 'DELETE',
        headers
      });

      if (!response.ok) {
        throw new Error('Failed to delete file');
      }

      toast({
        title: "File Deleted",
        description: `${fileToDelete.name} has been deleted successfully.`,
      });

      // Refresh the file list after successful deletion
      if (onRefreshFiles) {
        onRefreshFiles();
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: "Error",
        description: "Failed to delete file",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setFileToDelete(null);
    }
  };

  const handleFiles = async (files: File[]) => {
    for (const file of files) {
      if (!file.name.endsWith(".json") && !file.name.endsWith(".csv")) {
        toast({
          title: "Unsupported File Type",
          description: "Please upload JSON or CSV files only.",
          variant: "destructive",
        })
        continue
      }

      setIsUploading(true)
      setUploadProgress(0)

      try {
        // Use direct file upload instead of presigned URLs
        const token = localStorage.getItem('qorscend_token');
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const formData = new FormData();
        formData.append('file', file);
        
        const headers: Record<string, string> = {};
        
        // Only add authorization if token exists
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }
        
        // Direct file upload
        const uploadResponse = await fetch(`${baseUrl}/api/files/upload`, {
          method: 'POST',
          headers,
          body: formData
        })

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          console.error('File upload error:', {
            status: uploadResponse.status,
            statusText: uploadResponse.statusText,
            body: errorText
          });
          throw new Error(`Failed to upload file: ${uploadResponse.status} ${uploadResponse.statusText} - ${errorText}`);
        }

        const uploadResult = await uploadResponse.json();
        
        // Update progress
        setUploadProgress(50)

        // Register file with QData Clean backend
        const registerHeaders: Record<string, string> = {
          'Content-Type': 'application/json'
        };
        
        // Only add authorization if token exists
        if (token) {
          registerHeaders.Authorization = `Bearer ${token}`;
        }
        
        const registerResponse = await fetch(`${baseUrl}/api/qdata-clean/upload`, {
          method: 'POST',
          headers: registerHeaders,
          body: JSON.stringify({
            filename: uploadResult.filename,
            originalName: file.name,
            contentType: file.type,
            size: file.size
          })
        })

        if (!registerResponse.ok) {
          const errorText = await registerResponse.text();
          console.error('QData Clean registration error:', {
            status: registerResponse.status,
            statusText: registerResponse.statusText,
            body: errorText
          });
          throw new Error(`Failed to register file: ${registerResponse.status} ${registerResponse.statusText} - ${errorText}`);
        }

        setUploadProgress(100)

        // Get the registration result and create data file object
        const registerResult = await registerResponse.json();
        const dataFile: DataFile = {
          id: registerResult.data.file.id,
          name: file.name,
          type: file.type,
          size: file.size,
          data: [], // Will be populated when needed
          processed: false,
          uploadedAt: new Date(registerResult.data.file.uploadedAt),
          recordCount: registerResult.data.file.recordCount,
          metadata: registerResult.data.file.metadata
        };
        
        onFileUpload(dataFile)

        toast({
          title: "File Uploaded Successfully",
          description: `${file.name} has been uploaded and is ready for processing.`,
        })
      } catch (error) {
        console.error('Upload error:', error)
        toast({
          title: "Upload Failed",
          description: `Failed to upload ${file.name}. Please try again.`,
          variant: "destructive",
        })
      } finally {
        setIsUploading(false)
        setUploadProgress(0)
      }
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Upload Quantum Data
          </CardTitle>
          <CardDescription>
            Upload JSON or CSV files containing quantum experiment results for processing and analysis.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="space-y-4">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-medium">Drop files here or click to browse</h3>
                <p className="text-sm text-muted-foreground">Supports JSON and CSV files up to 10MB</p>
              </div>
              <div className="flex justify-center gap-2">
                <Badge variant="outline">JSON</Badge>
                <Badge variant="outline">CSV</Badge>
              </div>
              <input
                type="file"
                multiple
                accept=".json,.csv"
                onChange={handleFileInput}
                className="hidden"
                id="file-upload"
              />
              <Button asChild>
                <label htmlFor="file-upload" className="cursor-pointer">
                  Select Files
                </label>
              </Button>
            </div>
          </div>

          {isUploading && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Uploading and processing...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-accent" />
                <div>
                  <CardTitle>Uploaded Files</CardTitle>
                  <CardDescription>Manage your uploaded quantum data files</CardDescription>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onRefreshFiles?.()}
                title="Refresh file list"
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {uploadedFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => onFileSelect(file)}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">{file.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatFileSize(file.size)} • {file.recordCount || file.data.length} records • {file.uploadedAt.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {file.processed ? (
                      <Badge className="bg-accent text-accent-foreground">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Processed
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Raw
                      </Badge>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewRaw(file);
                      }}
                      title="View raw content"
                    >
                      <FileText className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFile(file);
                      }}
                      title="Delete file"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete File</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{fileToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
