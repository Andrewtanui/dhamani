import { BaseScraper } from './base.scraper'
import type { ScrapedProduct } from '@/types'
import type { CheerioAPI } from 'cheerio'

const BASE_URL = 'https://www.jumia.co.ke'

export class JumiaScraper extends BaseScraper {
  constructor() {
    super('jumia')
  }

  async search(query: string): Promise<ScrapedProduct[]> {
    const url = `${BASE_URL}/catalog/?q=${encodeURIComponent(query)}`
    console.log('[JumiaScraper] fetching:', url)

    let $: CheerioAPI
    try {
      $ = await this.fetchHtml(url)
    } catch (err) {
      console.error('[JumiaScraper] search failed:', err)
      return []
    }

    const products: ScrapedProduct[] = []
    const self = this

    const productSelectors = [
      'article.prd',
      '[class*="prd"]',
      '[class*="product"]',
      '.product-card',
    ]

    let foundSelector = null
    for (const selector of productSelectors) {
      const count = $(selector).length
      if (count > 0) {
        foundSelector = selector
        console.log(`[JumiaScraper] found ${count} products with selector: ${selector}`)
        break
      }
    }

    if (!foundSelector) {
      console.log('[JumiaScraper] no products found with any selector')
      return []
    }

    $(foundSelector).each((_, el) => {
      const card = $(el as Parameters<typeof $>[0])

      const nameSelectors = ['.name', 'h3', 'h2', '[class*="name"]', '[class*="title"]']
      let name = ''
      for (const selector of nameSelectors) {
        const text = card.find(selector).first().text().trim()
        if (text) {
          name = text
          break
        }
      }

      const linkSelectors = ['a.core', 'a[class*="core"]', 'a[href]']
      let href = null
      for (const selector of linkSelectors) {
        const attr = card.find(selector).first().attr('href')
        if (attr) {
          href = attr
          break
        }
      }
      const productUrl = href ? `${BASE_URL}${href}` : null

      if (!name || !productUrl) return

      const priceSelectors = ['.prc', '[class*="price"]', '[class*="prc"]']
      let priceRaw = ''
      for (const selector of priceSelectors) {
        const text = card.find(selector).first().text().trim()
        if (text) {
          priceRaw = text
          break
        }
      }

      const originalSelectors = ['.old', '[class*="old"]', '[class*="original"]']
      let originalRaw = ''
      for (const selector of originalSelectors) {
        const text = card.find(selector).first().text().trim()
        if (text) {
          originalRaw = text
          break
        }
      }

      let imageUrl = null
      const imgEl = card.find('img').first()
      imageUrl = imgEl.attr('data-src') ?? imgEl.attr('src') ?? imgEl.attr('data-image') ?? null

      const price = self.parsePrice(priceRaw)
      const original_price = self.parsePrice(originalRaw)
      const is_on_sale = !!original_price && !!price && original_price > price

      products.push({
        name,
        url: productUrl,
        price,
        original_price: original_price ?? null,
        image_url: imageUrl,
        is_in_stock: true,
        is_on_sale,
        discount_pct: self.discountPct(price, original_price),
        rating: null,
        review_count: null,
        retailer: 'jumia',
      })
    })

    console.log(`[JumiaScraper] parsed ${products.length} products`)
    return products
  }

  async scrapePrice(url: string) {
    try {
      const $ = await this.fetchHtml(url)

      const priceRaw = $('span.-b-s1').first().text().trim()
        || $('[class*="prc"]').first().text().trim()
      const originalRaw = $('span.-lthr').first().text().trim()
        || $('[class*="old"]').first().text().trim()

      const price = this.parsePrice(priceRaw)
      const original_price = this.parsePrice(originalRaw)
      const is_on_sale = !!original_price && !!price && original_price > price

      const outOfStock = $('div.-error').text().toLowerCase().includes('out of stock')
        || $('button.btn').text().toLowerCase().includes('out of stock')

      return { price, original_price, is_in_stock: !outOfStock, is_on_sale }
    } catch {
      return null
    }
  }
}
