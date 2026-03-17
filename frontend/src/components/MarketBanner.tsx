import { useEffect, useState } from 'react'
import { MarketOverview } from '../types'

const API = import.meta.env.VITE_API_URL || '/api'

function formatMarketCap(v: number): string {
  if (v >= 1e12) return `$${(v / 1e12).toFixed(2)}T`
  if (v >= 1e9) return `$${(v / 1e9).toFixed(0)}B`
  return `$${v.toFixed(0)}`
}

function fngColor(label: string): string {
  switch (label.toLowerCase()) {
    case 'extreme greed': return 'text-accent-green'
    case 'greed': return 'text-accent-green'
    case 'neutral': return 'text-accent-yellow'
    case 'fear': return 'text-accent-red'
    case 'extreme fear': return 'text-accent-red'
    default: return 'text-text-secondary'
  }
}

export function MarketBanner() {
  const [data, setData] = useState<MarketOverview | null>(null)

  useEffect(() => {
    fetch(`${API}/market`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
  }, [])

  if (!data) return null

  const capChange = data.market_cap_change_24h
  const isPositive = capChange >= 0

  return (
    <div className="px-4 pt-3 pb-1 overflow-x-auto">
      <div className="flex gap-2 min-w-max">
        {data.total_market_cap > 0 && (
          <div className="bg-bg-secondary border border-border rounded-xl px-3 py-2 flex-shrink-0">
            <p className="text-text-muted text-xs mb-0.5">Market Cap</p>
            <div className="flex items-center gap-1.5">
              <span className="text-text-primary text-sm font-semibold">{formatMarketCap(data.total_market_cap)}</span>
              {capChange !== 0 && (
                <span className={`text-xs font-medium ${isPositive ? 'text-accent-green' : 'text-accent-red'}`}>
                  {isPositive ? '+' : ''}{capChange.toFixed(1)}%
                </span>
              )}
            </div>
          </div>
        )}

        {data.btc_dominance > 0 && (
          <div className="bg-bg-secondary border border-border rounded-xl px-3 py-2 flex-shrink-0">
            <p className="text-text-muted text-xs mb-0.5">BTC Dom.</p>
            <span className="text-text-primary text-sm font-semibold">{data.btc_dominance.toFixed(1)}%</span>
          </div>
        )}

        {data.fear_greed_value && (
          <div className="bg-bg-secondary border border-border rounded-xl px-3 py-2 flex-shrink-0">
            <p className="text-text-muted text-xs mb-0.5">Fear & Greed</p>
            <div className="flex items-center gap-1.5">
              <span className="text-text-primary text-sm font-semibold">{data.fear_greed_value}</span>
              <span className={`text-xs font-medium ${fngColor(data.fear_greed_label)}`}>{data.fear_greed_label}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
