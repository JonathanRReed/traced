import { useRef, useState, useMemo, useEffect, useCallback } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import type { BreachSummary } from '../lib/types'
import { navigate } from 'astro:transitions/client'
import { getBreachStatus, slugify } from '../lib/utils'
import { Button } from '@/components/starwind-react/button'
import { fetchBreachesClient } from '../lib/breaches-client'

interface YearData {
  year: number
  total: number
  critical: number
  recent: number
  older: number
  topBreach: BreachSummary
}

interface TooltipState {
  data: YearData
  x: number
}

const BAR_H = 120

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
      let critical = 0, recent = 0, older = 0
      let topBreach = group[0]
      group.forEach((b) => {
        const s = getBreachStatus(b)
        if (s === 'critical') critical++
        else if (s === 'recent') recent++
        else older++
        if (!topBreach || b.PwnCount > topBreach.PwnCount) topBreach = b
      })
      return { year, total: group.length, critical, recent, older, topBreach }
    })
  }, [years, yearMap])

  const maxCount = useMemo(() => Math.max(...yearData.map((d) => d.total), 1), [yearData])

  function barColor(d: YearData): string {
    if (d.critical > 0) return 'var(--sev-critical)'
    if (d.recent > 0) return 'var(--sev-recent)'
    return 'var(--sev-older)'
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
      <section className="tl-wrap wrap" aria-label="Loading timeline" aria-busy="true">
        <div className="tl-bars">
          {Array.from({ length: 24 }).map((_, i) => (
            <div
              key={i}
              className="skeleton"
              style={{ width: '100%', height: 12 + ((i * 17) % 50), alignSelf: 'flex-end' }}
            />
          ))}
        </div>
      </section>
    )
  }

  if (error && breaches.length === 0) {
    return (
      <section className="tl-wrap wrap">
        <div className="notice" role="status">
          <h3>Could not load the timeline</h3>
          <p>{error}</p>
          <Button variant="outline" size="sm" onClick={() => void loadBreaches(true)}>
            Try again
          </Button>
        </div>
      </section>
    )
  }

  return (
    <section className="tl-wrap wrap" aria-labelledby="timeline-heading">
      <div className="tl-header">
        <div>
          <h2 id="timeline-heading" className="section-title">Breaches by year</h2>
          <p className="muted">{breaches.length.toLocaleString('en-US')} recorded breaches. Select a bar to open that year's largest case file.</p>
        </div>
        <ul className="tl-legend" aria-label="Bar colours">
          <li><span className="tl-swatch" style={{ background: 'var(--sev-critical)' }} />Critical</li>
          <li><span className="tl-swatch" style={{ background: 'var(--sev-recent)' }} />Recent</li>
          <li><span className="tl-swatch" style={{ background: 'var(--sev-older)' }} />Older</li>
        </ul>
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
                  background: d.total === 0 ? 'var(--border)' : color,
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
                    void navigate(`/case/${slugify(d.topBreach.Name)}/`)
                  }
                }}
                aria-label={
                  d.total > 0
                    ? `${d.year}: ${d.total} breach${d.total !== 1 ? 'es' : ''}. Open the ${d.topBreach.Title} case file`
                    : `${d.year}: no recorded breaches`
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
              left: Math.min(
                Math.max(tooltip.x - 70, 4),
                Math.max((containerRef.current?.offsetWidth ?? 400) - 224, 4),
              ),
              bottom: BAR_H + 28,
            }}
          >
            <span className="tt-year">{tooltip.data.year}</span>
            <span className="tt-total">{tooltip.data.total} breach{tooltip.data.total !== 1 ? 'es' : ''}</span>
            <span className="tt-breakdown">
              {[
                tooltip.data.critical > 0 && `${tooltip.data.critical} critical`,
                tooltip.data.recent > 0 && `${tooltip.data.recent} recent`,
                tooltip.data.older > 0 && `${tooltip.data.older} older`,
              ].filter(Boolean).join(', ')}
            </span>
            <span className="tt-top">Largest: {tooltip.data.topBreach.Title}</span>
          </div>
        )}
      </div>
    </section>
  )
}
