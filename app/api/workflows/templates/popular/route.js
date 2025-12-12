import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const popularTemplates = [
  {
    id: 'tmpl-quick-benchmark',
    name: 'Quick Benchmark',
    description: 'Benchmark against common providers in one click.',
    steps: [{ id: 'step1', type: 'benchmark', name: 'Benchmark', description: 'Run quick benchmark' }],
  },
  {
    id: 'tmpl-clean-basic',
    name: 'Basic Data Clean',
    description: 'Remove outliers and normalize your dataset.',
    steps: [{ id: 'step1', type: 'clean', name: 'Data Clean', description: 'Basic cleaning operations' }],
  },
]

export async function GET() {
  return NextResponse.json({
    success: true,
    data: popularTemplates,
  })
}
