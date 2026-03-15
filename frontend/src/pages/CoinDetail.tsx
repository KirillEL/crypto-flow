import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useCryptoStore } from '../store/cryptoStore'
import { PriceChart } from '../components/PriceChart'
import { formatPrice, formatPercent, formatVolume } from '../utils/format'
import type { Candle, Coin, TimeFrame } from '../types'

const API_BASE = import.meta.env.VITE_API_URL || '/api'
const BOT_NAME = import.meta.env.VITE_TELEGRAM_BOT_NAME || ''
const APP_NAME = import.meta.env.VITE_TELEGRAM_APP_NAME || 'app'

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
  const [externalCoin, setExternalCoin] = useState<Coin | null>(null)
  const [notFound, setNotFound] = useState(false)

  const storeCoin = coins.find((c) => c.symbol === symbol)
  const coin = storeCoin ?? externalCoin
  const isWatched = symbol ? watchlist.includes(symbol) : false
  const isPositive = (coin?.priceChangePercent24h ?? 0) >= 0

  // Fetch coin from API if not in local store (dynamic coin support)
  useEffect(() => {
    if (storeCoin || !symbol) return
    fetch(`${API_BASE}/search?q=${encodeURIComponent(symbol)}`)
      .then((r) => r.json())
      .then((data: Coin[]) => {
        const found = data.find((c) => c.symbol === symbol.toUpperCase())
        if (found) setExternalCoin(found)
        else setNotFound(true)
      })
      .catch(() => setNotFound(true))
  }, [symbol, storeCoin])

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

  const handleShare = () => {
    if (!coin || !symbol) return
    const pct = coin.priceChangePercent24h
    const sign = pct >= 0 ? '+' : ''
    const text = `${coin.symbol} $${formatPrice(coin.price)} (${sign}${pct.toFixed(2)}%) — смотри в CryptoFlow`

    if (BOT_NAME) {
      const url = `https://t.me/share/url?url=https://t.me/${BOT_NAME}/${APP_NAME}?startapp=coin_${symbol}&text=${encodeURIComponent(text)}`
      window.Telegram?.WebApp?.openTelegramLink(url)
    } else {
      // fallback: copy to clipboard
      navigator.clipboard?.writeText(text).catch(() => {})
    }
  }

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-text-muted">Монета не найдена</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-accent-blue text-sm">Назад</button>
      </div>
    )
  }

  if (!coin) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 rounded-full border-2 border-accent-blue border-t-transparent animate-spin mb-4" />
        <p className="text-text-muted text-sm">Загрузка...</p>
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

        {/* Share button */}
        <button
          onClick={handleShare}
          className="w-8 h-8 rounded-xl bg-bg-card flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
          title="Поделиться"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
        </button>

        {/* Watchlist star */}
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
