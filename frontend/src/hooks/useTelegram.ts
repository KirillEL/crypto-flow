import { useEffect } from 'react'

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void
        expand: () => void
        close: () => void
        enableClosingConfirmation: () => void
        setHeaderColor: (color: string) => void
        setBackgroundColor: (color: string) => void
        openTelegramLink: (url: string) => void
        openLink: (url: string) => void
        switchInlineQuery: (query: string, choose_chat_types?: string[]) => void
        MainButton: {
          text: string
          show: () => void
          hide: () => void
          onClick: (fn: () => void) => void
        }
        BackButton: {
          show: () => void
          hide: () => void
          onClick: (fn: () => void) => void
        }
        HapticFeedback: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void
          selectionChanged: () => void
        }
        themeParams: Record<string, string>
        colorScheme: 'light' | 'dark'
        initDataUnsafe: {
          user?: {
            id: number
            first_name: string
            last_name?: string
            username?: string
          }
          start_param?: string
        }
      }
    }
  }
}

export const useTelegram = () => {
  const tg = window.Telegram?.WebApp

  useEffect(() => {
    if (tg) {
      tg.ready()
      tg.expand()
      tg.setBackgroundColor('#0a0e1a')
      tg.setHeaderColor('#0a0e1a')
    }
  }, [tg])

  return { tg, user: tg?.initDataUnsafe?.user }
}

export const useHaptic = () => {
  const hf = window.Telegram?.WebApp?.HapticFeedback
  return {
    tapLight: () => hf?.impactOccurred('light'),
    tapMedium: () => hf?.impactOccurred('medium'),
    success: () => hf?.notificationOccurred('success'),
    error: () => hf?.notificationOccurred('error'),
    warning: () => hf?.notificationOccurred('warning'),
    selectionChanged: () => hf?.selectionChanged(),
  }
}
