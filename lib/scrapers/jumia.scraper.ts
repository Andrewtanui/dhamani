import { BaseScraper } from './base.scraper'
import type { ScrapedProduct } from '@/types'
import type { CheerioAPI } from 'cheerio'

const BASE_URL = 'https://www.jumia.co.ke'

export class JumiaScraper extends BaseScraper {
  constructor() {
    super('jumia')
  }

  private isValidProductUrl(href: string): boolean {
    if (!href) return false

    const invalidPatterns = ['login', 'account', 'customer', 'auth', 'signin', 'signup', 'tkWl=', 'return=', 'redirect']
    for (const pattern of invalidPatterns) {
      if (href.toLowerCase().includes(pattern)) return false
    }

    const validPatterns: (string | RegExp)[] = ['.html', '/catalog/', /-\d+\.html/]
    for (const pattern of validPatterns) {
      if (typeof pattern === 'string' && href.includes(pattern)) return true
      if (pattern instanceof RegExp && pattern.test(href)) return true
    }

    return href.startsWith('/') && href.length > 10
  }

  private extractPriceFromText(text: string): number | null {
    if (!text) return null
    const cleaned = text.replace(/[KSh\s,]/g, '')
    const match = cleaned.match(/(\d+\.?\d*)/)
    if (match) {
      const price = parseFloat(match[1])
      return isNaN(price) ? null : price
    }
    return null
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

    // Log raw HTML snippet around known product markers for debugging
    const rawHtml = $.html()
    const markerIndex = rawHtml.indexOf('data-catalog-id')
    if (markerIndex === -1) {
      console.warn('[JumiaScraper] no data-catalog-id found in HTML — page may be JS-rendered or blocked')
      console.log('[JumiaScraper] HTML sample (chars 5000-8000):', rawHtml.substring(5000, 8000))
    } else {
      console.log('[JumiaScraper] found data-catalog-id at index:', markerIndex)
    }

    const products: ScrapedProduct[] = []

    const productSelectors = [
      'article[data-catalog-id]',
      '.prd._fb.col.c-prd',
      '.prd',
      '[data-id]',
      '.core',
      'article.prd',
      '.itm',
    ]

    let productElements = null
    for (const selector of productSelectors) {
      const elements = $(selector)
      if (elements.length > 0) {
        productElements = elements
        console.log(`[JumiaScraper] found ${elements.length} products using selector: ${selector}`)
        break
      }
    }

    if (!productElements) {
      console.warn('[JumiaScraper] no product elements found with any selector')
      return []
    }

    productElements.each((_, el) => {
      const card = $(el as Parameters<typeof $>[0])

      let name: string | null = null
      let productLink: string | null = null

      const nameLinkSelectors = [
        '.name a', '.prd-name a', 'h3 a', '.core a',
        '[data-catalog-id] a', 'a[href*="/"]', '.info a',
      ]
      for (const selector of nameLinkSelectors) {
        const nameEl = card.find(selector).first()
        if (nameEl.length) {
          const candidateName = nameEl.text().trim()
          const href = nameEl.attr('href')

          if (candidateName) name = candidateName
          if (href && this.isValidProductUrl(href)) {
            productLink = href.startsWith('http') ? href : `${BASE_URL}${href}`
          }
          if (name && productLink) break
        }
      }

      if (!name) {
        const nameOnlySelectors = ['.name', '.prd-name', 'h3', '.info h3', '.title']
        for (const selector of nameOnlySelectors) {
          const nameEl = card.find(selector).first()
          if (nameEl.length) {
            name = nameEl.text().trim()
            if (name) break
          }
        }
      }

      if (!productLink) {
        const linkOnlySelectors = ['a[href*=".html"]', 'a[href*="/"]', 'a[href*="jumia.co.ke"]']
        for (const selector of linkOnlySelectors) {
          const linkEl = card.find(selector).first()
          if (linkEl.length) {
            const href = linkEl.attr('href')
            if (href && this.isValidProductUrl(href)) {
              productLink = href.startsWith('http') ? href : `${BASE_URL}${href}`
              break
            }
          }
        }
      }

      if (name) {
        name = name.replace(/KSh\s*[\d,]+/g, '')
        name = name.replace(/\d+%/g, '')
        name = name.replace(/\d+\s*out\s*of\s*\d+/g, '')
        name = name.replace(/\(\d+\)/g, '')
        name = name.replace(/\s+/g, ' ').trim()
      }

      if (!name) return

      let price: number | null = null
      const priceSelectors = ['.prc', '.price', '.prd-price', '.current-price', '.-b.-tal.-fs24']
      for (const selector of priceSelectors) {
        const priceEl = card.find(selector).first()
        if (priceEl.length) {
          const extracted = this.extractPriceFromText(priceEl.text().trim())
          if (extracted !== null) {
            price = extracted
            break
          }
        }
      }

      let originalPrice: number | null = null
      const originalPriceSelectors = ['.old-price', '.original-price', '.crossed-out-price', '.-tal.-gy5.-lthr', '.old']
      for (const selector of originalPriceSelectors) {
        const origEl = card.find(selector).first()
        if (origEl.length) {
          const extracted = this.extractPriceFromText(origEl.text().trim())
          if (extracted !== null) {
            originalPrice = extracted
            break
          }
        }
      }

      const imgEl = card.find('img').first()
      const imageUrl = imgEl.attr('data-src') ?? imgEl.attr('src') ?? imgEl.attr('data-image') ?? null

      let rating: number | null = null
      const ratingEl = card.find('.stars, .rating, [data-rating]').first()
      if (ratingEl.length) {
        const match = ratingEl.text().trim().match(/(\d+\.?\d*)/)
        if (match) rating = parseFloat(match[1])
      }

      let discountPct: number | null = null
      const discountEl = card.find('.discount, .sale-flag, .-paxs').first()
      if (discountEl.length) {
        const match = discountEl.text().trim().match(/(\d+)%/)
        if (match) discountPct = parseInt(match[1])
      }

      let reviewCount: number | null = null
      const reviewsEl = card.find('.rev, .reviews-count').first()
      if (reviewsEl.length) {
        const match = reviewsEl.text().trim().match(/(\d+)/)
        if (match) reviewCount = parseInt(match[1])
      }

      const isOnSale = !!originalPrice && !!price && originalPrice > price

      if (name && price !== null) {
        products.push({
          name,
          url: productLink || '',
          price,
          original_price: originalPrice,
          image_url: imageUrl,
          is_in_stock: true,
          is_on_sale: isOnSale,
          discount_pct: discountPct,
          rating,
          review_count: reviewCount,
          retailer: 'jumia',
        })
      }
    })

    console.log(`[JumiaScraper] parsed ${products.length} products`)
    return products
  }

  async scrapePrice(url: string) {
    try {
      const $ = await this.fetchHtml(url)

      const priceRaw =
        $('span.-b-s1').first().text().trim() ||
        $('[class*="prc"]').first().text().trim()
      const originalRaw =
        $('span.-lthr').first().text().trim() ||
        $('[class*="old"]').first().text().trim()

      const price = this.extractPriceFromText(priceRaw)
      const original_price = this.extractPriceFromText(originalRaw)
      const is_on_sale = !!original_price && !!price && original_price > price

      const outOfStock =
        $('div.-error').text().toLowerCase().includes('out of stock') ||
        $('button.btn').text().toLowerCase().includes('out of stock')

      return { price, original_price, is_in_stock: !outOfStock, is_on_sale }
    } catch {
      return null
    }
  }
}