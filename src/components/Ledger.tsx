import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { BreachSummary, LeakFamily, YearStat } from '../lib/types'
import { LEAK_FAMILIES, breachYear, byNewest, formatPwnCount, leakFamilies } from '../lib/utils'
import { fetchBreachesClient } from '../lib/breaches-client'
import { Button } from '@/components/starwind-react/button'
import { Input } from '@/components/starwind-react/input'
import { ToggleGroup, ToggleGroupItem } from '@/components/starwind-react/toggle-group'
import { LedgerHead, LedgerRow } from './LedgerRow'

type Sort = 'newest' | 'largest' | 'added' | 'az'

const SORTS: { value: Sort; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'largest', label: 'Largest' },
  { value: 'added', label: 'Just listed' },
  { value: 'az', label: 'A to Z' },
]

const COMPARE: Record<Sort, (a: BreachSummary, b: BreachSummary) => number> = {
  newest: byNewest,
  largest: (a, b) => b.PwnCount - a.PwnCount || byNewest(a, b),
  added: (a, b) => b.AddedDate.localeCompare(a.AddedDate) || byNewest(a, b),
  az: (a, b) => a.Title.localeCompare(b.Title, 'en', { sensitivity: 'base' }),
}

const FAMILY_IDS = LEAK_FAMILIES.map((f) => f.id)
const CHART_H = 72

interface Props {
  /** The newest rows, rendered on the server so the list is there before any script runs. */
  initial: BreachSummary[]
  total: number
  years: YearStat[]
  dataClasses: string[]
}

interface Filters {
  q: string
  families: LeakFamily[]
  year: number | null
  type: string
  sort: Sort
}

const EMPTY: Filters = { q: '', families: [], year: null, type: '', sort: 'newest' }

function readFilters(): Filters {
  const params = new URLSearchParams(window.location.search)
  const year = Number(params.get('year'))
  const sort = params.get('sort') as Sort
  return {
    q: params.get('q') ?? '',
    families: (params.get('leak') ?? '').split(',').filter((id): id is LeakFamily => FAMILY_IDS.includes(id as LeakFamily)),
    year: Number.isInteger(year) && year > 1900 ? year : null,
    type: params.get('type') ?? '',
    sort: SORTS.some((s) => s.value === sort) ? sort : 'newest',
  }
}

