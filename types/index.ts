// ============================================================
// Thamani — Shared TypeScript Types
// ============================================================

// ----- Enums ------------------------------------------------

export type RetailerName = 'jumia' | 'kilimall' | 'jiji' | 'instagram'
export type AlertType = 'price_drop' | 'back_in_stock' | 'any_change'

// ----- DB Row Types -----------------------------------------

export type Profile = {
  id: string
  display_name: string | null
  bio: string | null
  avatar_url: string | null
  currency: string
  created_at: string
  updated_at: string
}

export type Category = {
  id: string
  name: string
  slug: string
  parent_id: string | null
  image_url: string | null
  created_at: string
}

export type Retailer = {
  id: string
  name: RetailerName
  display_name: string
  website_url: string
  logo_url: string | null
  country: string
  is_active: boolean
  created_at: string
}

export type Product = {
  id: string
  name: string
  description: string | null
  brand: string | null
  model: string | null
  category_id: string | null
  image_url: string | null
  specs: Record<string, string> | null
  created_at: string
  updated_at: string
}

export type ProductRetailer = {
  id: string
  product_id: string
  retailer_id: string
  retailer_product_url: string
  current_price: number | null
  original_price: number | null
  is_in_stock: boolean
  is_on_sale: boolean
  last_scraped_at: string | null
  scrape_error: string | null
  scrape_count: number
  is_scrapable: boolean
  created_at: string
  updated_at: string
}

export type PriceHistory = {
  id: string
  product_retailer_id: string
  price: number
  original_price: number | null
  is_on_sale: boolean
  recorded_at: string
}

export type UserTrackedProduct = {
  id: string
  user_id: string
  product_id: string
  target_price: number | null
  alert_type: AlertType
  is_active: boolean
  last_notified_at: string | null
  created_at: string
}

export type Wishlist = {
  id: string
  user_id: string
  name: string
  is_public: boolean
  created_at: string
}

export type WishlistItem = {
  id: string
  wishlist_id: string
  product_id: string | null
  product_name: string
  product_url: string
  product_image_url: string | null
  product_price: number | null
  retailer: RetailerName
  added_at: string
}

// ----- Enriched / Joined Types ------------------------------

/** Product with its listings across retailers */
export type ProductWithRetailers = Product & {
  category: Category | null
  retailers: (ProductRetailer & { retailer: Retailer })[]
}

/** Scraper result — raw data before DB persistence */
export type ScrapedProduct = {
  name: string
  url: string
  price: number | null
  original_price: number | null
  image_url: string | null
  is_in_stock: boolean
  is_on_sale: boolean
  discount_pct: number | null
  rating: number | null
  review_count: number | null
  retailer: RetailerName
}

/** Search result returned to the frontend */
export type SearchResult = {
  query: string
  results: ScrapedProduct[]
  retailer_errors: Partial<Record<RetailerName, string>>
  duration_ms: number
}

// ----- Supabase Database type (used with createClient<Database>) ---

export type Database = {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> }
      categories: { Row: Category; Insert: Partial<Category>; Update: Partial<Category> }
      retailers: { Row: Retailer; Insert: Partial<Retailer>; Update: Partial<Retailer> }
      products: { Row: Product; Insert: Partial<Product>; Update: Partial<Product> }
      product_retailers: { Row: ProductRetailer; Insert: Partial<ProductRetailer>; Update: Partial<ProductRetailer> }
      price_history: { Row: PriceHistory; Insert: Partial<PriceHistory>; Update: Partial<PriceHistory> }
      user_tracked_products: { Row: UserTrackedProduct; Insert: Partial<UserTrackedProduct>; Update: Partial<UserTrackedProduct> }
      wishlists: { Row: Wishlist; Insert: Partial<Wishlist>; Update: Partial<Wishlist> }
      wishlist_items: { 
        Row: WishlistItem; 
        Insert: Partial<WishlistItem>; 
        Update: Partial<WishlistItem> 
      }
    }
    Enums: {
      retailer_name: RetailerName
      alert_type: AlertType
    }
  }
}