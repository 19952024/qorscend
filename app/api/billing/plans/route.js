import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    period: 'month',
    description: 'Perfect for getting started with quantum computing',
    features: [
      '10 code conversions per month',
      '5 benchmarks per month',
      '5 data files per month',
      '100 MB storage',
      '3 workflows',
      'Community support'
    ],
    limits: {
      codeConversions: 10,
      benchmarks: 5,
      dataFiles: 5,
      storage: 100, // MB
      workflows: 3
    }
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 29,
    period: 'month',
    description: 'For professionals and teams',
    features: [
      '1,000 code conversions per month',
      '500 benchmarks per month',
      '500 data files per month',
      '10 GB storage',
      '100 workflows',
      'Priority support',
      'Advanced analytics'
    ],
    limits: {
      codeConversions: 1000,
      benchmarks: 500,
      dataFiles: 500,
      storage: 10000, // MB (10 GB)
      workflows: 100
    }
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 99,
    period: 'month',
    description: 'For large organizations',
    features: [
      'Unlimited code conversions',
      'Unlimited benchmarks',
      'Unlimited data files',
      '100 GB storage',
      'Unlimited workflows',
      'Dedicated support',
      'Custom integrations',
      'SLA guarantee'
    ],
    limits: {
      codeConversions: -1, // unlimited
      benchmarks: -1,
      dataFiles: -1,
      storage: 100000, // MB (100 GB)
      workflows: -1
    }
  }
]

export async function GET() {
  return NextResponse.json({ success: true, data: plans })
}

