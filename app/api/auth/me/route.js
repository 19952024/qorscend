import { NextResponse } from 'next/server';
import connectDB from '@/lib/backend/config/db';
import User from '@/lib/backend/models/User';
import { protect } from '@/lib/backend/middleware/auth-next';
import logger from '@/lib/backend/utils/logger';
import devConfig from '@/lib/backend/config/dev-config';

export async function GET(request) {
  try {
    await connectDB();
    
    logger.info('GET /api/auth/me called');
    logger.info('Development mode:', devConfig.NODE_ENV);

    const user = await protect(request);
    
    const fullUser = await User.findById(user.id);
    
    if (!fullUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      user: {
        id: fullUser._id,
        name: fullUser.name,
        email: fullUser.email,
        role: fullUser.role,
        avatar: fullUser.avatar,
        stats: fullUser.stats,
        preferences: fullUser.preferences,
        lastLogin: fullUser.lastLogin
      }
    });
  } catch (error) {
    logger.error('Get current user error:', error);
    if (error.message === 'Not authorized to access this route' || error.message === 'No token provided') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}

