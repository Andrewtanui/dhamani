import { scraperManager } from '@/lib/scrapers/scraper-manager'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import type { RetailerName } from '@/types'

const querySchema = z.object({
  q: z.string().min(2, 'Query must be at least 2 characters').max(100),
  retailers: z.string().optional().nullable(),
})

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const parsed = querySchema.safeParse({ 
    q: searchParams.get('q'),
    retailers: searchParams.get('retailers')
  })
  
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 422 }
    )
  }

  try {
    let retailers: RetailerName[]
    try {
      retailers = parsed.data.retailers ? JSON.parse(parsed.data.retailers) : ['jumia', 'kilimall', 'jiji']
    } catch {
      retailers = ['jumia', 'kilimall', 'jiji']
    }

    const result = await scraperManager.search(parsed.data.q, retailers)
    return NextResponse.json(result)
  } catch (err) {
    console.error('[/api/search] unhandled error:', err)
    return NextResponse.json(
      { error: 'Search failed. Please try again.' },
      { status: 500 }
    )
  }
}
