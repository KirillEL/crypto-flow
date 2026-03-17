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

interface NewsArticle {
  title: string
  url: string
  source: string
  image_url: string
  published_at: number
}

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() / 1000) - ts)
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function NewsFeed({ symbol }: { symbol: string }) {
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(false)
    fetch(`${API_BASE}/coins/${symbol}/news`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json() })
      .then((data) => setArticles(Array.isArray(data) ? data : []))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [symbol])

  if (loading) return (
    <div className="flex flex-col gap-3 mt-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="bg-bg-card rounded-2xl p-4 animate-pulse">
          <div className="h-3 w-24 bg-bg-secondary rounded mb-2" />
          <div className="h-4 w-full bg-bg-secondary rounded mb-1" />
          <div className="h-4 w-3/4 bg-bg-secondary rounded" />
        </div>
      ))}
    </div>
  )

  if (error || articles.length === 0) return (
    <div className="flex flex-col items-center py-16 text-text-muted">
      <svg className="w-12 h-12 mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
      </svg>
      <p className="text-sm">{error ? 'Failed to load news' : 'No news available'}</p>
    </div>
  )

  return (
    <div className="flex flex-col gap-3 mt-2">
      {articles.map((a, i) => (
        <button
          key={i}
          onClick={() => window.Telegram?.WebApp?.openLink(a.url)}
          className="bg-bg-card rounded-2xl p-4 flex gap-3 text-left hover:bg-bg-hover active:bg-bg-hover transition-colors w-full border border-border/40"
        >
          {a.image_url && (
            <img
              src={a.image_url}
              alt=""
              className="w-16 h-16 rounded-xl object-cover flex-shrink-0 bg-bg-secondary"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-text-muted text-xs font-medium truncate">{a.source}</span>
              <span className="text-text-muted text-xs flex-shrink-0">{timeAgo(a.published_at)}</span>
            </div>
            <p className="text-text-primary text-sm font-medium leading-snug line-clamp-3">{a.title}</p>
          </div>
        </button>
      ))}
    </div>
  )
}

export function CoinDetail() {
  const { symbol } = useParams<{ symbol: string }>()
  const navigate = useNavigate()
  const { coins, watchlist, toggleWatchlist, selectedTimeFrame, setTimeFrame } = useCryptoStore()
  const [candles, setCandles] = useState<Candle[]>([])
  const [loadingChart, setLoadingChart] = useState(false)
  const [chartError, setChartError] = useState(false)
  const [copied, setCopied] = useState(false)
  const [externalCoin, setExternalCoin] = useState<Coin | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [activeTab, setActiveTab] = useState<'chart' | 'news'>('chart')

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
    setChartError(false)
    try {
      const res = await fetch(`${API_BASE}/coins/${symbol}/candles?interval=${tf}`)
      if (!res.ok) throw new Error('Failed to fetch candles')
      const data: Candle[] = await res.json()
      setCandles(data)
    } catch {
      setChartError(true)
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
    const text = `${coin.symbol} $${formatPrice(coin.price)} (${sign}${pct.toFixed(2)}%) — check CryptoFlow`

    if (BOT_NAME) {
      // Use ?startapp= without APP_NAME — opens the bot's main web app directly
      // (works when bot has a web app set via BotFather /setmainwebapp)
      const appUrl = `https://t.me/${BOT_NAME}?startapp=coin_${symbol}`
      const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(appUrl)}&text=${encodeURIComponent(text)}`
      window.Telegram?.WebApp?.openTelegramLink(shareUrl)
    } else {
      navigator.clipboard?.writeText(text).then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }).catch(() => {})
    }
  }

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-text-muted">Coin not found</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-accent-blue text-sm">Go back</button>
      </div>
    )
  }

  if (!coin) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 rounded-full border-2 border-accent-blue border-t-transparent animate-spin mb-4" />
        <p className="text-text-muted text-sm">Loading...</p>
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
          className="h-8 rounded-xl bg-bg-card flex items-center justify-center text-text-muted hover:text-text-primary transition-colors px-2 gap-1"
          title="Share"
        >
          {copied ? (
            <span className="text-accent-green text-xs font-medium">Copied!</span>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          )}
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

        {/* Tab switcher */}
        <div className="flex gap-1 bg-bg-card rounded-xl p-1">
          {(['chart', 'news'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors capitalize ${
                activeTab === tab ? 'bg-accent-blue text-white' : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              {tab === 'chart' ? 'Chart' : 'News'}
            </button>
          ))}
        </div>

        {/* Chart tab */}
        {activeTab === 'chart' && (
          <>
            {loadingChart ? (
              <div className="h-72 bg-bg-card rounded-2xl border border-border animate-pulse" />
            ) : chartError ? (
              <div className="h-72 bg-bg-card rounded-2xl border border-border flex flex-col items-center justify-center gap-2">
                <p className="text-text-muted text-sm">Chart unavailable</p>
                <button onClick={() => fetchCandles(selectedTimeFrame)} className="text-accent-blue text-xs">Retry</button>
              </div>
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
          </>
        )}

        {/* News tab */}
        {activeTab === 'news' && symbol && <NewsFeed symbol={symbol} />}
      </div>
    </div>
  )
}
