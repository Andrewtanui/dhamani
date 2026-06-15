import { JumiaScraper } from './jumia.scraper'
import { KilimallScraper } from './kilimall.scraper'
import { JijiScraper } from './jiji.scraper'
import type { ScrapedProduct, RetailerName, SearchResult } from '@/types'

export class ScraperManager {
  private scrapers = {
    jumia: new JumiaScraper(),
    kilimall: new KilimallScraper(),
    jiji: new JijiScraper(),
  }

  async search(query: string, retailers?: RetailerName[]): Promise<SearchResult> {
    const start = Date.now()
    const retailer_errors: Partial<Record<RetailerName, string>> = {}

    const retailersToSearch = retailers || ['jumia', 'kilimall', 'jiji']
    console.log('[ScraperManager] searching retailers:', retailersToSearch)

    const settled = await Promise.allSettled(
      Object.entries(this.scrapers)
        .filter(([name]) => retailersToSearch.includes(name as RetailerName))
        .map(async ([name, scraper]) => ({
          retailer: name as RetailerName,
          products: await scraper.search(query),
        }))
    )

    const allProducts: ScrapedProduct[] = []

    for (const result of settled) {
      if (result.status === 'fulfilled') {
        allProducts.push(...result.value.products)
      } else {
        const err = result.reason as Error
        console.error('[ScraperManager] retailer error:', err.message)
      }
    }

    const seen = new Set<string>()
    const unique = allProducts.filter((p) => {
      if (seen.has(p.url)) return false
      seen.add(p.url)
      return true
    })

    const queryLower = query.toLowerCase()

    const hasQueryMatch = (product: ScrapedProduct) => {
      const nameLower = product.name.toLowerCase()
      return nameLower.includes(queryLower)
    }

    unique.sort((a, b) => {
      const aHasMatch = hasQueryMatch(a)
      const bHasMatch = hasQueryMatch(b)
      
      if (aHasMatch !== bHasMatch) return aHasMatch ? -1 : 1
      
      if (a.is_in_stock !== b.is_in_stock) return a.is_in_stock ? -1 : 1
      
      if (a.price === null && b.price === null) return 0
      if (a.price === null) return 1
      if (b.price === null) return -1
      
      return a.price - b.price
    })

    console.log(`[ScraperManager] Total unique products: ${unique.length}`)

    return {
      query,
      results: unique,
      retailer_errors,
      duration_ms: Date.now() - start,
    }
  }

  async scrapePrice(
    retailer: RetailerName,
    url: string
  ): Promise<ReturnType<InstanceType<typeof JumiaScraper>['scrapePrice']>> {
    const scraper = this.scrapers[retailer]
    if (!scraper) throw new Error(`Unknown retailer: ${retailer}`)
    return scraper.scrapePrice(url)
  }
}

export const scraperManager = new ScraperManager()
