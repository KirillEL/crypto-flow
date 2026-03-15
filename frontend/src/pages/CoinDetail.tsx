import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useCryptoStore } from '../store/cryptoStore'
import { PriceChart } from '../components/PriceChart'
import { formatPrice, formatPercent, formatVolume } from '../utils/format'
import type { Candle, TimeFrame } from '../types'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

const STAT_ITEM = ({ label, value }: { label: string; value: string }) => (
  <div className="bg-bg-secondary rounded-xl p-3">
    <div className="text-text-muted text-xs mb-1">{label}</div>
    <div className="text-text-primary font-semibold text-sm font-mono">{value}</div>
  </div>
)

export function CoinDetail() {
  const { symbol } = useParams<{ symbol: string }>()
  const navigate = useNavigate()
  const { coins, watchlist, toggleWatchlist, selectedTimeFrame, setTimeFrame } = useCryptoStore()
  const [candles, setCandles] = useState<Candle[]>([])
  const [loadingChart, setLoadingChart] = useState(false)

  const coin = coins.find((c) => c.symbol === symbol)
  const isWatched = symbol ? watchlist.includes(symbol) : false
  const isPositive = (coin?.priceChangePercent24h ?? 0) >= 0

  const fetchCandles = useCallback(async (tf: TimeFrame) => {
    if (!symbol) return
    setLoadingChart(true)
    try {
      const res = await fetch(`${API_BASE}/coins/${symbol}/candles?interval=${tf}`)
      if (!res.ok) throw new Error('Failed to fetch candles')
      const data: Candle[] = await res.json()
      setCandles(data)
    } catch {
      // fallback: empty chart
    } finally {
      setLoadingChart(false)
    }
  }, [symbol])

  useEffect(() => {
    fetchCandles(selectedTimeFrame)
  }, [fetchCandles, selectedTimeFrame])

  const handleTimeFrameChange = (tf: TimeFrame) => {
    setTimeFrame(tf)
    fetchCandles(tf)
  }

  if (!coin) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-text-muted">Coin not found</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-accent-blue text-sm">Go back</button>
      </div>
    )
  }

  return (
    <div className="animate-fade-in pb-8">
      {/* Top bar */}
      <div className="sticky top-0 z-50 bg-bg-primary/95 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 rounded-xl bg-bg-card flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-text-primary font-bold text-base">{coin.symbol}/USDT</span>
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${
                isPositive ? 'bg-accent-green/10 text-accent-green' : 'bg-accent-red/10 text-accent-red'
              }`}
            >
              {isPositive ? '+' : ''}{formatPercent(coin.priceChangePercent24h)}
            </span>
          </div>
          <div className="text-text-muted text-xs">{coin.name}</div>
        </div>

        <button
          onClick={() => symbol && toggleWatchlist(symbol)}
          className="w-8 h-8 rounded-xl bg-bg-card flex items-center justify-center"
        >
          <svg
            className={`w-4 h-4 transition-colors ${isWatched ? 'text-accent-yellow fill-current' : 'text-text-muted'}`}
            viewBox="0 0 24 24"
            fill={isWatched ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth={2}
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </button>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Price hero */}
        <div>
          <div className="text-3xl font-bold text-text-primary font-mono">
            ${formatPrice(coin.price)}
          </div>
          <div className={`flex items-center gap-2 mt-1 ${isPositive ? 'text-accent-green' : 'text-accent-red'}`}>
            <span className="text-sm font-medium">
              {isPositive ? '+' : ''}${Math.abs(coin.priceChange24h).toFixed(2)}
            </span>
            <span className="text-sm">({formatPercent(coin.priceChangePercent24h)})</span>
            <span className="text-text-muted text-xs">24h</span>
          </div>
        </div>

        {/* Chart */}
        {loadingChart ? (
          <div className="h-72 bg-bg-card rounded-2xl border border-border animate-pulse" />
        ) : (
          <PriceChart
            candles={candles}
            timeFrame={selectedTimeFrame}
            onTimeFrameChange={handleTimeFrameChange}
            isPositive={isPositive}
          />
        )}

        {/* Stats */}
        <div>
          <h3 className="text-text-secondary text-xs font-semibold uppercase tracking-wider mb-2">Statistics</h3>
          <div className="grid grid-cols-2 gap-2">
            <STAT_ITEM label="24h High" value={`$${formatPrice(coin.high24h)}`} />
            <STAT_ITEM label="24h Low" value={`$${formatPrice(coin.low24h)}`} />
            <STAT_ITEM label="24h Volume" value={formatVolume(coin.volume24h)} />
            <STAT_ITEM label="24h Change" value={formatPercent(coin.priceChangePercent24h)} />
          </div>
        </div>
      </div>
    </div>
  )
}
