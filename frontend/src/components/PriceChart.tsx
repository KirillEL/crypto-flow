import { useEffect, useRef, useState } from 'react'
import {
  createChart,
  ColorType,
  CrosshairMode,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type LineData,
  type UTCTimestamp,
} from 'lightweight-charts'
import type { Candle, TimeFrame } from '../types'

interface PriceChartProps {
  candles: Candle[]
  timeFrame: TimeFrame
  onTimeFrameChange: (tf: TimeFrame) => void
  isPositive: boolean
}

const TIME_FRAMES: TimeFrame[] = ['1m', '5m', '15m', '1h', '4h', '1d', '1w']

function calcMA(candles: Candle[], period: number): LineData[] {
  const result: LineData[] = []
  for (let i = period - 1; i < candles.length; i++) {
    let sum = 0
    for (let j = 0; j < period; j++) sum += candles[i - j].close
    result.push({ time: candles[i].time as UTCTimestamp, value: sum / period })
  }
  return result
}

export function PriceChart({ candles, timeFrame, onTimeFrameChange, isPositive }: PriceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const ma20Ref = useRef<ISeriesApi<'Line'> | null>(null)
  const ma50Ref = useRef<ISeriesApi<'Line'> | null>(null)
  const [showMA20, setShowMA20] = useState(false)
  const [showMA50, setShowMA50] = useState(false)

  useEffect(() => {
    if (!containerRef.current) return

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#94a3b8',
        fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
        fontSize: 11,
      },
      grid: {
        vertLines: { color: '#1e293b' },
        horzLines: { color: '#1e293b' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      rightPriceScale: {
        borderColor: '#1e293b',
        scaleMargins: { top: 0.1, bottom: 0.2 },
      },
      timeScale: {
        borderColor: '#1e293b',
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: { mouseWheel: true, pressedMouseMove: true },
      handleScale: { mouseWheel: true, pinch: true },
    })

    const series = chart.addCandlestickSeries({
      upColor: '#10b981',
      downColor: '#ef4444',
      borderUpColor: '#10b981',
      borderDownColor: '#ef4444',
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
    })

    const ma20 = chart.addLineSeries({ color: '#f59e0b', lineWidth: 1, priceLineVisible: false, lastValueVisible: false })
    const ma50 = chart.addLineSeries({ color: '#a78bfa', lineWidth: 1, priceLineVisible: false, lastValueVisible: false })
    ma20.applyOptions({ visible: false })
    ma50.applyOptions({ visible: false })

    chartRef.current = chart
    seriesRef.current = series
    ma20Ref.current = ma20
    ma50Ref.current = ma50

    const ro = new ResizeObserver(() => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth })
      }
    })
    ro.observe(containerRef.current)

    return () => {
      ro.disconnect()
      chart.remove()
    }
  }, [])

  useEffect(() => {
    if (!seriesRef.current || !candles.length) return
    const data: CandlestickData[] = candles.map((c) => ({
      time: c.time as UTCTimestamp,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }))
    seriesRef.current.setData(data)
    if (ma20Ref.current) ma20Ref.current.setData(calcMA(candles, 20))
    if (ma50Ref.current) ma50Ref.current.setData(calcMA(candles, 50))
    chartRef.current?.timeScale().fitContent()
  }, [candles])

  useEffect(() => {
    ma20Ref.current?.applyOptions({ visible: showMA20 })
  }, [showMA20])

  useEffect(() => {
    ma50Ref.current?.applyOptions({ visible: showMA50 })
  }, [showMA50])

  return (
    <div className="bg-bg-card rounded-2xl overflow-hidden border border-border">
      {/* Timeframe selector + MA toggles */}
      <div className="flex items-center gap-1 p-3 border-b border-border overflow-x-auto">
        {TIME_FRAMES.map((tf) => (
          <button
            key={tf}
            onClick={() => onTimeFrameChange(tf)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              timeFrame === tf
                ? 'bg-accent-blue text-white'
                : 'text-text-muted hover:text-text-secondary hover:bg-bg-secondary'
            }`}
          >
            {tf.toUpperCase()}
          </button>
        ))}
        <div className="flex-1" />
        <button
          onClick={() => setShowMA20((v) => !v)}
          className={`flex-shrink-0 px-2 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            showMA20 ? 'bg-amber-500/20 text-amber-400' : 'text-text-muted hover:text-text-secondary hover:bg-bg-secondary'
          }`}
        >
          MA20
        </button>
        <button
          onClick={() => setShowMA50((v) => !v)}
          className={`flex-shrink-0 px-2 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            showMA50 ? 'bg-violet-500/20 text-violet-400' : 'text-text-muted hover:text-text-secondary hover:bg-bg-secondary'
          }`}
        >
          MA50
        </button>
      </div>

      {/* Chart */}
      <div ref={containerRef} className="w-full h-56" />
    </div>
  )
}
