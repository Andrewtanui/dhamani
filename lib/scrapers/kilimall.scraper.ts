import { BaseScraper } from './base.scraper'
import type { ScrapedProduct } from '@/types'
import type { CheerioAPI } from 'cheerio'

const BASE_URL = 'https://www.kilimall.co.ke'

export class KilimallScraper extends BaseScraper {
  constructor() {
    super('kilimall')
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
    const self = this

    const productSelectors = [
      '.product-item'
    ]

    let foundSelector = null
    for (const selector of productSelectors) {
      const count = $(selector).length
      if (count > 0) {
        foundSelector = selector
        console.log(`[KilimallScraper] found ${count} products with selector: ${selector}`)
        break
      }
    }

    if (!foundSelector) {
      console.log('[KilimallScraper] no products found with any selector')
      return []
    }

    $(foundSelector).each((_, el) => {
      const card = $(el as Parameters<typeof $>[0])

      const nameSelectors = [
        '.product-title'
      ]
      let name = ''
      for (const selector of nameSelectors) {
        const text = card.find(selector).first().text().trim()
        if (text) {
          name = text
          break
        }
      }

      let href = card.find('a').first().attr('href')
      const productUrl = href
        ? href.startsWith('http') ? href : `${BASE_URL}${href}`
        : null

      if (!name || !productUrl) return

      const priceSelectors = [
        '.product-price'
      ]
      let priceRaw = ''
      for (const selector of priceSelectors) {
        const text = card.find(selector).first().text().trim()
        if (text) {
          priceRaw = text
          break
        }
      }

      let imageUrl = null
      const imgEl = card.find('img').first()
      imageUrl = imgEl.attr('data-src') ?? imgEl.attr('src') ?? imgEl.attr('data-image') ?? null

      const price = self.parsePrice(priceRaw)

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
    })

    console.log(`[KilimallScraper] parsed ${products.length} products`)
    return products
  }

  async scrapePrice(url: string) {
    try {
      const $ = await this.fetchHtml(url)

      const priceRaw =
        $('[class*="price"]:not([class*="origin"]):not([class*="old"])').first().text().trim()
      const originalRaw =
        $('[class*="origin-price"], [class*="old-price"]').first().text().trim()

      const price = this.parsePrice(priceRaw)
      const original_price = this.parsePrice(originalRaw)
      const is_on_sale = !!original_price && !!price && original_price > price

      const stockText = $('[class*="stock"], [class*="inventory"]').first().text().toLowerCase()
      const is_in_stock = !stockText.includes('out of stock') && !stockText.includes('unavailable')

      return { price, original_price, is_in_stock, is_on_sale }
    } catch {
      return null
    }
  }
}
