import { useState, useMemo, useEffect, useCallback } from 'react'
import type { BreachStatus, BreachSummary } from '../lib/types'
import { getBreachStatus, getAllDataClasses, STATUS_LABELS } from '../lib/utils'
import { fetchBreachesClient } from '../lib/breaches-client'
import { Button } from '@/components/starwind-react/button'
import { Input } from '@/components/starwind-react/input'
import { ToggleGroup, ToggleGroupItem } from '@/components/starwind-react/toggle-group'
import { BreachCard } from './BreachCard'

type StatusFilter = 'all' | BreachStatus

const PAGE_SIZE = 48
const DECADE_ORDER = ['1990s', '2000s', '2010s', '2020s']
const STATUS_OPTIONS: StatusFilter[] = ['all', 'critical', 'recent', 'older']

function getDecade(dateStr: string): string {
  const year = new Date(dateStr).getFullYear()
  if (Number.isNaN(year)) return 'Unknown'
  if (year < 2000) return '1990s'
  if (year < 2010) return '2000s'
  if (year < 2020) return '2010s'
  return '2020s'
}

export function BreachArchive() {
  const [breaches, setBreaches] = useState<BreachSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [decadeFilter, setDecadeFilter] = useState('all')
  const [dataClassFilter, setDataClassFilter] = useState('all')
  const [showCount, setShowCount] = useState(PAGE_SIZE)

  const loadBreaches = useCallback(async (force = false) => {
    setLoading(true)
    setError(null)

    try {
      setBreaches(await fetchBreachesClient(force))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load case files.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadBreaches()
  }, [loadBreaches])

  const allDataClasses = useMemo(() => getAllDataClasses(breaches), [breaches])

  const decades = useMemo(() => {
    const present = new Set(breaches.map((b) => getDecade(b.BreachDate)))
    return ['all', ...DECADE_ORDER.filter((d) => present.has(d))]
  }, [breaches])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return breaches.filter((b) => {
      if (
        q &&
        !b.Title.toLowerCase().includes(q) &&
        !b.Domain?.toLowerCase().includes(q) &&
        !b.DataClasses.some((dc) => dc.toLowerCase().includes(q))
      ) return false
      if (statusFilter !== 'all' && getBreachStatus(b) !== statusFilter) return false
      if (decadeFilter !== 'all' && getDecade(b.BreachDate) !== decadeFilter) return false
      if (dataClassFilter !== 'all' && !b.DataClasses.includes(dataClassFilter)) return false
      return true
    })
  }, [breaches, search, statusFilter, decadeFilter, dataClassFilter])

  const hasFilters = search !== '' || statusFilter !== 'all' || decadeFilter !== 'all' || dataClassFilter !== 'all'

  function change<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value)
      setShowCount(PAGE_SIZE)
    }
  }

  function clearFilters() {
    setSearch('')
    setStatusFilter('all')
    setDecadeFilter('all')
    setDataClassFilter('all')
    setShowCount(PAGE_SIZE)
  }

  if (loading) {
    return (
      <section className="archive-root wrap" aria-label="Loading case files" aria-busy="true">
        <div className="archive-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="breach-card breach-card-skeleton">
              <div className="skeleton" style={{ width: '45%', height: 14 }} />
              <div className="skeleton" style={{ width: '70%', height: 26 }} />
              <div className="skeleton" style={{ width: '55%', height: 14 }} />
              <div className="skeleton" style={{ width: '80%', height: 22 }} />
            </div>
          ))}
        </div>
      </section>
    )
  }

  if (error && breaches.length === 0) {
    return (
      <section className="archive-root wrap" aria-label="Case files">
        <div className="notice" role="status">
          <h3>Could not load the case files</h3>
          <p>{error}</p>
          <Button variant="outline" size="sm" onClick={() => void loadBreaches(true)}>
            Try again
          </Button>
        </div>
      </section>
    )
  }

  const visible = filtered.slice(0, showCount)

  return (
    <section className="archive-root wrap" aria-label="Searchable breach archive">
      <div className="archive-controls">
        <div className="archive-search">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <Input
            type="search"
            placeholder="Search by name, domain or data type"
            aria-label="Search breaches"
            value={search}
            onValueChange={change(setSearch)}
            className="archive-search-input"
          />
        </div>

        <div className="filter-row">
          <div className="filter-group">
            <span className="filter-label" id="filter-status">Status</span>
            <ToggleGroup
              variant="outline"
              size="sm"
              spacing={0}
              aria-labelledby="filter-status"
              value={[statusFilter]}
              onValueChange={(v) => change(setStatusFilter)((v[0] as StatusFilter) ?? 'all')}
            >
              {STATUS_OPTIONS.map((s) => (
                <ToggleGroupItem key={s} value={s}>
                  {s === 'all' ? 'All' : STATUS_LABELS[s]}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          <div className="filter-group">
            <span className="filter-label" id="filter-era">Era</span>
            <ToggleGroup
              variant="outline"
              size="sm"
              spacing={0}
              aria-labelledby="filter-era"
              value={[decadeFilter]}
              onValueChange={(v) => change(setDecadeFilter)(v[0] ?? 'all')}
            >
              {decades.map((d) => (
                <ToggleGroupItem key={d} value={d}>
                  {d === 'all' ? 'All' : d}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          <div className="filter-group">
            <label className="filter-label" htmlFor="filter-data">Data type</label>
            <select
              id="filter-data"
              value={dataClassFilter}
              onChange={(e) => change(setDataClassFilter)(e.target.value)}
              className="filter-select"
            >
              <option value="all">All types</option>
              {allDataClasses.map((dc) => (
                <option key={dc} value={dc}>{dc}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="archive-count" aria-live="polite">
        <span>
          {filtered.length.toLocaleString('en-US')} case file{filtered.length === 1 ? '' : 's'}
        </span>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear filters
          </Button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="archive-empty">
          <h3>No case files match</h3>
          <p>Try a shorter search or remove a filter.</p>
          <Button variant="outline" size="sm" onClick={clearFilters}>
            Clear filters
          </Button>
        </div>
      ) : (
        <>
          <div className="archive-grid">
            {visible.map((b) => (
              <BreachCard key={b.Name} breach={b} />
            ))}
          </div>

          {showCount < filtered.length && (
            <div className="load-more">
              <Button variant="outline" onClick={() => setShowCount((c) => c + PAGE_SIZE)}>
                Show {Math.min(PAGE_SIZE, filtered.length - showCount)} more
                <span className="muted">({(filtered.length - showCount).toLocaleString('en-US')} left)</span>
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  )
}
