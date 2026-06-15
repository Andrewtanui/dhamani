import type { Profile, Category, Retailer, Product, ProductRetailer, PriceHistory, UserTrackedProduct, Wishlist, WishlistItem, RetailerName, AlertType } from './index'

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Partial<Profile>
        Update: Partial<Profile>
      }
      categories: {
        Row: Category
        Insert: Partial<Category>
        Update: Partial<Category>
      }
      retailers: {
        Row: Retailer
        Insert: Partial<Retailer>
        Update: Partial<Retailer>
      }
      products: {
        Row: Product
        Insert: Partial<Product>
        Update: Partial<Product>
      }
      product_retailers: {
        Row: ProductRetailer
        Insert: Partial<ProductRetailer>
        Update: Partial<ProductRetailer>
      }
      price_history: {
        Row: PriceHistory
        Insert: Partial<PriceHistory>
        Update: Partial<PriceHistory>
      }
      user_tracked_products: {
        Row: UserTrackedProduct
        Insert: Partial<UserTrackedProduct>
        Update: Partial<UserTrackedProduct>
      }
      wishlists: {
        Row: Wishlist
        Insert: Partial<Wishlist>
        Update: Partial<Wishlist>
      }
      wishlist_items: {
        Row: WishlistItem
        Insert: Partial<WishlistItem>
        Update: Partial<WishlistItem>
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      retailer_name: RetailerName
      alert_type: AlertType
    }
  }
}
