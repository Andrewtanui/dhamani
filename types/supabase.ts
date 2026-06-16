import type { Profile, Category, Retailer, Product, ProductRetailer, PriceHistory, UserTrackedProduct, Wishlist, WishlistItem, RetailerName, AlertType } from './index'

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>
      }
      categories: {
        Row: Category
        Insert: Omit<Category, 'created_at'>
        Update: Partial<Omit<Category, 'id' | 'created_at'>>
      }
      retailers: {
        Row: Retailer
        Insert: Omit<Retailer, 'created_at'>
        Update: Partial<Omit<Retailer, 'id' | 'created_at'>>
      }
      products: {
        Row: Product
        Insert: Omit<Product, 'created_at' | 'updated_at'>
        Update: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at'>>
      }
      product_retailers: {
        Row: ProductRetailer
        Insert: Omit<ProductRetailer, 'created_at' | 'updated_at'>
        Update: Partial<Omit<ProductRetailer, 'id' | 'created_at' | 'updated_at'>>
      }
      price_history: {
        Row: PriceHistory
        Insert: Omit<PriceHistory, 'id'>
        Update: Partial<Omit<PriceHistory, 'id'>>
      }
      user_tracked_products: {
        Row: UserTrackedProduct
        Insert: Omit<UserTrackedProduct, 'id' | 'created_at'>
        Update: Partial<Omit<UserTrackedProduct, 'id' | 'created_at'>>
      }
      wishlists: {
        Row: Wishlist
        Insert: Omit<Wishlist, 'id' | 'created_at'>
        Update: Partial<Omit<Wishlist, 'id' | 'created_at'>>
      }
      wishlist_items: {
        Row: WishlistItem
        Insert: Omit<WishlistItem, 'id' | 'added_at'>
        Update: Partial<Omit<WishlistItem, 'id' | 'added_at'>>
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
