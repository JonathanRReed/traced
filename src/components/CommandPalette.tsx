import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import type { BreachSummary } from '../lib/types'
import { navigate as goTo } from 'astro:transitions/client'
import { getBreachStatus, formatPwnCount, slugify, STATUS_LABELS } from '../lib/utils'
import { Button } from '@/components/starwind-react/button'
import { StatusBadge } from './StatusBadge'
import { fetchBreachesClient } from '../lib/breaches-client'

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [breaches, setBreaches] = useState<BreachSummary[]>([])
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
    if (!open) return
    // Remember what was focused (the search button) so focus can return to it on close.
    const trigger = document.activeElement as HTMLElement | null
    setQuery('')
    setActiveIdx(0)
    const t = setTimeout(() => inputRef.current?.focus(), 30)
    return () => {
      clearTimeout(t)
      trigger?.focus?.()
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
          STATUS_LABELS[getBreachStatus(b)].toLowerCase().includes(q),
      )
      .slice(0, 50)
  }, [breaches, query])

  function navigate(breach: BreachSummary) {
    setOpen(false)
    void goTo(`/case/${slugify(breach.Name)}/`)
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
    } else if (e.key === 'Tab') {
      // Trap focus inside the modal (ARIA modal-dialog contract).
      const focusables = e.currentTarget.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])',
      )
      if (focusables.length === 0) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
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
          <svg className="cp-prompt" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <input
            ref={inputRef}
            className="cp-input"
            placeholder="Search case files"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
            spellCheck={false}
            aria-label="Search breach case files"
            role="combobox"
            aria-expanded={true}
            aria-controls="cp-listbox"
            aria-autocomplete="list"
            aria-activedescendant={filtered[activeIdx] ? `cp-opt-${activeIdx}` : undefined}
          />
          <button type="button" className="cp-esc" onClick={() => setOpen(false)} aria-label="Close search">Esc</button>
        </div>

        <div className="cp-divider" />

        <div className="cp-results" id="cp-listbox" ref={listRef} role="listbox" aria-label="Breach results">
          {error && breaches.length === 0 ? (
            <div className="cp-empty cp-error" role="status">
              <div>
                <strong>Could not load the case files</strong>
                <p className="muted">{error}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => void loadBreaches(true)}>
                Try again
              </Button>
            </div>
          ) : breaches.length === 0 ? (
            <div className="cp-empty" role="status">Loading case files...</div>
          ) : filtered.length === 0 ? (
            <div className="cp-empty" role="status">No case files match &quot;{query}&quot;.</div>
          ) : (
            filtered.map((b, i) => {
              const status = getBreachStatus(b)
              const year = new Date(b.BreachDate).getFullYear()
              return (
                <div
                  key={b.Name}
                  id={`cp-opt-${i}`}
                  className={`cp-item${i === activeIdx ? ' cp-item-active' : ''}`}
                  role="option"
                  aria-selected={i === activeIdx}
                  onClick={() => navigate(b)}
                  onMouseEnter={() => setActiveIdx(i)}
                >
                  <div className="cp-item-left">
                    <span className="cp-title">{b.Title}</span>
                    {b.Domain && <span className="cp-domain">{b.Domain}</span>}
                  </div>
                  <div className="cp-item-right">
                    <span className="cp-year data">{year}</span>
                    <span className="cp-count data">{formatPwnCount(b.PwnCount)}</span>
                    <StatusBadge status={status} />
                  </div>
                </div>
              )
            })
          )}
        </div>

        <div className="cp-footer">
          <span className="cp-hint"><kbd>↑↓</kbd> move</span>
          <span className="cp-hint"><kbd>Enter</kbd> open</span>
          <span className="cp-hint"><kbd>Esc</kbd> close</span>
          <span className="cp-count-label">{filtered.length} shown</span>
        </div>
      </div>

    </div>
  )
}
