import { useState } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { Header } from './components/Header'
import { Home } from './pages/Home'
import { Watchlist } from './pages/Watchlist'
import { CoinDetail } from './pages/CoinDetail'
import { useTelegram } from './hooks/useTelegram'

function MainLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const isDetailPage = location.pathname.startsWith('/coin/')

  const getActiveTab = () => {
    if (location.pathname.startsWith('/watchlist')) return 'watchlist'
    return 'market'
  }

  const handleTabChange = (tab: 'market' | 'watchlist') => {
    navigate(tab === 'market' ? '/' : '/watchlist')
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
        </Routes>
      </main>
    </div>
  )
}
