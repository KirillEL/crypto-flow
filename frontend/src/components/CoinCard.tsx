import { memo } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Coin } from '../types'
import { formatPrice, formatPercent } from '../utils/format'
import { Sparkline } from './Sparkline'
import { useCryptoStore } from '../store/cryptoStore'
import { useAlertStore } from '../store/alertStore'
import { COIN_COLORS } from '../constants/coins'
import { useHaptic } from '../hooks/useTelegram'

interface CoinCardProps {
  coin: Coin
  rank?: number
}

export const CoinCard = memo(({ coin, rank }: CoinCardProps) => {
  const navigate = useNavigate()
  const { watchlist, toggleWatchlist } = useCryptoStore()
  const { setQuickAlertSymbol } = useAlertStore()
  const { tapLight, selectionChanged } = useHaptic()
  const isPositive = coin.priceChangePercent24h >= 0
  const isWatched = watchlist.includes(coin.symbol)
  const color = COIN_COLORS[coin.symbol] || '#3b82f6'

  return (
    <div
      onClick={() => { tapLight(); navigate(`/coin/${coin.symbol}`) }}
      className="flex items-center gap-3 px-4 py-3.5 hover:bg-bg-hover active:bg-bg-hover transition-colors cursor-pointer"
    >
      {/* Rank */}
      {rank && (
        <span className="text-text-muted text-xs w-5 text-center flex-shrink-0">{rank}</span>
      )}

      {/* Icon */}
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm"
        style={{ backgroundColor: color + '22', border: `1.5px solid ${color}44` }}
      >
        <span style={{ color }}>{coin.symbol.slice(0, 2)}</span>
      </div>

      {/* Name + Volume */}
      <div className="flex-1 min-w-0">
        <div className="text-text-primary font-semibold text-sm">{coin.symbol}</div>
        <div className="text-text-muted text-xs mt-0.5 truncate">{coin.name}</div>
      </div>

      {/* Sparkline */}
      <div className="hidden sm:block">
        <Sparkline data={coin.sparkline || []} isPositive={isPositive} />
      </div>

      {/* Price + Change */}
      <div className="text-right flex-shrink-0">
        <div className="text-text-primary font-semibold text-sm font-mono">
          ${formatPrice(coin.price)}
        </div>
        <div
          className={`text-xs font-medium mt-0.5 px-1.5 py-0.5 rounded-md inline-block ${
            isPositive
              ? 'text-accent-green bg-accent-green/10'
              : 'text-accent-red bg-accent-red/10'
          }`}
        >
          {isPositive ? '▲' : '▼'} {formatPercent(Math.abs(coin.priceChangePercent24h))}
        </div>
      </div>

      {/* Quick alert bell */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          tapLight()
          setQuickAlertSymbol(coin.symbol)
        }}
        className="flex-shrink-0 p-1 rounded-lg hover:bg-bg-card transition-colors"
      >
        <svg className="w-4 h-4 text-text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      </button>

      {/* Watchlist star */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          selectionChanged()
          toggleWatchlist(coin.symbol)
        }}
        className="flex-shrink-0 ml-1 p-1 rounded-lg hover:bg-bg-card transition-colors"
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
  )
})

CoinCard.displayName = 'CoinCard'
