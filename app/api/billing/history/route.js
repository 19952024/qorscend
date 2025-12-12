import { NextResponse } from 'next/server'
import connectDB from '@/lib/backend/config/db'
import Invoice from '@/lib/backend/models/Invoice'
import { protect } from '@/lib/backend/middleware/auth-next'
import logger from '@/lib/backend/utils/logger'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request) {
  try {
    await connectDB()
    
    const user = await protect(request)
    const userId = user._id ? user._id.toString() : (user.id || user._id)

    // Get invoices for the user
    const invoices = await Invoice.find({ user: userId })
      .sort({ date: -1 })
      .lean()

    // Transform to match frontend interface
    const transformedInvoices = invoices.map((inv) => ({
      id: inv._id.toString(),
      number: inv.number || inv._id.toString(),
      date: inv.date,
      dueDate: inv.dueDate,
      amount: inv.amount,
      currency: inv.currency || 'USD',
      status: inv.status,
      plan: inv.plan
    }))

    return NextResponse.json({
      success: true,
      data: { invoices: transformedInvoices }
    })
  } catch (error) {
    logger.error('Error fetching billing history:', error)
    if (error.message === 'Not authorized to access this route' || error.message === 'No token provided') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { success: false, error: 'Failed to fetch billing history' },
      { status: 500 }
    )
  }
}

