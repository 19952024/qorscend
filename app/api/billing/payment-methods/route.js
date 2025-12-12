import { NextResponse } from 'next/server'
import connectDB from '@/lib/backend/config/db'
import PaymentMethod from '@/lib/backend/models/PaymentMethod'
import { protect } from '@/lib/backend/middleware/auth-next'
import logger from '@/lib/backend/utils/logger'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET - Fetch all payment methods for the user
export async function GET(request) {
  try {
    await connectDB()
    
    const user = await protect(request)
    const userId = user._id ? user._id.toString() : (user.id || user._id)

    // Get payment methods for the user
    const paymentMethods = await PaymentMethod.find({ user: userId })
      .sort({ isDefault: -1, createdAt: -1 })
      .lean()

    return NextResponse.json({
      success: true,
      data: paymentMethods
    })
  } catch (error) {
    logger.error('Error fetching payment methods:', error)
    if (error.message === 'Not authorized to access this route' || error.message === 'No token provided') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payment methods' },
      { status: 500 }
    )
  }
}

// POST - Add a new payment method
export async function POST(request) {
  try {
    await connectDB()
    
    const user = await protect(request)
    const userId = user._id ? user._id.toString() : (user.id || user._id)
    const body = await request.json().catch(() => ({}))

    const { type, last4, brand, email, expiryMonth, expiryYear } = body

    // Validate required fields
    if (!type) {
      return NextResponse.json(
        { success: false, error: 'Payment method type is required' },
        { status: 400 }
      )
    }

    if (type === 'card' && (!last4 || !brand)) {
      return NextResponse.json(
        { success: false, error: 'Card number and brand are required for card payment methods' },
        { status: 400 }
      )
    }

    if (type === 'paypal' && !email) {
      return NextResponse.json(
        { success: false, error: 'Email is required for PayPal payment methods' },
        { status: 400 }
      )
    }

    // Check if this will be the first payment method (make it default)
    const existingMethods = await PaymentMethod.countDocuments({ user: userId })
    const isDefault = existingMethods === 0

    // If setting as default, unset other defaults
    if (isDefault) {
      await PaymentMethod.updateMany(
        { user: userId },
        { $set: { isDefault: false } }
      )
    }

    // Create payment method
    const paymentMethod = await PaymentMethod.create({
      user: userId,
      type,
      last4: type === 'card' ? last4 : undefined,
      brand: type === 'card' ? brand : undefined,
      email: type === 'paypal' ? email : undefined,
      expiryMonth: type === 'card' ? expiryMonth : undefined,
      expiryYear: type === 'card' ? expiryYear : undefined,
      isDefault
    })

    logger.info(`Payment method created for user ${userId}`)

    return NextResponse.json({
      success: true,
      data: paymentMethod
    }, { status: 201 })
  } catch (error) {
    logger.error('Error creating payment method:', error)
    if (error.message === 'Not authorized to access this route' || error.message === 'No token provided') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      )
    }
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create payment method' },
      { status: 500 }
    )
  }
}