function writeFilters(f: Filters) {
  const params = new URLSearchParams()
  if (f.q.trim()) params.set('q', f.q.trim())
  if (f.families.length) params.set('leak', f.families.join(','))
  if (f.year !== null) params.set('year', String(f.year))
  if (f.type) params.set('type', f.type)
  if (f.sort !== 'newest') params.set('sort', f.sort)
  const query = params.toString()
  const url = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`
  window.history.replaceState(window.history.state, '', url)
}

export function Ledger({ initial, total, years, dataClasses }: Props) {
  const pageSize = initial.length
  const [all, setAll] = useState<BreachSummary[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<Filters>(EMPTY)
  const [showCount, setShowCount] = useState(pageSize)
  const [hoverYear, setHoverYear] = useState<number | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const loadAll = useCallback(async (force = false) => {
    setError(null)
    try {
      setAll(await fetchBreachesClient(force))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load the full list.')
    }
  }, [])

  // The first rows are already on the page. Everything else is fetched once
  // the browser is idle, so searching feels instant without delaying the load.
  useEffect(() => {
    const fromUrl = readFilters()
    const hasUrlFilters = JSON.stringify(fromUrl) !== JSON.stringify(EMPTY)
    if (hasUrlFilters) {
      setFilters(fromUrl)
      void loadAll()
      return
    }
    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 1200))
    const cancel = window.cancelIdleCallback ?? window.clearTimeout
    const handle = idle(() => void loadAll(), { timeout: 2500 })
    return () => cancel(handle)
  }, [loadAll])

  // "/" jumps to the search box, the way it does in most archives.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return
      const target = e.target as HTMLElement | null
      if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return
      e.preventDefault()
      searchRef.current?.focus()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  function update(patch: Partial<Filters>) {
    const next = { ...filters, ...patch }
    setFilters(next)
    setShowCount(pageSize)
    writeFilters(next)
    if (!all) void loadAll()
  }

  const isFiltered =
    filters.q.trim() !== '' || filters.families.length > 0 || filters.year !== null || filters.type !== ''
  const isDefault = !isFiltered && filters.sort === 'newest'

  // Everything except the year, so the chart can show how the other filters
  // spread across time while a year is selected.
  // Everything a breach can be searched by, lower-cased once when the list arrives.
  const haystacks = useMemo(
    () => all?.map((b) => `${b.Title}\n${b.Domain ?? ''}\n${b.DataClasses.join('\n')}`.toLowerCase()) ?? [],
    [all],
  )

  const matched = useMemo(() => {
    if (!all) return null
    const q = filters.q.trim().toLowerCase()
    return all.filter((b, i) => {
      if (q && !haystacks[i].includes(q)) return false
      if (filters.families.length) {
        const found = leakFamilies(b.DataClasses)
        if (!filters.families.every((id) => found.includes(id))) return false
      }
      if (filters.type && !b.DataClasses.includes(filters.type)) return false
      return true
    })
  }, [all, haystacks, filters.q, filters.families, filters.type])

  const rows = useMemo(() => {
    if (!matched) return initial
    const inYear = filters.year === null ? matched : matched.filter((b) => breachYear(b.BreachDate) === filters.year)
    return [...inYear].sort(COMPARE[filters.sort])
  }, [matched, initial, filters.year, filters.sort])

  const matchedByYear = useMemo(() => {
    const counts = new Map<number, number>()
    if (!matched) {
      years.forEach((y) => counts.set(y.year, y.count))
      return counts
    }
    matched.forEach((b) => {
      const year = breachYear(b.BreachDate)
      if (year !== null) counts.set(year, (counts.get(year) ?? 0) + 1)
    })
    return counts
  }, [matched, years])

  const waiting = !all && !isDefault
  const resultCount = all ? rows.length : total
  const visible = rows.slice(0, showCount)
  const remaining = resultCount - visible.length
  const maxYearCount = Math.max(...years.map((y) => y.count), 1)
  const readoutYear = hoverYear ?? filters.year
  const readout = years.find((y) => y.year === readoutYear)
  const groupByYear = filters.sort === 'newest'

  function showMore() {
    setShowCount((count) => count + pageSize)
    if (!all) void loadAll()
  }

  return (
    <section className="ledger" aria-label="Searchable list of breaches">
      <div className="ledger-tools wrap">
        <div className="ledger-search">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <line x1="20" y1="20" x2="16.2" y2="16.2" />
          </svg>
          <Input
            ref={searchRef}
            type="search"
            size="lg"
            placeholder="Find a service you've used"
            aria-label="Search breaches by service, domain or data type"
            value={filters.q}
            onValueChange={(q) => update({ q })}
            onFocus={() => !all && void loadAll()}
            className="ledger-search-input"
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        <div className="ledger-filters">
          <div className="filter-group" role="group" aria-labelledby="filter-leak">
            <span className="sr-only" id="filter-leak">Show only breaches that leaked</span>
            {LEAK_FAMILIES.map((family) => {
              const on = filters.families.includes(family.id)
              return (
                <button
                  key={family.id}
                  type="button"
                  className="tick leak-hot"
                  aria-pressed={on}
                  onClick={() =>
                    update({
                      families: on ? filters.families.filter((id) => id !== family.id) : [...filters.families, family.id],
                    })
                  }
                >
                  <span className="tick-box" aria-hidden="true" />
                  <span aria-hidden="true">*</span>
                  {family.label}
                </button>
              )
            })}
          </div>

          <div className="filter-group">
            <label className="sr-only" htmlFor="filter-type">Data type</label>
            <select
              id="filter-type"
              value={filters.type}
              onChange={(e) => update({ type: e.target.value })}
              className="filter-select"
            >
              <option value="">Any of {dataClasses.length} data types</option>
              {dataClasses.map((dc) => (
                <option key={dc} value={dc}>{dc}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="chart" role="group" aria-label="Breaches by year. Select a year to filter the list.">
          <div className="chart-bars" style={{ height: CHART_H }} onMouseLeave={() => setHoverYear(null)}>
            {years.map((y) => {
              const matchedCount = matchedByYear.get(y.year) ?? 0
              const selected = filters.year === y.year
              return (
                <button
                  key={y.year}
                  type="button"
                  className="chart-bar"
                  aria-pressed={selected}
                  data-dim={filters.year !== null && !selected}
                  disabled={y.count === 0}
                  aria-label={`${y.year}: ${matchedCount} breach${matchedCount === 1 ? '' : 'es'}`}
                  onClick={() => update({ year: selected ? null : y.year })}
                  onMouseEnter={() => setHoverYear(y.year)}
                  onFocus={() => setHoverYear(y.year)}
                  onBlur={() => setHoverYear(null)}
                >
                  <span className="chart-total" style={{ height: `${Math.max(2, (y.count / maxYearCount) * 100)}%` }}>
                    <span className="chart-match" style={{ height: y.count ? `${(matchedCount / y.count) * 100}%` : 0 }} />
                  </span>
                </button>
              )
            })}
          </div>
          <div className="chart-axis" aria-hidden="true">
            {years.map((y, i) => (
              <span key={y.year} data-on={filters.year === y.year}>
                {i === 0 || i === years.length - 1 || y.year % 5 === 0 || filters.year === y.year ? y.year : ''}
              </span>
            ))}
          </div>
          <p className="chart-readout" aria-live="polite">
            {readout && (
              <>
                <strong>{readout.year}</strong>{' '}
                {isFiltered && matched
                  ? `${matchedByYear.get(readout.year) ?? 0} of ${readout.count} breaches match`
                  : `${readout.count} breach${readout.count === 1 ? '' : 'es'}, ${formatPwnCount(readout.accounts)} accounts`}
              </>
            )}
          </p>
        </div>

        <div className="ledger-status">
          <p aria-live="polite">
            {waiting ? (
              error ? "Couldn't load the full list." : 'Loading all breaches...'
            ) : (
              <>
                <strong>{resultCount.toLocaleString('en-US')}</strong> breach{resultCount === 1 ? '' : 'es'}
                {isFiltered ? ' match' : ''}
              </>
            )}
          </p>
          {isFiltered && (
            <Button variant="ghost" size="sm" onClick={() => update({ q: '', families: [], year: null, type: '' })}>
              Clear filters
            </Button>
          )}
          <div className="filter-group">
            <span className="sr-only" id="filter-sort">Sort</span>
            <ToggleGroup
              variant="outline"
              size="sm"
              spacing={0}
              aria-labelledby="filter-sort"
              value={[filters.sort]}
              onValueChange={(v) => v[0] && update({ sort: v[0] as Sort })}
            >
              {SORTS.map((s) => (
                <ToggleGroupItem key={s.value} value={s.value}>{s.label}</ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        </div>
      </div>

      {error && !all && !isDefault ? (
        <div className="wrap">
          <div className="notice" role="alert">
            <h3>Couldn't load the full list</h3>
            <p>{error} Search and filters need the full list, though the newest breaches are still shown below.</p>
            <Button variant="outline" size="sm" onClick={() => void loadAll(true)}>Try again</Button>
          </div>
        </div>
      ) : null}

      {rows.length === 0 ? (
        <div className="ledger-empty wrap">
          <h3>No matches found</h3>
          <p>That doesn't mean the service was never breached. It just means HIBP doesn't have a public record of it.</p>
          <Button variant="outline" size="sm" onClick={() => update({ q: '', families: [], year: null, type: '' })}>
            Clear filters
          </Button>
        </div>
      ) : (
        <>
          <LedgerHead />
          <ol className="rows" aria-busy={waiting}>
            {visible.map((b, i) => {
              const year = breachYear(b.BreachDate)
              const startsYear = groupByYear && (i === 0 || year !== breachYear(visible[i - 1].BreachDate))
              const yearCount =
                filters.year !== null || !all ? matchedByYear.get(year ?? 0) : rows.filter((r) => breachYear(r.BreachDate) === year).length
              return (
                <Fragment key={b.Name}>
                  {startsYear && year !== null && (
                    <li className="row-year">
                      <span className="figure">{year}</span>
                      <span>
                        {yearCount} breach{yearCount === 1 ? '' : 'es'}
                      </span>
                    </li>
                  )}
                  <LedgerRow breach={b} />
                </Fragment>
              )
            })}
          </ol>

          {remaining > 0 && (
            <div className="ledger-more wrap">
              <Button variant="outline" onClick={showMore}>
                Show {Math.min(pageSize, remaining)} more
                <span className="muted">{remaining.toLocaleString('en-US')} left</span>
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  )
}
