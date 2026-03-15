import { create } from 'zustand'
import { Alert } from '../types'

const API = import.meta.env.VITE_API_URL || '/api'

function getUserId(): number {
  return window.Telegram?.WebApp?.initDataUnsafe?.user?.id ?? 0
}

interface AlertStore {
  alerts: Alert[]
  loading: boolean
  fetchAlerts: () => Promise<void>
  createAlert: (data: {
    chat_id: number
    symbol: string
    condition: 'above' | 'below'
    price: number
  }) => Promise<void>
  deleteAlert: (id: number) => Promise<void>
  resetAlert: (id: number) => Promise<void>
}

export const useAlertStore = create<AlertStore>((set) => ({
  alerts: [],
  loading: false,

  fetchAlerts: async () => {
    const userId = getUserId()
    if (!userId) return
    set({ loading: true })
    try {
      const res = await fetch(`${API}/alerts?user_id=${userId}`)
      const data = await res.json()
      set({ alerts: Array.isArray(data) ? data : [] })
    } finally {
      set({ loading: false })
    }
  },

  createAlert: async ({ chat_id, symbol, condition, price }) => {
    const userId = getUserId()
    await fetch(`${API}/alerts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, chat_id, symbol, condition, price }),
    })
    await useAlertStore.getState().fetchAlerts()
  },

  deleteAlert: async (id) => {
    await fetch(`${API}/alerts/${id}`, { method: 'DELETE' })
    set((s) => ({ alerts: s.alerts.filter((a) => a.id !== id) }))
  },

  resetAlert: async (id) => {
    await fetch(`${API}/alerts/${id}/reset`, { method: 'PATCH' })
    set((s) => ({
      alerts: s.alerts.map((a) => (a.id === id ? { ...a, triggered: false } : a)),
    }))
  },
}))
