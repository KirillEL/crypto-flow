import { useEffect, useRef, useCallback } from 'react'
import { useCryptoStore } from '../store/cryptoStore'

const WS_URL = import.meta.env.VITE_WS_URL || 'wss://stream.binance.com:9443/stream'

export const useWebSocket = (symbols: string[]) => {
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { updateCoinPrice, setWsConnected } = useCryptoStore()

  const connect = useCallback(() => {
    if (!symbols.length) return

    const streams = symbols
      .map((s) => `${s.toLowerCase()}usdt@ticker`)
      .join('/')
    const url = `${WS_URL}?streams=${streams}`

    wsRef.current = new WebSocket(url)

    wsRef.current.onopen = () => {
      setWsConnected(true)
    }

    wsRef.current.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        const data = msg.data || msg
        if (data.s && data.c && data.P) {
          const symbol = data.s.replace('USDT', '')
          updateCoinPrice(symbol, parseFloat(data.c), parseFloat(data.P))
        }
      } catch {
        // ignore parse errors
      }
    }

    wsRef.current.onclose = () => {
      setWsConnected(false)
      reconnectTimer.current = setTimeout(connect, 3000)
    }

    wsRef.current.onerror = () => {
      setWsConnected(false)
      wsRef.current?.close()
    }
  }, [symbols.join(','), updateCoinPrice, setWsConnected])

  useEffect(() => {
    connect()
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
      wsRef.current?.close()
    }
  }, [connect])
}
