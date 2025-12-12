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
    const body = await request.json().catch(() => ({}))
    const { planId } = body

    if (!planId) {
      return NextResponse.json(
        { success: false, error: 'Plan ID is required' },
        { status: 400 }
      )
    }

    const validTiers = ['free', 'pro', 'enterprise']
    if (!validTiers.includes(planId.toLowerCase())) {
      return NextResponse.json(
        { success: false, error: 'Invalid plan ID' },
        { status: 400 }
      )
    }

    // Get or create subscription
    let subscription = await Subscription.findOne({ user: userId })
    
    if (!subscription) {
      subscription = await Subscription.create({
        user: userId,
        tier: planId.toLowerCase(),
        status: 'active',
        provider: 'mock',
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      })
    } else {
      subscription.tier = planId.toLowerCase()
      subscription.status = 'active'
      // Update period end date (30 days from now)
      subscription.currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      await subscription.save()
    }

    logger.info(`Subscription changed to ${planId} for user ${userId}`)

    return NextResponse.json({
      success: true,
      data: {
        subscription: {
          tier: subscription.tier,
          status: subscription.status,
          currentPeriodEnd: subscription.currentPeriodEnd
        }
      }
    })
  } catch (error) {
    logger.error('Error changing subscription:', error)
    if (error.message === 'Not authorized to access this route' || error.message === 'No token provided') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to change subscription' },
      { status: 500 }
    )
  }
}

