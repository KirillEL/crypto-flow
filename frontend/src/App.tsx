import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { Header } from './components/Header'
import { Home } from './pages/Home'
import { Watchlist } from './pages/Watchlist'
import { CoinDetail } from './pages/CoinDetail'
import { Alerts } from './pages/Alerts'
import { useTelegram } from './hooks/useTelegram'

function MainLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const isDetailPage = location.pathname.startsWith('/coin/')

  const getActiveTab = (): 'market' | 'watchlist' | 'alerts' => {
    if (location.pathname.startsWith('/watchlist')) return 'watchlist'
    if (location.pathname.startsWith('/alerts')) return 'alerts'
    return 'market'
  }

  const handleTabChange = (tab: 'market' | 'watchlist' | 'alerts') => {
    if (tab === 'market') navigate('/')
    else if (tab === 'watchlist') navigate('/watchlist')
    else navigate('/alerts')
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
          <Route path="/coin/:symbol" element={<CoinDetail />} />
          <Route path="/alerts" element={<Alerts />} />
        </Routes>
      </main>
    </div>
  )
}
