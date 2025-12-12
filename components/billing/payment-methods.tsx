"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { 
  CreditCard, 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle,
  AlertCircle,
  Lock
} from "lucide-react"

interface PaymentMethod {
  id: string
  type: 'card' | 'paypal'
  last4?: string
  brand?: string
  email?: string
  isDefault: boolean
  expiryMonth?: number
  expiryYear?: number
}

interface BillingAddress {
  firstName: string
  lastName: string
  address: string
  city: string
  state: string
  country: string
  zipCode: string
}

interface PaymentFormData {
  cardNumber: string
  cardholderName: string
  expiryMonth: string
  expiryYear: string
  cvv: string
}

export function PaymentMethods() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [isAddingCard, setIsAddingCard] = useState(false)
  const [isEditing, setIsEditing] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  
  // Form states
  const [paymentForm, setPaymentForm] = useState<PaymentFormData>({
    cardNumber: '',
    cardholderName: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: ''
  })
  const [billingAddress, setBillingAddress] = useState<BillingAddress>({
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    state: '',
    country: '',
    zipCode: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formErrors, setFormErrors] = useState<Partial<PaymentFormData>>({})
  const [isLoadingAddress, setIsLoadingAddress] = useState(true)

  // Debug auth context
  useEffect(() => {
    const token = localStorage.getItem('qorscend_token')
    const user = localStorage.getItem('qorscend_user')
    console.log('🔑 Auth debug - Token:', token ? 'Present' : 'Missing')
    console.log('👤 Auth debug - User:', user ? 'Present' : 'Missing')
    if (token) {
      console.log('🔑 Token value:', token.substring(0, 20) + '...')
    }
  }, [])

  const fetchPaymentMethods = async () => {
    try {
      setIsLoading(true)
      setError(null)
      console.log('🔍 Fetching payment methods...')
      const res = await fetch('/api/billing/payment-methods', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('qorscend_token')}` }
      })
      console.log('📡 Response status:', res.status)
      if (res.ok) {
        const data = await res.json()
        console.log('📊 Raw API response:', data)
        if (data.success) {
          // Handle case where data.data might be null or undefined
          const paymentMethodsData = data.data || []
          const mapped: PaymentMethod[] = Array.isArray(paymentMethodsData)
            ? paymentMethodsData.map((pm: any) => ({
                id: pm._id || pm.id || '',
                type: pm.type || 'card',
                last4: pm.last4,
                brand: pm.brand,
                email: pm.email,
                isDefault: pm.isDefault || false,
                expiryMonth: pm.expiryMonth,
                expiryYear: pm.expiryYear
              }))
            : []
          console.log('🔄 Mapped payment methods:', mapped)
          setPaymentMethods(mapped)
        } else {
          setError(data.error || 'Failed to fetch payment methods')
        }
      } else {
        let errorMessage = 'Failed to fetch payment methods'
        try {
          const errorData = await res.json()
          errorMessage = errorData.error || errorData.message || errorMessage
        } catch {
          errorMessage = res.statusText || errorMessage
        }
        console.error('❌ API error:', res.status, res.statusText)
        setError(errorMessage)
      }
    } catch (e) {
      console.error('💥 Fetch error:', e)
      setError('Error fetching payment methods')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchBillingAddress = async () => {
    try {
      setIsLoadingAddress(true)
      console.log('🏠 Fetching billing address...')
      const res = await fetch('/api/billing/address', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('qorscend_token')}` }
      })
      console.log('📡 Billing address response status:', res.status)
      if (res.ok) {
        const data = await res.json()
        console.log('📊 Billing address response:', data)
        if (data.success && data.data) {
          console.log('🏠 Setting billing address:', data.data)
          // Ensure all required fields are present
          const addressData = {
            firstName: data.data.firstName || '',
            lastName: data.data.lastName || '',
            address: data.data.address || '',
            city: data.data.city || '',
            state: data.data.state || '',
            country: data.data.country || '',
            zipCode: data.data.zipCode || ''
          }
          console.log('🏠 Processed billing address data:', addressData)
          setBillingAddress(addressData)
        } else {
          console.log('🏠 No billing address data found, keeping form empty')
          // Keep form fields empty if no data is found - let user fill in actual data
        }
      } else {
        console.log('🏠 Billing address fetch failed with status:', res.status)
        // Keep form empty on error - let user fill in actual data
      }
    } catch (e) {
      console.error('💥 Billing address fetch error:', e)
      // Keep form empty on error - let user fill in actual data
    } finally {
      setIsLoadingAddress(false)
    }
  }

  useEffect(() => { 
    fetchPaymentMethods()
    fetchBillingAddress()
  }, [])

  const validatePaymentForm = (): boolean => {
    const errors: Partial<PaymentFormData> = {}
    
    if (!paymentForm.cardNumber.replace(/\s/g, '').match(/^\d{16}$/)) {
      errors.cardNumber = 'Please enter a valid 16-digit card number'
    }
    
    if (!paymentForm.cardholderName.trim()) {
      errors.cardholderName = 'Cardholder name is required'
    }
    
    if (!paymentForm.expiryMonth.match(/^(0[1-9]|1[0-2])$/)) {
      errors.expiryMonth = 'Please enter a valid month (01-12)'
    }
    
    if (!paymentForm.expiryYear.match(/^\d{4}$/)) {
      errors.expiryYear = 'Please enter a valid 4-digit year'
    }
    
    const currentYear = new Date().getFullYear()
    if (parseInt(paymentForm.expiryYear) < currentYear) {
      errors.expiryYear = 'Card has expired'
    }
    
    if (!paymentForm.cvv.match(/^\d{3,4}$/)) {
      errors.cvv = 'Please enter a valid CVV'
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handlePaymentFormChange = (field: keyof PaymentFormData, value: string) => {
    setPaymentForm(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const handleAddPaymentMethod = async () => {
    if (!validatePaymentForm()) {
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)
      
      // Extract last 4 digits and determine brand
      const last4 = paymentForm.cardNumber.slice(-4)
      const brand = getCardBrand(paymentForm.cardNumber)
      
      const res = await fetch('/api/billing/payment-methods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('qorscend_token')}`
        },
        body: JSON.stringify({
          type: 'card',
          last4,
          brand,
          expiryMonth: parseInt(paymentForm.expiryMonth),
          expiryYear: parseInt(paymentForm.expiryYear)
        })
      })

      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          setSuccessMessage('Payment method added successfully!')
          setIsAddingCard(false)
          setPaymentForm({
            cardNumber: '',
            cardholderName: '',
            expiryMonth: '',
            expiryYear: '',
            cvv: ''
          })
          setFormErrors({})
          await fetchPaymentMethods() // Refresh the list
        } else {
          setError(data.error || 'Failed to add payment method')
        }
      } else {
        let errorMessage = 'Failed to add payment method'
        try {
          const errorData = await res.json()
          errorMessage = errorData.error || errorData.message || errorMessage
        } catch {
          errorMessage = res.statusText || errorMessage
        }
        setError(errorMessage)
      }
    } catch (e) {
      setError('Error adding payment method')
      console.error(e)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteCard = async (id: string) => {
    if (!confirm('Are you sure you want to remove this payment method?')) {
      return
    }

    try {
      setError(null)
      const res = await fetch(`/api/billing/payment-methods/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('qorscend_token')}` }
      })

      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          setSuccessMessage('Payment method removed successfully!')
          await fetchPaymentMethods() // Refresh the list
        } else {
          setError(data.error || 'Failed to remove payment method')
        }
      } else {
        let errorMessage = 'Failed to remove payment method'
        try {
          const errorData = await res.json()
          errorMessage = errorData.error || errorData.message || errorMessage
        } catch {
          errorMessage = res.statusText || errorMessage
        }
        setError(errorMessage)
      }
    } catch (e) {
      setError('Error removing payment method')
      console.error(e)
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      setError(null)
      const res = await fetch(`/api/billing/payment-methods/${id}/default`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('qorscend_token')}` }
      })

      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          setSuccessMessage('Default payment method updated!')
          await fetchPaymentMethods() // Refresh the list
        } else {
          setError(data.error || 'Failed to update default payment method')
        }
      } else {
        let errorMessage = 'Failed to update default payment method'
        try {
          const errorData = await res.json()
          errorMessage = errorData.error || errorData.message || errorMessage
        } catch {
          errorMessage = res.statusText || errorMessage
        }
        setError(errorMessage)
      }
    } catch (e) {
      setError('Error updating default payment method')
      console.error(e)
    }
  }

  const validateBillingAddress = (): boolean => {
    const { firstName, lastName, address, city, state, country, zipCode } = billingAddress
    
    if (!firstName?.trim()) {
      setError('First name is required')
      return false
    }
    if (!lastName?.trim()) {
      setError('Last name is required')
      return false
    }
    if (!address?.trim()) {
      setError('Address is required')
      return false
    }
    if (!city?.trim()) {
      setError('City is required')
      return false
    }
    if (!state?.trim()) {
      setError('State is required')
      return false
    }
    if (!country?.trim()) {
      setError('Country is required')
      return false
    }
    if (!zipCode?.trim()) {
      setError('ZIP code is required')
      return false
    }
    
    return true
  }

  const handleUpdateBillingAddress = async () => {
    // Clear any previous errors
    setError(null)
    
    // Check if billing address data is loaded
    if (!billingAddress.firstName && !billingAddress.lastName && !billingAddress.address) {
      console.log('🏠 Billing address data not loaded yet, skipping update')
      return
    }
    
    // Validate all fields are filled
    if (!validateBillingAddress()) {
      return
    }

    try {
      setIsSubmitting(true)
      
      console.log('🏠 Updating billing address with data:', billingAddress)
      console.log('🏠 Data being sent to backend:', JSON.stringify(billingAddress, null, 2))
      
      const res = await fetch('/api/billing/address', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('qorscend_token')}`
        },
        body: JSON.stringify(billingAddress)
      })

      console.log('📡 Billing address update response status:', res.status)

      if (res.ok) {
        const data = await res.json()
        console.log('📊 Billing address update response:', data)
        if (data.success) {
          setSuccessMessage('Billing address updated successfully!')
        } else {
          setError(data.error || 'Failed to update billing address')
        }
      } else {
        const errorData = await res.json()
        console.error('❌ Billing address update error:', errorData)
        setError(errorData.error || 'Failed to update billing address')
      }
    } catch (e) {
      console.error('💥 Billing address update error:', e)
      setError('Error updating billing address')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getCardBrand = (cardNumber: string): string => {
    const cleanNumber = cardNumber.replace(/\s/g, '')
    if (cleanNumber.startsWith('4')) return 'visa'
    if (cleanNumber.startsWith('5')) return 'mastercard'
    if (cleanNumber.startsWith('3')) return 'amex'
    if (cleanNumber.startsWith('6')) return 'discover'
    return 'generic'
  }

  const formatCardNumber = (value: string): string => {
    const cleanValue = value.replace(/\s/g, '').slice(0, 16)
    return cleanValue.replace(/(\d{4})/g, '$1 ').trim()
  }

  const handleAddCard = () => {
    setIsAddingCard(true)
    setError(null)
    setSuccessMessage(null)
  }

  const handleCancelAdd = () => {
    setIsAddingCard(false)
    setPaymentForm({
      cardNumber: '',
      cardholderName: '',
      expiryMonth: '',
      expiryYear: '',
      cvv: ''
    })
    setFormErrors({})
    setError(null)
  }

  const getCardIcon = (brand?: string) => {
    switch (brand?.toLowerCase()) {
      case 'visa':
        return '💳'
      case 'mastercard':
        return '💳'
      case 'amex':
        return '💳'
      default:
        return '💳'
    }
  }

  const getPaymentMethodDisplay = (pm: PaymentMethod) => {
    if (pm.type === 'card') {
      return `${pm.brand} •••• ${pm.last4}`
    } else {
      return `PayPal (${pm.email})`
    }
  }

  const getExpiryDisplay = (pm: PaymentMethod) => {
    if (pm.type === 'card' && pm.expiryMonth && pm.expiryYear) {
      return `${pm.expiryMonth.toString().padStart(2, '0')}/${pm.expiryYear}`
    }
    return null
  }

  // Clear success message after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [successMessage])

  // Debug state changes
  useEffect(() => {
    console.log('🔄 Payment methods state updated:', paymentMethods)
  }, [paymentMethods])

  useEffect(() => {
    console.log('🏠 Billing address state updated:', billingAddress)
  }, [billingAddress])

  // Debug initial state
  useEffect(() => {
    console.log('🏠 Initial billing address state:', billingAddress)
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Payment Methods</h2>
          <p className="text-muted-foreground">
            Manage your payment methods and billing information
          </p>
        </div>
        <Button onClick={handleAddCard}>
          <Plus className="h-4 w-4 mr-2" />
          Add Payment Method
        </Button>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 text-green-800">
            <CheckCircle className="h-4 w-4" />
            <span>{successMessage}</span>
          </div>
        </div>
      )}
      
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Payment Methods List */}
      <div className="space-y-4">
        {isLoading && <p>Loading payment methods...</p>}
        {!isLoading && !error && paymentMethods.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p>No payment methods added yet.</p>
              <p className="text-sm">Add your first payment method to get started.</p>
            </CardContent>
          </Card>
        )}
        {!isLoading && !error && paymentMethods.map((pm) => (
          <Card key={pm.id} className="relative">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    {pm.type === 'card' ? (
                      <CreditCard className="h-6 w-6 text-primary" />
                    ) : (
                      <span className="text-2xl">💰</span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">
                        {getPaymentMethodDisplay(pm)}
                      </h3>
                      {pm.isDefault && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Default
                        </Badge>
                      )}
                    </div>
                    {pm.type === 'card' && getExpiryDisplay(pm) && (
                      <p className="text-sm text-muted-foreground">
                        Expires {getExpiryDisplay(pm)}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {!pm.isDefault && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSetDefault(pm.id)}
                    >
                      Set Default
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteCard(pm.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add New Card Form */}
      {isAddingCard && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Payment Method</CardTitle>
            <CardDescription>
              Add a new credit or debit card to your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="card-number">Card Number</Label>
                <Input
                  id="card-number"
                  placeholder="1234 5678 9012 3456"
                  value={paymentForm.cardNumber}
                  onChange={(e) => handlePaymentFormChange('cardNumber', formatCardNumber(e.target.value))}
                  maxLength={19}
                  className={formErrors.cardNumber ? 'border-red-500' : ''}
                />
                {formErrors.cardNumber && (
                  <p className="text-sm text-red-500">{formErrors.cardNumber}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="card-holder">Cardholder Name</Label>
                <Input
                  id="card-holder"
                  placeholder="John Doe"
                  value={paymentForm.cardholderName}
                  onChange={(e) => handlePaymentFormChange('cardholderName', e.target.value)}
                  className={formErrors.cardholderName ? 'border-red-500' : ''}
                />
                {formErrors.cardholderName && (
                  <p className="text-sm text-red-500">{formErrors.cardholderName}</p>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expiry-month">Expiry Month</Label>
                <Input
                  id="expiry-month"
                  placeholder="MM"
                  value={paymentForm.expiryMonth}
                  onChange={(e) => handlePaymentFormChange('expiryMonth', e.target.value)}
                  maxLength={2}
                  className={formErrors.expiryMonth ? 'border-red-500' : ''}
                />
                {formErrors.expiryMonth && (
                  <p className="text-sm text-red-500">{formErrors.expiryMonth}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiry-year">Expiry Year</Label>
                <Input
                  id="expiry-year"
                  placeholder="YYYY"
                  value={paymentForm.expiryYear}
                  onChange={(e) => handlePaymentFormChange('expiryYear', e.target.value)}
                  maxLength={4}
                  className={formErrors.expiryYear ? 'border-red-500' : ''}
                />
                {formErrors.expiryYear && (
                  <p className="text-sm text-red-500">{formErrors.expiryYear}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="cvv">CVV</Label>
                <Input
                  id="cvv"
                  placeholder="123"
                  value={paymentForm.cvv}
                  onChange={(e) => handlePaymentFormChange('cvv', e.target.value)}
                  maxLength={4}
                  className={formErrors.cvv ? 'border-red-500' : ''}
                />
                {formErrors.cvv && (
                  <p className="text-sm text-red-500">{formErrors.cvv}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Lock className="h-4 w-4" />
              <span>Your payment information is encrypted and secure</span>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCancelAdd} variant="outline">
                Cancel
              </Button>
              <Button 
                onClick={handleAddPaymentMethod}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Adding...' : 'Add Payment Method'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security Notice */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-green-500" />
            Security & Privacy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
            <div>
              <p className="font-medium">PCI DSS Compliant</p>
              <p className="text-sm text-muted-foreground">
                We follow the highest security standards for payment processing
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
            <div>
              <p className="font-medium">Encrypted Data</p>
              <p className="text-sm text-muted-foreground">
                All payment information is encrypted using industry-standard protocols
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
            <div>
              <p className="font-medium">Secure Storage</p>
              <p className="text-sm text-muted-foreground">
                Payment methods are securely stored and never shared with third parties
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Billing Address */}
      <Card>
        <CardHeader>
          <CardTitle>Billing Address</CardTitle>
          <CardDescription>
            Update your billing address for invoices and receipts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoadingAddress && (
            <div className="text-center py-4">
              <p className="text-muted-foreground">Loading billing address...</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first-name">First Name</Label>
              <Input 
                id="first-name" 
                placeholder="John"
                value={billingAddress.firstName}
                onChange={(e) => setBillingAddress(prev => ({ ...prev, firstName: e.target.value }))}
                disabled={isLoadingAddress}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last-name">Last Name</Label>
              <Input 
                id="last-name" 
                placeholder="Doe"
                value={billingAddress.lastName}
                onChange={(e) => setBillingAddress(prev => ({ ...prev, lastName: e.target.value }))}
                disabled={isLoadingAddress}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input 
              id="address" 
              placeholder="123 Main Street"
              value={billingAddress.address}
              onChange={(e) => setBillingAddress(prev => ({ ...prev, address: e.target.value }))}
              disabled={isLoadingAddress}
            />
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input 
                id="city" 
                placeholder="New York"
                value={billingAddress.city}
                onChange={(e) => setBillingAddress(prev => ({ ...prev, city: e.target.value }))}
                disabled={isLoadingAddress}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input 
                id="state" 
                placeholder="NY"
                value={billingAddress.state}
                onChange={(e) => setBillingAddress(prev => ({ ...prev, state: e.target.value }))}
                disabled={isLoadingAddress}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zip">ZIP Code</Label>
              <Input 
                id="zip" 
                placeholder="10001"
                value={billingAddress.zipCode}
                onChange={(e) => setBillingAddress(prev => ({ ...prev, zipCode: e.target.value }))}
                disabled={isLoadingAddress}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Input 
              id="country" 
              placeholder="United States"
              value={billingAddress.country}
              onChange={(e) => setBillingAddress(prev => ({ ...prev, country: e.target.value }))}
              disabled={isLoadingAddress}
            />
          </div>
          
          <Button 
            onClick={handleUpdateBillingAddress}
            disabled={isSubmitting || isLoadingAddress}
          >
            {isLoadingAddress ? 'Loading...' : isSubmitting ? 'Updating...' : 'Update Billing Address'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
