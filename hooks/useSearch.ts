'use client'

import { useState, useCallback, useRef } from 'react'
import type { SearchResult, RetailerName } from '@/types'

type SearchState = {
  data: SearchResult | null
  loading: boolean
  error: string | null
}

const ALL_RETAILERS: RetailerName[] = ['jumia', 'kilimall', 'jiji', 'instagram']

export function useSearch() {
  const [state, setState] = useState<SearchState>({
    data: null,
    loading: false,
    error: null,
  })

  const [selectedRetailers, setSelectedRetailers] = useState<RetailerName[]>(ALL_RETAILERS)

  const abortRef = useRef<AbortController | null>(null)

  const toggleRetailer = useCallback((retailer: RetailerName) => {
    setSelectedRetailers(prev => {
      if (prev.includes(retailer)) {
        const filtered = prev.filter(r => r !== retailer)
        return filtered.length === 0 ? ALL_RETAILERS : filtered
      } else {
        return [...prev, retailer]
      }
    })
  }, [])

  const selectAllRetailers = useCallback(() => {
    setSelectedRetailers(ALL_RETAILERS)
  }, [])

  const search = useCallback(async (query: string, retailers?: RetailerName[]) => {
    if (!query.trim()) return

    abortRef.current?.abort()
    abortRef.current = new AbortController()

    const retailersToSearch = retailers || selectedRetailers

    setState({ data: null, loading: true, error: null })

    try {
      const params = new URLSearchParams({
        q: query.trim(),
        retailers: JSON.stringify(retailersToSearch)
      })
      
      const res = await fetch(
        `/api/search?${params}`,
        { signal: abortRef.current.signal }
      )

      if (!res.ok) {
        const { error } = await res.json()
        throw new Error(error ?? 'Search failed')
      }

      const data: SearchResult = await res.json()
      setState({ data, loading: false, error: null })
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      setState({
        data: null,
        loading: false,
        error: (err as Error).message ?? 'Something went wrong',
      })
    }
  }, [selectedRetailers])

  const clear = useCallback(() => {
    abortRef.current?.abort()
    setState({ data: null, loading: false, error: null })
    setSelectedRetailers(ALL_RETAILERS)
  }, [])

  return {
    ...state,
    search,
    clear,
    selectedRetailers,
    toggleRetailer,
    selectAllRetailers,
    ALL_RETAILERS,
  }
}
