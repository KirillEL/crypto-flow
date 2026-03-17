interface PullIndicatorProps {
  pullProgress: number
  isRefreshing: boolean
}

export function PullIndicator({ pullProgress, isRefreshing }: PullIndicatorProps) {
  if (pullProgress === 0 && !isRefreshing) return null

  const rotate = pullProgress * 180

  return (
    <div
      className="flex items-center justify-center py-3 transition-all duration-150"
      style={{ opacity: Math.max(pullProgress, isRefreshing ? 1 : 0) }}
    >
      <div
        className="w-6 h-6 text-accent-blue"
        style={{
          transform: isRefreshing ? undefined : `rotate(${rotate}deg)`,
          animation: isRefreshing ? 'spin 0.8s linear infinite' : undefined,
        }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
          {isRefreshing ? (
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
          ) : (
            <path d="M19 12A7 7 0 0 1 5.27 15M5 12A7 7 0 0 1 18.73 9M19 5v4h-4M5 19v-4h4" strokeLinecap="round" strokeLinejoin="round" />
          )}
        </svg>
      </div>
    </div>
  )
}
