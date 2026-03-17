import { useRef, useState, useCallback } from 'react'

const THRESHOLD = 60

interface UsePullToRefreshOptions {
  onRefresh: () => void | Promise<void>
}

export function usePullToRefresh({ onRefresh }: UsePullToRefreshOptions) {
  const containerRef = useRef<HTMLDivElement>(null)
  const startYRef = useRef(0)
  const [pullProgress, setPullProgress] = useState(0)
  const [isPulling, setIsPulling] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const onTouchStart = useCallback((e: TouchEvent) => {
    const el = containerRef.current
    if (!el || el.scrollTop > 0) return
    startYRef.current = e.touches[0].clientY
  }, [])

  const onTouchMove = useCallback((e: TouchEvent) => {
    const el = containerRef.current
    if (!el || el.scrollTop > 0) return
    const delta = e.touches[0].clientY - startYRef.current
    if (delta <= 0) return
    const progress = Math.min(delta / THRESHOLD, 1)
    setPullProgress(progress)
    setIsPulling(true)
  }, [])

  const onTouchEnd = useCallback(async () => {
    if (!isPulling) return
    if (pullProgress >= 1) {
      setIsRefreshing(true)
      try {
        await onRefresh()
      } finally {
        setIsRefreshing(false)
      }
    }
    setPullProgress(0)
    setIsPulling(false)
  }, [isPulling, pullProgress, onRefresh])

  const bindEvents = useCallback((el: HTMLDivElement | null) => {
    if (!el) return
    ;(containerRef as React.MutableRefObject<HTMLDivElement | null>).current = el
    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: true })
    el.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
    }
  }, [onTouchStart, onTouchMove, onTouchEnd])

  return { containerRef, pullProgress, isPulling: isPulling || isRefreshing, isRefreshing, bindEvents }
}
