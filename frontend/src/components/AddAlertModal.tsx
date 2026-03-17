import { useState } from 'react'
import { useAlertStore } from '../store/alertStore'
import { DEFAULT_SYMBOLS } from '../constants/coins'
import { useHaptic } from '../hooks/useTelegram'

const BOT_NAME = import.meta.env.VITE_TELEGRAM_BOT_NAME || ''

interface AddAlertModalProps {
  onClose: () => void
  connectUrl: string | null
  initialSymbol?: string
}

export function AddAlertModal({ onClose, connectUrl, initialSymbol }: AddAlertModalProps) {
  const { createAlert } = useAlertStore()
  const { success, error: hapticError } = useHaptic()

  const [symbol, setSymbol] = useState(initialSymbol || 'BTC')
  const [alertType, setAlertType] = useState<'price' | 'pct'>('price')
  const [condition, setCondition] = useState<'above' | 'below'>('above')
  const [price, setPrice] = useState('')
  const [threshold, setThreshold] = useState('5')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    setError('')
    if (alertType === 'price') {
      const priceNum = parseFloat(price)
      if (!priceNum || priceNum <= 0) { hapticError(); setError('Enter a valid price'); return }
    } else {
      const thr = parseFloat(threshold)
      if (!thr || thr <= 0) { hapticError(); setError('Enter a valid percentage'); return }
    }

    setLoading(true)
    try {
      const result = await createAlert(
        alertType === 'price'
          ? { symbol, condition, price: parseFloat(price), alert_type: 'price' }
          : {
              symbol,
              condition: condition === 'above' ? 'pct_above' : 'pct_below',
              alert_type: 'pct',
              threshold: parseFloat(threshold),
            }
      )
      if (result.error === 'not_connected' && result.connect_url) {
        window.Telegram?.WebApp?.openTelegramLink(result.connect_url)
        onClose()
        return
      }
      if (result.error) { hapticError(); setError(result.error); return }
      success()
      onClose()
    } finally {
      setLoading(false)
    }
  }

  // Show the initialSymbol chip if it's not in the default list
  const showCustomChip = initialSymbol && !DEFAULT_SYMBOLS.includes(initialSymbol)

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-bg-secondary w-full max-w-md rounded-t-3xl p-6 pb-10 flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-text-primary font-bold text-lg">New Alert</h2>
          <button onClick={onClose} className="text-text-muted text-xl leading-none">✕</button>
        </div>

        {/* Symbol */}
        <div>
          <label className="text-text-muted text-xs mb-1.5 block">Coin</label>
          <div className="grid grid-cols-5 gap-1.5">
            {showCustomChip && (
              <button
                onClick={() => setSymbol(initialSymbol)}
                className={`py-1.5 rounded-lg text-xs font-bold transition-colors col-span-1 ${
                  symbol === initialSymbol ? 'bg-accent-blue text-white' : 'bg-bg-primary text-text-secondary hover:text-text-primary'
                }`}
              >
                {initialSymbol}
              </button>
            )}
            {DEFAULT_SYMBOLS.map((s) => (
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

        {/* Alert type */}
        <div>
          <label className="text-text-muted text-xs mb-1.5 block">Alert Type</label>
          <div className="flex gap-2">
            {(['price', 'pct'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setAlertType(t)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                  alertType === t ? 'bg-accent-blue text-white' : 'bg-bg-primary text-text-secondary hover:text-text-primary'
                }`}
              >
                {t === 'price' ? '💰 Price' : '📊 % Change'}
              </button>
            ))}
          </div>
        </div>

        {/* Condition */}
        <div>
          <label className="text-text-muted text-xs mb-1.5 block">
            {alertType === 'pct' ? 'Direction' : 'Condition'}
          </label>
          <div className="flex gap-2">
            {(['above', 'below'] as const).map((c) => (
              <button
                key={c}
                onClick={() => setCondition(c)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  condition === c
                    ? c === 'above' ? 'bg-accent-green/20 text-accent-green' : 'bg-accent-red/20 text-accent-red'
                    : 'bg-bg-primary text-text-secondary hover:text-text-primary'
                }`}
              >
                {alertType === 'pct'
                  ? (c === 'above' ? '▲ Rise' : '▼ Drop')
                  : (c === 'above' ? '▲ Above' : '▼ Below')}
              </button>
            ))}
          </div>
        </div>

        {/* Value input */}
        {alertType === 'price' ? (
          <div>
            <label className="text-text-muted text-xs mb-1.5 block">Price ($)</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
              className="w-full bg-bg-primary border border-border rounded-xl px-4 py-3 text-text-primary placeholder-text-muted text-base focus:outline-none focus:border-accent-blue"
            />
          </div>
        ) : (
          <div>
            <label className="text-text-muted text-xs mb-1.5 block">Change Threshold (%)</label>
            <input
              type="number"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              placeholder="5"
              className="w-full bg-bg-primary border border-border rounded-xl px-4 py-3 text-text-primary placeholder-text-muted text-base focus:outline-none focus:border-accent-blue"
            />
            <p className="text-text-muted text-xs mt-1">
              Notify when 24h change {condition === 'above' ? 'exceeds' : 'drops below'} {threshold || '0'}%
            </p>
          </div>
        )}

        {error && <p className="text-accent-red text-sm">{error}</p>}

        {connectUrl && !BOT_NAME && (
          <p className="text-text-muted text-xs text-center">
            Alerts require{' '}
            <button onClick={() => window.Telegram?.WebApp?.openTelegramLink(connectUrl)} className="text-accent-blue underline">
              connecting the bot
            </button>
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-3.5 rounded-2xl bg-accent-blue text-white font-semibold text-base disabled:opacity-50 transition-opacity"
        >
          {loading ? 'Creating...' : 'Create Alert'}
        </button>
      </div>
    </div>
  )
}
