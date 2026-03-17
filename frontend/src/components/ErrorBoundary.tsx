import { Component, type ReactNode, type ErrorInfo } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="flex flex-col items-center justify-center min-h-[200px] gap-4 px-6 py-10">
          <div className="w-14 h-14 rounded-2xl bg-accent-red/10 flex items-center justify-center">
            <svg className="w-7 h-7 text-accent-red" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-text-primary font-semibold mb-1">Что-то пошло не так</p>
            <p className="text-text-muted text-sm">Попробуйте перезагрузить страницу</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 rounded-xl bg-accent-blue text-white text-sm font-medium"
          >
            Перезагрузить
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
