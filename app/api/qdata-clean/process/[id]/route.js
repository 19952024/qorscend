import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import connectDB from '@/lib/backend/config/db'
import DataFile from '@/lib/backend/models/DataFile'
import logger from '@/lib/backend/utils/logger'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(req, { params }) {
  try {
    await connectDB()
    const { id } = await params

    const dataFile = await DataFile.findById(id).lean()
    if (!dataFile) {
      return NextResponse.json({ success: false, error: 'File not found' }, { status: 404 })
    }

    const filePath = dataFile.filePath || path.join(process.cwd(), 'uploads', dataFile.filename)
    let raw = ''
    try {
      raw = await fs.readFile(filePath, 'utf8')
    } catch (e) {
      logger.warn('Process read failed:', e)
      return NextResponse.json({ success: false, error: 'Failed to read file content' }, { status: 500 })
    }

    const body = await req.json().catch(() => ({}))
    const processingOptions = Array.isArray(body.processingOptions) ? body.processingOptions : []

    // Basic parsing (same as data endpoint)
    let parsedData = []
    let metadata = { recordCount: 0, columns: [], dataTypes: {} }
    try {
      const ext = path.extname(dataFile.originalName || dataFile.filename || '').toLowerCase()
      if (ext === '.json') {
        const jsonData = JSON.parse(raw)
        parsedData = Array.isArray(jsonData) ? jsonData : [jsonData]
      } else if (ext === '.csv') {
        const lines = raw.split('\n').filter((line) => line.trim())
        if (lines.length > 0) {
          const headers = lines[0].split(',').map((h) => h.trim())
          parsedData = lines.slice(1).map((line) => {
            const values = line.split(',').map((v) => v.trim())
            const obj = {}
            headers.forEach((header, idx) => {
              obj[header] = values[idx] || ''
            })
            return obj
          })
        }
      }
      metadata.recordCount = parsedData.length
      metadata.columns = parsedData.length > 0 ? Object.keys(parsedData[0]) : []
      metadata.dataTypes =
        parsedData.length > 0
          ? Object.fromEntries(Object.entries(parsedData[0]).map(([k, v]) => [k, typeof v]))
          : {}
    } catch (parseErr) {
      logger.warn('Process parse error:', parseErr)
    }

    // For now, processing is a no-op placeholder
    const processedData = parsedData
    const processingSteps = processingOptions.length

    return NextResponse.json({
      success: true,
      data: {
        processedData,
        metadata,
        processingSteps,
      },
    })
  } catch (error) {
    logger.error('Process data error:', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}

