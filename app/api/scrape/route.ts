import { scraperManager } from '@/lib/scrapers/scraper-manager'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import type { RetailerName } from '@/types'

const bodySchema = z.object({
  retailer: z.enum(['jumia', 'kilimall', 'jiji']),
  url: z.string().url(),
})

// POST /api/scrape/price
// Body: { retailer: 'jumia', url: 'https://...' }
export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 422 }
    )
  }

  const { retailer, url } = parsed.data

  try {
    const result = await scraperManager.scrapePrice(retailer as RetailerName, url)
    if (!result) {
      return NextResponse.json(
        { error: 'Could not scrape price from this URL' },
        { status: 404 }
      )
    }
    return NextResponse.json(result)
  } catch (err) {
    console.error('[/api/scrape/price] error:', err)
    return NextResponse.json({ error: 'Scrape failed' }, { status: 500 })
  }
}