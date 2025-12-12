import { NextResponse } from 'next/server'
import connectDB from '@/lib/backend/config/db'
import User from '@/lib/backend/models/User'
import { protect } from '@/lib/backend/middleware/auth-next'
import logger from '@/lib/backend/utils/logger'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET - Fetch user settings
export async function GET(request) {
  try {
    await connectDB()
    
    const user = await protect(request)
    const userId = user._id ? user._id.toString() : (user.id || user._id)
    
    const userDoc = await User.findById(userId)
    
    if (!userDoc) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Return settings from user document
    const settings = {
      firstName: userDoc.firstName || userDoc.name?.split(' ')[0] || '',
      lastName: userDoc.lastName || userDoc.name?.split(' ').slice(1).join(' ') || '',
      organization: userDoc.organization || '',
      toolPreferences: userDoc.toolPreferences || {
        autoSaveConversions: false,
        liveBenchmarks: false,
        autoProcessData: false,
        defaultQuantumLibrary: 'qiskit',
        preferredChartType: 'line'
      },
      appearance: userDoc.preferences?.appearance || {
        theme: userDoc.preferences?.theme || 'dark',
        colorScheme: 'blue',
        compactMode: false,
        showAnimations: true
      },
      notifications: userDoc.preferences?.notifications || {
        email: userDoc.preferences?.notifications?.email ?? true,
        push: userDoc.preferences?.notifications?.push ?? true,
        jobCompletionAlerts: false,
        weeklyReports: false,
        quietHours: ''
      },
      dataPrivacy: userDoc.dataPrivacy || {
        dataCollection: true,
        analytics: true,
        marketingCommunications: false,
        dataRetention: '1-year'
      }
    }

    return NextResponse.json({
      success: true,
      data: settings
    })
  } catch (error) {
    logger.error('Error fetching settings:', error)
    if (error.message === 'Not authorized to access this route' || error.message === 'No token provided') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { success: false, error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

// PUT - Update user settings
export async function PUT(request) {
  try {
    await connectDB()
    
    const user = await protect(request)
    const userId = user._id ? user._id.toString() : (user.id || user._id)
    const body = await request.json().catch(() => ({}))
    
    const userDoc = await User.findById(userId)
    
    if (!userDoc) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Update user fields
    if (body.firstName || body.lastName) {
      const firstName = body.firstName || userDoc.name?.split(' ')[0] || ''
      const lastName = body.lastName || userDoc.name?.split(' ').slice(1).join(' ') || ''
      userDoc.name = `${firstName} ${lastName}`.trim()
      if (body.firstName) userDoc.firstName = body.firstName
      if (body.lastName) userDoc.lastName = body.lastName
    }

    if (body.organization !== undefined) {
      userDoc.organization = body.organization
    }

    // Update tool preferences
    if (body.toolPreferences) {
      userDoc.toolPreferences = {
        ...userDoc.toolPreferences,
        ...body.toolPreferences
      }
    }

    // Update appearance preferences
    if (body.appearance) {
      if (!userDoc.preferences) {
        userDoc.preferences = {}
      }
      if (!userDoc.preferences.appearance) {
        userDoc.preferences.appearance = {}
      }
      userDoc.preferences.appearance = {
        ...userDoc.preferences.appearance,
        ...body.appearance
      }
      // Also update theme at root level for compatibility
      if (body.appearance.theme) {
        userDoc.preferences.theme = body.appearance.theme
      }
    }

    // Update notification preferences
    if (body.notifications) {
      if (!userDoc.preferences) {
        userDoc.preferences = {}
      }
      if (!userDoc.preferences.notifications) {
        userDoc.preferences.notifications = {}
      }
      userDoc.preferences.notifications = {
        ...userDoc.preferences.notifications,
        ...body.notifications
      }
    }

    // Update data privacy settings
    if (body.dataPrivacy) {
      userDoc.dataPrivacy = {
        ...userDoc.dataPrivacy,
        ...body.dataPrivacy
      }
    }

    await userDoc.save()

    logger.info(`Settings updated for user ${userId}`)

    return NextResponse.json({
      success: true,
      data: {
        message: 'Settings updated successfully'
      }
    })
  } catch (error) {
    logger.error('Error updating settings:', error)
    if (error.message === 'Not authorized to access this route' || error.message === 'No token provided') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update settings' },
      { status: 500 }
    )
  }
}

