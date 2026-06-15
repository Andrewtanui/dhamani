'use client'

import { useState, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from './useAuth'
import type { ScrapedProduct, RetailerName } from '@/types'

type WishlistItem = {
  id: string
  product_name: string
  product_url: string
  product_image_url: string | null
  product_price: number | null
  retailer: RetailerName
  added_at: string
}

export function useWishlist() {
  const supabase = createClient()
  const { user, isAuthenticated } = useAuth()
  const [items, setItems] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(false)

  const fetchWishlist = useCallback(async () => {
    if (!isAuthenticated || !user) return

    setLoading(true)
    try {
      // First check if user has a wishlist
      const { data: wishlists, error: wishlistError } = await supabase
        .from('wishlists')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(1)

      if (wishlistError) throw wishlistError

      let wishlistId: string
      if (wishlists.length === 0) {
        // Create default wishlist
        const { data: newWishlist, error: createError } = await supabase
          .from('wishlists')
          .insert({ user_id: user.id })
          .select('id')
          .single()

        if (createError) throw createError
        wishlistId = newWishlist.id
      } else {
        wishlistId = wishlists[0].id
      }

      // Get wishlist items
      const { data, error } = await supabase
        .from('wishlist_items')
        .select('*')
        .eq('wishlist_id', wishlistId)
        .order('added_at', { ascending: false })

      if (error) throw error

      setItems(data.map(item => ({
        id: item.id,
        product_name: item.product_name,
        product_url: item.product_url,
        product_image_url: item.product_image_url,
        product_price: item.product_price,
        retailer: item.retailer,
        added_at: item.added_at
      })))
    } catch (err) {
      console.error('Error fetching wishlist:', err)
    } finally {
      setLoading(false)
    }
  }, [supabase, user, isAuthenticated])

  // Check if a product is in wishlist
  const isInWishlist = useCallback((productUrl: string) => {
    return items.some(item => item.product_url === productUrl)
  }, [items])

  const addToWishlist = useCallback(async (product: ScrapedProduct) => {
    if (!isAuthenticated || !user) {
      alert('Please sign in to add products to wishlist')
      return false
    }

    setLoading(true)
    try {
      // Get or create wishlist
      const { data: wishlists, error: wishlistError } = await supabase
        .from('wishlists')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(1)

      if (wishlistError) throw wishlistError

      let wishlistId: string
      if (wishlists.length === 0) {
        const { data: newWishlist, error: createError } = await supabase
          .from('wishlists')
          .insert({ user_id: user.id })
          .select('id')
          .single()

        if (createError) throw createError
        wishlistId = newWishlist.id
      } else {
        wishlistId = wishlists[0].id
      }

      // Check if we need to add columns to wishlist_items first
      // We'll store scraped product directly
      const { error: insertError } = await supabase
        .from('wishlist_items')
        .insert({
          wishlist_id: wishlistId,
          product_name: product.name,
          product_url: product.url,
          product_image_url: product.image_url,
          product_price: product.price,
          retailer: product.retailer
        })

      if (insertError) {
        // If columns don't exist, let's try to create them by checking the error
        // We'll need a migration for this
        throw insertError
      }

      await fetchWishlist()
      return true
    } catch (err) {
      console.error('Error adding to wishlist:', err)
      return false
    } finally {
      setLoading(false)
    }
  }, [supabase, user, isAuthenticated, fetchWishlist])

  const removeFromWishlist = useCallback(async (productUrl: string) => {
    if (!isAuthenticated || !user) return

    const item = items.find(i => i.product_url === productUrl)
    if (!item) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('wishlist_items')
        .delete()
        .eq('id', item.id)

      if (error) throw error

      await fetchWishlist()
    } catch (err) {
      console.error('Error removing from wishlist:', err)
    } finally {
      setLoading(false)
    }
  }, [supabase, user, isAuthenticated, items, fetchWishlist])

  useEffect(() => {
    fetchWishlist()
  }, [fetchWishlist])

  return {
    items,
    loading,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    fetchWishlist
  }
}
