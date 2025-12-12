import { NextResponse } from 'next/server'
import connectDB from '@/lib/backend/config/db'
import Subscription from '@/lib/backend/models/Subscription'
import { protect } from '@/lib/backend/middleware/auth-next'
import logger from '@/lib/backend/utils/logger'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request) {
  try {
    await connectDB()
    
    const user = await protect(request)
    const userId = user._id ? user._id.toString() : (user.id || user._id)

    // Get subscription
    let subscription = await Subscription.findOne({ user: userId })
    
    if (!subscription) {
      return NextResponse.json(
        { success: false, error: 'No active subscription found' },
        { status: 404 }
      )
    }

    // Cancel subscription (downgrade to free)
    subscription.tier = 'free'
    subscription.status = 'canceled'
    subscription.currentPeriodEnd = null
    await subscription.save()

    logger.info(`Subscription canceled for user ${userId}`)

    return NextResponse.json({
      success: true,
      data: {
        subscription: {
          tier: subscription.tier,
          status: subscription.status
        }
      }
    })
  } catch (error) {
    logger.error('Error canceling subscription:', error)
    if (error.message === 'Not authorized to access this route' || error.message === 'No token provided') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to cancel subscription' },
      { status: 500 }
    )
  }
}

