import { useEffect, useState } from 'react'
import { useAlertStore } from '../store/alertStore'
import { Alert } from '../types'

const SYMBOLS = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'ADA', 'DOGE', 'AVAX', 'DOT', 'MATIC', 'LINK', 'UNI', 'ATOM', 'LTC', 'TRX']
const CHAT_ID_KEY = 'cf_chat_id'

function formatPrice(price: number) {
  return price >= 1 ? price.toLocaleString('en-US', { maximumFractionDigits: 2 }) : price.toFixed(6)
}

function AlertCard({ alert, onDelete, onReset }: { alert: Alert; onDelete: () => void; onReset: () => void }) {
  return (
    <div className={`bg-bg-secondary rounded-2xl p-4 flex flex-col gap-3 border ${alert.triggered ? 'border-accent-red/40' : 'border-border'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-bold text-text-primary text-base">{alert.symbol}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            alert.condition === 'above' ? 'bg-accent-green/15 text-accent-green' : 'bg-accent-red/15 text-accent-red'
          }`}>
            {alert.condition === 'above' ? '▲ выше' : '▼ ниже'}
          </span>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
          alert.triggered ? 'bg-accent-red/20 text-accent-red' : 'bg-accent-blue/15 text-accent-blue'
        }`}>
          {alert.triggered ? 'Сработал' : 'Активен'}
        </span>
      </div>

      <div className="text-text-primary font-mono text-lg font-semibold">
        ${formatPrice(alert.price)}
      </div>

      <div className="flex gap-2">
        {alert.triggered && (
          <button
            onClick={onReset}
            className="flex-1 py-2 rounded-xl text-sm font-medium bg-accent-blue/15 text-accent-blue hover:bg-accent-blue/25 transition-colors"
          >
            Сбросить
          </button>
        )}
        <button
          onClick={onDelete}
          className="flex-1 py-2 rounded-xl text-sm font-medium bg-accent-red/10 text-accent-red hover:bg-accent-red/20 transition-colors"
        >
          Удалить
        </button>
      </div>
    </div>
  )
}

function AddAlertModal({ onClose }: { onClose: () => void }) {
  const { createAlert } = useAlertStore()
  const savedChatId = localStorage.getItem(CHAT_ID_KEY) || ''

  const [symbol, setSymbol] = useState('BTC')
  const [condition, setCondition] = useState<'above' | 'below'>('above')
  const [price, setPrice] = useState('')
  const [chatId, setChatId] = useState(savedChatId)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    const priceNum = parseFloat(price)
    const chatIdNum = parseInt(chatId)
    if (!priceNum || priceNum <= 0) { setError('Введите корректную цену'); return }
    if (!chatIdNum) { setError('Введите Chat ID группы'); return }

    setLoading(true)
    setError('')
    try {
      localStorage.setItem(CHAT_ID_KEY, chatId)
      await createAlert({ chat_id: chatIdNum, symbol, condition, price: priceNum })
      onClose()
    } catch {
      setError('Ошибка при создании алерта')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-bg-secondary w-full max-w-md rounded-t-3xl p-6 pb-10 flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-text-primary font-bold text-lg">Новый алерт</h2>
          <button onClick={onClose} className="text-text-muted text-xl leading-none">✕</button>
        </div>

        {/* Symbol */}
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

        {/* Condition */}
        <div>
          <label className="text-text-muted text-xs mb-1.5 block">Условие</label>
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
                {c === 'above' ? '▲ Выше' : '▼ Ниже'}
              </button>
            ))}
          </div>
        </div>

        {/* Price */}
        <div>
          <label className="text-text-muted text-xs mb-1.5 block">Цена ($)</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0.00"
            className="w-full bg-bg-primary border border-border rounded-xl px-4 py-3 text-text-primary placeholder-text-muted text-base focus:outline-none focus:border-accent-blue"
          />
        </div>

        {/* Chat ID */}
        <div>
          <label className="text-text-muted text-xs mb-1.5 block">Chat ID группы</label>
          <input
            type="number"
            value={chatId}
            onChange={(e) => setChatId(e.target.value)}
            placeholder="-100xxxxxxxxxx"
            className="w-full bg-bg-primary border border-border rounded-xl px-4 py-3 text-text-primary placeholder-text-muted text-base focus:outline-none focus:border-accent-blue"
          />
          <p className="text-text-muted text-xs mt-1">Добавьте бота в группу и получите ID через @userinfobot</p>
        </div>

        {error && <p className="text-accent-red text-sm">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-3.5 rounded-2xl bg-accent-blue text-white font-semibold text-base disabled:opacity-50 transition-opacity"
        >
          {loading ? 'Создание...' : 'Создать алерт'}
        </button>
      </div>
    </div>
  )
}

export function Alerts() {
  const { alerts, loading, fetchAlerts, deleteAlert, resetAlert } = useAlertStore()
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    fetchAlerts()
  }, [])

  const active = alerts.filter((a) => !a.triggered)
  const triggered = alerts.filter((a) => a.triggered)

  return (
    <div className="px-4 pt-4 pb-24">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-text-primary font-bold text-xl">Алерты</h1>
        <button
          onClick={() => setShowModal(true)}
          className="w-9 h-9 rounded-xl bg-accent-blue flex items-center justify-center text-white text-xl font-light shadow-lg shadow-accent-blue/30"
        >
          +
        </button>
      </div>

      {loading && <p className="text-text-muted text-sm text-center py-8">Загрузка...</p>}

      {!loading && alerts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <span className="text-5xl">🔔</span>
          <p className="text-text-secondary font-medium">Нет алертов</p>
          <p className="text-text-muted text-sm text-center">Нажмите + чтобы следить за ценой монеты</p>
        </div>
      )}

      {active.length > 0 && (
        <div className="flex flex-col gap-3 mb-4">
          {active.map((a) => (
            <AlertCard key={a.id} alert={a} onDelete={() => deleteAlert(a.id)} onReset={() => resetAlert(a.id)} />
          ))}
        </div>
      )}

      {triggered.length > 0 && (
        <>
          <p className="text-text-muted text-xs font-medium mb-2 mt-2">Сработавшие</p>
          <div className="flex flex-col gap-3">
            {triggered.map((a) => (
              <AlertCard key={a.id} alert={a} onDelete={() => deleteAlert(a.id)} onReset={() => resetAlert(a.id)} />
            ))}
          </div>
        </>
      )}

      {showModal && <AddAlertModal onClose={() => setShowModal(false)} />}
    </div>
  )
}
