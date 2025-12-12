import { NextResponse } from 'next/server'
import connectDB from '@/lib/backend/config/db'
import BillingAddress from '@/lib/backend/models/BillingAddress'
import { protect } from '@/lib/backend/middleware/auth-next'
import logger from '@/lib/backend/utils/logger'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request) {
  try {
    await connectDB()
    
    const user = await protect(request)
    const userId = user._id ? user._id.toString() : (user.id || user._id)

    // Get billing address
    const billingAddress = await BillingAddress.findOne({ user: userId })

    if (!billingAddress) {
      return NextResponse.json({
        success: true,
        data: null
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        firstName: billingAddress.firstName,
        lastName: billingAddress.lastName,
        address: billingAddress.address,
        city: billingAddress.city,
        state: billingAddress.state,
        country: billingAddress.country,
        zipCode: billingAddress.zipCode
      }
    })
  } catch (error) {
    logger.error('Error fetching billing address:', error)
    if (error.message === 'Not authorized to access this route' || error.message === 'No token provided') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { success: false, error: 'Failed to fetch billing address' },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    await connectDB()
    
    const user = await protect(request)
    const userId = user._id ? user._id.toString() : (user.id || user._id)
    const body = await request.json().catch(() => ({}))

    const { firstName, lastName, address, city, state, country, zipCode } = body

    // Validate required fields
    if (!firstName || !lastName || !address || !city || !state || !country || !zipCode) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Update or create billing address
    const billingAddress = await BillingAddress.findOneAndUpdate(
      { user: userId },
      {
        user: userId,
        firstName,
        lastName,
        address,
        city,
        state,
        country,
        zipCode
      },
      { new: true, upsert: true, runValidators: true }
    )

    logger.info(`Billing address updated for user ${userId}`)

    return NextResponse.json({
      success: true,
      data: {
        firstName: billingAddress.firstName,
        lastName: billingAddress.lastName,
        address: billingAddress.address,
        city: billingAddress.city,
        state: billingAddress.state,
        country: billingAddress.country,
        zipCode: billingAddress.zipCode
      }
    })
  } catch (error) {
    logger.error('Error updating billing address:', error)
    if (error.message === 'Not authorized to access this route' || error.message === 'No token provided') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      )
    }
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update billing address' },
      { status: 500 }
    )
  }
}

