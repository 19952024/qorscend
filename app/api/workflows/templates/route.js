import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const templates = [
  {
    id: 'tmpl-convert-benchmark',
    name: 'Convert & Benchmark',
    description: 'Convert quantum code then benchmark across providers.',
    steps: [
      { id: 'step1', type: 'convert', name: 'Code Conversion', description: 'Convert code between libraries' },
      { id: 'step2', type: 'benchmark', name: 'Benchmark', description: 'Run performance benchmarks' },
    ],
  },
  {
    id: 'tmpl-clean-visualize',
    name: 'Clean & Visualize',
    description: 'Clean experimental data and prepare for visualization.',
    steps: [
      { id: 'step1', type: 'clean', name: 'Data Clean', description: 'Normalize and clean data' },
    ],
  },
]

export async function GET() {
  return NextResponse.json({
    success: true,
    data: templates,
  })
}

