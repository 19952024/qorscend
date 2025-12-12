import { NextResponse } from 'next/server'
import connectDB from '@/lib/backend/config/db'
import PaymentMethod from '@/lib/backend/models/PaymentMethod'
import { protect } from '@/lib/backend/middleware/auth-next'
import logger from '@/lib/backend/utils/logger'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// POST - Set a payment method as default
export async function POST(request, { params }) {
  try {
    await connectDB()
    
    const user = await protect(request)
    const userId = user._id ? user._id.toString() : (user.id || user._id)
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Payment method ID is required' },
        { status: 400 }
      )
    }

    // Find payment method and ensure it belongs to the user
    const paymentMethod = await PaymentMethod.findOne({
      _id: id,
      user: userId
    })

    if (!paymentMethod) {
      return NextResponse.json(
        { success: false, error: 'Payment method not found' },
        { status: 404 }
      )
    }

    // Unset all other defaults for this user
    await PaymentMethod.updateMany(
      { user: userId, _id: { $ne: id } },
      { $set: { isDefault: false } }
    )

    // Set this one as default
    paymentMethod.isDefault = true
    await paymentMethod.save()

    logger.info(`Payment method ${id} set as default for user ${userId}`)

    return NextResponse.json({
      success: true,
      data: paymentMethod
    })
  } catch (error) {
    logger.error('Error setting default payment method:', error)
    if (error.message === 'Not authorized to access this route' || error.message === 'No token provided') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to set default payment method' },
      { status: 500 }
    )
  }
}

