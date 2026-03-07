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

    </a>
  )
}
