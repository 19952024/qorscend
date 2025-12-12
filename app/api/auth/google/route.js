import { NextResponse } from 'next/server';
import { redirect } from 'next/navigation';
import connectDB from '@/lib/backend/config/db';
import User from '@/lib/backend/models/User';
import logger from '@/lib/backend/utils/logger';

export async function GET(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const mockEmail = searchParams.get('email') || `google_user_${Date.now()}@example.com`;
    const mockName = searchParams.get('name') || 'Google User';

    let user = await User.findOne({ email: mockEmail });
    if (!user) {
      user = await User.create({ name: mockName, email: mockEmail, password: Math.random().toString(36).slice(2) });
    }
    const token = user.getSignedJwtToken();
    // Redirect back to frontend with token in fragment for SPA
    const frontendUrl = process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://www.qorscend.com';
    const redirectUrl = `${frontendUrl}/#token=${token}`;
    
    return NextResponse.redirect(redirectUrl, { status: 302 });
  } catch (error) {
    logger.error('Google OAuth mock error:', error);
    return NextResponse.json(
      { success: false, error: 'OAuth error' },
      { status: 500 }
    );
  }
}

