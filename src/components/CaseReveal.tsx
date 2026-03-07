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


    </div>
  )
}
