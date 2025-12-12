"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Search, 
  Download, 
  Receipt, 
  CreditCard, 
  Calendar,
  DollarSign,
  Eye
} from "lucide-react"
import { format } from "date-fns"

interface Invoice {
  id: string
  number: string
  date: Date
  dueDate: Date
  amount: number
  currency: string
  status: 'paid' | 'pending' | 'overdue' | 'canceled'
  description: string
  items: {
    description: string
    quantity: number
    unitPrice: number
    total: number
  }[]
}



export function BillingHistory() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch billing history from backend
  const fetchBillingHistory = async () => {
    try {
      setIsLoading(true)
      setError(null)
      console.log('📊 Fetching billing history...')
      
      const response = await fetch('/api/billing/history', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('qorscend_token')}`
        }
      })
      
      console.log('📡 Billing history response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          console.log('📊 Billing history response:', data)
          // Transform backend data to match frontend interface
          const invoicesList = data.data?.invoices || []
          const transformedInvoices = Array.isArray(invoicesList)
            ? invoicesList.map((inv: any) => ({
                id: inv.id || inv._id?.toString() || '',
                number: inv.number || inv.id || inv._id?.toString() || 'N/A',
                date: inv.date ? new Date(inv.date) : new Date(),
                dueDate: inv.dueDate ? new Date(inv.dueDate) : new Date(),
                amount: inv.amount || 0,
                currency: inv.currency || 'USD',
                status: (inv.status || 'paid') as 'paid' | 'pending' | 'overdue' | 'canceled',
                description: inv.plan || 'Subscription',
                items: [
                  {
                    description: inv.plan || 'Subscription',
                    quantity: 1,
                    unitPrice: inv.amount || 0,
                    total: inv.amount || 0
                  }
                ]
              }))
            : []
          console.log('🔄 Transformed invoices:', transformedInvoices)
          setInvoices(transformedInvoices)
        } else {
          setError(data.error || 'Failed to fetch billing history')
        }
      } else {
        console.error('❌ Billing history fetch failed:', response.status, response.statusText)
        setError('Failed to fetch billing history')
      }
    } catch (error) {
      console.error('💥 Billing history fetch error:', error)
      setError('Error fetching billing history')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchBillingHistory()
  }, [])

  const filteredInvoices = invoices.filter(invoice =>
    invoice.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusColor = (status: Invoice['status']) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'overdue':
        return 'bg-red-100 text-red-800'
      case 'canceled':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleDownloadInvoice = (invoice: Invoice) => {
    // Simulate downloading invoice
    const dataStr = JSON.stringify(invoice, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${invoice.number}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
  }

  const totalPaid = invoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.amount, 0)

  const totalPending = invoices
    .filter(inv => inv.status === 'pending')
    .reduce((sum, inv) => sum + inv.amount, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Billing History</h2>
          <p className="text-muted-foreground">
            View and download your invoices and payment history
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">Total Paid</p>
                <p className="text-2xl font-bold">${totalPaid.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-yellow-500" />
              <div>
                <p className="text-sm font-medium">Pending</p>
                <p className="text-2xl font-bold">${totalPending.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Total Invoices</p>
                <p className="text-2xl font-bold">{invoices.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-800">
            <span>❌ {error}</span>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search invoices..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Invoices List */}
      <div className="space-y-4">
        {isLoading ? (
          <Card>
            <CardContent className="text-center py-8">
              <Receipt className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Loading billing history...</p>
            </CardContent>
          </Card>
        ) : filteredInvoices.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Receipt className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No invoices found</p>
            </CardContent>
          </Card>
        ) : (
          filteredInvoices.map((invoice) => (
            <Card key={invoice.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">{invoice.number}</h3>
                      <Badge className={getStatusColor(invoice.status)}>
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground mb-2">{invoice.description}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Date: {format(invoice.date, 'MMM dd, yyyy')}</span>
                      <span>Due: {format(invoice.dueDate, 'MMM dd, yyyy')}</span>
                      <span className="font-medium text-foreground">
                        ${invoice.amount.toFixed(2)} {invoice.currency}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewInvoice(invoice)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownloadInvoice(invoice)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{selectedInvoice.number}</CardTitle>
                <CardDescription>{selectedInvoice.description}</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedInvoice(null)}
              >
                ×
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Invoice Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm font-medium">Invoice Date</p>
                <p className="text-sm text-muted-foreground">
                  {format(selectedInvoice.date, 'MMM dd, yyyy')}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Due Date</p>
                <p className="text-sm text-muted-foreground">
                  {format(selectedInvoice.dueDate, 'MMM dd, yyyy')}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Status</p>
                <Badge className={getStatusColor(selectedInvoice.status)}>
                  {selectedInvoice.status.charAt(0).toUpperCase() + selectedInvoice.status.slice(1)}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium">Total Amount</p>
                <p className="text-lg font-bold">
                  ${selectedInvoice.amount.toFixed(2)} {selectedInvoice.currency}
                </p>
              </div>
            </div>

            {/* Invoice Items */}
            <div>
              <h4 className="font-medium mb-3">Invoice Items</h4>
              <div className="space-y-2">
                {selectedInvoice.items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{item.description}</p>
                      <p className="text-sm text-muted-foreground">
                        Quantity: {item.quantity} × ${item.unitPrice.toFixed(2)}
                      </p>
                    </div>
                    <p className="font-medium">${item.total.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                onClick={() => handleDownloadInvoice(selectedInvoice)}
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Invoice
              </Button>
              {selectedInvoice.status === 'pending' && (
                <Button className="flex-1">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Pay Now
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
