import type { BreachSummary } from '../lib/types'
import {
  getBreachStatus,
  getCaseNumber,
  formatBreachDate,
  formatPwnCount,
  isSensitiveDataClass,
  slugify,
} from '../lib/utils'
import { StatusBadge } from './StatusBadge'

const VISIBLE_CLASSES = 3

export function BreachCard({ breach }: { breach: BreachSummary }) {
  const slug = slugify(breach.Name)
  const extra = breach.DataClasses.length - VISIBLE_CLASSES

  return (
    <a
      href={`/case/${slug}/`}
      className="breach-card"
      onPointerMove={(e) => {
        const box = e.currentTarget.getBoundingClientRect()
        e.currentTarget.style.setProperty('--mx', `${e.clientX - box.left}px`)
        e.currentTarget.style.setProperty('--my', `${e.clientY - box.top}px`)
      }}
    >
      <header className="breach-card-top">
        <span className="case-id data">{getCaseNumber(breach)}</span>
        <StatusBadge status={getBreachStatus(breach)} />
      </header>

      <div className="breach-card-title">
        {breach.LogoPath ? (
          <img
            src={breach.LogoPath}
            alt=""
            width={32}
            height={32}
            className="breach-logo"
            loading="lazy"
            onError={(e) => { e.currentTarget.style.display = 'none' }}
          />
        ) : null}
        <h3 style={{ viewTransitionName: `case-${slug}` }}>{breach.Title}</h3>
        <svg className="breach-card-arrow" viewBox="0 0 20 20" width="20" height="20" aria-hidden="true">
          <path d="M4 10h11M10.5 5l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <dl className="breach-card-meta">
        <div>
          <dt>Date</dt>
          <dd className="data">{formatBreachDate(breach.BreachDate)}</dd>
        </div>
        <div>
          <dt>Accounts</dt>
          <dd className="data">{formatPwnCount(breach.PwnCount)}</dd>
        </div>
      </dl>

      <ul className="chip-list" aria-label="Exposed data types">
        {breach.DataClasses.slice(0, VISIBLE_CLASSES).map((dc) => (
          <li key={dc} className="chip" data-sensitive={isSensitiveDataClass(dc)}>
            {dc}
          </li>
        ))}
        {extra > 0 && <li className="chip">+{extra} more</li>}
      </ul>
    </a>
  )
}
