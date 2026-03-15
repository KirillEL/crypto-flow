import { create } from 'zustand'
import type { Coin, SortField, SortOrder, TimeFrame } from '../types'

interface CryptoStore {
  coins: Coin[]
  watchlist: string[]
  searchQuery: string
  sortField: SortField
  sortOrder: SortOrder
  isLoading: boolean
  error: string | null
  selectedTimeFrame: TimeFrame
  wsConnected: boolean

  setCoins: (coins: Coin[]) => void
  updateCoinPrice: (symbol: string, price: number, priceChangePercent: number) => void
  toggleWatchlist: (symbol: string) => void
  setSearchQuery: (q: string) => void
  setSortField: (field: SortField) => void
  setSortOrder: (order: SortOrder) => void
  setLoading: (v: boolean) => void
  setError: (e: string | null) => void
  setTimeFrame: (tf: TimeFrame) => void
  setWsConnected: (v: boolean) => void
}

const WATCHLIST_KEY = 'cryptoflow_watchlist'

const loadWatchlist = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(WATCHLIST_KEY) || '[]')
  } catch {
    return []
  }
}

export const useCryptoStore = create<CryptoStore>((set) => ({
  coins: [],
  watchlist: loadWatchlist(),
  searchQuery: '',
  sortField: 'rank',
  sortOrder: 'asc',
  isLoading: false,
  error: null,
  selectedTimeFrame: '1h',
  wsConnected: false,

  setCoins: (coins) => set({ coins }),

  updateCoinPrice: (symbol, price, priceChangePercent) =>
    set((state) => ({
      coins: state.coins.map((c) =>
        c.symbol === symbol
          ? {
              ...c,
              price,
              priceChangePercent24h: priceChangePercent,
              priceChange24h: (price * priceChangePercent) / 100,
            }
          : c
      ),
    })),

  toggleWatchlist: (symbol) =>
    set((state) => {
      const next = state.watchlist.includes(symbol)
        ? state.watchlist.filter((s) => s !== symbol)
        : [...state.watchlist, symbol]
      localStorage.setItem(WATCHLIST_KEY, JSON.stringify(next))
      return { watchlist: next }
    }),

  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSortField: (sortField) => set({ sortField }),
  setSortOrder: (sortOrder) => set({ sortOrder }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setTimeFrame: (selectedTimeFrame) => set({ selectedTimeFrame }),
  setWsConnected: (wsConnected) => set({ wsConnected }),
}))
