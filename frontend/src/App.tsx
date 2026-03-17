import { useEffect, useState } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { Header } from './components/Header'
import { Home } from './pages/Home'
import { Watchlist } from './pages/Watchlist'
import { CoinDetail } from './pages/CoinDetail'
import { Alerts } from './pages/Alerts'
import { Portfolio } from './pages/Portfolio'
import { useTelegram } from './hooks/useTelegram'
import { ErrorBoundary } from './components/ErrorBoundary'
import { OnboardingModal } from './components/OnboardingModal'
import { STORAGE_KEYS } from './constants/storage'

type Tab = 'market' | 'watchlist' | 'portfolio' | 'alerts'

function MainLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const isDetailPage = location.pathname.startsWith('/coin/')

  // Handle deep links from share cards / bot: ?startapp=coin_BTC
  useEffect(() => {
    const startParam = window.Telegram?.WebApp?.initDataUnsafe?.start_param
    if (startParam?.startsWith('coin_')) {
      const symbol = startParam.slice(5).toUpperCase()
      if (symbol) navigate(`/coin/${symbol}`, { replace: true })
    }
  }, [])

  const getActiveTab = (): Tab => {
    if (location.pathname.startsWith('/watchlist')) return 'watchlist'
    if (location.pathname.startsWith('/portfolio')) return 'portfolio'
    if (location.pathname.startsWith('/alerts')) return 'alerts'
    return 'market'
  }

  const handleTabChange = (tab: Tab) => {
    if (tab === 'market') navigate('/')
    else navigate(`/${tab}`)
  }

  if (isDetailPage) return null

  return <Header activeTab={getActiveTab()} onTabChange={handleTabChange} />
}

export default function App() {
  const { user } = useTelegram()
  const location = useLocation()
  const [showOnboarding, setShowOnboarding] = useState(
    () => !localStorage.getItem(STORAGE_KEYS.ONBOARDED)
  )

  if (showOnboarding) {
    return <OnboardingModal onDone={() => setShowOnboarding(false)} userName={user?.first_name} />
  }

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      <MainLayout />
      <main>
        <ErrorBoundary>
          <div key={location.pathname} className="animate-slide-left">
            <Routes>
              <Route path="/" element={<ErrorBoundary><Home /></ErrorBoundary>} />
              <Route path="/watchlist" element={<ErrorBoundary><Watchlist /></ErrorBoundary>} />
              <Route path="/portfolio" element={<ErrorBoundary><Portfolio /></ErrorBoundary>} />
              <Route path="/coin/:symbol" element={<ErrorBoundary><CoinDetail /></ErrorBoundary>} />
              <Route path="/alerts" element={<ErrorBoundary><Alerts /></ErrorBoundary>} />
            </Routes>
          </div>
        </ErrorBoundary>
      </main>
    </div>
  )
}
