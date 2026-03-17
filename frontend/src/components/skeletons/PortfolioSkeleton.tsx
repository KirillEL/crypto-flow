export function PortfolioSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {/* Summary card skeleton */}
      <div className="bg-bg-secondary rounded-2xl p-5 mb-2 border border-border animate-pulse">
        <div className="h-3 w-28 bg-bg-hover rounded mb-2" />
        <div className="h-8 w-40 bg-bg-hover rounded mb-3" />
        <div className="h-4 w-32 bg-bg-hover rounded" />
      </div>
      {/* Holding cards */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-bg-secondary rounded-2xl p-4 border border-border animate-pulse">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-bg-hover" />
              <div>
                <div className="h-4 w-10 bg-bg-hover rounded mb-1.5" />
                <div className="h-3 w-24 bg-bg-hover rounded" />
              </div>
            </div>
            <div className="text-right">
              <div className="h-4 w-20 bg-bg-hover rounded mb-1.5" />
              <div className="h-3 w-16 bg-bg-hover rounded" />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex-1 h-8 rounded-lg bg-bg-hover" />
            <div className="flex-1 h-8 rounded-lg bg-bg-hover" />
          </div>
        </div>
      ))}
    </div>
  )
}
