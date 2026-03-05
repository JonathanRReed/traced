import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { HibpBreach } from '../lib/types'
import { formatBreachDate, formatFullDate, formatPwnCount, getCaseNumber } from '../lib/utils'

interface Props {
  breach: HibpBreach
}

const SENSITIVE_CLASSES = ['Passwords', 'Credit cards', 'Social security numbers', 'Bank account numbers', 'Payment histories']

interface Field {
  label: string
  value: React.ReactNode
  delay: number
}

function sanitizeDescription(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

export function CaseReveal({ breach }: Props) {
  const [visibleCount, setVisibleCount] = useState(0)
  const [started, setStarted] = useState(false)

  const fields: Field[] = [
    {
      label: 'INCIDENT DATE',
      value: <span className="field-value">{formatFullDate(breach.BreachDate)}</span>,
      delay: 0,
    },
    {
      label: 'SURFACED',
      value: <span className="field-value">{formatFullDate(breach.AddedDate)}</span>,
      delay: 200,
    },
    {
      label: 'ACCOUNTS AFFECTED',
      value: (
        <span className="field-value field-count">
          {formatPwnCount(breach.PwnCount)}
          <span className="field-sublabel"> records compromised</span>
        </span>
      ),
      delay: 400,
    },
    {
      label: 'DATA COMPROMISED',
      value: (
        <div className="field-tags">
          {breach.DataClasses.map((dc) => (
            <span
              key={dc}
              className={`evidence-tag${SENSITIVE_CLASSES.includes(dc) ? ' sensitive' : ''}`}
            >
              {dc}
            </span>
          ))}
        </div>
      ),
      delay: 600,
    },
    {
      label: 'VERIFICATION',
      value: (
        <span className={`field-badge ${breach.IsVerified ? 'badge-verified' : 'badge-unverified'}`}>
          {breach.IsVerified ? '✓ VERIFIED' : '? UNVERIFIED'}
        </span>
      ),
      delay: 800,
    },
    {
      label: 'DOMAIN',
      value: breach.Domain ? (
        <a
          href={`https://${breach.Domain}`}
          target="_blank"
          rel="noopener noreferrer"
          className="field-link"
        >
          {breach.Domain}
        </a>
      ) : (
        <span className="field-value field-muted">UNKNOWN</span>
      ),
      delay: 1000,
    },
    {
      label: 'INCIDENT REPORT',
      value: (
        <p className="field-description">
          {sanitizeDescription(breach.Description || 'No description available.')}
        </p>
      ),
      delay: 1200,
    },
  ]

  useEffect(() => {
    const timer = setTimeout(() => setStarted(true), 300)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!started) return
    if (visibleCount >= fields.length) return
    const nextDelay = fields[visibleCount]?.delay ?? 200
    const timer = setTimeout(() => {
      setVisibleCount((c) => c + 1)
    }, visibleCount === 0 ? 0 : 300)
    return () => clearTimeout(timer)
  }, [started, visibleCount, fields.length])

  return (
    <div className="case-reveal scanlines">
      {fields.map((field, i) => (
        <AnimatePresence key={field.label}>
          {i < visibleCount && (
            <motion.div
              className="evidence-row"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <span className="evidence-label">{field.label}</span>
              <div className="evidence-value">
                {field.value}
                {i === visibleCount - 1 && visibleCount < fields.length && (
                  <span className="cursor-blink">_</span>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      ))}

      {visibleCount >= fields.length && (
        <motion.div
          className="evidence-complete"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <span>▸ END OF FILE — {getCaseNumber(breach)}</span>
        </motion.div>
      )}

      <style>{`
        .case-reveal {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          padding: 2rem;
          display: flex;
          flex-direction: column;
          gap: 0;
        }
        .evidence-row {
          display: grid;
          grid-template-columns: 180px 1fr;
          gap: 1rem;
          padding: 0.875rem 0;
          border-bottom: 1px solid var(--color-border);
          align-items: start;
        }
        .evidence-row:last-child { border-bottom: none; }
        .evidence-label {
          font-family: var(--font-mono);
          font-size: 0.6rem;
          letter-spacing: 0.18em;
          color: var(--color-muted);
          padding-top: 2px;
          white-space: nowrap;
        }
        .evidence-value {
          display: flex;
          flex-wrap: wrap;
          align-items: flex-start;
          gap: 6px;
        }
        .field-value {
          font-family: var(--font-mono);
          font-size: 0.78rem;
          letter-spacing: 0.05em;
          color: var(--color-text);
        }
        .field-count {
          font-size: 0.9rem;
          color: var(--color-accent);
        }
        .field-sublabel {
          font-size: 0.65rem;
          color: var(--color-muted);
          margin-left: 4px;
        }
        .field-muted { color: var(--color-muted); }
        .field-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }
        .field-badge {
          font-family: var(--font-mono);
          font-size: 0.65rem;
          letter-spacing: 0.1em;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 2px;
        }
        .badge-verified {
          color: #22c55e;
          border: 1px solid #22c55e40;
          background: #22c55e10;
        }
        .badge-unverified {
          color: var(--color-muted);
          border: 1px solid var(--color-border);
        }
        .field-link {
          font-family: var(--font-mono);
          font-size: 0.75rem;
          color: var(--color-accent);
          text-decoration: none;
          letter-spacing: 0.05em;
        }
        .field-link:hover { text-decoration: underline; }
        .field-description {
          font-family: var(--font-mono);
          font-size: 0.72rem;
          line-height: 1.7;
          color: var(--color-text);
          opacity: 0.8;
          margin: 0;
        }
        .cursor-blink {
          display: inline-block;
          color: var(--color-accent);
          animation: blink 1s step-end infinite;
          font-family: var(--font-mono);
          font-size: 0.8rem;
          margin-left: 2px;
        }
        .evidence-complete {
          font-family: var(--font-mono);
          font-size: 0.6rem;
          letter-spacing: 0.15em;
          color: var(--color-muted);
          padding-top: 1rem;
          text-align: right;
        }
        @media (max-width: 600px) {
          .evidence-row { grid-template-columns: 1fr; gap: 0.25rem; }
          .case-reveal { padding: 1rem; }
        }
      `}</style>
    </div>
  )
}
