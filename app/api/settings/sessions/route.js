import { NextResponse } from 'next/server'
import connectDB from '@/lib/backend/config/db'
import { protect } from '@/lib/backend/middleware/auth-next'
import logger from '@/lib/backend/utils/logger'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET - Fetch active sessions
export async function GET(request) {
  try {
    await connectDB()
    
    const user = await protect(request)
    const userId = user._id ? user._id.toString() : (user.id || user._id)
    
    // For now, return a mock session representing the current session
    // In a full implementation, you would query a Session model
    const sessions = [
      {
        _id: 'current-session',
        deviceInfo: {
          browser: 'Chrome',
          os: 'Windows'
        },
        isCurrent: true,
        lastActive: new Date().toISOString()
      }
    ]

    return NextResponse.json({
      success: true,
      data: sessions
    })
  } catch (error) {
    logger.error('Error fetching sessions:', error)
    if (error.message === 'Not authorized to access this route' || error.message === 'No token provided') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { success: false, error: 'Failed to fetch sessions' },
      { status: 500 }
    )
  }
}

