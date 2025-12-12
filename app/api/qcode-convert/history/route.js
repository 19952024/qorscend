import { NextResponse } from 'next/server';
import connectDB from '@/lib/backend/config/db';
import CodeConversion from '@/lib/backend/models/CodeConversion';
import { protect } from '@/lib/backend/middleware/auth-next';
import logger from '@/lib/backend/utils/logger';

export async function GET(request) {
  try {
    await connectDB();
    
    const user = await protect(request);
    const userId = user._id ? user._id.toString() : (user.id || user._id)
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const startIndex = (page - 1) * limit;

    const query = { user: userId };

    // Add filters
    const sourceLibrary = searchParams.get('sourceLibrary');
    const targetLibrary = searchParams.get('targetLibrary');
    const status = searchParams.get('status');
    
    if (sourceLibrary) query.sourceLibrary = sourceLibrary;
    if (targetLibrary) query.targetLibrary = targetLibrary;
    if (status) query.status = status;

    const conversions = await CodeConversion.find(query)
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

    const total = await CodeConversion.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: {
        conversions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get conversion history error:', error);
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

