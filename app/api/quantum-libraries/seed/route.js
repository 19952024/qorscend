import { NextResponse } from 'next/server';
import connectDB from '@/lib/backend/config/db';
import QuantumLibrary from '@/lib/backend/models/QuantumLibrary';
import logger from '@/lib/backend/utils/logger';

const defaultLibraries = [
  {
    name: 'qiskit',
    displayName: 'Qiskit',
    description: "IBM's open-source quantum computing framework",
    version: '0.45.0',
    features: [
      'Circuit construction',
      'Quantum algorithms',
      'Hardware backends',
      'Visualization tools'
    ],
    documentationUrl: 'https://qiskit.org/documentation/',
    popularity: 'High',
    color: 'bg-blue-500/10 text-blue-500',
    isActive: true,
    metadata: {
      lastUpdated: new Date(),
      conversionCount: 0,
      successRate: 0
    }
  },
  {
    name: 'cirq',
    displayName: 'Cirq',
    description: "Google's quantum computing framework for NISQ circuits",
    version: '1.3.0',
    features: [
      'NISQ circuits',
      'Quantum simulators',
      'Hardware integration',
      'Optimization tools'
    ],
    documentationUrl: 'https://quantumai.google/cirq',
    popularity: 'High',
    color: 'bg-green-500/10 text-green-500',
    isActive: true,
    metadata: {
      lastUpdated: new Date(),
      conversionCount: 0,
      successRate: 0
    }
  },
  {
    name: 'braket',
    displayName: 'Amazon Braket',
    description: 'AWS quantum computing service with multiple backends',
    version: '1.73.0',
    features: [
      'Cloud quantum computing',
      'Multiple backends',
      'Hybrid algorithms',
      'Cost optimization'
    ],
    documentationUrl: 'https://docs.aws.amazon.com/braket/',
    popularity: 'Medium',
    color: 'bg-orange-500/10 text-orange-500',
    isActive: true,
    metadata: {
      lastUpdated: new Date(),
      conversionCount: 0,
      successRate: 0
    }
  },
  {
    name: 'pennylane',
    displayName: 'PennyLane',
    description: 'Quantum machine learning library with automatic differentiation',
    version: '0.33.0',
    features: [
      'Quantum ML',
      'Automatic differentiation',
      'Hybrid computing',
      'Optimization'
    ],
    documentationUrl: 'https://pennylane.ai/',
    popularity: 'Medium',
    color: 'bg-purple-500/10 text-purple-500',
    isActive: true,
    metadata: {
      lastUpdated: new Date(),
      conversionCount: 0,
      successRate: 0
    }
  },
  {
    name: 'pyquil',
    displayName: 'PyQuil',
    description: "Rigetti's quantum programming language",
    version: '3.0.0',
    features: [
      'Quantum programming',
      'Rigetti hardware access',
      'Quantum algorithms',
      'Simulation tools'
    ],
    documentationUrl: 'https://pyquil-docs.rigetti.com/',
    popularity: 'Low',
    color: 'bg-cyan-500/10 text-cyan-500',
    isActive: true,
    metadata: {
      lastUpdated: new Date(),
      conversionCount: 0,
      successRate: 0
    }
  }
];

export async function POST(request) {
  try {
    await connectDB();
    
    // Check if libraries already exist
    const existingCount = await QuantumLibrary.countDocuments();
    
    if (existingCount > 0) {
      return NextResponse.json({
        success: true,
        message: `Database already contains ${existingCount} libraries. No seeding needed.`,
        librariesCount: existingCount
      });
    }

    // Insert default libraries
    const insertedLibraries = await QuantumLibrary.insertMany(defaultLibraries, {
      ordered: false // Continue even if some fail (e.g., duplicates)
    });

    logger.info(`Seeded ${insertedLibraries.length} quantum libraries`);

    return NextResponse.json({
      success: true,
      message: `Successfully seeded ${insertedLibraries.length} quantum libraries`,
      librariesCount: insertedLibraries.length
    });
  } catch (error) {
    logger.error('Seed quantum libraries error:', error);
    
    // If error is due to duplicates, that's okay
    if (error.code === 11000 || error.message?.includes('duplicate')) {
      return NextResponse.json({
        success: true,
        message: 'Libraries already exist in database',
        librariesCount: await QuantumLibrary.countDocuments()
      });
    }
    
    return NextResponse.json(
      { success: false, error: 'Server error during seeding' },
      { status: 500 }
    );
  }
}

