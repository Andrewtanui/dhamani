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

    let $: CheerioAPI
    try {
      $ = await this.fetchHtml(url)
    } catch (err) {
      console.error('[KilimallScraper] search failed:', err)
      return []
    }

    const products: ScrapedProduct[] = []

    // Kilimall product grid items
    $('.goods-item, .product-item, [class*="goods"]').each((_, el) => {
      const card = $(el)

      const name =
        card.find('.goods-title, .product-name, [class*="title"]').first().text().trim()
      const href =
        card.find('a').first().attr('href')
      const productUrl = href
        ? href.startsWith('http') ? href : `${BASE_URL}${href}`
        : null

      if (!name || !productUrl) return

      const priceRaw =
        card.find('.goods-price, .price, [class*="price"]').first().text().trim()
      const originalRaw =
        card.find('.origin-price, .old-price, [class*="origin"]').first().text().trim()
      const imageUrl =
        card.find('img').attr('data-src') ?? card.find('img').attr('src') ?? null
      const ratingRaw =
        card.find('[class*="rate"], [class*="star"]').first().text().trim()
      const reviewRaw =
        card.find('[class*="review"], [class*="sold"]').first().text().trim()

      const price = this.parsePrice(priceRaw)
      const original_price = this.parsePrice(originalRaw)
      const is_on_sale = !!original_price && !!price && original_price > price

      const rating = ratingRaw ? parseFloat(ratingRaw) : null
      const reviewMatch = reviewRaw.match(/\d+/)
      const review_count = reviewMatch ? parseInt(reviewMatch[0], 10) : null

      products.push({
        name,
        url: productUrl,
        price,
        original_price: original_price ?? null,
        image_url: imageUrl,
        is_in_stock: true,
        is_on_sale,
        discount_pct: this.discountPct(price, original_price),
        rating: rating && !isNaN(rating) ? rating : null,
        review_count: review_count && !isNaN(review_count) ? review_count : null,
        retailer: 'kilimall',
      })
    })

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