import { NextResponse } from 'next/server';
import connectDB from '@/lib/backend/config/db';
import DataFile from '@/lib/backend/models/DataFile';
import User from '@/lib/backend/models/User';
import { protect } from '@/lib/backend/middleware/auth-next';
import logger from '@/lib/backend/utils/logger';
import path from 'path';
import fs from 'fs/promises';

export async function POST(request) {
  try {
    await connectDB();
    
    // Optional auth: allow anonymous uploads if no/invalid token
    let user = null;
    try {
      user = await protect(request);
    } catch (authErr) {
      // Ignore auth errors to allow anonymous upload; user remains null
      user = null;
    }
    const body = await request.json();
    const { filename, originalName, contentType, size, description, tags } = body;

    if (!filename || !originalName) {
      return NextResponse.json(
        { success: false, error: 'filename and originalName are required' },
        { status: 400 }
      );
    }

    // Verify the file exists in uploads directory
    const uploadsDir = path.join(process.cwd(), 'uploads');
    const filePath = path.join(uploadsDir, filename);
    
    try {
      await fs.access(filePath);
    } catch {
      return NextResponse.json(
        { success: false, error: 'File not found in uploads directory' },
        { status: 404 }
      );
    }

    // Parse file to extract record count and metadata
    let recordCount = 0;
    let metadata = {};
    
    try {
      const fileContent = await fs.readFile(filePath, 'utf8');
      
      if (path.extname(originalName).toLowerCase() === '.json') {
        const jsonData = JSON.parse(fileContent);
        recordCount = Array.isArray(jsonData) ? jsonData.length : 1;
        metadata = {
          recordCount,
          columns: Array.isArray(jsonData) && jsonData.length > 0 ? Object.keys(jsonData[0]) : [],
          dataTypes: Array.isArray(jsonData) && jsonData.length > 0 ? 
            Object.fromEntries(Object.entries(jsonData[0]).map(([key, value]) => [key, typeof value])) : {}
        };
      } else if (path.extname(originalName).toLowerCase() === '.csv') {
        const lines = fileContent.split('\n').filter(line => line.trim());
        recordCount = Math.max(0, lines.length - 1); // Subtract header row
        if (lines.length > 0) {
          const headers = lines[0].split(',').map(h => h.trim());
          metadata = {
            recordCount,
            columns: headers,
            dataTypes: {}
          };
        }
      }
    } catch (parseError) {
      logger.warn(`Could not parse file ${originalName} for metadata:`, parseError.message);
      // Continue with default values
    }

    // Create data file record with metadata
    const userId = user ? (user._id ? user._id.toString() : (user.id || user._id)) : null
    const dataFile = await DataFile.create({
      user: userId,
      filename: filename,
      originalName: originalName,
      fileType: path.extname(originalName).toLowerCase().substring(1),
      fileSize: size || 0,
      filePath: filePath,
      description: description || '',
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      status: 'uploaded',
      data: {
        metadata: metadata
      }
    });

    // Update user stats
    if (user) {
      try {
        const userId = user._id ? user._id.toString() : (user.id || user._id)
        const fullUser = await User.findById(userId);
        if (fullUser && fullUser.updateStats) {
          await fullUser.updateStats('dataFilesProcessed');
        }
        logger.info(`File uploaded for QData Clean: ${originalName} by user ${userId}`);
      } catch (statsError) {
        logger.warn('Failed to update user stats:', statsError.message);
      }
    } else {
      logger.info(`File uploaded for QData Clean: ${originalName} by anonymous user`);
    }

    return NextResponse.json({
      success: true,
      data: {
        file: {
          id: dataFile._id,
          filename: dataFile.filename,
          originalName: dataFile.originalName,
          fileType: dataFile.fileType,
          fileSize: dataFile.fileSize,
          status: dataFile.status,
          uploadedAt: dataFile.createdAt,
          recordCount: dataFile.data.metadata.recordCount || 0,
          metadata: dataFile.data.metadata
        }
      }
    }, { status: 201 });
  } catch (error) {
    logger.error('File upload error:', error);
    // Never block uploads on auth failure; treat as server error only
    return NextResponse.json(
      { success: false, error: 'Server error during file upload' },
      { status: 500 }
    );
  }
}

