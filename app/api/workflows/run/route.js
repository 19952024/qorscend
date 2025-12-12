import { NextResponse } from 'next/server'
import connectDB from '@/lib/backend/config/db'
import Workflow from '@/lib/backend/models/Workflow'
import { protect } from '@/lib/backend/middleware/auth-next'
import logger from '@/lib/backend/utils/logger'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request) {
  try {
    await connectDB()
    
    const user = await protect(request)
    const body = await request.json().catch(() => ({}))
    const id = body.id || body.workflowId
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Workflow ID is required' },
        { status: 400 }
      )
    }

    // Find workflow and ensure it belongs to the user
    const userId = user._id ? user._id.toString() : (user.id || user._id)
    const workflow = await Workflow.findOne({
      _id: id,
      user: userId
    })

    if (!workflow) {
      return NextResponse.json(
        { success: false, error: 'Workflow not found' },
        { status: 404 }
      )
    }

    // Update workflow status to running
    workflow.status = 'running'
    if (!workflow.metadata) {
      workflow.metadata = {}
    }
    workflow.metadata.lastRunAt = new Date()
    await workflow.save()

    return NextResponse.json({
      success: true,
      data: { started: true, startedAt: new Date().toISOString() },
    })
  } catch (error) {
    logger.error('Error starting workflow:', error)
    if (error.message === 'Not authorized to access this route' || error.message === 'No token provided') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { success: false, error: 'Failed to start workflow' },
      { status: 500 }
    )
  }
}

