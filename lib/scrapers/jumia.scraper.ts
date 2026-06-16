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
    
    // Skip invalid patterns
    const invalidPatterns = ['login', 'account', 'customer', 'auth', 'signin', 'signup', 'tkWl=', 'return=', 'redirect']
    for (const pattern of invalidPatterns) {
      if (href.toLowerCase().includes(pattern)) return false
    }
    
    // Check valid patterns
    const validPatterns = ['.html', '/catalog/', /-\d+\.html/]
    for (const pattern of validPatterns) {
      if (typeof pattern === 'string' && href.includes(pattern)) return true
      if (pattern instanceof RegExp && pattern.test(href)) return true
    }
    
    // Fallback: reasonable path
    return href.startsWith('/') && href.length > 10
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

    // Find product elements using multiple selectors
    const productSelectors = [
      'article[data-catalog-id]',
      '.prd._fb.col.c-prd',
      '.prd',
      '[data-id]',
      '.core',
      'article.prd',
      '.itm'
    ]

    let productElements = null
    for (const selector of productSelectors) {
      const elements = $(selector)
      if (elements.length > 0) {
        productElements = elements
        console.log(`[JumiaScraper] Found ${elements.length} products using selector: ${selector}`)
        break
      }
    }

    if (!productElements) {
      console.log('[JumiaScraper] No products found')
      return []
    }

    productElements.each((_, el) => {
      const card = $(el as Parameters<typeof $>[0])
      
      let name = null
      let productLink = null
      
      // Try name+link selectors first
      const nameLinkSelectors = [
        '.name a',
        '.prd-name a',
        'h3 a',
        '.core a',
        '[data-catalog-id] a',
        'a[href*="/"]',
        '.info a'
      ]
      for (const selector of nameLinkSelectors) {
        const nameEl = card.find(selector).first()
        if (nameEl.length) {
          const candidateName = nameEl.text().trim()
          const href = nameEl.attr('href')
          
          if (candidateName) {
            name = candidateName
          }
          
          if (href && this.isValidProductUrl(href)) {
            productLink = href.startsWith('http') ? href : `${BASE_URL}${href}`
          }
          
          if (name && productLink) break
        }
      }
      
      // If we still don't have a name, try name-only selectors
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
      
      // If we still don't have a link, try link-only selectors
      if (!productLink) {
        const linkOnlySelectors = [
          'a[href*=".html"]',
          'a[href*="/"]',
          'a[href*="jumia.co.ke"]'
        ]
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
      
      // Clean up name
      if (name) {
        name = name.replace(/KSh\s*[\d,]+/g, '')
        name = name.replace(/\d+%/g, '')
        name = name.replace(/\d+\s*out\s*of\s*\d+/g, '')
        name = name.replace(/\(\d+\)/g, '')
        name = name.replace(/\s+/g, ' ').trim()
      }
      
      if (!name) return // Skip invalid products without name
      
      // Extract price
      let price = null
      const priceSelectors = [
        '.prc',
        '.price',
        '.prd-price',
        '.current-price',
        '.-b.-tal.-fs24'
      ]
      for (const selector of priceSelectors) {
        const priceEl = card.find(selector).first()
        if (priceEl.length) {
          const priceText = priceEl.text().trim()
          const extractedPrice = this.extractPriceFromText(priceText)
          if (extractedPrice !== null) {
            price = extractedPrice
            break
          }
        }
      }
      
      // Extract original price
      let originalPrice = null
      const originalPriceSelectors = [
        '.old-price',
        '.original-price',
        '.crossed-out-price',
        '.-tal.-gy5.-lthr',
        '.old'
      ]
      for (const selector of originalPriceSelectors) {
        const origEl = card.find(selector).first()
        if (origEl.length) {
          const origText = origEl.text().trim()
          const extractedOrig = this.extractPriceFromText(origText)
          if (extractedOrig !== null) {
            originalPrice = extractedOrig
            break
          }
        }
      }
      
      // Extract image
      let imageUrl = null
      const imgEl = card.find('img').first()
      imageUrl = imgEl.attr('data-src') ?? imgEl.attr('src') ?? imgEl.attr('data-image') ?? null
      
      // Extract rating
      let rating = null
      const ratingEl = card.find('.stars, .rating, [data-rating]').first()
      if (ratingEl.length) {
        const ratingText = ratingEl.text().trim()
        const match = ratingText.match(/(\d+\.?\d*)/)
        if (match) {
          rating = parseFloat(match[1])
        }
      }
      
      // Extract discount percentage
      let discountPct = null
      const discountEl = card.find('.discount, .sale-flag, .-paxs').first()
      if (discountEl.length) {
        const discountText = discountEl.text().trim()
        const match = discountText.match(/(\d+)%/)
        if (match) {
          discountPct = parseInt(match[1])
        }
      }
      
      // Extract reviews count
      let reviewsCount = null
      const reviewsEl = card.find('.rev, .reviews-count').first()
      if (reviewsEl.length) {
        const reviewsText = reviewsEl.text().trim()
        const match = reviewsText.match(/(\d+)/)
        if (match) {
          reviewsCount = parseInt(match[1])
        }
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
          review_count: reviewsCount,
          retailer: 'jumia'
        })
      }
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

      const price = this.extractPriceFromText(priceRaw)
      const original_price = this.extractPriceFromText(originalRaw)
      const is_on_sale = !!original_price && !!price && original_price > price

      const outOfStock = $('div.-error').text().toLowerCase().includes('out of stock')
        || $('button.btn').text().toLowerCase().includes('out of stock')

      return { price, original_price, is_in_stock: !outOfStock, is_on_sale }
    } catch {
      return null
    }
  }
}
