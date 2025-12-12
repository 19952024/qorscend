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
    const { currentPassword, newPassword } = body;

    // Validation
    if (!currentPassword) {
      return NextResponse.json(
        { success: false, error: 'Current password is required' },
        { status: 400 }
      );
    }

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: 'New password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Get user with password
    const fullUser = await User.findById(user.id).select('+password');

    // Check current password
    const isMatch = await fullUser.matchPassword(currentPassword);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, error: 'Current password is incorrect' },
        { status: 400 }
      );
    }

    // Update password
    fullUser.password = newPassword;
    await fullUser.save();

    logger.info(`Password changed for user: ${fullUser.email}`);

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    logger.error('Change password error:', error);
    if (error.message === 'Not authorized to access this route' || error.message === 'No token provided') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Server error during password change' },
      { status: 500 }
    );
  }
}

