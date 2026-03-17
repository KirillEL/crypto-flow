import { useEffect } from 'react'
import { create } from 'zustand'

interface ToastState {
  message: string | null
  type: 'error' | 'success' | 'info'
  show: (message: string, type?: 'error' | 'success' | 'info') => void
  hide: () => void
}

export const useToast = create<ToastState>((set) => ({
  message: null,
  type: 'error',
  show: (message, type = 'error') => set({ message, type }),
  hide: () => set({ message: null }),
}))

export function Toast() {
  const { message, type, hide } = useToast()

  useEffect(() => {
    if (!message) return
    const t = setTimeout(hide, 3500)
    return () => clearTimeout(t)
  }, [message, hide])

  if (!message) return null

  const colors = {
    error: 'bg-accent-red/90 text-white',
    success: 'bg-accent-green/90 text-white',
    info: 'bg-accent-blue/90 text-white',
  }

  return (
    <div
      className={`fixed bottom-24 left-4 right-4 z-[100] px-4 py-3 rounded-2xl text-sm font-medium shadow-lg animate-fade-in flex items-center justify-between gap-3 ${colors[type]}`}
      onClick={hide}
    >
      <span>{message}</span>
      <span className="opacity-70 text-xs">✕</span>
    </div>
  )
}
