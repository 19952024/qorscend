import { NextResponse } from 'next/server'
import connectDB from '@/lib/backend/config/db'
import Subscription from '@/lib/backend/models/Subscription'
import Invoice from '@/lib/backend/models/Invoice'
import { protect } from '@/lib/backend/middleware/auth-next'
import logger from '@/lib/backend/utils/logger'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const PLAN_PRICING = {
  free: 0,
  pro: 29,
  enterprise: 99
}

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
    const tier = planId.toLowerCase()
    if (!validTiers.includes(tier)) {
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
        tier: tier,
        status: 'active',
        provider: 'mock',
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      })
    } else {
      subscription.tier = tier
      subscription.status = 'active'
      subscription.currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      await subscription.save()
    }

    // Create invoice for paid plans
    if (tier !== 'free' && PLAN_PRICING[tier] > 0) {
      const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const now = new Date()
      const dueDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

      await Invoice.create({
        user: userId,
        number: invoiceNumber,
        status: 'paid',
        plan: tier,
        date: now,
        dueDate: dueDate,
        amount: PLAN_PRICING[tier],
        currency: 'USD'
      })
    }

    logger.info(`Subscription upgraded to ${tier} for user ${userId}`)

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
    logger.error('Error upgrading subscription:', error)
    if (error.message === 'Not authorized to access this route' || error.message === 'No token provided') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to upgrade subscription' },
      { status: 500 }
    )
  }
}

