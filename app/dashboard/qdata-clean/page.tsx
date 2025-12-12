"use client"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { DataUploader } from "@/components/qdata-clean/data-uploader"
import { DataProcessor } from "@/components/qdata-clean/data-processor"
import { DataVisualizer } from "@/components/qdata-clean/data-visualizer"
import { DataExporter } from "@/components/qdata-clean/data-exporter"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

export interface DataFile {
  id: string
  name: string
  type: string
  size: number
  data: any[]
  processed: boolean
  uploadedAt: Date
  recordCount?: number
  metadata?: any
}

export default function QDataCleanPage() {
  const [uploadedFiles, setUploadedFiles] = useState<DataFile[]>([])
  const [activeFile, setActiveFile] = useState<DataFile | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [lastLoaded, setLastLoaded] = useState<number>(0)

  // Load files from backend
  const loadFilesFromBackend = async (forceRefresh = false) => {
    try {
      // Check if we have recent data and don't need to refresh
      const now = Date.now()
      const dataAge = now - lastLoaded
      const hasRecentData = dataAge < 2 * 60 * 1000 // 2 minutes
      
      if (!forceRefresh && hasRecentData && uploadedFiles.length > 0) {
        console.log('Using cached files, last loaded:', new Date(lastLoaded).toLocaleTimeString())
        return
      }

      setIsLoading(true);
      const token = localStorage.getItem('qorscend_token');
      const headers: Record<string, string> = {};
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const response = await fetch(`/api/qdata-clean/files`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error('Failed to load files');
      }

      const result = await response.json();
      const files: DataFile[] = result.data.files.map((file: any) => ({
        id: file._id,
        name: file.originalName,
        type: file.fileType,
        size: file.fileSize,
        data: [],
        processed: file.status === 'processed',
        uploadedAt: new Date(file.createdAt),
        recordCount: file.data?.metadata?.recordCount || 0,
        metadata: file.data?.metadata || {}
      }));
      
      setUploadedFiles(files);
      setLastLoaded(now);
      
      // Restore active file if it was previously selected
      if (!activeFile && files.length > 0) {
        const savedActiveFileId = localStorage.getItem('qdata_active_file_id');
        if (savedActiveFileId) {
          const savedFile = files.find(f => f.id === savedActiveFileId);
          if (savedFile) {
            setActiveFile(savedFile);
          }
        }
      }
      
      console.log(`Files loaded successfully: ${files.length} files, last loaded: ${new Date(now).toLocaleTimeString()}`);
    } catch (error) {
      console.error('Error loading files:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load files when component mounts
  useEffect(() => {
    loadFilesFromBackend();
  }, []);

  // Auto-refresh files every 5 minutes to keep them fresh
  useEffect(() => {
    const interval = setInterval(() => {
      if (uploadedFiles.length > 0) {
        loadFilesFromBackend();
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [uploadedFiles.length]);

  // Persist active file selection
  useEffect(() => {
    if (activeFile) {
      localStorage.setItem('qdata_active_file_id', activeFile.id);
    }
  }, [activeFile]);

  const handleFileUpload = (file: DataFile) => {
    setUploadedFiles((prev) => [...prev, file])
    setActiveFile(file)
  }

  const handleFileProcess = (processedFile: DataFile) => {
    setUploadedFiles((prev) => prev.map((f) => (f.id === processedFile.id ? processedFile : f)))
    setActiveFile(processedFile)
  }

  const handleFileSelect = (file: DataFile) => {
    setActiveFile(file);
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">QData Clean™</h1>
              <p className="text-muted-foreground">
                Upload, clean, normalize, and visualize quantum experiment data with powerful analytics tools.
                {lastLoaded > 0 && (
                  <span className="block text-xs text-muted-foreground mt-1">
                    Last updated: {new Date(lastLoaded).toLocaleTimeString()}
                  </span>
                )}
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => loadFilesFromBackend(true)}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh Files
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="upload" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="upload">Upload Data</TabsTrigger>
            <TabsTrigger value="process" disabled={!activeFile}>
              Process & Clean
            </TabsTrigger>
            <TabsTrigger value="visualize" disabled={!activeFile?.processed}>
              Visualize
            </TabsTrigger>
            <TabsTrigger value="export" disabled={!activeFile?.processed}>
              Export
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            <DataUploader 
              onFileUpload={handleFileUpload} 
              uploadedFiles={uploadedFiles} 
              onFileSelect={handleFileSelect}
              onRefreshFiles={() => loadFilesFromBackend(true)}
              isLoading={isLoading}
            />
          </TabsContent>

          <TabsContent value="process" className="space-y-6">
            {activeFile && <DataProcessor file={activeFile} onProcess={handleFileProcess} />}
          </TabsContent>

          <TabsContent value="visualize" className="space-y-6">
            {activeFile && <DataVisualizer file={activeFile} />}
          </TabsContent>

          <TabsContent value="export" className="space-y-6">
            {activeFile && <DataExporter file={activeFile} />}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
