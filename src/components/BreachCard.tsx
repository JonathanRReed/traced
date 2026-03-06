import { useState } from 'react'
import type { HibpBreach, BreachStatus } from '../lib/types'
import { getBreachStatus, getCaseNumber, formatBreachDate, formatPwnCount, slugify } from '../lib/utils'
import { useScramble } from '../hooks/useScramble'

interface Props {
  breach: HibpBreach
}

const STATUS_LABELS: Record<BreachStatus, string> = {
  'CRITICAL': 'CRITICAL',
  'UNSOLVED': 'UNSOLVED',
  'COLD CASE': 'COLD CASE',
}

const STATUS_CLASSES: Record<BreachStatus, string> = {
  'CRITICAL': 'stamp stamp-critical',
  'UNSOLVED': 'stamp stamp-unsolved',
  'COLD CASE': 'stamp stamp-cold',
}

const SENSITIVE_CLASSES = ['Passwords', 'Credit cards', 'Social security numbers', 'Bank account numbers']

export function BreachCard({ breach }: Props) {
  const status = getBreachStatus(breach)
  const caseNum = getCaseNumber(breach)
  const caseSlug = slugify(breach.Name)
  const topClasses = breach.DataClasses.slice(0, 3)
  const hasMore = breach.DataClasses.length > 3
  const [hovered, setHovered] = useState(false)
  const scrambledTitle = useScramble(breach.Title, hovered)

  return (
    <a
      href={`/case/${caseSlug}`}
      style={{ textDecoration: 'none', display: 'block' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <article className="breach-card scanlines">
        <div className="breach-card-header">
          <span className="breach-case-num">{caseNum}</span>
          <span className={STATUS_CLASSES[status]}>{STATUS_LABELS[status]}</span>
        </div>

        <div className="breach-card-body">
          {breach.LogoPath ? (
            <img
              src={breach.LogoPath}
              alt={breach.Title}
              className="breach-logo"
              loading="lazy"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          ) : null}
          <h3 className="breach-title">{scrambledTitle}</h3>
        </div>

        <div className="breach-card-meta">
          <div className="breach-meta-row">
            <span className="meta-label">DATE</span>
            <span className="meta-value">{formatBreachDate(breach.BreachDate)}</span>
          </div>
          <div className="breach-meta-row">
            <span className="meta-label">ACCOUNTS</span>
            <span className="meta-value">{formatPwnCount(breach.PwnCount)}</span>
          </div>
        </div>

        <div className="breach-card-classes">
          {topClasses.map((dc) => (
            <span
              key={dc}
              className={`evidence-tag${SENSITIVE_CLASSES.includes(dc) ? ' sensitive' : ''}`}
            >
              {dc}
            </span>
          ))}
          {hasMore && (
            <span className="evidence-tag">+{breach.DataClasses.length - 3} more</span>
          )}
        </div>
      </article>
      <style>{`
        .breach-card {
          background: var(--color-surface);
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          transition: background 0.15s;
          height: 100%;
          position: relative;
          cursor: pointer;
        }
        .breach-card:hover { background: var(--color-surface-2); }
        .breach-card::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 0;
          height: 2px;
          background: var(--color-accent);
          transition: width 0.25s ease;
        }
        .breach-card:hover::after { width: 100%; }
        .breach-card-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 0.5rem;
        }
        .breach-case-num {
          font-family: var(--font-mono);
          font-size: 0.55rem;
          letter-spacing: 0.1em;
          color: var(--color-muted);
          line-height: 1.6;
          flex: 1;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .breach-card-body {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          flex: 1;
        }
        .breach-logo {
          width: 28px;
          height: 28px;
          object-fit: contain;
          filter: grayscale(100%) brightness(0.7);
          border-radius: 2px;
        }
        .breach-title {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 1.2rem;
          letter-spacing: 0.05em;
          color: var(--color-text);
          margin: 0;
          line-height: 1.2;
        }
        .breach-card-meta {
          display: flex;
          flex-direction: column;
          gap: 4px;
          border-top: 1px solid var(--color-border);
          padding-top: 0.75rem;
        }
        .breach-meta-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-family: var(--font-mono);
          font-size: 0.6rem;
          letter-spacing: 0.1em;
        }
        .meta-label { color: var(--color-muted); }
        .meta-value { color: var(--color-text); }
        .breach-card-classes {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }
      `}</style>
    </a>
  )
}
