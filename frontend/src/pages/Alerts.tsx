import { useEffect, useState } from 'react'
import { useAlertStore } from '../store/alertStore'
import { Alert } from '../types'
import { DEFAULT_SYMBOLS } from '../constants/coins'
import { useHaptic } from '../hooks/useTelegram'
import { AlertSkeleton } from '../components/skeletons/AlertSkeleton'

const SYMBOLS = DEFAULT_SYMBOLS
const BOT_NAME = import.meta.env.VITE_TELEGRAM_BOT_NAME || ''

function getUserId(): number {
  return window.Telegram?.WebApp?.initDataUnsafe?.user?.id ?? 0
}

function formatPrice(price: number) {
  return price >= 1 ? price.toLocaleString('en-US', { maximumFractionDigits: 2 }) : price.toFixed(6)
}

function AlertCard({ alert, onDelete, onReset }: { alert: Alert; onDelete: () => void; onReset: () => void }) {
  const isPct = alert.alert_type === 'pct'
  const condLabel = isPct
    ? (alert.condition === 'pct_above' ? `▲ +${alert.threshold}%` : `▼ -${alert.threshold}%`)
    : (alert.condition === 'above' ? '▲ выше' : '▼ ниже')
  const valueLabel = isPct ? `24ч изм. ${alert.condition === 'pct_above' ? '+' : '-'}${alert.threshold}%` : `$${formatPrice(alert.price)}`

  return (
    <div className={`bg-bg-secondary rounded-2xl p-4 flex flex-col gap-3 border ${alert.triggered ? 'border-accent-red/40' : 'border-border'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-bold text-text-primary text-base">{alert.symbol}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            alert.condition === 'above' || alert.condition === 'pct_above'
              ? 'bg-accent-green/15 text-accent-green'
              : 'bg-accent-red/15 text-accent-red'
          }`}>
            {condLabel}
          </span>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
          alert.triggered ? 'bg-accent-red/20 text-accent-red' : 'bg-accent-blue/15 text-accent-blue'
        }`}>
          {alert.triggered ? 'Сработал' : 'Активен'}
        </span>
      </div>

      <div className="text-text-primary font-mono text-lg font-semibold">
        {valueLabel}
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

function ConnectBotBanner({ connectUrl }: { connectUrl: string }) {
  return (
    <div className="bg-accent-blue/10 border border-accent-blue/30 rounded-2xl p-4 flex flex-col gap-3 mb-4">
      <div className="flex items-center gap-2">
        <span className="text-xl">🤖</span>
        <div>
          <p className="text-text-primary font-semibold text-sm">Подключите бота</p>
          <p className="text-text-muted text-xs mt-0.5">Чтобы получать уведомления в Telegram</p>
        </div>
      </div>
      <button
        onClick={() => window.Telegram?.WebApp?.openTelegramLink(connectUrl)}
        className="w-full py-2.5 rounded-xl bg-accent-blue text-white text-sm font-semibold"
      >
        Подключить бота →
      </button>
    </div>
  )
}

function AddAlertModal({ onClose, connectUrl }: { onClose: () => void; connectUrl: string | null }) {
  const { createAlert } = useAlertStore()
  const { success, error: hapticError } = useHaptic()

  const [symbol, setSymbol] = useState('BTC')
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
      if (!priceNum || priceNum <= 0) { hapticError(); setError('Введите корректную цену'); return }
    } else {
      const thr = parseFloat(threshold)
      if (!thr || thr <= 0) { hapticError(); setError('Введите корректный процент'); return }
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

        {/* Alert type */}
        <div>
          <label className="text-text-muted text-xs mb-1.5 block">Тип алерта</label>
          <div className="flex gap-2">
            {(['price', 'pct'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setAlertType(t)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                  alertType === t ? 'bg-accent-blue text-white' : 'bg-bg-primary text-text-secondary hover:text-text-primary'
                }`}
              >
                {t === 'price' ? '💰 По цене' : '📊 По % изм.'}
              </button>
            ))}
          </div>
        </div>

        {/* Condition */}
        <div>
          <label className="text-text-muted text-xs mb-1.5 block">
            {alertType === 'pct' ? 'Направление' : 'Условие'}
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
                  ? (c === 'above' ? '▲ Рост' : '▼ Падение')
                  : (c === 'above' ? '▲ Выше' : '▼ Ниже')}
              </button>
            ))}
          </div>
        </div>

        {/* Value input */}
        {alertType === 'price' ? (
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
        ) : (
          <div>
            <label className="text-text-muted text-xs mb-1.5 block">Порог изменения (%)</label>
            <input
              type="number"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              placeholder="5"
              className="w-full bg-bg-primary border border-border rounded-xl px-4 py-3 text-text-primary placeholder-text-muted text-base focus:outline-none focus:border-accent-blue"
            />
            <p className="text-text-muted text-xs mt-1">
              Уведомить если 24ч изменение {condition === 'above' ? 'превысит' : 'упадёт ниже'} {threshold || '0'}%
            </p>
          </div>
        )}

        {error && <p className="text-accent-red text-sm">{error}</p>}

        {connectUrl && !BOT_NAME && (
          <p className="text-text-muted text-xs text-center">
            Для алертов нужно <button onClick={() => window.Telegram?.WebApp?.openTelegramLink(connectUrl)} className="text-accent-blue underline">подключить бота</button>
          </p>
        )}

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
  const { alerts, loading, connected, fetchAlerts, checkConnection, deleteAlert, resetAlert } = useAlertStore()
  const [showModal, setShowModal] = useState(false)
  const [connectUrl, setConnectUrl] = useState<string | null>(null)

  useEffect(() => {
    fetchAlerts()
    const userId = getUserId()
    if (userId && BOT_NAME) {
      checkConnection().then((ok) => {
        if (!ok) {
          setConnectUrl(`https://t.me/${BOT_NAME}?start=connect_${userId}`)
        }
      })
    }
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

      {connected === false && connectUrl && <ConnectBotBanner connectUrl={connectUrl} />}

      {loading && <AlertSkeleton />}

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

      {showModal && <AddAlertModal onClose={() => setShowModal(false)} connectUrl={connectUrl} />}
    </div>
  )
}
