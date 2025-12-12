import { NextResponse } from 'next/server';
import connectDB from '@/lib/backend/config/db';
import QuantumLibrary from '@/lib/backend/models/QuantumLibrary';
import logger from '@/lib/backend/utils/logger';

export async function GET(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const library = searchParams.get('library');
    const category = searchParams.get('category');
    const autoSeed = searchParams.get('autoSeed') !== 'false'; // Default to true

    const query = {};
    if (library) query.name = { $regex: library, $options: 'i' };
    if (category) query.category = category;

    let libraries = await QuantumLibrary.find(query)
      .sort({ name: 1 })
      .limit(parseInt(searchParams.get('limit')) || 100);

    // Auto-seed if database is empty and autoSeed is enabled
    if (libraries.length === 0 && autoSeed) {
      try {
        const defaultLibraries = [
          {
            name: 'qiskit',
            displayName: 'Qiskit',
            description: "IBM's open-source quantum computing framework",
            version: '0.45.0',
            features: ['Circuit construction', 'Quantum algorithms', 'Hardware backends', 'Visualization tools'],
            documentationUrl: 'https://qiskit.org/documentation/',
            popularity: 'High',
            color: 'bg-blue-500/10 text-blue-500',
            isActive: true,
            metadata: { lastUpdated: new Date(), conversionCount: 0, successRate: 0 }
          },
          {
            name: 'cirq',
            displayName: 'Cirq',
            description: "Google's quantum computing framework for NISQ circuits",
            version: '1.3.0',
            features: ['NISQ circuits', 'Quantum simulators', 'Hardware integration', 'Optimization tools'],
            documentationUrl: 'https://quantumai.google/cirq',
            popularity: 'High',
            color: 'bg-green-500/10 text-green-500',
            isActive: true,
            metadata: { lastUpdated: new Date(), conversionCount: 0, successRate: 0 }
          },
          {
            name: 'braket',
            displayName: 'Amazon Braket',
            description: 'AWS quantum computing service with multiple backends',
            version: '1.73.0',
            features: ['Cloud quantum computing', 'Multiple backends', 'Hybrid algorithms', 'Cost optimization'],
            documentationUrl: 'https://docs.aws.amazon.com/braket/',
            popularity: 'Medium',
            color: 'bg-orange-500/10 text-orange-500',
            isActive: true,
            metadata: { lastUpdated: new Date(), conversionCount: 0, successRate: 0 }
          },
          {
            name: 'pennylane',
            displayName: 'PennyLane',
            description: 'Quantum machine learning library with automatic differentiation',
            version: '0.33.0',
            features: ['Quantum ML', 'Automatic differentiation', 'Hybrid computing', 'Optimization'],
            documentationUrl: 'https://pennylane.ai/',
            popularity: 'Medium',
            color: 'bg-purple-500/10 text-purple-500',
            isActive: true,
            metadata: { lastUpdated: new Date(), conversionCount: 0, successRate: 0 }
          },
          {
            name: 'pyquil',
            displayName: 'PyQuil',
            description: "Rigetti's quantum programming language",
            version: '3.0.0',
            features: ['Quantum programming', 'Rigetti hardware access', 'Quantum algorithms', 'Simulation tools'],
            documentationUrl: 'https://pyquil-docs.rigetti.com/',
            popularity: 'Low',
            color: 'bg-cyan-500/10 text-cyan-500',
            isActive: true,
            metadata: { lastUpdated: new Date(), conversionCount: 0, successRate: 0 }
          }
        ];

        await QuantumLibrary.insertMany(defaultLibraries, { ordered: false });
        logger.info('Auto-seeded quantum libraries');
        
        // Fetch again after seeding
        libraries = await QuantumLibrary.find(query)
          .sort({ name: 1 })
          .limit(parseInt(searchParams.get('limit')) || 100);
      } catch (seedError) {
        // If libraries already exist, that's fine
        if (seedError.code !== 11000 && !seedError.message?.includes('duplicate')) {
          logger.warn('Auto-seed failed, continuing with empty result:', seedError);
        } else {
          // Libraries were already seeded, fetch them
          libraries = await QuantumLibrary.find(query)
            .sort({ name: 1 })
            .limit(parseInt(searchParams.get('limit')) || 100);
        }
      }
    }

    // Transform database fields to match frontend expectations
    const transformedLibraries = libraries.map(lib => ({
      name: lib.name,
      displayName: lib.displayName,
      description: lib.description,
      version: lib.version,
      features: lib.features || [],
      docs: lib.documentationUrl, // Map documentationUrl to docs
      popularity: lib.popularity || 'Medium',
      color: lib.color || 'bg-blue-500/10 text-blue-500',
      isActive: lib.isActive !== false, // Default to true if not set
      metadata: lib.metadata ? {
        lastUpdated: lib.metadata.lastUpdated ? (typeof lib.metadata.lastUpdated === 'string' ? lib.metadata.lastUpdated : lib.metadata.lastUpdated.toISOString()) : new Date().toISOString(),
        conversionCount: lib.metadata.conversionCount || 0,
        successRate: lib.metadata.successRate || 0
      } : undefined
    }));

    logger.info(`Returning ${transformedLibraries.length} libraries from database`);

    return NextResponse.json({
      success: true,
      data: {
        libraries: transformedLibraries,
        total: transformedLibraries.length
      }
    });
  } catch (error) {
    logger.error('Get quantum libraries error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}

