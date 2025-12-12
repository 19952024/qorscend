import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')

    if (!file || typeof file === 'string') {
      return NextResponse.json({ success: false, error: 'file is required' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const uploadsDir = path.join(process.cwd(), 'uploads')
    await fs.mkdir(uploadsDir, { recursive: true })

    const safeName = `${Date.now()}-${(file.name || 'upload').replace(/\s+/g, '-')}`
    const filePath = path.join(uploadsDir, safeName)
    await fs.writeFile(filePath, buffer)

    return NextResponse.json({
      success: true,
      filename: safeName,
      originalName: file.name || safeName,
      size: buffer.length,
    })
  } catch (error) {
    console.error('File upload handler error:', error)
    return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 })
  }
}

