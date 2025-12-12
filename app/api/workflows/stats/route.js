import { NextResponse } from 'next/server'
import connectDB from '@/lib/backend/config/db'
import Workflow from '@/lib/backend/models/Workflow'
import { protect } from '@/lib/backend/middleware/auth-next'
import logger from '@/lib/backend/utils/logger'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request) {
  try {
    await connectDB()
    
    // Try to get user, but allow unauthenticated requests in development
    let user = null
    try {
      user = await protect(request)
    } catch (error) {
      // In development, return empty stats
      return NextResponse.json({
        success: true,
        data: {
          activeWorkflows: 0,
          completed: 0,
          successRate: '0%',
          avgRuntime: '0m',
        }
      })
    }

    // Get workflows for the authenticated user
    const userId = user._id ? user._id.toString() : (user.id || user._id)
    const items = await Workflow.find({ user: userId }).lean()
    
    const total = items.length
    const completed = items.filter((w) => w.status === 'completed').length
    const active = items.filter((w) => w.status !== 'completed' && w.status !== 'failed').length
    const successRate = total === 0 ? '0%' : `${Math.round((completed / total) * 100)}%`

    // Calculate average runtime from metadata
    const runtimes = items
      .filter((w) => w.metadata?.averageRuntime)
      .map((w) => w.metadata.averageRuntime)
    const avgRuntimeMs = runtimes.length > 0
      ? runtimes.reduce((a, b) => a + b, 0) / runtimes.length
      : 0
    const avgRuntime = avgRuntimeMs > 0
      ? `${Math.round(avgRuntimeMs / 60000)}m`
      : '0m'

    const data = {
      activeWorkflows: active,
      completed,
      successRate,
      avgRuntime,
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    logger.error('Error fetching workflow stats:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}

