import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import type { HibpBreach } from '../lib/types'
import { getBreachStatus, formatPwnCount } from '../lib/utils'

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%'
const STATUS_COLOR: Record<string, string> = {
  CRITICAL: '#ef4444',
  UNSOLVED: '#3b82f6',
  'COLD CASE': '#8390a2',
}

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [breaches, setBreaches] = useState<HibpBreach[]>([])
  const [activeIdx, setActiveIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const fetchedRef = useRef(false)

  const fetchBreaches = useCallback(() => {
    if (fetchedRef.current) return
    fetchedRef.current = true
    fetch('/breaches.json')
      .then((r) => r.json())
      .then((data: HibpBreach[]) => setBreaches(data))
      .catch(() => {})
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((o) => !o)
        fetchBreaches()
      }
      if (e.key === 'Escape') setOpen(false)
    }
    function onCustom() {
      setOpen(true)
      fetchBreaches()
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('open-command-palette', onCustom)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('open-command-palette', onCustom)
    }
  }, [fetchBreaches])

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
    window.location.href = `/case/${breach.Name.toLowerCase()}`
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
      <div className="cp-modal" onClick={(e) => e.stopPropagation()} onKeyDown={onKeyDown}>
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
          {breaches.length === 0 ? (
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

      <style>{`
        .cp-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.75);
          backdrop-filter: blur(4px);
          z-index: 9000;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding-top: clamp(4rem, 10vh, 8rem);
          animation: cp-fade-in 0.12s ease;
        }
        @keyframes cp-fade-in {
          from { opacity: 0 }
          to   { opacity: 1 }
        }
        .cp-modal {
          width: min(680px, calc(100vw - 2rem));
          background: #090c10;
          border: 1px solid #1a2030;
          border-top: 2px solid #3b82f6;
          box-shadow: 0 24px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(59,130,246,0.1);
          display: flex;
          flex-direction: column;
          max-height: calc(100vh - 8rem);
          animation: cp-slide-in 0.15s cubic-bezier(0.16,1,0.3,1);
          overflow: hidden;
        }
        @keyframes cp-slide-in {
          from { opacity: 0; transform: translateY(-12px) scale(0.98) }
          to   { opacity: 1; transform: translateY(0) scale(1) }
        }
        .cp-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 1.25rem;
        }
        .cp-prompt {
          font-family: var(--font-mono);
          font-size: 1rem;
          color: #3b82f6;
          flex-shrink: 0;
        }
        .cp-input {
          flex: 1;
          background: none;
          border: none;
          outline: none;
          font-family: var(--font-mono);
          font-size: 0.75rem;
          letter-spacing: 0.12em;
          color: #c9cdd4;
          caret-color: #3b82f6;
        }
        .cp-input::placeholder {
          color: #4b5563;
          letter-spacing: 0.18em;
        }
        .cp-esc {
          font-family: var(--font-mono);
          font-size: 0.55rem;
          letter-spacing: 0.1em;
          color: #4b5563;
          border: 1px solid #1a2030;
          border-radius: 2px;
          padding: 2px 6px;
          cursor: pointer;
          transition: color 0.1s;
          flex-shrink: 0;
        }
        .cp-esc:hover { color: #8390a2; }
        .cp-divider {
          height: 1px;
          background: #1a2030;
        }
        .cp-results {
          overflow-y: auto;
          flex: 1;
          scrollbar-width: thin;
          scrollbar-color: #1a2030 transparent;
        }
        .cp-empty {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 2rem 1.25rem;
          font-family: var(--font-mono);
          font-size: 0.6rem;
          letter-spacing: 0.2em;
          color: #4b5563;
        }
        .cp-loading-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #3b82f6;
          animation: blink 1s step-end infinite;
          flex-shrink: 0;
        }
        .cp-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.625rem 1.25rem;
          cursor: pointer;
          gap: 1rem;
          border-left: 2px solid transparent;
          transition: background 0.08s, border-color 0.08s;
        }
        .cp-item:hover, .cp-item-active {
          background: rgba(59,130,246,0.06);
          border-left-color: #3b82f6;
        }
        .cp-item-left {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          min-width: 0;
        }
        .cp-status-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .cp-title {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 0.875rem;
          color: #c9cdd4;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .cp-domain {
          font-family: var(--font-mono);
          font-size: 0.55rem;
          color: #4b5563;
          letter-spacing: 0.06em;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .cp-item-right {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-shrink: 0;
        }
        .cp-year {
          font-family: var(--font-mono);
          font-size: 0.55rem;
          color: #4b5563;
          letter-spacing: 0.06em;
        }
        .cp-count {
          font-family: var(--font-mono);
          font-size: 0.55rem;
          color: #8390a2;
          letter-spacing: 0.06em;
        }
        .cp-status {
          font-family: var(--font-mono);
          font-size: 0.5rem;
          letter-spacing: 0.12em;
          min-width: 5.5rem;
          text-align: right;
        }
        .cp-footer {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          padding: 0.625rem 1.25rem;
          border-top: 1px solid #1a2030;
          background: rgba(13,17,23,0.8);
        }
        .cp-hint {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-family: var(--font-mono);
          font-size: 0.5rem;
          color: #4b5563;
          letter-spacing: 0.08em;
        }
        .cp-hint kbd {
          font-family: var(--font-mono);
          font-size: 0.5rem;
          color: #8390a2;
          border: 1px solid #1a2030;
          border-radius: 2px;
          padding: 1px 4px;
        }
        .cp-count-label {
          margin-left: auto;
          font-family: var(--font-mono);
          font-size: 0.5rem;
          color: #4b5563;
          letter-spacing: 0.12em;
        }
        @media (max-width: 640px) {
          .cp-item-right { display: none; }
          .cp-domain { display: none; }
          .cp-footer { gap: 0.75rem; }
        }
      `}</style>
    </div>
  )
}
