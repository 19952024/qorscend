import { NextResponse } from 'next/server'
import connectDB from '@/lib/backend/config/db'
import Workflow from '@/lib/backend/models/Workflow'
import { protect } from '@/lib/backend/middleware/auth-next'
import logger from '@/lib/backend/utils/logger'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function PUT(request, { params }) {
  try {
    await connectDB()
    
    const user = await protect(request)
    const { id } = await params
    const body = await request.json().catch(() => ({}))

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

    // Update workflow fields
    if (body.name !== undefined) workflow.name = body.name
    if (body.description !== undefined) workflow.description = body.description
    if (body.steps !== undefined) workflow.steps = body.steps
    if (body.status !== undefined) workflow.status = body.status
    if (body.completedAt !== undefined) workflow.completedAt = body.completedAt

    const updated = await workflow.save()

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    logger.error('Error updating workflow:', error)
    if (error.message === 'Not authorized to access this route' || error.message === 'No token provided') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { success: false, error: 'Failed to update workflow' },
      { status: 500 }
    )
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectDB()
    
    const user = await protect(request)
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Workflow ID is required' },
        { status: 400 }
      )
    }

    // Get user ID - handle both Mongoose document and plain object
    const userId = user._id ? user._id.toString() : (user.id || user._id)

    // Find and delete workflow, ensuring it belongs to the user
    const workflow = await Workflow.findOneAndDelete({
      _id: id,
      user: userId
    })

    if (!workflow) {
      return NextResponse.json(
        { success: false, error: 'Workflow not found or you do not have permission to delete it' },
        { status: 404 }
      )
    }

    logger.info(`Workflow ${id} deleted by user ${userId}`)
    return NextResponse.json({ success: true, data: { id } })
  } catch (error) {
    logger.error('Error deleting workflow:', error)
    if (error.message === 'Not authorized to access this route' || error.message === 'No token provided') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete workflow' },
      { status: 500 }
    )
  }
}

