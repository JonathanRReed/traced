import { useState, useMemo, useEffect, useCallback } from 'react'
import type { HibpBreach } from '../lib/types'
import { getBreachStatus, getAllDataClasses } from '../lib/utils'
import { fetchBreachesClient } from '../lib/breaches-client'
import { BreachCard } from './BreachCard'

type StatusFilter = 'ALL' | 'CRITICAL' | 'UNSOLVED' | 'COLD CASE'

const DECADES = ['ALL', '1990s', '2000s', '2010s', '2020s']

function getDecade(dateStr: string): string {
  const year = new Date(dateStr).getFullYear()
  if (year < 2000) return '1990s'
  if (year < 2010) return '2000s'
  if (year < 2020) return '2010s'
  return '2020s'
}

export function BreachArchive() {
  const [breaches, setBreaches] = useState<HibpBreach[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const loadBreaches = useCallback(async (force = false) => {
    setLoading(true)
    setError(null)

    try {
      const data = await fetchBreachesClient(force)
      setBreaches(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load case files.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadBreaches()
  }, [loadBreaches])

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [decadeFilter, setDecadeFilter] = useState('ALL')
  const [dataClassFilter, setDataClassFilter] = useState('ALL')
  const [showCount, setShowCount] = useState(48)

  const allDataClasses = useMemo(() => getAllDataClasses(breaches), [breaches])

  const filtered = useMemo(() => {
    return breaches.filter((b) => {
      if (search) {
        const q = search.toLowerCase()
        if (
          !b.Title.toLowerCase().includes(q) &&
          !b.Domain?.toLowerCase().includes(q) &&
          !b.DataClasses.some((dc) => dc.toLowerCase().includes(q))
        ) return false
      }
      if (statusFilter !== 'ALL' && getBreachStatus(b) !== statusFilter) return false
      if (decadeFilter !== 'ALL' && getDecade(b.BreachDate) !== decadeFilter) return false
      if (dataClassFilter !== 'ALL' && !b.DataClasses.includes(dataClassFilter)) return false
      return true
    })
  }, [breaches, search, statusFilter, decadeFilter, dataClassFilter])

  const visible = filtered.slice(0, showCount)

  if (loading) {
    return (
      <div className="archive-root">
        <div className="archive-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton-card">
              <div className="skeleton" style={{ width: '40%', height: 12, marginBottom: 12 }} />
              <div className="skeleton" style={{ width: '70%', height: 20, marginBottom: 16 }} />
              <div className="skeleton" style={{ width: '55%', height: 10, marginBottom: 8 }} />
              <div className="skeleton" style={{ width: '45%', height: 10 }} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error && breaches.length === 0) {
    return (
      <div className="archive-root">
        <div className="shared-error" role="status" aria-live="polite">
          <span className="shared-error-kicker">ARCHIVE OFFLINE</span>
          <p className="shared-error-message">
            The case files could not be loaded right now. Please try again.
          </p>
          <p className="shared-error-detail">{error}</p>
          <button
            type="button"
            onClick={() => void loadBreaches(true)}
            className="shared-error-retry"
          >
            RETRY LOAD
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="archive-root">
      <div className="archive-controls">
        <div className="search-wrap">
          <span className="search-icon">⌕</span>
          <input
            type="text"
            placeholder="SEARCH BREACHES..."
            aria-label="Search breaches"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setShowCount(48) }}
            className="search-input"
          />
          {search && (
            <button
              type="button"
              onClick={() => { setSearch(''); setShowCount(48) }}
              className="search-clear"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        <div className="filter-row">
          <div className="filter-group" role="group" aria-label="Filter by status">
            <span className="filter-label" aria-hidden="true">STATUS</span>
            {(['ALL', 'CRITICAL', 'UNSOLVED', 'COLD CASE'] as StatusFilter[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => { setStatusFilter(s); setShowCount(48) }}
                className={`filter-btn${statusFilter === s ? ' active' : ''}`}
                data-status={s.toLowerCase().replace(' ', '-')}
                aria-pressed={statusFilter === s}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="filter-group" role="group" aria-label="Filter by era">
            <span className="filter-label" aria-hidden="true">ERA</span>
            {DECADES.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => { setDecadeFilter(d); setShowCount(48) }}
                className={`filter-btn${decadeFilter === d ? ' active' : ''}`}
                aria-pressed={decadeFilter === d}
              >
                {d}
              </button>
            ))}
          </div>

          <div className="filter-group">
            <span className="filter-label" aria-hidden="true">DATA</span>
            <select
              value={dataClassFilter}
              onChange={(e) => { setDataClassFilter(e.target.value); setShowCount(48) }}
              className="filter-select"
              aria-label="Filter by data type"
            >
              <option value="ALL">ALL TYPES</option>
              {allDataClasses.map((dc) => (
                <option key={dc} value={dc}>{dc.toUpperCase()}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="archive-count">
        <span>{filtered.length} CASE{filtered.length !== 1 ? 'S' : ''} ON FILE</span>
        {(search || statusFilter !== 'ALL' || decadeFilter !== 'ALL' || dataClassFilter !== 'ALL') && (
          <button
            type="button"
            onClick={() => { setSearch(''); setStatusFilter('ALL'); setDecadeFilter('ALL'); setDataClassFilter('ALL'); setShowCount(48) }}
            className="clear-filters"
          >
            CLEAR FILTERS
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="no-results">
          <span className="no-results-icon">◻</span>
          <p>NO CASES MATCH YOUR CRITERIA.</p>
        </div>
      ) : (
        <>
          <div className="archive-grid">
            {visible.map((b) => (
              <BreachCard key={b.Name} breach={b} />
            ))}
          </div>

          {showCount < filtered.length && (
            <div className="load-more-wrap">
              <button
                type="button"
                onClick={() => setShowCount((c) => c + 48)}
                className="load-more-btn"
              >
                LOAD MORE CASES
                <span className="load-more-count">
                  {filtered.length - showCount} REMAINING
                </span>
              </button>
            </div>
          )}
        </>
      )}


    </div>
  )
}
