import { NextResponse } from 'next/server'
import connectDB from '@/lib/backend/config/db'
import PaymentMethod from '@/lib/backend/models/PaymentMethod'
import { protect } from '@/lib/backend/middleware/auth-next'
import logger from '@/lib/backend/utils/logger'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// DELETE - Remove a payment method
export async function DELETE(request, { params }) {
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

    // Find and delete payment method, ensuring it belongs to the user
    const paymentMethod = await PaymentMethod.findOneAndDelete({
      _id: id,
      user: userId
    })

    if (!paymentMethod) {
      return NextResponse.json(
        { success: false, error: 'Payment method not found' },
        { status: 404 }
      )
    }

    // If the deleted method was default, set another one as default (if any exist)
    if (paymentMethod.isDefault) {
      const nextMethod = await PaymentMethod.findOne({ user: userId })
      if (nextMethod) {
        nextMethod.isDefault = true
        await nextMethod.save()
      }
    }

    logger.info(`Payment method ${id} deleted for user ${userId}`)

    return NextResponse.json({
      success: true,
      data: { id }
    })
  } catch (error) {
    logger.error('Error deleting payment method:', error)
    if (error.message === 'Not authorized to access this route' || error.message === 'No token provided') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete payment method' },
      { status: 500 }
    )
  }
}

