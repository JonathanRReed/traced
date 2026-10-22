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

  const severityColor =
    gap.months < 12 ? 'var(--signal)' : gap.months < 36 ? 'var(--sev-recent)' : 'var(--sev-critical)'

  return (
    <div className="gap-wrap" ref={ref}>
      <p className="muted">Time between the recorded breach date and HIBP listing</p>

      <div className="gap-timeline">
        <div className="gap-endpoint">
          <span className="gap-dot" />
          <span className="gap-endpoint-label">Breach occurred</span>
          <span className="gap-endpoint-date data">{gap.breachFormatted}</span>
        </div>

        <div className="gap-bar-wrap">
          <div className="gap-bar-track">
            <motion.div
              className="gap-bar-fill"
              initial={reduceMotion ? false : { width: '0%' }}
              animate={isInView ? { width: '100%' } : { width: '0%' }}
              transition={reduceMotion ? { duration: 0 } : { duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
              style={{ background: severityColor }}
            />
          </div>
          <span className="gap-duration-label" style={{ color: severityColor }}>{gap.label}</span>
        </div>

        <div className="gap-endpoint">
          <span className="gap-dot" style={{ background: severityColor, borderColor: severityColor }} />
          <span className="gap-endpoint-label">Added to HIBP</span>
          <span className="gap-endpoint-date data">{gap.discoveredFormatted}</span>
        </div>
      </div>

      <p className="gap-note">
        About {gap.label} elapsed between the recorded breach date and its addition to Have I Been Pwned.
        This interval does not establish when the breach was discovered or publicly disclosed, or whether data circulated during that time.
      </p>
    </div>
  )
}
