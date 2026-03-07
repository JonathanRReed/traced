import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import type { HibpBreach } from '../lib/types'
import { getBreachStatus, formatPwnCount, slugify } from '../lib/utils'
import { fetchBreachesClient } from '../lib/breaches-client'

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%'
const STATUS_COLOR: Record<string, string> = {
  CRITICAL: 'var(--color-danger)',
  UNSOLVED: 'var(--color-accent)',
  'COLD CASE': 'var(--color-muted)',
}

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [breaches, setBreaches] = useState<HibpBreach[]>([])
  const [error, setError] = useState<string | null>(null)
  const [activeIdx, setActiveIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const fetchedRef = useRef(false)

  const loadBreaches = useCallback(async (force = false) => {
    if (fetchedRef.current && !force) return

    fetchedRef.current = true
    setError(null)

    try {
      const data = await fetchBreachesClient(force)
      setBreaches(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load case files.')
      fetchedRef.current = false
    }
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((o) => !o)
        void loadBreaches()
      }
      if (e.key === 'Escape') setOpen(false)
    }
    function onCustom() {
      setOpen(true)
      void loadBreaches()
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('open-command-palette', onCustom)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('open-command-palette', onCustom)
    }
  }, [loadBreaches])

  useEffect(() => {
    if (open) {
      setQuery('')
      setActiveIdx(0)
      setTimeout(() => inputRef.current?.focus(), 30)
    }
  }, [open])

  const filtered = useMemo(() => {
    if (!query.trim()) return breaches.slice(0, 50)
    const q = query.toLowerCase()
    return breaches
      .filter(
        (b) =>
          b.Title.toLowerCase().includes(q) ||
          b.Domain?.toLowerCase().includes(q) ||
          String(new Date(b.BreachDate).getFullYear()).includes(q) ||
          getBreachStatus(b).toLowerCase().includes(q),
      )
      .slice(0, 50)
  }, [breaches, query])

  function navigate(breach: HibpBreach) {
    window.location.href = `/case/${slugify(breach.Name)}`
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx((i) => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && filtered[activeIdx]) {
      navigate(filtered[activeIdx])
    }
  }

  useEffect(() => {
    const el = listRef.current?.children[activeIdx] as HTMLElement | undefined
    el?.scrollIntoView({ block: 'nearest' })
  }, [activeIdx])

  useEffect(() => { setActiveIdx(0) }, [query])

  if (!open) return null

  return (
    <div className="cp-backdrop" onClick={() => setOpen(false)}>
      <div className="cp-modal" onClick={(e) => e.stopPropagation()} onKeyDown={onKeyDown} role="dialog" aria-modal="true" aria-label="Search case files">
        <div className="cp-header">
          <span className="cp-prompt">⌕</span>
          <input
            ref={inputRef}
            className="cp-input"
            placeholder="SEARCH CASE FILES..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
            spellCheck={false}
            aria-label="Search breach case files"
          />
          <kbd className="cp-esc" onClick={() => setOpen(false)}>ESC</kbd>
        </div>

        <div className="cp-divider" />

        <div className="cp-results" ref={listRef} role="listbox" aria-label="Breach results">
          {error && breaches.length === 0 ? (
            <div className="cp-empty cp-error" role="status" aria-live="polite">
              <div className="cp-error-copy">
                <span className="cp-error-label">CASE FILES UNAVAILABLE</span>
                <span className="cp-error-detail">{error}</span>
              </div>
              <button
                type="button"
                className="cp-retry"
                onClick={() => void loadBreaches(true)}
              >
                RETRY
              </button>
            </div>
          ) : breaches.length === 0 ? (
            <div className="cp-empty">
              <span className="cp-loading-dot" />
              ACCESSING DATABASE...
            </div>
          ) : filtered.length === 0 ? (
            <div className="cp-empty">NO RECORDS FOUND FOR &quot;{query.toUpperCase()}&quot;</div>
          ) : (
            filtered.map((b, i) => {
              const status = getBreachStatus(b)
              const color = STATUS_COLOR[status]
              const year = new Date(b.BreachDate).getFullYear()
              return (
                <div
                  key={b.Name}
                  className={`cp-item${i === activeIdx ? ' cp-item-active' : ''}`}
                  role="option"
                  aria-selected={i === activeIdx}
                  onClick={() => navigate(b)}
                  onMouseEnter={() => setActiveIdx(i)}
                >
                  <div className="cp-item-left">
                    <span className="cp-status-dot" style={{ background: color }} />
                    <span className="cp-title">{b.Title}</span>
                    {b.Domain && <span className="cp-domain">{b.Domain}</span>}
                  </div>
                  <div className="cp-item-right">
                    <span className="cp-year">{year}</span>
                    <span className="cp-count">{formatPwnCount(b.PwnCount)}</span>
                    <span className="cp-status" style={{ color }}>{status}</span>
                  </div>
                </div>
              )
            })
          )}
        </div>

        <div className="cp-footer">
          <span className="cp-hint"><kbd>↑↓</kbd> navigate</span>
          <span className="cp-hint"><kbd>↵</kbd> open case file</span>
          <span className="cp-hint"><kbd>⌘K</kbd> close</span>
          <span className="cp-count-label">{filtered.length} RECORDS</span>
        </div>
      </div>

    </div>
  )
}
