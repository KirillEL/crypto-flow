import { useEffect, useState } from 'react'
import { useAlertStore } from '../store/alertStore'
import { Alert } from '../types'
import { AlertSkeleton } from '../components/skeletons/AlertSkeleton'
import { AddAlertModal } from '../components/AddAlertModal'

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
    : (alert.condition === 'above' ? '▲ above' : '▼ below')
  const valueLabel = isPct ? `24h chg. ${alert.condition === 'pct_above' ? '+' : '-'}${alert.threshold}%` : `$${formatPrice(alert.price)}`

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
          {alert.triggered ? 'Triggered' : 'Active'}
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
            Reset
          </button>
        )}
        <button
          onClick={onDelete}
          className="flex-1 py-2 rounded-xl text-sm font-medium bg-accent-red/10 text-accent-red hover:bg-accent-red/20 transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  )
}

function ConnectBotBanner({ connectUrl, userId }: { connectUrl: string; userId: number }) {
  const [copied, setCopied] = useState(false)
  const [tab, setTab] = useState<'personal' | 'group'>('personal')

  const copyUserId = () => {
    navigator.clipboard?.writeText(String(userId)).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="bg-accent-blue/10 border border-accent-blue/30 rounded-2xl p-4 flex flex-col gap-3 mb-4">
      <div className="flex items-center gap-2">
        <span className="text-xl">🤖</span>
        <div>
          <p className="text-text-primary font-semibold text-sm">Connect Bot</p>
          <p className="text-text-muted text-xs mt-0.5">Choose where to receive alerts</p>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-bg-primary rounded-xl p-1">
        <button
          onClick={() => setTab('personal')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${tab === 'personal' ? 'bg-accent-blue text-white' : 'text-text-secondary'}`}
        >
          Personal chat
        </button>
        <button
          onClick={() => setTab('group')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${tab === 'group' ? 'bg-accent-blue text-white' : 'text-text-secondary'}`}
        >
          Group
        </button>
      </div>

      {tab === 'personal' ? (
        <button
          onClick={() => window.Telegram?.WebApp?.openTelegramLink(connectUrl)}
          className="w-full py-2.5 rounded-xl bg-accent-blue text-white text-sm font-semibold"
        >
          Open bot chat →
        </button>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-text-secondary text-xs leading-relaxed">
            1. Add the bot to your group<br />
            2. Send this command in the group:
          </p>
          <div className="bg-bg-primary rounded-xl px-3 py-2 flex items-center justify-between gap-2">
            <code className="text-accent-blue text-sm font-mono">/link {userId}</code>
            <button
              onClick={copyUserId}
              className="text-xs text-text-muted hover:text-text-primary transition-colors shrink-0"
            >
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}


export function Alerts() {
  const { alerts, loading, connected, fetchAlerts, checkConnection, deleteAlert, resetAlert } = useAlertStore()
  const [showModal, setShowModal] = useState(false)
  const [connectUrl, setConnectUrl] = useState<string | null>(null)
  const [showConnectBanner, setShowConnectBanner] = useState(false)

  useEffect(() => {
    fetchAlerts()
    const userId = getUserId()
    if (userId && BOT_NAME) {
      checkConnection().then((ok) => {
        const url = `https://t.me/${BOT_NAME}?start=connect_${userId}`
        setConnectUrl(url)
        if (!ok) setShowConnectBanner(true)
      })
    }
  }, [])

  const active = alerts.filter((a) => !a.triggered)
  const triggered = alerts.filter((a) => a.triggered)

  return (
    <div className="px-4 pt-4 pb-24">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-text-primary font-bold text-xl">Alerts</h1>
        <div className="flex items-center gap-2">
          {connected === true && BOT_NAME && (
            <button
              onClick={() => setShowConnectBanner((v) => !v)}
              className="text-text-muted text-xs px-2 py-1.5 rounded-lg hover:bg-bg-secondary transition-colors"
            >
              Change chat
            </button>
          )}
          <button
            onClick={() => setShowModal(true)}
            className="w-9 h-9 rounded-xl bg-accent-blue flex items-center justify-center text-white text-xl font-light shadow-lg shadow-accent-blue/30"
          >
            +
          </button>
        </div>
      </div>

      {!BOT_NAME && (
        <div className="bg-accent-yellow/10 border border-accent-yellow/30 rounded-2xl p-4 mb-4 flex items-start gap-2">
          <span className="text-xl">⚠️</span>
          <p className="text-text-secondary text-sm">Bot not configured. Set <code className="text-accent-yellow">VITE_TELEGRAM_BOT_NAME</code> to enable alerts.</p>
        </div>
      )}
      {showConnectBanner && connectUrl && <ConnectBotBanner connectUrl={connectUrl} userId={getUserId()} />}

      {loading && <AlertSkeleton />}

      {!loading && alerts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <span className="text-5xl">🔔</span>
          <p className="text-text-secondary font-medium">No alerts</p>
          <p className="text-text-muted text-sm text-center">Tap + to track a coin's price</p>
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
          <p className="text-text-muted text-xs font-medium mb-2 mt-2">Triggered</p>
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
