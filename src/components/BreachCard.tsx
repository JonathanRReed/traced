import { useState } from 'react'
import type { BreachSummary, BreachStatus } from '../lib/types'
import { getBreachStatus, getCaseNumber, formatBreachDate, formatPwnCount, slugify } from '../lib/utils'
import { useScramble } from '../hooks/useScramble'

interface Props {
  breach: BreachSummary
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
      href={`/case/${caseSlug}/`}
      style={{ textDecoration: 'none', display: 'block' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <article className="breach-card scanlines">
        <header className="breach-card-header">
          <span className="breach-case-num">{caseNum}</span>
          <span className={STATUS_CLASSES[status]}>{STATUS_LABELS[status]}</span>
        </header>

        <div className="breach-card-body">
          {breach.LogoPath ? (
            <img
              src={breach.LogoPath}
              alt={breach.Title}
              width={64}
              height={64}
              className="breach-logo"
              loading="lazy"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          ) : null}
          <h3 className="breach-title">{scrambledTitle}</h3>
        </div>

        <dl className="breach-card-meta">
          <div className="breach-meta-row">
            <dt className="meta-label">DATE</dt>
            <dd className="meta-value">{formatBreachDate(breach.BreachDate)}</dd>
          </div>
          <div className="breach-meta-row">
            <dt className="meta-label">ACCOUNTS</dt>
            <dd className="meta-value">{formatPwnCount(breach.PwnCount)}</dd>
          </div>
        </dl>

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

    </a>
  )
}
