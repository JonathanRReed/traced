import { useEffect, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import type { HibpBreach } from '../lib/types'
import { formatFullDate, formatPwnCount, getCaseNumber } from '../lib/utils'

interface Props {
  breach: HibpBreach
}

const SENSITIVE_CLASSES = ['Passwords', 'Credit cards', 'Social security numbers', 'Bank account numbers', 'Payment histories']

interface Field {
  label: string
  value: React.ReactNode
}

function sanitizeDescription(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

export function CaseReveal({ breach }: Props) {
  const [visibleCount, setVisibleCount] = useState(0)
  const [started, setStarted] = useState(false)
  const reduceMotion = useReducedMotion()

  const fields: Field[] = [
    {
      label: 'INCIDENT DATE',
      value: <span className="field-value">{formatFullDate(breach.BreachDate)}</span>,
    },
    {
      label: 'SURFACED',
      value: <span className="field-value">{formatFullDate(breach.AddedDate)}</span>,
    },
    {
      label: 'ACCOUNTS AFFECTED',
      value: (
        <span className="field-value field-count">
          {formatPwnCount(breach.PwnCount)}
          <span className="field-sublabel"> records compromised</span>
        </span>
      ),
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
    },
    {
      label: 'VERIFICATION',
      value: (
        <span className={`field-badge ${breach.IsVerified ? 'badge-verified' : 'badge-unverified'}`}>
          {breach.IsVerified ? '✓ VERIFIED' : '? UNVERIFIED'}
        </span>
      ),
    },
    {
      label: 'DOMAIN',
      value: breach.Domain ? (
        <span className="field-value">{breach.Domain}</span>
      ) : (
        <span className="field-value field-muted">UNKNOWN</span>
      ),
    },
    {
      label: 'INCIDENT REPORT',
      value: (
        <p className="field-description">
          {sanitizeDescription(breach.Description || 'No description available.')}
        </p>
      ),
    },
  ]

  useEffect(() => {
    if (reduceMotion) {
      setStarted(true)
      setVisibleCount(fields.length)
      return
    }
    const timer = setTimeout(() => setStarted(true), 300)
    return () => clearTimeout(timer)
  }, [reduceMotion, fields.length])

  useEffect(() => {
    if (reduceMotion || !started) return
    if (visibleCount >= fields.length) return
    const timer = setTimeout(() => {
      setVisibleCount((c) => c + 1)
    }, visibleCount === 0 ? 0 : 300)
    return () => clearTimeout(timer)
  }, [reduceMotion, started, visibleCount, fields.length])

  return (
    <div className="case-reveal scanlines">
      {fields.map((field, i) => (
        <AnimatePresence key={field.label}>
          {i < visibleCount && (
            <motion.div
              className="evidence-row"
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={reduceMotion ? { duration: 0 } : { duration: 0.3, ease: 'easeOut' }}
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
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={reduceMotion ? { duration: 0 } : { delay: 0.3 }}
        >
          <span>▸ END OF FILE — {getCaseNumber(breach)}</span>
        </motion.div>
      )}


    </div>
  )
}
