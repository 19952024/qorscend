import { NextResponse } from 'next/server';
import connectDB from '@/lib/backend/config/db';
import User from '@/lib/backend/models/User';
import { protect } from '@/lib/backend/middleware/auth-next';
import logger from '@/lib/backend/utils/logger';

export async function PUT(request) {
  try {
    await connectDB();
    
    const user = await protect(request);
    const body = await request.json();
    const { name, preferences, avatar } = body;

    // Validation
    if (name && (name.trim().length < 2 || name.trim().length > 50)) {
      return NextResponse.json(
        { success: false, error: 'Name must be between 2 and 50 characters' },
        { status: 400 }
      );
    }

    if (preferences?.theme && !['light', 'dark', 'system'].includes(preferences.theme)) {
      return NextResponse.json(
        { success: false, error: 'Theme must be light, dark, or system' },
        { status: 400 }
      );
    }

    const updateFields = {};
    if (name) updateFields.name = name.trim();
    if (preferences) updateFields.preferences = preferences;
    if (avatar) updateFields.avatar = avatar;

    const updatedUser = await User.findByIdAndUpdate(
      user.id,
      updateFields,
      { new: true, runValidators: true }
    );

    logger.info(`User profile updated: ${updatedUser.email}`);

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        avatar: updatedUser.avatar,
        stats: updatedUser.stats,
        preferences: updatedUser.preferences
      }
    });
  } catch (error) {
    logger.error('Update profile error:', error);
    if (error.message === 'Not authorized to access this route' || error.message === 'No token provided') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Server error during profile update' },
      { status: 500 }
    );
  }
}

