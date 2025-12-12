import { NextResponse } from 'next/server'
import connectDB from '@/lib/backend/config/db'
import ProviderMetrics from '@/lib/backend/models/ProviderMetrics'
import logger from '@/lib/backend/utils/logger'

// Force dynamic execution; disable caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    await connectDB()

    const metrics = await ProviderMetrics.find({}).lean()

    if (!metrics || metrics.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          averageQueueTime: 0,
          averageCost: 0,
          onlineBackends: 0,
          averageErrorRate: 0,
        },
      })
    }

    let queueSum = 0
    let costSum = 0
    let errorSum = 0
    let count = 0
    let onlineBackends = 0

    metrics.forEach((m) => {
      const q = Number(m.metrics?.queueTime || 0)
      const c = Number(m.metrics?.costPerShot || 0)
      const e = Number(m.metrics?.errorRate || 0)
      queueSum += q
      costSum += c
      errorSum += e
      count += 1
      const status = m.status || 'online'
      if (status === 'online') onlineBackends += 1
    })

    const averageQueueTime = count ? queueSum / count : 0
    const averageCost = count ? costSum / count : 0
    const averageErrorRate = count ? errorSum / count : 0

    return NextResponse.json({
      success: true,
      data: {
        averageQueueTime,
        averageCost,
        onlineBackends,
        averageErrorRate,
      },
    })
  } catch (error) {
    logger.error('Get qbenchmark-live status error:', error)
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 },
    )
  }
}

