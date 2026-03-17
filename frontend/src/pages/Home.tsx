import { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import { useCryptoStore } from '../store/cryptoStore'
import { CoinCard } from '../components/CoinCard'
import { SearchBar } from '../components/SearchBar'
import { SortBar } from '../components/SortBar'
import { MarketBanner } from '../components/MarketBanner'
import { useWebSocket } from '../hooks/useWebSocket'
import { usePullToRefresh } from '../hooks/usePullToRefresh'
import { PullIndicator } from '../components/PullIndicator'
import type { Coin } from '../types'

const API_BASE = import.meta.env.VITE_API_URL || '/api'
const WS_SYMBOLS = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'ADA', 'DOGE', 'AVAX', 'DOT', 'MATIC', 'LINK', 'UNI', 'ATOM', 'LTC', 'TRX']

export function Home() {
  const { coins, setCoins, setLoading, setError, searchQuery, sortField, sortOrder, isLoading, error } = useCryptoStore()
  const [searchResults, setSearchResults] = useState<Coin[]>([])
  const searchDebounce = useRef<ReturnType<typeof setTimeout>>()

  useWebSocket(WS_SYMBOLS)

  const fetchCoins = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/coins`)
      if (!res.ok) throw new Error('Failed to fetch coins')
      const data: Coin[] = await res.json()
      setCoins(data)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [setCoins, setLoading, setError])

  const { pullProgress, isPulling, isRefreshing, bindEvents } = usePullToRefresh({ onRefresh: fetchCoins })

  useEffect(() => {
    fetchCoins()
  }, [fetchCoins])

  // Dynamic search — fires when query doesn't match local coins
  useEffect(() => {
    clearTimeout(searchDebounce.current)
    if (!searchQuery || searchQuery.length < 1) {
      setSearchResults([])
      return
    }
    searchDebounce.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(searchQuery)}`)
        if (res.ok) {
          const data: Coin[] = await res.json()
          // Only show API results for coins NOT in the local list
          const localSymbols = new Set(coins.map((c) => c.symbol))
          setSearchResults(data.filter((c) => !localSymbols.has(c.symbol)))
        }
      } catch {
        // silently ignore search errors
      }
    }, 350)
    return () => clearTimeout(searchDebounce.current)
  }, [searchQuery, coins])

  const filteredCoins = useMemo(() => {
    let list = [...coins]

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      list = list.filter(
        (c) => c.symbol.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
      )
    }

    list.sort((a, b) => {
      let aVal: number, bVal: number
      switch (sortField) {
        case 'price': aVal = a.price; bVal = b.price; break
        case 'change': aVal = a.priceChangePercent24h; bVal = b.priceChangePercent24h; break
        case 'volume': aVal = a.volume24h; bVal = b.volume24h; break
        default: aVal = 0; bVal = 0
      }
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal
    })

    return list
  }, [coins, searchQuery, sortField, sortOrder])

  if (isLoading) {
    return (
      <div className="flex flex-col gap-0.5 mt-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3.5">
            <div className="w-5 h-4 bg-bg-card rounded animate-pulse" />
            <div className="w-10 h-10 rounded-full bg-bg-card animate-pulse" />
            <div className="flex-1">
              <div className="h-4 w-16 bg-bg-card rounded animate-pulse mb-1.5" />
              <div className="h-3 w-24 bg-bg-card rounded animate-pulse" />
            </div>
            <div className="text-right">
              <div className="h-4 w-20 bg-bg-card rounded animate-pulse mb-1.5" />
              <div className="h-4 w-14 bg-bg-card rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-accent-red/10 flex items-center justify-center mb-4">
          <svg className="w-7 h-7 text-accent-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-text-secondary font-medium">Failed to load data</p>
        <p className="text-text-muted text-sm mt-1">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-6 py-2 bg-accent-blue rounded-xl text-white text-sm font-medium"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="animate-fade-in" ref={bindEvents}>
      <PullIndicator pullProgress={pullProgress} isRefreshing={isRefreshing} />
      <MarketBanner />
      <div className="pt-2">
        <SearchBar />
        <SortBar />
      </div>

      <div className="divide-y divide-border/50">
        {filteredCoins.map((coin, i) => (
          <CoinCard key={coin.symbol} coin={coin} rank={sortField === 'rank' ? i + 1 : undefined} />
        ))}

        {/* External search results (coins not in top 15) */}
        {searchResults.length > 0 && (
          <>
            {filteredCoins.length > 0 && (
              <div className="px-4 py-2">
                <span className="text-text-muted text-xs font-medium">Другие монеты</span>
              </div>
            )}
            {searchResults.map((coin) => (
              <CoinCard key={`ext-${coin.symbol}`} coin={coin} />
            ))}
          </>
        )}

        {filteredCoins.length === 0 && searchResults.length === 0 && searchQuery && (
          <div className="flex flex-col items-center py-16 text-text-muted">
            <svg className="w-12 h-12 mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-sm">Монета не найдена</p>
          </div>
        )}
      </div>
    </div>
  )
}
