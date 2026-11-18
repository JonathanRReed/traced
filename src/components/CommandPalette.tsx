import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import type { BreachSummary } from '../lib/types'
import { navigate as goTo } from 'astro:transitions/client'
import { breachYear, formatCompact, slugify } from '../lib/utils'
import { Button } from '@/components/starwind-react/button'
import { fetchBreachesClient } from '../lib/breaches-client'

interface Item {
  key: string
  href: string
  title: string
  detail?: string
  year?: number | null
  count?: string
}

const PAGES: Item[] = [
  { key: 'page-home', href: '/', title: 'All breaches', detail: 'Search, filter and sort the full list' },
  { key: 'page-check', href: '/check/', title: 'Check a password', detail: 'Without sending it anywhere' },
  { key: 'page-index', href: '/archive/', title: 'Case index', detail: 'Every full record, newest first' },
  { key: 'page-about', href: '/about/', title: 'About TRACED', detail: 'Where the data comes from' },
]

const MAX_RESULTS = 50

export function CommandPalette() {
  // The palette is only mounted when someone asks for it, so it starts open.
  const [open, setOpen] = useState(true)
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
      setBreaches(await fetchBreachesClient(force))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load the breach list.')
      fetchedRef.current = false
    }
  }, [])

  // Cmd/Ctrl+K and the header button are handled by the site script, which
  // mounts this component on first use and sends a toggle after that.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    function onToggle() {
      setOpen((o) => !o)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('palette:toggle', onToggle)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('palette:toggle', onToggle)
    }
  }, [])

  useEffect(() => {
    if (open) void loadBreaches()
  }, [open, loadBreaches])

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

  const items = useMemo<Item[]>(() => {
    const q = query.trim().toLowerCase()
    const toItem = (b: BreachSummary): Item => ({
      key: b.Name,
      href: `/case/${slugify(b.Name)}/`,
      title: b.Title,
      detail: b.Domain,
      year: breachYear(b.BreachDate),
      count: formatCompact(b.PwnCount),
    })

    if (!q) {
      // With nothing typed: the pages, then the biggest breaches on file.
      const biggest = [...breaches].sort((a, b) => b.PwnCount - a.PwnCount).slice(0, 12)
      return [...PAGES, ...biggest.map(toItem)]
    }

    const pages = PAGES.filter((p) => p.title.toLowerCase().includes(q))
    const matches = breaches
      .filter(
        (b) =>
          b.Title.toLowerCase().includes(q) ||
          b.Domain?.toLowerCase().includes(q) ||
          String(breachYear(b.BreachDate)).includes(q),
      )
      // Names that start with the query come first, then bigger breaches.
      .sort((a, b) => {
        const aStarts = a.Title.toLowerCase().startsWith(q) ? 0 : 1
        const bStarts = b.Title.toLowerCase().startsWith(q) ? 0 : 1
        return aStarts - bStarts || b.PwnCount - a.PwnCount
      })
      .slice(0, MAX_RESULTS)
    return [...pages, ...matches.map(toItem)]
  }, [breaches, query])

  function open_(item: Item) {
    setOpen(false)
    void goTo(item.href)
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx((i) => Math.min(i + 1, items.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && items[activeIdx]) {
      // Closing hands focus back to the search button. Without this, the same
      // Enter press would then activate that button and reopen the palette.
      e.preventDefault()
      open_(items[activeIdx])
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
    listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [activeIdx])

  useEffect(() => { setActiveIdx(0) }, [query])

  if (!open) return null

  const loading = breaches.length === 0 && !error

  return (
    <div className="cp-backdrop" onClick={() => setOpen(false)}>
      <div className="cp-modal" onClick={(e) => e.stopPropagation()} onKeyDown={onKeyDown} role="dialog" aria-modal="true" aria-label="Search breaches">
        <div className="cp-header">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><line x1="20" y1="20" x2="16.2" y2="16.2" /></svg>
          <input
            ref={inputRef}
            className="cp-input"
            placeholder="Search a service, domain or year"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
            spellCheck={false}
            aria-label="Search breaches by service, domain or year"
            role="combobox"
            aria-expanded={true}
            aria-controls="cp-listbox"
            aria-autocomplete="list"
            aria-activedescendant={items[activeIdx] ? `cp-opt-${activeIdx}` : undefined}
          />
          <button type="button" className="cp-esc" onClick={() => setOpen(false)} aria-label="Close search">Esc</button>
        </div>

        <div className="cp-results" id="cp-listbox" ref={listRef} role="listbox" aria-label="Results">
          {items.map((item, i) => (
            <div
              key={item.key}
              id={`cp-opt-${i}`}
              className={`cp-item${i === activeIdx ? ' cp-item-active' : ''}`}
              role="option"
              aria-selected={i === activeIdx}
              onClick={() => open_(item)}
              onMouseEnter={() => setActiveIdx(i)}
            >
              <div className="cp-item-left">
                <span className="cp-title">{item.title}</span>
                {item.detail && <span className="cp-domain">{item.detail}</span>}
              </div>
              <span className="cp-year">{item.year ?? ''}</span>
              <span className="cp-count">{item.count ?? ''}</span>
            </div>
          ))}

          {error && breaches.length === 0 ? (
            <div className="cp-empty" role="status">
              <div>
                <strong>The breach list did not load</strong>
                <p>{error}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => void loadBreaches(true)}>
                Try again
              </Button>
            </div>
          ) : loading ? (
            <div className="cp-empty" role="status">Loading the breach list…</div>
          ) : items.length === 0 ? (
            <div className="cp-empty" role="status">Nothing on file matches &quot;{query}&quot;.</div>
          ) : null}
        </div>

        <div className="cp-footer">
          <span className="cp-hint"><kbd>↑↓</kbd> move</span>
          <span className="cp-hint"><kbd>Enter</kbd> open</span>
          <span className="cp-hint"><kbd>Esc</kbd> close</span>
          <span className="cp-count-label">
            {query.trim() ? `${items.length}${items.length >= MAX_RESULTS ? '+' : ''} found` : 'Pages and the largest breaches'}
          </span>
        </div>
      </div>
    </div>
  )
}
