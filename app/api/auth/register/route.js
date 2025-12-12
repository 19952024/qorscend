import { NextResponse } from 'next/server';
import connectDB from '@/lib/backend/config/db';
import User from '@/lib/backend/models/User';
import logger from '@/lib/backend/utils/logger';

export async function POST(request) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { name, email, password } = body;

    // Validation
    if (!name || name.trim().length < 2 || name.trim().length > 50) {
      return NextResponse.json(
        { success: false, error: 'Name must be between 2 and 50 characters' },
        { status: 400 }
      );
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Please provide a valid email' },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'An account with this email address already exists. Please sign in instead.' },
        { status: 400 }
      );
    }

    // Create user
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password
    });

    // Update last login
    await user.updateLastLogin();

    // Generate token
    const token = user.getSignedJwtToken();

    logger.info(`New user registered: ${email}`);

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        stats: user.stats
      }
    }, { status: 201 });
  } catch (error) {
    logger.error('Registration error:', error);
    
    // Extract specific error message
    let errorMessage = 'Server error during registration';
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message).join(', ');
      errorMessage = `Validation error: ${validationErrors}`;
    }
    // Handle duplicate key errors (e.g., email already exists)
    else if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      errorMessage = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
    }
    // Handle database connection errors
    else if (error.message && error.message.includes('connection')) {
      errorMessage = 'Database connection error. Please try again later.';
    }
    // Handle specific error messages
    else if (error.message) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: error.statusCode || 500 }
    );
  }
}

