"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Copy, ArrowRight, Zap, CheckCircle, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const libraries = [
  { value: "qiskit", label: "Qiskit", description: "IBM's quantum computing framework" },
  { value: "cirq", label: "Cirq", description: "Google's quantum computing framework" },
  { value: "braket", label: "Amazon Braket", description: "AWS quantum computing service" },
  { value: "pennylane", label: "PennyLane", description: "Quantum machine learning library" },
  { value: "pyquil", label: "PyQuil", description: "Rigetti's quantum programming language" },
]

const exampleCode = {
  qiskit: `from qiskit import QuantumCircuit, execute, Aer
from qiskit.visualization import plot_histogram

# Create a quantum circuit
qc = QuantumCircuit(2, 2)
qc.h(0)  # Hadamard gate on qubit 0
qc.cx(0, 1)  # CNOT gate
qc.measure_all()

# Execute the circuit
backend = Aer.get_backend('qasm_simulator')
job = execute(qc, backend, shots=1024)
result = job.result()
counts = result.get_counts(qc)
print(counts)`,
  cirq: `import cirq
import numpy as np

# Create qubits
q0, q1 = cirq.LineQubit.range(2)

# Create a circuit
circuit = cirq.Circuit()
circuit.append(cirq.H(q0))  # Hadamard gate
circuit.append(cirq.CNOT(q0, q1))  # CNOT gate
circuit.append(cirq.measure(q0, q1, key='result'))

# Simulate the circuit
simulator = cirq.Simulator()
result = simulator.run(circuit, repetitions=1024)
print(result.histogram(key='result'))`,
}

