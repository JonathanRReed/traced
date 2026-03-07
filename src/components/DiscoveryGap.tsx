import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import type { DiscoveryGap as DiscoveryGapType } from '../lib/types'

interface Props {
  gap: DiscoveryGapType
}

export function DiscoveryGap({ gap }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })

  const severity = gap.months < 12 ? 'low' : gap.months < 36 ? 'medium' : 'high'
  const severityColor = severity === 'high' ? '#ef4444' : severity === 'medium' ? '#f59e0b' : '#3b82f6' // danger / amber / accent

  return (
    <div className="gap-wrap" ref={ref}>
      <div className="gap-header">
        <span className="gap-label">DISCOVERY GAP</span>
        <span className="gap-sublabel">Time between breach occurrence and public disclosure</span>
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
              initial={{ width: '0%' }}
              animate={isInView ? { width: '100%' } : { width: '0%' }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
              style={{ background: `linear-gradient(90deg, ${severityColor}40, ${severityColor})` }}
            />
          </div>
          <motion.div
            className="gap-duration-label"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ delay: 0.8 }}
            style={{ color: severityColor }}
          >
            ← {gap.label} →
          </motion.div>
        </div>

        <div className="gap-endpoint gap-endpoint-right">
          <div className="gap-dot dot-discovered" style={{ background: severityColor }} />
          <span className="gap-endpoint-label">DATA SURFACED</span>
          <span className="gap-endpoint-date">{gap.discoveredFormatted}</span>
        </div>
      </div>

      <div className="gap-callout" style={{ borderColor: `${severityColor}40`, background: `${severityColor}08` }}>
        <span className="gap-callout-icon" style={{ color: severityColor }}>◈</span>
        <p className="gap-callout-text">
          {gap.months >= 36
            ? `This breach went undetected for over ${Math.floor(gap.months / 12)} years. Data was actively in circulation during this window.`
            : gap.months >= 12
            ? `Nearly ${Math.floor(gap.months / 12)} year${Math.floor(gap.months / 12) > 1 ? 's' : ''} elapsed before this breach surfaced publicly.`
            : `${gap.label.replace(' dark', '')} passed before this incident was disclosed.`}
        </p>
      </div>


    </div>
  )
}
