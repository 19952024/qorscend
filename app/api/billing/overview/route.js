import { NextResponse } from 'next/server'
import connectDB from '@/lib/backend/config/db'
import Subscription from '@/lib/backend/models/Subscription'
import User from '@/lib/backend/models/User'
import CodeConversion from '@/lib/backend/models/CodeConversion'
import DataFile from '@/lib/backend/models/DataFile'
import Workflow from '@/lib/backend/models/Workflow'
import { protect } from '@/lib/backend/middleware/auth-next'
import logger from '@/lib/backend/utils/logger'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Plan limits configuration
const PLAN_LIMITS = {
  free: {
    codeConversions: 10,
    benchmarks: 5,
    dataFiles: 5,
    storage: 100, // MB
    workflows: 3
  },
  pro: {
    codeConversions: 1000,
    benchmarks: 500,
    dataFiles: 500,
    storage: 10000, // MB
    workflows: 100
  },
  enterprise: {
    codeConversions: -1, // unlimited
    benchmarks: -1,
    dataFiles: -1,
    storage: 100000, // MB
    workflows: -1
  }
}

// Plan pricing
const PLAN_PRICING = {
  free: { amount: 0, currency: 'USD' },
  pro: { amount: 29, currency: 'USD' },
  enterprise: { amount: 99, currency: 'USD' }
}

export async function GET(request) {
  try {
    await connectDB()
    
    const user = await protect(request)
    const userId = user._id ? user._id.toString() : (user.id || user._id)

    // Get or create subscription
    let subscription = await Subscription.findOne({ user: userId })
    
    if (!subscription) {
      // Create default free subscription
      subscription = await Subscription.create({
        user: userId,
        tier: 'free',
        status: 'active',
        provider: 'mock'
      })
    }

    // Get user stats
    const userDoc = await User.findById(userId)
    const stats = userDoc?.stats || {
      codeConversions: 0,
      benchmarksRun: 0,
      dataFilesProcessed: 0
    }

    // Get actual usage counts from database
    const codeConversionsCount = await CodeConversion.countDocuments({ user: userId })
    const benchmarksCount = 0 // TODO: Add benchmark model if exists
    const dataFilesCount = await DataFile.countDocuments({ user: userId })
    const workflowsCount = await Workflow.countDocuments({ user: userId })
    
    // Calculate storage usage (sum of file sizes) in MB
    const files = await DataFile.find({ user: userId }).select('size')
    const storageUsedBytes = files.reduce((sum, file) => sum + (file.size || 0), 0)
    const storageUsedMB = storageUsedBytes / (1024 * 1024) // Convert to MB

    const tier = subscription.tier || 'free'
    const limits = PLAN_LIMITS[tier] || PLAN_LIMITS.free
    const pricing = PLAN_PRICING[tier] || PLAN_PRICING.free

    // Calculate next billing date (30 days from current period end or now)
    // If subscription has a currentPeriodEnd, use it; otherwise set it 30 days from now
    let nextBillingDate
    if (subscription.currentPeriodEnd) {
      nextBillingDate = new Date(subscription.currentPeriodEnd)
    } else {
      // Set period end to 30 days from now if not set
      nextBillingDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      subscription.currentPeriodEnd = nextBillingDate
      await subscription.save()
    }

    const data = {
      subscription: {
        tier: subscription.tier,
        status: subscription.status,
        currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() || new Date().toISOString(),
        nextBillingDate: nextBillingDate.toISOString(),
        amount: pricing.amount,
        currency: pricing.currency
      },
      usage: {
        codeConversions: {
          used: codeConversionsCount,
          limit: limits.codeConversions === -1 ? Infinity : limits.codeConversions
        },
        benchmarks: {
          used: benchmarksCount,
          limit: limits.benchmarks === -1 ? Infinity : limits.benchmarks
        },
        dataFiles: {
          used: dataFilesCount,
          limit: limits.dataFiles === -1 ? Infinity : limits.dataFiles
        },
        storage: {
          used: Math.round(storageUsedMB * 100) / 100, // Round to 2 decimal places (MB)
          limit: limits.storage === -1 ? Infinity : limits.storage // MB
        },
        workflows: {
          used: workflowsCount,
          limit: limits.workflows === -1 ? Infinity : limits.workflows
        }
      }
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    logger.error('Error fetching billing overview:', error)
    if (error.message === 'Not authorized to access this route' || error.message === 'No token provided') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { success: false, error: 'Failed to fetch billing overview' },
      { status: 500 }
    )
  }
}

