import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import connectDB from '@/lib/backend/config/db'
import DataFile from '@/lib/backend/models/DataFile'
import logger from '@/lib/backend/utils/logger'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req) {
  try {
    await connectDB()
    const { searchParams, pathname } = new URL(req.url)
    // Next 15 dynamic API routes provide the id via the URL; extract from pathname
    const parts = pathname.split('/')
    const id = parts[parts.length - 2] === 'raw' ? parts[parts.length - 3] : parts[parts.length - 1]

    const dataFile = await DataFile.findById(id).lean()
    if (!dataFile) {
      return NextResponse.json({ success: false, error: 'File not found' }, { status: 404 })
    }

    const filePath = dataFile.filePath || path.join(process.cwd(), 'uploads', dataFile.filename)
    let content = ''
    try {
      content = await fs.readFile(filePath, 'utf8')
    } catch (e) {
      logger.warn('Raw read failed:', e)
      return NextResponse.json({ success: false, error: 'Failed to read file content' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: { content } })
  } catch (error) {
    logger.error('Raw file fetch error:', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}

