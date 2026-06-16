import axios, { type AxiosInstance } from 'axios'
import * as cheerio from 'cheerio'
import type { ScrapedProduct, RetailerName } from '@/types'

export interface ScraperConfig {
  timeout?: number
  delayMin?: number
  delayMax?: number
  maxRetries?: number
}

const DEFAULT_CONFIG: Required<ScraperConfig> = {
  timeout: Number(process.env.SCRAPING_TIMEOUT_MS) || 8000,
  delayMin: Number(process.env.SCRAPING_DELAY_MIN_MS) || 500,
  delayMax: Number(process.env.SCRAPING_DELAY_MAX_MS) || 1500,
  maxRetries: Number(process.env.SCRAPING_MAX_RETRIES) || 2,
}

// Rotate through realistic user agents
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:126.0) Gecko/20100101 Firefox/126.0',
]

export abstract class BaseScraper {
  protected readonly retailer: RetailerName
  protected readonly config: Required<ScraperConfig>
  protected readonly http: AxiosInstance

  constructor(retailer: RetailerName, config: ScraperConfig = {}) {
    this.retailer = retailer
    this.config = { ...DEFAULT_CONFIG, ...config }

    this.http = axios.create({
      timeout: this.config.timeout,
      headers: {
        'User-Agent': this.randomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
    })
  }

  /** Search a retailer for products matching a query */
  abstract search(query: string): Promise<ScrapedProduct[]>

  /** Fetch the current price for a known product URL */
  abstract scrapePrice(url: string): Promise<Pick<ScrapedProduct, 'price' | 'original_price' | 'is_in_stock' | 'is_on_sale'> | null>

  // ── Helpers ──────────────────────────────────────────────

  protected async fetchHtml(url: string): Promise<cheerio.CheerioAPI> {
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        await this.randomDelay()
        const { data, status } = await this.http.get<string>(url, {
          headers: { 'User-Agent': this.randomUserAgent() },
        })
        console.log(`[BaseScraper] fetched ${url}, status: ${status}`)
        console.log(`[BaseScraper] HTML preview (first 2000 chars): ${data.substring(0, 2000)}`)
        return cheerio.load(data)
      } catch (err) {
        lastError = err as Error
        console.error(`[BaseScraper] attempt ${attempt} failed for ${url}:`, err)
        if (attempt < this.config.maxRetries) {
          await this.sleep(attempt * 1000) // back-off
        }
      }
    }

    throw lastError ?? new Error(`Failed to fetch ${url}`)
  }

  protected parsePrice(raw: string | undefined | null): number | null {
    if (!raw) return null
    // Strip currency symbols: KES, KSh, Ksh, KSH, Kshs, commas, spaces
    const cleaned = raw
      .replace(/KShs?\.?|KSH|KSh|Ksh|Kes|KES/gi, '')
      .replace(/[,\s]/g, '')
      .trim()
    const num = parseFloat(cleaned)
    return isNaN(num) ? null : num
  }

  protected discountPct(price: number | null, original: number | null): number | null {
    if (!price || !original || original <= price) return null
    return Math.round(((original - price) / original) * 100)
  }

  private randomUserAgent(): string {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]
  }

  private randomDelay(): Promise<void> {
    const ms =
      this.config.delayMin +
      Math.random() * (this.config.delayMax - this.config.delayMin)
    return this.sleep(ms)
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}