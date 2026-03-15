import { useEffect } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { Header } from './components/Header'
import { Home } from './pages/Home'
import { Watchlist } from './pages/Watchlist'
import { CoinDetail } from './pages/CoinDetail'
import { Alerts } from './pages/Alerts'
import { Portfolio } from './pages/Portfolio'
import { useTelegram } from './hooks/useTelegram'

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
  useTelegram()

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      <MainLayout />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/watchlist" element={<Watchlist />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/coin/:symbol" element={<CoinDetail />} />
          <Route path="/alerts" element={<Alerts />} />
        </Routes>
      </main>
    </div>
  )
}
