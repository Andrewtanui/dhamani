import { BaseScraper } from './base.scraper'
import type { ScrapedProduct } from '@/types'
import type { CheerioAPI } from 'cheerio'

const BASE_URL = 'https://www.kilimall.co.ke'

export class KilimallScraper extends BaseScraper {
  constructor() {
    super('kilimall')
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
    const url = `${BASE_URL}/search?q=${encodeURIComponent(query)}`
    console.log('[KilimallScraper] fetching:', url)

    let $: CheerioAPI
    try {
      $ = await this.fetchHtml(url)
    } catch (err) {
      console.error('[KilimallScraper] search failed:', err)
      return []
    }

    const products: ScrapedProduct[] = []

    const productSelectors = [
      'div[data-v-1856e47a]', 
      '.product-item',
      '[class*="product"]',
      '[class*="goods"]',
      '.itm'
    ]

    let productElements = null
    for (const selector of productSelectors) {
      const elements = $(selector)
      if (elements.length > 0) {
        productElements = elements
        console.log(`[KilimallScraper] Found ${elements.length} products using selector: ${selector}`)
        break
      }
    }

    if (productElements) {
      productElements.each((_, el) => {
        const card = $(el as Parameters<typeof $>[0])

        // Find product link (must be an <a> tag
        const linkEl = card.find('a').first()
        const href = linkEl.attr('href')
        const productUrl = href
          ? href.startsWith('http') ? href : `${BASE_URL}${href}`
          : ''

        // Find product name
        const nameSelectors = [
          'p.product-title',
          '[class*="title"]',
          'h1',
          'h2',
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

        if (!name) return

        // Find price
        const priceSelectors = [
          '.product-price',
          '[class*="price"]',
          '.prc'
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

        // Find image
        let imageUrl = null
        const imgSelectors = ['img.img-content', 'img']
        for (const selector of imgSelectors) {
          const imgEl = card.find(selector).first()
          if (imgEl.length) {
            imageUrl = imgEl.attr('data-src') ?? imgEl.attr('src') ?? imgEl.attr('data-image') ?? null
            if (imageUrl) break
          }
        }

        if (name) {
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
            retailer: 'kilimall',
          })
        }
      })
    }

    console.log(`[KilimallScraper] parsed ${products.length} products`)
    return products
  }

  async scrapePrice(url: string) {
    try {
      const $ = await this.fetchHtml(url)

      const priceRaw = $('[class*="price"]:not([class*="origin"]):not([class*="old"])').first().text().trim()
      const originalRaw = $('[class*="origin-price"], [class*="old-price"]').first().text().trim()

      const price = this.extractPriceFromText(priceRaw)
      const original_price = this.extractPriceFromText(originalRaw)
      const is_on_sale = !!original_price && !!price && original_price > price

      const stockText = $('[class*="stock"], [class*="inventory"]').first().text().toLowerCase()
      const is_in_stock = !stockText.includes('out of stock') && !stockText.includes('unavailable')

      return { price, original_price, is_in_stock, is_on_sale }
    } catch {
      return null
    }
  }
}
