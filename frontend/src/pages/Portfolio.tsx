import { useEffect, useState } from 'react'
import { usePortfolioStore } from '../store/portfolioStore'
import { useCryptoStore } from '../store/cryptoStore'
import { Holding } from '../types'
import { formatPrice, formatVolume } from '../utils/format'

const SYMBOLS = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'ADA', 'DOGE', 'AVAX', 'DOT', 'MATIC', 'LINK', 'UNI', 'ATOM', 'LTC', 'TRX']

const COIN_COLORS: Record<string, string> = {
  BTC: '#f7931a', ETH: '#627eea', BNB: '#f3ba2f', SOL: '#9945ff',
  XRP: '#346aa9', ADA: '#0033ad', DOGE: '#c2a633', AVAX: '#e84142',
  DOT: '#e6007a', MATIC: '#8247e5', LINK: '#375bd2', UNI: '#ff007a',
  ATOM: '#6f7390', LTC: '#bfbbbb', TRX: '#ef0027',
}

interface HoldingCardProps {
  holding: Holding
  currentPrice: number
  onEdit: () => void
  onDelete: () => void
}

function HoldingCard({ holding, currentPrice, onEdit, onDelete }: HoldingCardProps) {
  const currentValue = holding.amount * currentPrice
  const invested = holding.amount * holding.entry_price
  const pnl = currentValue - invested
  const pnlPct = invested > 0 ? (pnl / invested) * 100 : 0
  const isPositive = pnl >= 0

  return (
    <div className="bg-bg-secondary rounded-2xl p-4 border border-border">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs"
            style={{ backgroundColor: COIN_COLORS[holding.symbol] || '#3b82f6' }}
          >
            {holding.symbol.slice(0, 2)}
          </div>
          <div>
            <div className="text-text-primary font-bold text-base">{holding.symbol}</div>
            <div className="text-text-muted text-xs">{holding.amount} шт. × ${formatPrice(holding.entry_price)}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-text-primary font-semibold">${formatPrice(currentValue)}</div>
          <div className={`text-xs font-medium ${isPositive ? 'text-accent-green' : 'text-accent-red'}`}>
            {isPositive ? '+' : ''}${formatPrice(Math.abs(pnl))} ({isPositive ? '+' : ''}{pnlPct.toFixed(2)}%)
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onEdit}
          className="flex-1 py-1.5 rounded-lg text-xs font-medium bg-bg-primary text-text-secondary hover:text-text-primary transition-colors"
        >
          Изменить
        </button>
        <button
          onClick={onDelete}
          className="flex-1 py-1.5 rounded-lg text-xs font-medium bg-accent-red/10 text-accent-red hover:bg-accent-red/20 transition-colors"
        >
          Удалить
        </button>
      </div>
    </div>
  )
}

