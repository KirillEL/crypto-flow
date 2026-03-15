export interface Coin {
  symbol: string
  name: string
  price: number
  priceChange24h: number
  priceChangePercent24h: number
  high24h: number
  low24h: number
  volume24h: number
  marketCap?: number
  logoUrl?: string
  sparkline?: number[]
}

export interface Candle {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface TickerUpdate {
  symbol: string
  price: number
  priceChangePercent: number
  volume: number
}

export type TimeFrame = '1m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w'

export type SortField = 'rank' | 'price' | 'change' | 'volume'
export type SortOrder = 'asc' | 'desc'

export interface Alert {
  id: number
  user_id: number
  chat_id: number
  symbol: string
  condition: 'above' | 'below'
  price: number
  active: boolean
  triggered: boolean
  created_at: string
}
