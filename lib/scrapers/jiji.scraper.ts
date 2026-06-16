import { BaseScraper } from './base.scraper'
import type { ScrapedProduct } from '@/types'
import type { CheerioAPI } from 'cheerio'

const BASE_URL = 'https://jiji.co.ke'

export class JijiScraper extends BaseScraper {
  constructor() {
    super('jiji')
  }

  private extractPriceFromText(text: string): number | null {
    if (!text) return null
    // Remove KSh, spaces, commas
    const cleaned = text.replace(/[KSh\s,]/g, '')
    const match = cleaned.match(/(\d+\.?\d*)/)
    if (match) {
      const price = parseFloat(match[1])
      return isNaN(price) ? null : price
    }
    return null
  }

  async search(query: string): Promise<ScrapedProduct[]> {
    const url = `${BASE_URL}/search?query=${encodeURIComponent(query)}`
    console.log('[JijiScraper] fetching:', url)

    let $: CheerioAPI
    try {
      $ = await this.fetchHtml(url)
    } catch (err) {
      console.error('[JijiScraper] search failed:', err)
      return []
    }

    const products: ScrapedProduct[] = []

    const productSelectors = [
      '.qa-advert-list-item',
      '[class*="b-list-advert-base"]',
      '[class*="list-advert"]'
    ]

    let productElements = null
    for (const selector of productSelectors) {
      const elements = $(selector)
      if (elements.length > 0) {
        productElements = elements
        console.log(`[JijiScraper] Found ${elements.length} products using selector: ${selector}`)
        break
      }
    }

    if (productElements) {
      productElements.each((_, el) => {
        const card = $(el as Parameters<typeof $>[0])

        // Find name and link
        const nameSelectors = [
          '.qa-advert-title',
          '.b-advert-title-inner',
          '[class*="title"]',
          'h3'
        ]
        let name = ''
        for (const selector of nameSelectors) {
          const text = card.find(selector).first().text().trim()
          if (text) {
            name = text
            break
          }
        }

        const linkEl = card.find('a').first()
        const href = linkEl.attr('href')
        const productUrl = href
          ? href.startsWith('http') ? href : `${BASE_URL}${href}`
          : ''

        if (!name) return

        const priceSelectors = [
          '.qa-advert-price',
          '[class*="price"]',
          '.b-list-advert__price'
        ]
        let priceRaw = ''
        for (const selector of priceSelectors) {
          const text = card.find(selector).first().text().trim()
          if (text) {
            priceRaw = text
            break
          }
        }
        const price = this.extractPriceFromText(priceRaw)

        if (price === null && (priceRaw.toLowerCase().includes('negotiable') || priceRaw.toLowerCase().includes('free'))) {
          return
        }

        let imageUrl = null
        const imgEl = card.find('img').first()
        imageUrl = imgEl.attr('data-src') ?? imgEl.attr('src') ?? imgEl.attr('data-image') ?? null

        products.push({
          name,
          url: productUrl,
          price,
          original_price: null,
          image_url: imageUrl,
          is_in_stock: true,
          is_on_sale: false,
          discount_pct: null,
          rating: null,
          review_count: null,
          retailer: 'jiji',
        })
      })
    }

    console.log(`[JijiScraper] parsed ${products.length} products`)
    return products
  }

  async scrapePrice(url: string) {
    try {
      const $ = await this.fetchHtml(url)

      const priceRaw =
        $('[class*="price"], .qa-advert-price, [itemprop="price"]').first().text().trim()
      const price = this.extractPriceFromText(priceRaw)

      const pageText = $('body').text().toLowerCase()
      const is_in_stock =
        !pageText.includes('this ad has been sold') &&
        !pageText.includes('ad is no longer available')

      return { price, original_price: null, is_in_stock, is_on_sale: false }
    } catch {
      return null
    }
  }
}