function AddHoldingModal({ onClose, editHolding }: { onClose: () => void; editHolding?: Holding }) {
  const { addHolding, updateHolding } = usePortfolioStore()

  const [symbol, setSymbol] = useState(editHolding?.symbol || 'BTC')
  const [amount, setAmount] = useState(editHolding ? String(editHolding.amount) : '')
  const [entryPrice, setEntryPrice] = useState(editHolding ? String(editHolding.entry_price) : '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    const amountNum = parseFloat(amount)
    const priceNum = parseFloat(entryPrice)
    if (!amountNum || amountNum <= 0) { setError('Введите корректный объём'); return }
    if (!priceNum || priceNum <= 0) { setError('Введите корректную цену входа'); return }

    setLoading(true)
    try {
      if (editHolding) {
        await updateHolding(editHolding.id, { amount: amountNum, entry_price: priceNum })
      } else {
        await addHolding({ symbol, amount: amountNum, entry_price: priceNum })
      }
      onClose()
    } catch {
      setError('Ошибка при сохранении')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-bg-secondary w-full max-w-md rounded-t-3xl p-6 pb-10 flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-text-primary font-bold text-lg">{editHolding ? 'Редактировать позицию' : 'Добавить монету'}</h2>
          <button onClick={onClose} className="text-text-muted text-xl leading-none">✕</button>
        </div>

        {!editHolding && (
          <div>
            <label className="text-text-muted text-xs mb-1.5 block">Монета</label>
            <div className="grid grid-cols-5 gap-1.5">
              {SYMBOLS.map((s) => (
                <button
                  key={s}
                  onClick={() => setSymbol(s)}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    symbol === s ? 'bg-accent-blue text-white' : 'bg-bg-primary text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="text-text-muted text-xs mb-1.5 block">Количество ({symbol})</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full bg-bg-primary border border-border rounded-xl px-4 py-3 text-text-primary placeholder-text-muted text-base focus:outline-none focus:border-accent-blue"
          />
        </div>

        <div>
          <label className="text-text-muted text-xs mb-1.5 block">Цена входа ($)</label>
          <input
            type="number"
            value={entryPrice}
            onChange={(e) => setEntryPrice(e.target.value)}
            placeholder="0.00"
            className="w-full bg-bg-primary border border-border rounded-xl px-4 py-3 text-text-primary placeholder-text-muted text-base focus:outline-none focus:border-accent-blue"
          />
        </div>

        {error && <p className="text-accent-red text-sm">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-3.5 rounded-2xl bg-accent-blue text-white font-semibold text-base disabled:opacity-50 transition-opacity"
        >
          {loading ? 'Сохранение...' : (editHolding ? 'Сохранить' : 'Добавить')}
        </button>
      </div>
    </div>
  )
}

export function Portfolio() {
  const { holdings, loading, fetchHoldings, deleteHolding } = usePortfolioStore()
  const { coins } = useCryptoStore()
  const [showModal, setShowModal] = useState(false)
  const [editHolding, setEditHolding] = useState<Holding | undefined>()

  useEffect(() => {
    fetchHoldings()
  }, [])

  const getPriceForSymbol = (symbol: string) => {
    return coins.find((c) => c.symbol === symbol)?.price ?? 0
  }

  // Totals
  const totalCurrentValue = holdings.reduce((acc, h) => {
    const price = getPriceForSymbol(h.symbol)
    return acc + h.amount * price
  }, 0)

  const totalInvested = holdings.reduce((acc, h) => acc + h.amount * h.entry_price, 0)
  const totalPnl = totalCurrentValue - totalInvested
  const totalPnlPct = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0
  const isPositive = totalPnl >= 0

  return (
    <div className="px-4 pt-4 pb-24">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-text-primary font-bold text-xl">Портфолио</h1>
        <button
          onClick={() => { setEditHolding(undefined); setShowModal(true) }}
          className="w-9 h-9 rounded-xl bg-accent-blue flex items-center justify-center text-white text-xl font-light shadow-lg shadow-accent-blue/30"
        >
          +
        </button>
      </div>

      {/* Summary card */}
      {holdings.length > 0 && (
        <div className="bg-gradient-to-br from-accent-blue/20 to-accent-purple/20 border border-accent-blue/20 rounded-2xl p-5 mb-5">
          <p className="text-text-muted text-xs mb-1">Общая стоимость</p>
          <p className="text-text-primary font-bold text-3xl mb-2">{formatVolume(totalCurrentValue)}</p>
          <div className="flex items-center gap-3">
            <span className={`text-sm font-semibold ${isPositive ? 'text-accent-green' : 'text-accent-red'}`}>
              {isPositive ? '+' : ''}{formatVolume(Math.abs(totalPnl))} ({isPositive ? '+' : ''}{totalPnlPct.toFixed(2)}%)
            </span>
            <span className="text-text-muted text-xs">P&L</span>
          </div>
          <p className="text-text-muted text-xs mt-1">Вложено: {formatVolume(totalInvested)}</p>
        </div>
      )}

      {loading && <p className="text-text-muted text-sm text-center py-8">Загрузка...</p>}

      {!loading && holdings.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <span className="text-5xl">💼</span>
          <p className="text-text-secondary font-medium">Портфолио пусто</p>
          <p className="text-text-muted text-sm text-center">Нажмите + чтобы добавить монеты и отслеживать P&L</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {holdings.map((h) => (
          <HoldingCard
            key={h.id}
            holding={h}
            currentPrice={getPriceForSymbol(h.symbol)}
            onEdit={() => { setEditHolding(h); setShowModal(true) }}
            onDelete={() => deleteHolding(h.id)}
          />
        ))}
      </div>

      {showModal && (
        <AddHoldingModal onClose={() => { setShowModal(false); setEditHolding(undefined) }} editHolding={editHolding} />
      )}
    </div>
  )
}