export function CodeConverter({ onConversionComplete }: { onConversionComplete?: () => void }) {
  const [sourceLibrary, setSourceLibrary] = useState("")
  const [targetLibrary, setTargetLibrary] = useState("")
  const [inputCode, setInputCode] = useState("")
  const [outputCode, setOutputCode] = useState("")
  const [isConverting, setIsConverting] = useState(false)
  const [conversionStatus, setConversionStatus] = useState<"idle" | "success" | "error">("idle")
  const { toast } = useToast()

  const handleConvert = async () => {
    if (!sourceLibrary || !targetLibrary || !inputCode.trim()) {
      toast({
        title: "Missing Information",
        description: "Please select source and target libraries and provide input code.",
        variant: "destructive",
      })
      return
    }

    // Check if source and target libraries are different
    if (sourceLibrary === targetLibrary) {
      toast({
        title: "Invalid Selection",
        description: "Source and target libraries must be different. Please select different libraries.",
        variant: "destructive",
      })
      return
    }

    setIsConverting(true)
    setConversionStatus("idle")

    try {
      const apiUrl = ''
      console.log('Calling API:', `/api/convert`)
      
      // Prepare headers - in development mode, try to get token but don't fail if missing
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      const token = localStorage.getItem('qorscend_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      } else {
        // Check if we're in development mode
        const isDevelopment = process.env.NODE_ENV === 'development' || 
                             window.location.hostname === 'localhost' ||
                             window.location.hostname === '127.0.0.1';
        
        if (isDevelopment) {
          console.log('Development mode: no authentication token, proceeding without auth');
        }
      }
      
      // Call backend conversion endpoint
      const response = await fetch(`/api/convert`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          sourceLibrary,
          targetLibrary,
          sourceCode: inputCode
        })
      })

      console.log('Request payload:', { sourceLibrary, targetLibrary, sourceCodeLength: inputCode.length })
      console.log('Response status:', response.status)
      console.log('Response headers:', response.headers)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Response error:', errorText)
        
        // Handle specific error cases
        if (response.status === 401) {
          throw new Error('Authentication required. Please log in to use this feature.');
        } else if (response.status === 400) {
          // Parse the error message to handle specific validation errors
          try {
            const errorData = JSON.parse(errorText);
            if (errorData.error === 'Source and target libraries must be different') {
              throw new Error('Source and target libraries must be different. Please select different libraries.');
            } else {
              throw new Error(errorData.error || 'Invalid request data');
            }
          } catch (parseError) {
            throw new Error(`HTTP ${response.status}: ${errorText || 'Conversion failed'}`);
          }
        } else if (response.status === 500) {
          throw new Error('Server error occurred. Please try again later.');
        } else {
          throw new Error(`HTTP ${response.status}: ${errorText || 'Conversion failed'}`);
        }
      }

      const data = await response.json()
      console.log('Response data:', data)
      console.log('Response data structure:', {
        success: data.success,
        hasData: !!data.data,
        dataKeys: data.data ? Object.keys(data.data) : 'no data',
        hasConversion: !!data.data?.conversion,
        conversionKeys: data.data?.conversion ? Object.keys(data.data.conversion) : 'no conversion',
        convertedCode: data.data?.conversion?.convertedCode,
        fullData: data.data
      })
      
      if (data.success) {
        // Try different possible data structures
        const convertedCode = data.data?.conversion?.convertedCode || 
                             data.data?.convertedCode || 
                             data.convertedCode ||
                             'No converted code received';
        
        console.log('Setting output code:', convertedCode)
        setOutputCode(convertedCode)
        setConversionStatus("success")
        console.log('Output code state set, conversion status set to success')
        toast({
          title: "Conversion Successful",
          description: `Code successfully converted from ${sourceLibrary} to ${targetLibrary}`,
        })
        onConversionComplete?.();
      } else {
        throw new Error(data.error || 'Conversion failed')
      }
    } catch (error) {
      console.error('Conversion error:', error)
      setConversionStatus("error")
      
      let errorMessage = "Failed to convert code. Please try again."
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          errorMessage = "Unable to connect to the server. Please check if the backend is running."
        } else if (error.message.includes('Authentication required')) {
          errorMessage = error.message
        } else if (error.message.includes('HTTP 500')) {
          errorMessage = "Server error occurred. Please try again later."
        } else {
          errorMessage = error.message
        }
      }
      
      toast({
        title: "Conversion Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsConverting(false)
    }
  }

  const handleCopyOutput = async () => {
    if (outputCode) {
      await navigator.clipboard.writeText(outputCode)
      toast({
        title: "Copied to Clipboard",
        description: "Converted code has been copied to your clipboard.",
      })
    }
  }

  const loadExample = (library: string) => {
    const example = exampleCode[library as keyof typeof exampleCode]
    if (example) {
      setInputCode(example)
      setSourceLibrary(library)
      
      // Set a different target library to avoid the "must be different" error
      const availableLibraries = libraries.filter(lib => lib.value !== library)
      if (availableLibraries.length > 0) {
        // Choose the first available different library
        setTargetLibrary(availableLibraries[0].value)
      }
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Source Code
          </CardTitle>
          <CardDescription>Paste your quantum code and select the source library</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Source Library</label>
            <Select value={sourceLibrary} onValueChange={setSourceLibrary}>
              <SelectTrigger>
                <SelectValue placeholder="Select source library" />
              </SelectTrigger>
              <SelectContent>
                {libraries.map((lib) => (
                  <SelectItem key={lib.value} value={lib.value}>
                    <div className="flex flex-col">
                      <span>{lib.label}</span>
                      <span className="text-xs text-muted-foreground">{lib.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Target Library</label>
            <Select value={targetLibrary} onValueChange={setTargetLibrary}>
              <SelectTrigger>
                <SelectValue placeholder="Select target library" />
              </SelectTrigger>
              <SelectContent>
                {libraries.map((lib) => (
                  <SelectItem key={lib.value} value={lib.value}>
                    <div className="flex flex-col">
                      <span>{lib.label}</span>
                      <span className="text-xs text-muted-foreground">{lib.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Input Code</label>
              <div className="flex gap-2">
                {Object.keys(exampleCode).map((lib) => (
                  <Button key={lib} variant="outline" size="sm" onClick={() => loadExample(lib)} className="text-xs">
                    {lib}
                  </Button>
                ))}
              </div>
            </div>
            <Textarea
              placeholder="Paste your quantum code here..."
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              className="min-h-[300px] font-mono text-sm"
            />
          </div>

          <Button 
            onClick={handleConvert} 
            disabled={isConverting || !sourceLibrary || !targetLibrary || !inputCode.trim() || sourceLibrary === targetLibrary} 
            className="w-full"
          >
            {isConverting ? (
              "Converting..."
            ) : (
              <>
                Convert Code
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
          
          {/* Show current library selections */}
          {sourceLibrary && targetLibrary && (
            <div className="text-sm text-muted-foreground text-center">
              {sourceLibrary === targetLibrary ? (
                <span className="text-destructive">Please select different source and target libraries</span>
              ) : (
                <>Converting from <span className="font-medium text-foreground">{sourceLibrary}</span> to <span className="font-medium text-foreground">{targetLibrary}</span></>
              )}
            </div>
          )}
          
          {/* Development mode indicator */}
          {process.env.NODE_ENV === 'development' && (
            <div className="text-xs text-muted-foreground text-center">
              🚀 Development Mode - Authentication Bypassed
            </div>
          )}
          
          {/* Debug information in development mode */}
          {process.env.NODE_ENV === 'development' && (
            <div className="text-xs text-muted-foreground text-center p-2 bg-muted rounded">
              <div>Debug Info:</div>
              <div>outputCode length: {outputCode?.length || 0}</div>
              <div>conversionStatus: {conversionStatus}</div>
              <div>outputCode preview: {outputCode?.substring(0, 50) || 'none'}...</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Output Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-accent" />
            Converted Code
            {conversionStatus === "success" && <Badge className="bg-accent text-accent-foreground">Success</Badge>}
            {conversionStatus === "error" && <Badge variant="destructive">Error</Badge>}
          </CardTitle>
          <CardDescription>Your converted quantum code ready to use</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Output Code</label>
              {outputCode && (
                <Button variant="outline" size="sm" onClick={handleCopyOutput}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
              )}
            </div>
            <Textarea
              placeholder="Converted code will appear here..."
              value={outputCode}
              readOnly
              className="min-h-[300px] font-mono text-sm bg-muted/50"
            />
          </div>

          {conversionStatus === "success" && (
            <div className="p-4 bg-accent/10 border border-accent/20 rounded-lg">
              <div className="flex items-center gap-2 text-accent">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Conversion Complete</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Code has been successfully converted and is ready to use in your target environment.
              </p>
            </div>
          )}

          {conversionStatus === "error" && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Conversion Error</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Unable to convert the code. Please check your input and try again.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
