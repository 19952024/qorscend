import { NextResponse } from 'next/server';
import connectDB from '@/lib/backend/config/db';
import CodeConversion from '@/lib/backend/models/CodeConversion';
import { protect } from '@/lib/backend/middleware/auth-next';
import logger from '@/lib/backend/utils/logger';

export async function DELETE(request, { params }) {
  try {
    await connectDB();
    
    const user = await protect(request);
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Conversion ID is required' },
        { status: 400 }
      );
    }

    // Find the conversion and verify it belongs to the user
    const conversion = await CodeConversion.findById(id);

    if (!conversion) {
      return NextResponse.json(
        { success: false, error: 'Conversion not found' },
        { status: 404 }
      );
    }

    // Verify the conversion belongs to the user
    if (conversion.user.toString() !== user.id.toString()) {
      return NextResponse.json(
        { success: false, error: 'Not authorized to delete this conversion' },
        { status: 403 }
      );
    }

    // Delete the conversion
    await CodeConversion.findByIdAndDelete(id);

    logger.info(`Conversion ${id} deleted by user ${user.id}`);

    return NextResponse.json({
      success: true,
      message: 'Conversion deleted successfully'
    });
  } catch (error) {
    logger.error('Delete conversion error:', error);
    if (error.message === 'Not authorized to access this route' || error.message === 'No token provided') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Server error during deletion' },
      { status: 500 }
    );
  }
}

