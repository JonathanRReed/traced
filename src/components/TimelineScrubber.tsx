import { useRef, useState, useMemo, useEffect, useCallback } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import type { BreachSummary } from '../lib/types'
import { getBreachStatus, slugify } from '../lib/utils'
import { fetchBreachesClient } from '../lib/breaches-client'

interface YearData {
  year: number
  total: number
  critical: number
  unsolved: number
  cold: number
  topBreach: BreachSummary
}

interface TooltipState {
  data: YearData
  x: number
}

const BAR_H = 80

export function TimelineScrubber() {
  const [breaches, setBreaches] = useState<BreachSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()

  const loadBreaches = useCallback(async (force = false) => {
    setLoading(true)
    setError(null)

    try {
      const data = await fetchBreachesClient(force)
      setBreaches(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load timeline data.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadBreaches()
  }, [loadBreaches])

  const yearMap = useMemo(() => {
    const map = new Map<number, BreachSummary[]>()
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
    if (d.critical > 0) return 'var(--color-danger)'
    if (d.unsolved > 0) return 'var(--color-accent)'
    return 'var(--color-dim)'
  }

  // Anchor the tooltip to the bar itself so it works for both hover and
  // keyboard focus (a FocusEvent has no clientX).
  function showTooltip(el: HTMLElement, d: YearData) {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const bar = el.getBoundingClientRect()
    setTooltip({ data: d, x: bar.left - rect.left + bar.width / 2 })
  }

  const labelYears = yearData.filter((_, i) => i % 5 === 0 || i === yearData.length - 1)

  if (loading) {
    return (
      <div className="tl-wrap" aria-live="polite">
        <div className="tl-header">
          <span className="tl-label">
            <span className="skeleton" style={{ width: 200, height: 10, display: 'inline-block' }} />
          </span>
        </div>
        <div className="tl-chart" style={{ height: BAR_H + 24 }}>
          <div className="tl-bars">
            {Array.from({ length: 24 }).map((_, i) => (
              <div
                key={i}
                className="skeleton"
                style={{
                  width: '100%',
                  height: Math.max(4, Math.round(Math.random() * BAR_H * 0.6)),
                  alignSelf: 'flex-end',
                }}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error && breaches.length === 0) {
    return (
      <div className="tl-wrap" role="status" aria-live="polite">
        <div className="shared-error">
          <span className="shared-error-kicker">TIMELINE UNAVAILABLE</span>
          <p className="shared-error-message">
            We could not load the incident timeline right now.
          </p>
          <p className="shared-error-detail">{error}</p>
          <button
            type="button"
            className="shared-error-retry"
            onClick={() => void loadBreaches(true)}
          >
            RETRY TIMELINE
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="tl-wrap">
      <div className="tl-header">
        <span className="tl-label">INCIDENT FREQUENCY — {breaches.length} RECORDED EVENTS</span>
        <span className="tl-legend">
          <span className="tl-swatch tl-swatch-critical" />CRITICAL
          <span className="tl-swatch tl-swatch-unsolved" />UNSOLVED
          <span className="tl-swatch tl-swatch-cold" />COLD CASE
        </span>
      </div>

      <div className="tl-chart" ref={containerRef} style={{ height: BAR_H + 24 }}>
        <div className="tl-bars">
          {yearData.map((d, i) => {
            const h = d.total === 0 ? 1 : Math.max(2, Math.round((d.total / maxCount) * BAR_H))
            const color = barColor(d)
            return (
              <motion.button
                key={d.year}
                className={`tl-bar ${d.total === 0 ? 'tl-bar-empty' : ''}`}
                style={{
                  height: h,
                  background: d.total === 0 ? 'var(--color-border)' : color,
                  opacity: d.total === 0 ? 0.2 : 0.75,
                  boxShadow: d.total > 0 ? `0 0 6px color-mix(in srgb, ${color} 25%, transparent)` : 'none',
                  transformOrigin: 'bottom',
                }}
                initial={reduceMotion ? false : { scaleY: 0 }}
                whileInView={{ scaleY: 1 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={reduceMotion ? { duration: 0 } : { duration: 0.4, delay: i * 0.025, ease: 'easeOut' }}
                onMouseEnter={(e) => d.total > 0 && showTooltip(e.currentTarget, d)}
                onMouseLeave={() => setTooltip(null)}
                onFocus={(e) => d.total > 0 && showTooltip(e.currentTarget, d)}
                onBlur={() => setTooltip(null)}
                onClick={() => {
                  if (d.total > 0 && d.topBreach) {
                    window.location.href = `/case/${slugify(d.topBreach.Name)}/`
                  }
                }}
                aria-label={
                  d.total > 0
                    ? `${d.year}: ${d.total} incident${d.total !== 1 ? 's' : ''} — open ${d.topBreach.Title} case file`
                    : `${d.year}: no recorded incidents`
                }
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


    </div>
  )
}
