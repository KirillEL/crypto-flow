export function AlertSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-bg-secondary rounded-2xl p-4 border border-border animate-pulse">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="h-5 w-12 bg-bg-hover rounded" />
              <div className="h-5 w-16 bg-bg-hover rounded-full" />
            </div>
            <div className="h-5 w-16 bg-bg-hover rounded-full" />
          </div>
          <div className="h-6 w-28 bg-bg-hover rounded mb-3" />
          <div className="flex gap-2">
            <div className="flex-1 h-9 rounded-xl bg-bg-hover" />
          </div>
        </div>
      ))}
    </div>
  )
}
