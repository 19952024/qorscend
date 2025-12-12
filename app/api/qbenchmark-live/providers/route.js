import { NextResponse } from 'next/server';
import connectDB from '@/lib/backend/config/db';
import ProviderMetrics from '@/lib/backend/models/ProviderMetrics';
import { protect } from '@/lib/backend/middleware/auth-next';
import logger from '@/lib/backend/utils/logger';

export async function GET(request) {
  try {
    await connectDB();
    
    // Optional: protect route if needed
    // const user = await protect(request);
    
    // Fetch all provider metrics from database
    const metrics = await ProviderMetrics.find({})
      .sort({ lastUpdated: -1 })
      .lean();

    // Group metrics by provider
    const providersMap = new Map();
    
    metrics.forEach(metric => {
      if (!providersMap.has(metric.provider)) {
        providersMap.set(metric.provider, {
          name: metric.provider,
          status: metric.status || 'online',
          backends: []
        });
      }
      
      const provider = providersMap.get(metric.provider);
      provider.backends.push({
        name: metric.backend.name,
        qubits: metric.backend.qubits || 0,
        queueTime: metric.metrics.queueTime || 0,
        costPerShot: metric.metrics.costPerShot || 0,
        errorRate: metric.metrics.errorRate || 0,
        availability: metric.metrics.availability || 0,
        status: metric.status || 'online',
        lastUpdated: metric.lastUpdated?.toISOString() || new Date().toISOString()
      });
    });

    // Convert map to array
    const providers = Array.from(providersMap.values());
    
    // Calculate totals
    const totalProviders = providers.length;
    const totalBackends = providers.reduce((sum, p) => sum + p.backends.length, 0);

    return NextResponse.json({
      success: true,
      data: {
        providers,
        totalProviders,
        totalBackends,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Get providers error:', error);
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

