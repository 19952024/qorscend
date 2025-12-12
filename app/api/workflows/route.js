import { NextResponse } from 'next/server'
import connectDB from '@/lib/backend/config/db'
import Workflow from '@/lib/backend/models/Workflow'
import { protect } from '@/lib/backend/middleware/auth-next'
import logger from '@/lib/backend/utils/logger'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// List workflows
export async function GET(request) {
  try {
    await connectDB()
    
    // Try to get user, but allow unauthenticated requests in development
    let user = null
    try {
      user = await protect(request)
    } catch (error) {
      // In development, continue without auth
      logger.warn('No authenticated user, returning empty workflows list')
      return NextResponse.json({
        success: true,
        data: { workflows: [] },
      })
    }

    // Get workflows for the authenticated user
    const userId = user._id ? user._id.toString() : (user.id || user._id)
    const workflows = await Workflow.find({ user: userId })
      .sort({ createdAt: -1 })
      .lean()

    return NextResponse.json({
      success: true,
      data: { workflows },
    })
  } catch (error) {
    logger.error('Error fetching workflows:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch workflows' },
      { status: 500 }
    )
  }
}

// Delete (by query param id)
export async function DELETE(request) {
  try {
    await connectDB()
    
    const user = await protect(request)
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Workflow ID is required' },
        { status: 400 }
      )
    }

    // Find and delete workflow, ensuring it belongs to the user
    const workflow = await Workflow.findOneAndDelete({
      _id: id,
      user: userId
    })

    if (!workflow) {
      return NextResponse.json(
        { success: false, error: 'Workflow not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Error deleting workflow:', error)
    if (error.message === 'Not authorized to access this route' || error.message === 'No token provided') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { success: false, error: 'Failed to delete workflow' },
      { status: 500 }
    )
  }
}

// Create workflow
export async function POST(request) {
  try {
    await connectDB()
    
    const user = await protect(request)
    const body = await request.json().catch(() => ({}))

    // Create workflow in database
    const workflow = await Workflow.create({
      user: userId,
      name: body.name || 'Untitled workflow',
      description: body.description || '',
      steps: Array.isArray(body.steps) ? body.steps : [],
      status: body.status || 'draft',
      completedAt: body.completedAt || null,
    })

    return NextResponse.json({ success: true, data: workflow }, { status: 201 })
  } catch (error) {
    logger.error('Error creating workflow:', error)
    if (error.message === 'Not authorized to access this route' || error.message === 'No token provided') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { success: false, error: 'Failed to save workflow' },
      { status: 500 }
    )
  }
}

