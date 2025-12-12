import { NextResponse } from 'next/server';
import connectDB from '@/lib/backend/config/db';
import CodeConversion from '@/lib/backend/models/CodeConversion';
import { protect } from '@/lib/backend/middleware/auth-next';
import logger from '@/lib/backend/utils/logger';

export async function GET(request) {
  try {
    await connectDB();
    
    logger.info('Alias route /api/history hit');
    
    const user = await protect(request);
    logger.info('User from request:', user);
    logger.info('Development mode:', process.env.NODE_ENV);
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const startIndex = (page - 1) * limit;

    const query = { user: user.id };

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
    logger.error('History alias route error:', error);
    if (error.message === 'Not authorized to access this route' || error.message === 'No token provided') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Internal server error during history retrieval' },
      { status: 500 }
    );
  }
}

