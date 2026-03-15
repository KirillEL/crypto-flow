export const formatPrice = (price: number): string => {
  if (price >= 1000) {
    return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }
  if (price >= 1) {
    return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })
  }
  if (price >= 0.01) {
    return price.toFixed(6)
  }
  return price.toFixed(8)
}

export const formatVolume = (volume: number): string => {
  if (volume >= 1_000_000_000) return `$${(volume / 1_000_000_000).toFixed(2)}B`
  if (volume >= 1_000_000) return `$${(volume / 1_000_000).toFixed(2)}M`
  if (volume >= 1_000) return `$${(volume / 1_000).toFixed(2)}K`
  return `$${volume.toFixed(2)}`
}

export const formatPercent = (v: number): string => {
  const sign = v >= 0 ? '+' : ''
  return `${sign}${v.toFixed(2)}%`
}
