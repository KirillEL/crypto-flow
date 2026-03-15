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
