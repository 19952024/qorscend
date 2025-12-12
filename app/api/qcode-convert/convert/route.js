import { NextResponse } from 'next/server';
import connectDB from '@/lib/backend/config/db';
import CodeConversion from '@/lib/backend/models/CodeConversion';
import User from '@/lib/backend/models/User';
import { convertCode } from '@/lib/backend/services/codeConverter';
import { protect } from '@/lib/backend/middleware/auth-next';
import logger from '@/lib/backend/utils/logger';

export async function POST(request) {
  try {
    await connectDB();
    
    const user = await protect(request);
    const body = await request.json();
    const { sourceLibrary, targetLibrary, sourceCode, tags = [] } = body;

    // Validation
    const validLibraries = ['qiskit', 'cirq', 'braket', 'pennylane', 'pyquil'];
    if (!validLibraries.includes(sourceLibrary)) {
      return NextResponse.json(
        { success: false, error: 'Invalid source library' },
        { status: 400 }
      );
    }
    if (!validLibraries.includes(targetLibrary)) {
      return NextResponse.json(
        { success: false, error: 'Invalid target library' },
        { status: 400 }
      );
    }
    if (!sourceCode || typeof sourceCode !== 'string' || sourceCode.length < 1 || sourceCode.length > 10000) {
      return NextResponse.json(
        { success: false, error: 'Source code must be between 1 and 10000 characters' },
        { status: 400 }
      );
    }
    if (tags && !Array.isArray(tags)) {
      return NextResponse.json(
        { success: false, error: 'Tags must be an array' },
        { status: 400 }
      );
    }

    // Check if source and target are different
    if (sourceLibrary === targetLibrary) {
      return NextResponse.json(
        { success: false, error: 'Source and target libraries must be different' },
        { status: 400 }
      );
    }

    const startTime = Date.now();

    // Convert the code
    const conversionResult = await convertCode(sourceLibrary, targetLibrary, sourceCode);

    const conversionTime = Date.now() - startTime;

    // Create conversion record
    const userId = user._id ? user._id.toString() : (user.id || user._id)
    const conversion = await CodeConversion.create({
      user: userId,
      sourceLibrary,
      targetLibrary,
      sourceCode,
      convertedCode: conversionResult.code,
      status: conversionResult.success ? 'success' : 'error',
      errorMessage: conversionResult.error,
      metadata: {
        linesOfCode: sourceCode.split('\n').length,
        conversionTime,
        complexity: conversionResult.complexity || 'medium'
      },
      tags
    });

    // Update user stats
    if (conversionResult.success && user.updateStats) {
      try {
        await user.updateStats('codeConversions');
      } catch (statsError) {
        logger.warn('Failed to update user stats:', statsError.message);
      }
    }

    logger.info(`Code conversion completed: ${sourceLibrary} -> ${targetLibrary} for user ${userId}`);

    return NextResponse.json({
      success: true,
      data: {
        conversion: {
          id: conversion._id,
          sourceLibrary,
          targetLibrary,
          sourceCode,
          convertedCode: conversionResult.code,
          status: conversion.status,
          metadata: conversion.metadata,
          tags: conversion.tags,
          createdAt: conversion.createdAt
        },
        conversionTime,
        complexity: conversionResult.complexity
      }
    });
  } catch (error) {
    logger.error('Code conversion error:', error);
    if (error.message === 'Not authorized to access this route' || error.message === 'No token provided') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Server error during code conversion' },
      { status: 500 }
    );
  }
}

