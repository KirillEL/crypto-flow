import { useMemo } from 'react'
import { useCryptoStore } from '../store/cryptoStore'
import { CoinCard } from '../components/CoinCard'

export function Watchlist() {
  const { coins, watchlist } = useCryptoStore()

  const watchedCoins = useMemo(
    () => coins.filter((c) => watchlist.includes(c.symbol)),
    [coins, watchlist]
  )

  if (watchlist.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-6 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-accent-yellow/10 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-accent-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <polygon strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </div>
        <h3 className="text-text-primary font-semibold text-lg mb-2">No coins yet</h3>
        <p className="text-text-muted text-sm leading-relaxed">
          Tap the star icon next to any coin<br />to add it to your watchlist
        </p>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <div className="px-4 pt-3 pb-2">
        <p className="text-text-muted text-xs">{watchedCoins.length} coin{watchedCoins.length !== 1 ? 's' : ''} tracked</p>
      </div>
      <div className="divide-y divide-border/50">
        {watchedCoins.map((coin) => (
          <CoinCard key={coin.symbol} coin={coin} />
        ))}
      </div>
    </div>
  )
}
