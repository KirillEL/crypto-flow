import { create } from 'zustand'
import { Alert } from '../types'

const API = import.meta.env.VITE_API_URL || '/api'

function getUserId(): number {
  return window.Telegram?.WebApp?.initDataUnsafe?.user?.id ?? 0
}

interface AlertStore {
  alerts: Alert[]
  loading: boolean
  connected: boolean | null  // null = not checked yet
  fetchAlerts: () => Promise<void>
  checkConnection: () => Promise<boolean>
  createAlert: (data: {
    symbol: string
    condition: 'above' | 'below' | 'pct_above' | 'pct_below'
    price?: number
    alert_type?: 'price' | 'pct'
    threshold?: number
  }) => Promise<{ error?: string; connect_url?: string }>
  deleteAlert: (id: number) => Promise<void>
  resetAlert: (id: number) => Promise<void>
}

export const useAlertStore = create<AlertStore>((set, get) => ({
  alerts: [],
  loading: false,
  connected: null,

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

  checkConnection: async () => {
    const userId = getUserId()
    if (!userId) {
      set({ connected: false })
      return false
    }
    try {
      const res = await fetch(`${API}/user/connected?user_id=${userId}`)
      const data = await res.json()
      set({ connected: !!data.connected })
      return !!data.connected
    } catch {
      set({ connected: false })
      return false
    }
  },

  createAlert: async ({ symbol, condition, price, alert_type, threshold }) => {
    const userId = getUserId()
    const res = await fetch(`${API}/alerts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        symbol,
        condition,
        price: price ?? 0,
        alert_type: alert_type ?? 'price',
        threshold: threshold ?? 0,
      }),
    })
    if (res.status === 402) {
      const data = await res.json()
      return { error: 'not_connected', connect_url: data.connect_url }
    }
    if (!res.ok) {
      const data = await res.json()
      return { error: data.error ?? 'Ошибка при создании алерта' }
    }
    await get().fetchAlerts()
    return {}
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
