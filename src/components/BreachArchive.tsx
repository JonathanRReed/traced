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
        <div className="archive-loading">
          <span className="archive-loading-dot" />
          <span className="archive-loading-text">LOADING CASE FILES...</span>
        </div>
        <style>{`
          .archive-loading {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 3rem 0;
            font-family: var(--font-mono);
            font-size: 0.65rem;
            letter-spacing: 0.2em;
            color: var(--color-muted);
          }
          .archive-loading-dot {
            width: 6px;
            height: 6px;
            background: var(--color-accent);
            border-radius: 50%;
            animation: blink 1s step-end infinite;
          }
        `}</style>
      </div>
    )
  }

  if (error && breaches.length === 0) {
    return (
      <div className="archive-root">
        <div className="archive-error" role="status" aria-live="polite">
          <span className="archive-error-kicker">ARCHIVE OFFLINE</span>
          <p className="archive-error-message">
            The case files could not be loaded right now. Please try again.
          </p>
          <p className="archive-error-detail">{error}</p>
          <button
            type="button"
            onClick={() => void loadBreaches(true)}
            className="archive-error-retry"
          >
            RETRY LOAD
          </button>
        </div>
        <style>{`
          .archive-root {
            padding: 0 2rem 4rem;
            max-width: 1400px;
            margin: 0 auto;
          }
          .archive-error {
            max-width: 32rem;
            margin: 3rem 0;
            padding: 1.25rem;
            border: 1px solid rgba(239, 68, 68, 0.24);
            border-left: 3px solid var(--color-danger);
            background: rgba(239, 68, 68, 0.06);
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
          }
          .archive-error-kicker {
            font-family: var(--font-mono);
            font-size: 0.58rem;
            letter-spacing: 0.22em;
            color: var(--color-danger);
          }
          .archive-error-message {
            margin: 0;
            font-family: var(--font-display);
            font-weight: 700;
            font-size: 1.25rem;
            letter-spacing: 0.05em;
            color: var(--color-text);
          }
          .archive-error-detail {
            margin: 0;
            font-family: var(--font-mono);
            font-size: 0.64rem;
            line-height: 1.7;
            letter-spacing: 0.06em;
            color: var(--color-muted);
          }
          .archive-error-retry {
            align-self: flex-start;
            font-family: var(--font-mono);
            font-size: 0.62rem;
            letter-spacing: 0.16em;
            background: none;
            border: 1px solid var(--color-danger);
            color: var(--color-danger);
            padding: 0.6rem 0.9rem;
            cursor: pointer;
            border-radius: 2px;
            transition: background 0.15s, color 0.15s, opacity 0.15s;
          }
          .archive-error-retry:hover {
            background: rgba(239, 68, 68, 0.12);
            color: #fca5a5;
          }
        `}</style>
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

      <style>{`
        .archive-root {
          padding: 0 2rem 4rem;
          max-width: 1400px;
          margin: 0 auto;
        }
        .archive-controls {
          position: sticky;
          top: 56px;
          z-index: 50;
          background: rgba(8, 11, 15, 0.96);
          border-bottom: 1px solid var(--color-border);
          padding: 1rem 0;
          backdrop-filter: blur(8px);
          margin-bottom: 2rem;
        }
        .archive-error {
          max-width: 32rem;
          margin: 3rem 0;
          padding: 1.25rem;
          border: 1px solid rgba(239, 68, 68, 0.24);
          border-left: 3px solid var(--color-danger);
          background: rgba(239, 68, 68, 0.06);
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .archive-error-kicker {
          font-family: var(--font-mono);
          font-size: 0.58rem;
          letter-spacing: 0.22em;
          color: var(--color-danger);
        }
        .archive-error-message {
          margin: 0;
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 1.25rem;
          letter-spacing: 0.05em;
          color: var(--color-text);
        }
        .archive-error-detail {
          margin: 0;
          font-family: var(--font-mono);
          font-size: 0.64rem;
          line-height: 1.7;
          letter-spacing: 0.06em;
          color: var(--color-muted);
        }
        .archive-error-retry {
          align-self: flex-start;
          font-family: var(--font-mono);
          font-size: 0.62rem;
          letter-spacing: 0.16em;
          background: none;
          border: 1px solid var(--color-danger);
          color: var(--color-danger);
          padding: 0.6rem 0.9rem;
          cursor: pointer;
          border-radius: 2px;
          transition: background 0.15s, color 0.15s, opacity 0.15s;
        }
        .archive-error-retry:hover {
          background: rgba(239, 68, 68, 0.12);
          color: #fca5a5;
        }
        .search-wrap {
          position: relative;
          margin-bottom: 1rem;
        }
        .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--color-muted);
          font-size: 1.1rem;
          pointer-events: none;
        }
        .search-input {
          width: 100%;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 2px;
          color: var(--color-text);
          font-family: var(--font-mono);
          font-size: 0.75rem;
          letter-spacing: 0.1em;
          padding: 10px 36px;
          outline: none;
          transition: border-color 0.15s;
        }
        .search-input::placeholder { color: var(--color-muted); }
        .search-input:focus { border-color: var(--color-accent); }
        .search-clear {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: var(--color-muted);
          cursor: pointer;
          font-size: 0.7rem;
          padding: 2px;
          transition: color 0.15s;
        }
        .search-clear:hover { color: var(--color-text); }
        .filter-row {
          display: flex;
          flex-wrap: wrap;
          gap: 1.5rem;
          align-items: center;
        }
        .filter-group {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        .filter-label {
          font-family: var(--font-mono);
          font-size: 0.6rem;
          letter-spacing: 0.15em;
          color: var(--color-muted);
          margin-right: 4px;
        }
        .filter-btn {
          font-family: var(--font-mono);
          font-size: 0.65rem;
          letter-spacing: 0.1em;
          background: none;
          border: 1px solid var(--color-border);
          border-radius: 2px;
          color: var(--color-muted);
          padding: 6px 10px;
          min-height: 36px;
          cursor: pointer;
          transition: all 0.15s;
          white-space: nowrap;
        }
        .filter-btn:hover { color: var(--color-text); border-color: var(--color-muted); }
        .filter-btn.active { color: var(--color-accent); border-color: var(--color-accent); }
        .filter-btn[data-status="critical"].active { color: var(--color-danger); border-color: var(--color-danger); }
        .filter-btn[data-status="cold-case"].active { color: var(--color-muted); border-color: var(--color-muted); }
        .filter-select {
          font-family: var(--font-mono);
          font-size: 0.65rem;
          letter-spacing: 0.08em;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 2px;
          color: var(--color-muted);
          padding: 6px 10px;
          min-height: 36px;
          cursor: pointer;
          outline: none;
        }
        .filter-select:focus { border-color: var(--color-accent); color: var(--color-text); }
        .archive-count {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-family: var(--font-mono);
          font-size: 0.65rem;
          letter-spacing: 0.12em;
          color: var(--color-muted);
          margin-bottom: 1.5rem;
        }
        .clear-filters {
          background: none;
          border: none;
          font-family: var(--font-mono);
          font-size: 0.65rem;
          letter-spacing: 0.12em;
          color: var(--color-accent);
          cursor: pointer;
          padding: 0;
          transition: opacity 0.15s;
        }
        .clear-filters:hover { opacity: 0.7; }
        .archive-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1px;
          background: var(--color-border);
          border: 1px solid var(--color-border);
        }
        .no-results {
          text-align: center;
          padding: 6rem 0;
          color: var(--color-muted);
          font-family: var(--font-mono);
          font-size: 0.75rem;
          letter-spacing: 0.12em;
        }
        .no-results-icon { font-size: 2rem; display: block; margin-bottom: 1rem; }
        .load-more-wrap {
          display: flex;
          justify-content: center;
          margin-top: 2rem;
        }
        .load-more-btn {
          font-family: var(--font-mono);
          font-size: 0.7rem;
          letter-spacing: 0.15em;
          background: none;
          border: 1px solid var(--color-border);
          color: var(--color-muted);
          padding: 10px 24px;
          cursor: pointer;
          transition: all 0.15s;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }
        .load-more-btn:hover { border-color: var(--color-accent); color: var(--color-text); }
        .load-more-count {
          font-size: 0.55rem;
          color: var(--color-muted);
        }
        @media (max-width: 640px) {
          .archive-root { padding: 0 1rem 3rem; }
          .filter-row { gap: 0.75rem; }
        }
      `}</style>
    </div>
  )
}
