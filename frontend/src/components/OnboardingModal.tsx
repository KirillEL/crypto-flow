import { useState } from 'react'
import { STORAGE_KEYS } from '../constants/storage'
import { useHaptic } from '../hooks/useTelegram'

const SLIDES = [
  {
    icon: '👋',
    title: (name: string) => `Привет, ${name}!`,
    desc: 'CryptoFlow — твой личный крипто-монитор прямо в Telegram. Цены, графики, уведомления — всё в одном месте.',
  },
  {
    icon: '📊',
    title: () => 'Живые цены и графики',
    desc: 'Следи за 15+ монетами в реальном времени. Свечные графики, спарклайны и 7 таймфреймов.',
  },
  {
    icon: '🔔',
    title: () => 'Умные алерты',
    desc: 'Устанавливай ценовые уведомления — бот пришлёт сообщение как только цена достигнет нужного уровня.',
  },
]

interface OnboardingModalProps {
  onDone: () => void
  userName?: string
}

export function OnboardingModal({ onDone, userName = 'друг' }: OnboardingModalProps) {
  const [slide, setSlide] = useState(0)
  const { tapLight, success } = useHaptic()

  const isLast = slide === SLIDES.length - 1
  const current = SLIDES[slide]

  const next = () => {
    if (isLast) {
      success()
      localStorage.setItem(STORAGE_KEYS.ONBOARDED, '1')
      onDone()
    } else {
      tapLight()
      setSlide((s) => s + 1)
    }
  }

  const skip = () => {
    localStorage.setItem(STORAGE_KEYS.ONBOARDED, '1')
    onDone()
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-bg-primary animate-fade-in">
      {/* Skip button */}
      <div className="flex justify-end px-5 pt-5">
        <button onClick={skip} className="text-text-muted text-sm px-3 py-1.5 rounded-lg hover:bg-bg-secondary transition-colors">
          Пропустить
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-6">
        <div className="text-7xl animate-slide-up">{current.icon}</div>
        <div className="animate-slide-up">
          <h2 className="text-text-primary font-bold text-2xl mb-3">
            {current.title(userName)}
          </h2>
          <p className="text-text-secondary text-base leading-relaxed">{current.desc}</p>
        </div>
      </div>

      {/* Dots */}
      <div className="flex items-center justify-center gap-2 pb-6">
        {SLIDES.map((_, i) => (
          <div
            key={i}
            className={`rounded-full transition-all duration-300 ${
              i === slide ? 'w-5 h-2 bg-accent-blue' : 'w-2 h-2 bg-bg-hover'
            }`}
          />
        ))}
      </div>

      {/* Button */}
      <div className="px-6 pb-10">
        <button
          onClick={next}
          className="w-full py-4 rounded-2xl bg-accent-blue text-white font-semibold text-base shadow-lg shadow-accent-blue/30 active:scale-95 transition-transform"
        >
          {isLast ? 'Начать' : 'Далее'}
        </button>
      </div>
    </div>
  )
}
