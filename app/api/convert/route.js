import { NextResponse } from 'next/server';
import connectDB from '@/lib/backend/config/db';
import CodeConversion from '@/lib/backend/models/CodeConversion';
import { convertCode } from '@/lib/backend/services/codeConverter';
import { protect } from '@/lib/backend/middleware/auth-next';
import logger from '@/lib/backend/utils/logger';

export async function POST(request) {
  try {
    await connectDB();
    
    logger.info('Alias route /api/convert hit');
    
    const user = await protect(request);
    const body = await request.json();
    logger.info('Request body:', body);
    logger.info('User from request:', user);
    logger.info('Development mode:', process.env.NODE_ENV);
    
    const { sourceLibrary, targetLibrary, sourceCode, tags = [] } = body;

    // Check if source and target are different
    if (sourceLibrary === targetLibrary) {
      return NextResponse.json(
        { success: false, error: 'Source and target libraries must be different' },
        { status: 400 }
      );
    }

    const startTime = Date.now();

    // Convert the code
    logger.info('Calling convertCode function...');
    const conversionResult = await convertCode(sourceLibrary, targetLibrary, sourceCode);
    logger.info('Conversion result:', conversionResult);

    const conversionTime = Date.now() - startTime;

    // Check if conversion was successful
    if (!conversionResult.success) {
      return NextResponse.json(
        { success: false, error: conversionResult.error || 'Code conversion failed' },
        { status: 400 }
      );
    }

    // Try to create conversion record, but don't fail if database is unavailable
    let conversion = null;
    try {
      const userId = user._id ? user._id.toString() : (user.id || user._id)
      conversion = await CodeConversion.create({
        user: userId,
        sourceLibrary,
        targetLibrary,
        sourceCode,
        convertedCode: conversionResult.code,
        status: 'success',
        errorMessage: null,
        metadata: {
          linesOfCode: sourceCode.split('\n').length,
          conversionTime,
          complexity: conversionResult.complexity || 'medium'
        },
        tags
      });

      // Try to update user stats, but don't fail if it doesn't work
      try {
        if (user.updateStats) {
          await user.updateStats('codeConversions');
        }
      } catch (statsError) {
        logger.warn('Failed to update user stats:', statsError.message);
      }

      logger.info(`Code conversion completed: ${sourceLibrary} -> ${targetLibrary} for user ${userId}`);
    } catch (dbError) {
      logger.warn('Database operation failed, but conversion succeeded:', dbError.message);
      // Continue without database operations
    }

    return NextResponse.json({
      success: true,
      data: {
        conversion: {
          id: conversion?._id || 'temp-id',
          sourceLibrary,
          targetLibrary,
          sourceCode,
          convertedCode: conversionResult.code,
          status: 'success',
          metadata: {
            linesOfCode: sourceCode.split('\n').length,
            conversionTime,
            complexity: conversionResult.complexity || 'medium'
          },
          tags,
          createdAt: conversion?.createdAt || new Date()
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
      { success: false, error: 'Internal server error during code conversion' },
      { status: 500 }
    );
  }
}

