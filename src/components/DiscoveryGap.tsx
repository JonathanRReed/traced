import { useRef } from 'react'
import { motion, useInView, useReducedMotion } from 'framer-motion'
import type { DiscoveryGap as DiscoveryGapType } from '../lib/types'

interface Props {
  gap: DiscoveryGapType
}

export function DiscoveryGap({ gap }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })
  const reduceMotion = useReducedMotion()

  const severity = gap.months < 12 ? 'low' : gap.months < 36 ? 'medium' : 'high'
  const severityColor =
    severity === 'high'
      ? 'var(--color-danger)'
      : severity === 'medium'
        ? 'var(--color-amber)'
        : 'var(--color-accent)'

  return (
    <div className="gap-wrap" ref={ref}>
      <div className="gap-header">
        <span className="gap-label">HIBP LISTING INTERVAL</span>
        <span className="gap-sublabel">Time between the recorded breach date and HIBP listing</span>
      </div>

      <div className="gap-timeline">
        <div className="gap-endpoint">
          <div className="gap-dot dot-breach" />
          <span className="gap-endpoint-label">BREACH OCCURRED</span>
          <span className="gap-endpoint-date">{gap.breachFormatted}</span>
        </div>

        <div className="gap-bar-wrap">
          <div className="gap-bar-track">
            <motion.div
              className="gap-bar-fill"
              initial={reduceMotion ? false : { width: '0%' }}
              animate={isInView ? { width: '100%' } : { width: '0%' }}
              transition={reduceMotion ? { duration: 0 } : { duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
              style={{ background: `linear-gradient(90deg, color-mix(in srgb, ${severityColor} 25%, transparent), ${severityColor})` }}
            />
          </div>
          <motion.div
            className="gap-duration-label"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={reduceMotion ? { duration: 0 } : { delay: 0.8 }}
            style={{ color: severityColor }}
          >
            ← {gap.label} →
          </motion.div>
        </div>

        <div className="gap-endpoint gap-endpoint-right">
          <div className="gap-dot dot-discovered" style={{ background: severityColor }} />
          <span className="gap-endpoint-label">ADDED TO HIBP</span>
          <span className="gap-endpoint-date">{gap.discoveredFormatted}</span>
        </div>
      </div>

      <div className="gap-callout" style={{ borderColor: `color-mix(in srgb, ${severityColor} 25%, transparent)`, background: `color-mix(in srgb, ${severityColor} 3%, transparent)` }}>
        <span className="gap-callout-icon" style={{ color: severityColor }}>◈</span>
        <p className="gap-callout-text">
          About {gap.label} elapsed between the recorded breach date and its addition to Have I Been Pwned.
          This interval does not establish when the breach was discovered or publicly disclosed, or whether data circulated during that time.
        </p>
      </div>


    </div>
  )
}
