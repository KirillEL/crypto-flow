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
  condition: 'above' | 'below' | 'pct_above' | 'pct_below'
  price: number
  alert_type: 'price' | 'pct'
  threshold: number
  active: boolean
  triggered: boolean
  created_at: string
}

export interface Holding {
  id: number
  user_id: number
  symbol: string
  amount: number
  entry_price: number
  created_at: string
}

export interface MarketOverview {
  total_market_cap: number
  market_cap_change_24h: number
  btc_dominance: number
  fear_greed_value: string
  fear_greed_label: string
}
