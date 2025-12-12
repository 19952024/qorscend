import { NextResponse } from 'next/server';
import connectDB from '@/lib/backend/config/db';
import User from '@/lib/backend/models/User';
import { protect } from '@/lib/backend/middleware/auth-next';
import logger from '@/lib/backend/utils/logger';

export async function GET(request) {
  try {
    await connectDB();
    
    const user = await protect(request);
    const fullUser = await User.findById(user.id);
    
    return NextResponse.json({
      success: true,
      data: {
        stats: fullUser.stats,
        lastLogin: fullUser.lastLogin,
        memberSince: fullUser.createdAt
      }
    });
  } catch (error) {
    logger.error('Get user stats error:', error);
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

