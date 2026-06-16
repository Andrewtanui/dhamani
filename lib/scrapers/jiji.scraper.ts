import { BaseScraper } from './base.scraper'
import type { ScrapedProduct } from '@/types'
import type { CheerioAPI } from 'cheerio'

const BASE_URL = 'https://jiji.co.ke'

export class JijiScraper extends BaseScraper {
  constructor() {
    super('jiji')
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
    const self = this

    const productSelectors = [
      '.qa-advert-list-item',
      '[class*="b-list-advert-base"]'
    ]

    let foundSelector = null
    for (const selector of productSelectors) {
      const count = $(selector).length
      if (count > 0) {
        foundSelector = selector
        console.log(`[JijiScraper] found ${count} products with selector: ${selector}`)
        break
      }
    }

    if (!foundSelector) {
      console.log('[JijiScraper] no products found with any selector')
      return []
    }

    $(foundSelector).each((_, el) => {
      const card = $(el as Parameters<typeof $>[0])

      const nameSelectors = [
        '.qa-advert-title',
        '.b-advert-title-inner',
        '[class*="title"]'
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
        '.qa-advert-price',
        '[class*="price"]'
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

      if (price === null && priceRaw.toLowerCase().includes('negotiable')) return
      if (price === null && priceRaw.toLowerCase().includes('free')) return

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

    console.log(`[JijiScraper] parsed ${products.length} products`)
    return products
  }

  async scrapePrice(url: string) {
    try {
      const $ = await this.fetchHtml(url)

      const priceRaw =
        $('[class*="price"], .qa-advert-price, [itemprop="price"]').first().text().trim()

      const price = this.parsePrice(priceRaw)

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
