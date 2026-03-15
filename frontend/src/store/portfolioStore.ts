import { create } from 'zustand'
import { Holding } from '../types'

const API = import.meta.env.VITE_API_URL || '/api'
const LOCAL_KEY = 'cf_portfolio'

function getUserId(): number {
  return window.Telegram?.WebApp?.initDataUnsafe?.user?.id ?? 0
}

interface PortfolioStore {
  holdings: Holding[]
  loading: boolean
  fetchHoldings: () => Promise<void>
  addHolding: (data: { symbol: string; amount: number; entry_price: number }) => Promise<void>
  updateHolding: (id: number, data: { amount: number; entry_price: number }) => Promise<void>
  deleteHolding: (id: number) => Promise<void>
}

let nextLocalId = -1

export const usePortfolioStore = create<PortfolioStore>((set, get) => ({
  holdings: [],
  loading: false,

  fetchHoldings: async () => {
    const userId = getUserId()
    set({ loading: true })

    if (!userId) {
      // localStorage fallback for non-Telegram context
      try {
        const stored = localStorage.getItem(LOCAL_KEY)
        set({ holdings: stored ? JSON.parse(stored) : [] })
      } catch {
        set({ holdings: [] })
      }
      set({ loading: false })
      return
    }

    try {
      const res = await fetch(`${API}/portfolio?user_id=${userId}`)
      const data = await res.json()
      set({ holdings: Array.isArray(data) ? data : [] })
    } finally {
      set({ loading: false })
    }
  },

  addHolding: async ({ symbol, amount, entry_price }) => {
    const userId = getUserId()

    if (!userId) {
      const holding: Holding = {
        id: nextLocalId--,
        user_id: 0,
        symbol,
        amount,
        entry_price,
        created_at: new Date().toISOString(),
      }
      set((s) => {
        const updated = [holding, ...s.holdings]
        localStorage.setItem(LOCAL_KEY, JSON.stringify(updated))
        return { holdings: updated }
      })
      return
    }

    await fetch(`${API}/portfolio`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, symbol, amount, entry_price }),
    })
    await get().fetchHoldings()
  },

  updateHolding: async (id, { amount, entry_price }) => {
    const userId = getUserId()

    if (!userId) {
      set((s) => {
        const updated = s.holdings.map((h) => h.id === id ? { ...h, amount, entry_price } : h)
        localStorage.setItem(LOCAL_KEY, JSON.stringify(updated))
        return { holdings: updated }
      })
      return
    }

    await fetch(`${API}/portfolio/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, entry_price }),
    })
    set((s) => ({ holdings: s.holdings.map((h) => h.id === id ? { ...h, amount, entry_price } : h) }))
  },

  deleteHolding: async (id) => {
    const userId = getUserId()

    if (!userId) {
      set((s) => {
        const updated = s.holdings.filter((h) => h.id !== id)
        localStorage.setItem(LOCAL_KEY, JSON.stringify(updated))
        return { holdings: updated }
      })
      return
    }

    await fetch(`${API}/portfolio/${id}`, { method: 'DELETE' })
    set((s) => ({ holdings: s.holdings.filter((h) => h.id !== id) }))
  },
}))
