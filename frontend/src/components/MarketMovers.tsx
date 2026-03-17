import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatPercent } from '../utils/format'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

interface Mover {
  symbol: string
  price: number
  change: number
}

interface MoversData {
  gainers: Mover[]
  losers: Mover[]
}

function MoverCard({ mover, isGainer }: { mover: Mover; isGainer: boolean }) {
  const navigate = useNavigate()
  const color = isGainer ? 'text-accent-green' : 'text-accent-red'
  const bg = isGainer ? 'bg-accent-green/10 border-accent-green/20' : 'bg-accent-red/10 border-accent-red/20'

  return (
    <button
      onClick={() => navigate(`/coin/${mover.symbol}`)}
      className={`flex-shrink-0 flex flex-col gap-1 px-3 py-2.5 rounded-xl border ${bg} min-w-[80px] text-left`}
    >
      <span className="text-text-primary font-bold text-xs">{mover.symbol}</span>
      <span className={`text-xs font-semibold ${color}`}>
        {isGainer ? '+' : ''}{formatPercent(mover.change)}
      </span>
    </button>
  )
}

export function MarketMovers() {
  const [data, setData] = useState<MoversData | null>(null)
  const [tab, setTab] = useState<'gainers' | 'losers'>('gainers')

  useEffect(() => {
    fetch(`${API_BASE}/market/movers`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => d && setData(d))
      .catch(() => {})
  }, [])

  if (!data) return null

  const list = tab === 'gainers' ? data.gainers : data.losers

  return (
    <div className="px-4 py-3 border-b border-border/50">
      <div className="flex items-center justify-between mb-2">
        <span className="text-text-muted text-xs font-medium">Top Movers</span>
        <div className="flex gap-1 bg-bg-card rounded-lg p-0.5">
          <button
            onClick={() => setTab('gainers')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
              tab === 'gainers' ? 'bg-accent-green text-white' : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            ▲ Gainers
          </button>
          <button
            onClick={() => setTab('losers')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
              tab === 'losers' ? 'bg-accent-red text-white' : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            ▼ Losers
          </button>
        </div>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {list.map((m) => (
          <MoverCard key={m.symbol} mover={m} isGainer={tab === 'gainers'} />
        ))}
      </div>
    </div>
  )
}
