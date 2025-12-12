import { NextResponse } from 'next/server'
import connectDB from '@/lib/backend/config/db'
import Workflow from '@/lib/backend/models/Workflow'
import { protect } from '@/lib/backend/middleware/auth-next'
import logger from '@/lib/backend/utils/logger'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const templates = [
  {
    id: 'tmpl-convert-benchmark',
    name: 'Convert & Benchmark',
    description: 'Convert quantum code then benchmark across providers.',
    steps: [
      { id: 'step1', type: 'convert', name: 'Code Conversion', description: 'Convert code between libraries', config: {} },
      { id: 'step2', type: 'benchmark', name: 'Benchmark', description: 'Run performance benchmarks', config: {} },
    ],
  },
  {
    id: 'tmpl-clean-visualize',
    name: 'Clean & Visualize',
    description: 'Clean experimental data and prepare for visualization.',
    steps: [
      { id: 'step1', type: 'clean', name: 'Data Clean', description: 'Normalize and clean data', config: {} },
    ],
  },
  {
    id: 'tmpl-quick-benchmark',
    name: 'Quick Benchmark',
    description: 'Benchmark against common providers in one click.',
    steps: [{ id: 'step1', type: 'benchmark', name: 'Benchmark', description: 'Run quick benchmark', config: {} }],
  },
  {
    id: 'tmpl-clean-basic',
    name: 'Basic Data Clean',
    description: 'Remove outliers and normalize your dataset.',
    steps: [{ id: 'step1', type: 'clean', name: 'Data Clean', description: 'Basic cleaning operations', config: {} }],
  },
]

export async function POST(_req, { params }) {
  try {
    await connectDB()
    
    const user = await protect(_req)
    const { id } = await params
    const tmpl = templates.find((t) => t.id === id)
    
    if (!tmpl) {
      return NextResponse.json({ success: false, error: 'Template not found' }, { status: 404 })
    }

    // Create workflow in the database
    const userId = user._id ? user._id.toString() : (user.id || user._id)
    const wf = await Workflow.create({
      user: userId,
      name: tmpl.name,
      description: tmpl.description,
      status: 'draft',
      steps: tmpl.steps.map((s, idx) => ({
        id: s.id || `step-${idx + 1}`,
        type: s.type,
        name: s.name,
        description: s.description,
        status: 'pending',
        config: s.config || {},
      })),
    })

    return NextResponse.json({ success: true, data: wf })
  } catch (error) {
    logger.error('Error using template:', error)
    if (error.message === 'Not authorized to access this route' || error.message === 'No token provided') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      )
    }
    return NextResponse.json({ success: false, error: 'Failed to use template' }, { status: 500 })
  }
}

