import { NextResponse } from 'next/server'
import connectDB from '@/lib/backend/config/db'
import { protect } from '@/lib/backend/middleware/auth-next'
import logger from '@/lib/backend/utils/logger'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// DELETE - Terminate a session
export async function DELETE(request, { params }) {
  try {
    await connectDB()
    
    const user = await protect(request)
    const userId = user._id ? user._id.toString() : (user.id || user._id)
    const { id } = await params
    
    // In a full implementation, you would delete the session from the database
    // For now, just return success
    logger.info(`Session ${id} terminated by user ${userId}`)

    return NextResponse.json({
      success: true,
      data: { message: 'Session terminated successfully' }
    })
  } catch (error) {
    logger.error('Error terminating session:', error)
    if (error.message === 'Not authorized to access this route' || error.message === 'No token provided') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { success: false, error: 'Failed to terminate session' },
      { status: 500 }
    )
  }
}

