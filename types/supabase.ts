import type { Profile, Category, Retailer, Product, RetailerName, AlertType } from './index'

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at'> & {
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<Profile, 'id' | 'created_at'>> & {
          updated_at?: string
        }
      }
      categories: {
        Row: Category
        Insert: Omit<Category, 'created_at'> & { created_at?: string }
        Update: Partial<Omit<Category, 'id' | 'created_at'>>
      }
      retailers: {
        Row: Retailer
        Insert: Omit<Retailer, 'created_at'> & { created_at?: string }
        Update: Partial<Omit<Retailer, 'id' | 'created_at'>>
      }
      products: {
        Row: Product
        Insert: Omit<Product, 'created_at'> & { created_at?: string }
        Update: Partial<Omit<Product, 'id' | 'created_at'>>
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
