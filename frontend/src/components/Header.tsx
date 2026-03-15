import { useCryptoStore } from '../store/cryptoStore'
import { useAlertStore } from '../store/alertStore'
import { usePortfolioStore } from '../store/portfolioStore'

type Tab = 'market' | 'watchlist' | 'portfolio' | 'alerts'

interface HeaderProps {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
}

export function Header({ activeTab, onTabChange }: HeaderProps) {
  const { wsConnected, watchlist } = useCryptoStore()
  const { alerts } = useAlertStore()
  const { holdings } = usePortfolioStore()
  const activeAlerts = alerts.filter((a) => a.active && !a.triggered).length

  return (
    <header className="sticky top-0 z-50 bg-bg-primary border-b border-border backdrop-blur-xl bg-opacity-95">
      <div className="px-4 pt-3 pb-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="white" />
              </svg>
            </div>
            <span className="text-text-primary font-bold text-xl tracking-tight">CryptoFlow</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-accent-green animate-pulse' : 'bg-accent-red'}`} />
            <span className="text-text-muted text-xs">{wsConnected ? 'Live' : 'Offline'}</span>
          </div>
        </div>

        <div className="flex gap-1 bg-bg-secondary rounded-xl p-1">
          <button
            onClick={() => onTabChange('market')}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
              activeTab === 'market'
                ? 'bg-accent-blue text-white shadow-lg shadow-accent-blue/20'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Market
          </button>
          <button
            onClick={() => onTabChange('watchlist')}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all duration-200 flex items-center justify-center gap-1 ${
              activeTab === 'watchlist'
                ? 'bg-accent-blue text-white shadow-lg shadow-accent-blue/20'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Watch
            {watchlist.length > 0 && (
              <span className={`text-xs rounded-full px-1 py-0.5 font-bold leading-none ${
                activeTab === 'watchlist' ? 'bg-white/20' : 'bg-accent-blue/20 text-accent-blue'
              }`}>
                {watchlist.length}
              </span>
            )}
          </button>
          <button
            onClick={() => onTabChange('portfolio')}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all duration-200 flex items-center justify-center gap-1 ${
              activeTab === 'portfolio'
                ? 'bg-accent-blue text-white shadow-lg shadow-accent-blue/20'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Portfolio
            {holdings.length > 0 && (
              <span className={`text-xs rounded-full px-1 py-0.5 font-bold leading-none ${
                activeTab === 'portfolio' ? 'bg-white/20' : 'bg-accent-blue/20 text-accent-blue'
              }`}>
                {holdings.length}
              </span>
            )}
          </button>
          <button
            onClick={() => onTabChange('alerts')}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all duration-200 flex items-center justify-center gap-1 ${
              activeTab === 'alerts'
                ? 'bg-accent-blue text-white shadow-lg shadow-accent-blue/20'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Alerts
            {activeAlerts > 0 && (
              <span className={`text-xs rounded-full px-1 py-0.5 font-bold leading-none ${
                activeTab === 'alerts' ? 'bg-white/20' : 'bg-accent-blue/20 text-accent-blue'
              }`}>
                {activeAlerts}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  )
}
