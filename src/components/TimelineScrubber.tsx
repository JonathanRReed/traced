import { useRef, useState, useMemo, useEffect } from 'react'
import type { HibpBreach } from '../lib/types'
import { getBreachStatus } from '../lib/utils'

interface YearData {
  year: number
  total: number
  critical: number
  unsolved: number
  cold: number
  topBreach: HibpBreach
}

interface TooltipState {
  data: YearData
  x: number
}

const BAR_H = 80

export function TimelineScrubber() {
  const [breaches, setBreaches] = useState<HibpBreach[]>([])
  const [loading, setLoading] = useState(true)
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/breaches.json')
      .then((r) => r.json())
      .then((data: HibpBreach[]) => { setBreaches(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const yearMap = useMemo(() => {
    const map = new Map<number, HibpBreach[]>()
    breaches.forEach((b) => {
      const y = new Date(b.BreachDate).getFullYear()
      if (isNaN(y)) return
      if (!map.has(y)) map.set(y, [])
      map.get(y)!.push(b)
    })
    return map
  }, [breaches])

  const years = useMemo(() => {
    const ys = Array.from(yearMap.keys()).sort((a, b) => a - b)
    if (!ys.length) return []
    const min = ys[0]
    const max = ys[ys.length - 1]
    const all: number[] = []
    for (let y = min; y <= max; y++) all.push(y)
    return all
  }, [yearMap])

  const yearData = useMemo((): YearData[] => {
    return years.map((year) => {
      const group = yearMap.get(year) ?? []
      let critical = 0, unsolved = 0, cold = 0
      let topBreach = group[0]
      group.forEach((b) => {
        const s = getBreachStatus(b)
        if (s === 'CRITICAL') critical++
        else if (s === 'UNSOLVED') unsolved++
        else cold++
        if (!topBreach || b.PwnCount > topBreach.PwnCount) topBreach = b
      })
      return { year, total: group.length, critical, unsolved, cold, topBreach }
    })
  }, [years, yearMap])

  const maxCount = useMemo(() => Math.max(...yearData.map((d) => d.total), 1), [yearData])

  function barColor(d: YearData): string {
    if (d.critical > 0) return '#ef4444'
    if (d.unsolved > 0) return '#3b82f6'
    return '#4b5563'
  }

  function handleEnter(e: React.MouseEvent, d: YearData) {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    setTooltip({ data: d, x: e.clientX - rect.left })
  }

  const labelYears = yearData.filter((_, i) => i % 5 === 0 || i === yearData.length - 1)

  return (
    <div className="tl-wrap">
      <div className="tl-header">
        <span className="tl-label">INCIDENT FREQUENCY — {breaches.length} RECORDED EVENTS</span>
        <span className="tl-legend">
          <span className="tl-swatch" style={{ background: '#ef4444' }} />CRITICAL
          <span className="tl-swatch" style={{ background: '#3b82f6' }} />UNSOLVED
          <span className="tl-swatch" style={{ background: '#4b5563' }} />COLD CASE
        </span>
      </div>

      <div className="tl-chart" ref={containerRef} style={{ height: BAR_H + 24 }}>
        <div className="tl-bars">
          {yearData.map((d) => {
            const h = d.total === 0 ? 1 : Math.max(2, Math.round((d.total / maxCount) * BAR_H))
            const color = barColor(d)
            return (
              <button
                key={d.year}
                className={`tl-bar ${d.total === 0 ? 'tl-bar-empty' : ''}`}
                style={{
                  height: h,
                  background: d.total === 0 ? 'var(--color-border)' : color,
                  opacity: d.total === 0 ? 0.2 : 0.75,
                  boxShadow: d.total > 0 ? `0 0 6px ${color}40` : 'none',
                }}
                onMouseEnter={(e) => d.total > 0 && handleEnter(e, d)}
                onMouseLeave={() => setTooltip(null)}
                onClick={() => {
                  if (d.total > 0 && d.topBreach) {
                    window.location.href = `/case/${d.topBreach.Name.toLowerCase()}`
                  }
                }}
                aria-label={d.total > 0 ? `${d.year}: ${d.total} incidents` : `${d.year}: no recorded incidents`}
                disabled={d.total === 0}
              />
            )
          })}
        </div>

        <div className="tl-axis">
          {labelYears.map((d) => {
            const idx = yearData.indexOf(d)
            const pct = yearData.length > 1 ? (idx / (yearData.length - 1)) * 100 : 0
            return (
              <span
                key={d.year}
                className="tl-year"
                style={{ left: `${pct}%` }}
              >
                {d.year}
              </span>
            )
          })}
        </div>

        {tooltip && (
          <div
            className="tl-tooltip"
            style={{
              left: Math.min(Math.max(tooltip.x - 70, 0), (containerRef.current?.offsetWidth ?? 400) - 160),
              bottom: BAR_H + 28,
            }}
          >
            <span className="tt-year">{tooltip.data.year}</span>
            <span className="tt-total">{tooltip.data.total} incident{tooltip.data.total !== 1 ? 's' : ''}</span>
            <div className="tt-breakdown">
              {tooltip.data.critical > 0 && <span className="tt-crit">{tooltip.data.critical} CRITICAL</span>}
              {tooltip.data.unsolved > 0 && <span className="tt-unsolved">{tooltip.data.unsolved} UNSOLVED</span>}
              {tooltip.data.cold > 0 && <span className="tt-cold">{tooltip.data.cold} COLD</span>}
            </div>
            {tooltip.data.topBreach && (
              <span className="tt-top">↳ {tooltip.data.topBreach.Title}</span>
            )}
          </div>
        )}
      </div>

      <style>{`
        .tl-wrap {
          padding: 1.5rem 2rem 1rem;
          border: 1px solid var(--color-border);
          background: var(--color-surface);
          margin: 0 2rem 2rem;
        }
        .tl-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        .tl-label {
          font-family: var(--font-mono);
          font-size: 0.58rem;
          letter-spacing: 0.2em;
          color: var(--color-muted);
        }
        .tl-legend {
          display: flex;
          align-items: center;
          gap: 0.875rem;
          font-family: var(--font-mono);
          font-size: 0.55rem;
          letter-spacing: 0.1em;
          color: var(--color-muted);
        }
        .tl-swatch {
          display: inline-block;
          width: 8px;
          height: 8px;
          margin-right: 4px;
          vertical-align: middle;
        }
        .tl-chart {
          position: relative;
        }
        .tl-bars {
          display: flex;
          align-items: flex-end;
          gap: 2px;
          height: ${BAR_H}px;
        }
        .tl-bar {
          flex: 1;
          min-width: 2px;
          border: none;
          padding: 0;
          cursor: pointer;
          transition: opacity 0.1s, box-shadow 0.1s, transform 0.1s;
          transform-origin: bottom center;
        }
        .tl-bar:hover:not(:disabled) {
          opacity: 1 !important;
          transform: scaleY(1.06);
        }
        .tl-bar-empty {
          cursor: default;
        }
        .tl-axis {
          position: relative;
          height: 20px;
          margin-top: 4px;
          border-top: 1px solid var(--color-border);
        }
        .tl-year {
          position: absolute;
          transform: translateX(-50%);
          font-family: var(--font-mono);
          font-size: 0.48rem;
          color: var(--color-muted);
          letter-spacing: 0.06em;
          top: 4px;
          opacity: 0.65;
          white-space: nowrap;
        }
        .tl-tooltip {
          position: absolute;
          background: #080b0fef;
          border: 1px solid var(--color-border);
          border-left: 2px solid var(--color-accent);
          padding: 8px 12px;
          pointer-events: none;
          z-index: 50;
          display: flex;
          flex-direction: column;
          gap: 3px;
          min-width: 140px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.6);
        }
        .tt-year {
          font-family: var(--font-display);
          font-weight: 900;
          font-size: 1.4rem;
          color: var(--color-text);
          letter-spacing: 0.08em;
          line-height: 1;
        }
        .tt-total {
          font-family: var(--font-mono);
          font-size: 0.6rem;
          color: var(--color-muted);
          letter-spacing: 0.1em;
        }
        .tt-breakdown {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          margin-top: 1px;
        }
        .tt-crit {
          font-family: var(--font-mono);
          font-size: 0.52rem;
          color: #ef4444;
          letter-spacing: 0.1em;
        }
        .tt-unsolved {
          font-family: var(--font-mono);
          font-size: 0.52rem;
          color: #3b82f6;
          letter-spacing: 0.1em;
        }
        .tt-cold {
          font-family: var(--font-mono);
          font-size: 0.52rem;
          color: var(--color-muted);
          letter-spacing: 0.1em;
        }
        .tt-top {
          font-family: var(--font-mono);
          font-size: 0.58rem;
          color: var(--color-muted);
          margin-top: 3px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        @media (max-width: 640px) {
          .tl-wrap { padding: 1rem; margin: 0 1rem 1.5rem; }
          .tl-legend { display: none; }
          .tl-bars { gap: 1px; }
        }
      `}</style>
    </div>
  )
}
