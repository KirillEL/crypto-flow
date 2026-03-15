import { useCryptoStore } from '../store/cryptoStore'
import type { SortField } from '../types'

const SORT_OPTIONS: { label: string; field: SortField }[] = [
  { label: '#', field: 'rank' },
  { label: 'Price', field: 'price' },
  { label: '24h %', field: 'change' },
  { label: 'Volume', field: 'volume' },
]

export function SortBar() {
  const { sortField, sortOrder, setSortField, setSortOrder } = useCryptoStore()

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  return (
    <div className="flex items-center gap-1 px-4 pb-2">
      {SORT_OPTIONS.map(({ label, field }) => {
        const active = sortField === field
        return (
          <button
            key={field}
            onClick={() => handleSort(field)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              active
                ? 'bg-accent-blue/10 text-accent-blue'
                : 'text-text-muted hover:text-text-secondary hover:bg-bg-card'
            }`}
          >
            {label}
            {active && (
              <svg
                className={`w-3 h-3 transition-transform ${sortOrder === 'asc' ? 'rotate-0' : 'rotate-180'}`}
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M7 14l5-5 5 5H7z" />
              </svg>
            )}
          </button>
        )
      })}
    </div>
  )
}
