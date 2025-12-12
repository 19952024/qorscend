import { NextResponse } from 'next/server'
import connectDB from '@/lib/backend/config/db'
import DataFile from '@/lib/backend/models/DataFile'
import logger from '@/lib/backend/utils/logger'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(req, { params }) {
  try {
    await connectDB()
    const { id } = await params
    const body = await req.json().catch(() => ({}))
    const { chartType, xAxis, yAxis, format = 'json' } = body

    const dataFile = await DataFile.findById(id).lean()
    if (!dataFile) {
      return NextResponse.json({ success: false, error: 'File not found' }, { status: 404 })
    }

    // Stub: in a real exporter, render chart data; for now return minimal payload
    const payload = {
      chartType,
      xAxis,
      yAxis,
      fileId: id,
      generatedAt: new Date().toISOString(),
    }

    if (format === 'json') {
      return new NextResponse(JSON.stringify(payload, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${dataFile.originalName || dataFile.filename || 'chart'}.json"`,
        },
      })
    }

    return NextResponse.json({ success: true, data: payload })
  } catch (error) {
    logger.error('Export chart error:', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}

