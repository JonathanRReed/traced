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
  const severityColor = severity === 'high' ? '#ef4444' : severity === 'medium' ? '#f59e0b' : '#3b82f6'

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

      <style>{`
        .gap-wrap {
          border: 1px solid var(--color-border);
          background: var(--color-surface);
          padding: 1.5rem 2rem;
        }
        .gap-header {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-bottom: 1.5rem;
        }
        .gap-label {
          font-family: var(--font-mono);
          font-size: 0.6rem;
          letter-spacing: 0.2em;
          color: var(--color-muted);
        }
        .gap-sublabel {
          font-family: var(--font-mono);
          font-size: 0.6rem;
          color: var(--color-muted);
          opacity: 0.6;
        }
        .gap-timeline {
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 1rem;
          align-items: center;
          margin-bottom: 1.25rem;
        }
        .gap-endpoint {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          min-width: 80px;
        }
        .gap-endpoint-right { align-items: center; }
        .gap-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          border: 2px solid var(--color-border);
          background: var(--color-surface);
        }
        .dot-breach { border-color: var(--color-muted); }
        .gap-endpoint-label {
          font-family: var(--font-mono);
          font-size: 0.5rem;
          letter-spacing: 0.12em;
          color: var(--color-muted);
          text-align: center;
          white-space: nowrap;
        }
        .gap-endpoint-date {
          font-family: var(--font-mono);
          font-size: 0.62rem;
          letter-spacing: 0.08em;
          color: var(--color-text);
          text-align: center;
        }
        .gap-bar-wrap {
          display: flex;
          flex-direction: column;
          gap: 6px;
          align-items: center;
        }
        .gap-bar-track {
          width: 100%;
          height: 4px;
          background: var(--color-border);
          border-radius: 2px;
          overflow: hidden;
          position: relative;
        }
        .gap-bar-fill {
          height: 100%;
          border-radius: 2px;
        }
        .gap-duration-label {
          font-family: var(--font-mono);
          font-size: 0.62rem;
          letter-spacing: 0.08em;
          text-align: center;
          font-weight: 500;
        }
        .gap-callout {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          border: 1px solid;
          border-radius: 2px;
        }
        .gap-callout-icon {
          font-size: 0.9rem;
          flex-shrink: 0;
          margin-top: 1px;
        }
        .gap-callout-text {
          font-family: var(--font-mono);
          font-size: 0.68rem;
          line-height: 1.6;
          color: var(--color-text);
          opacity: 0.85;
          margin: 0;
        }
        @media (max-width: 500px) {
          .gap-wrap { padding: 1rem; }
          .gap-timeline { grid-template-columns: auto 1fr auto; gap: 0.5rem; }
          .gap-endpoint { min-width: 60px; }
        }
      `}</style>
    </div>
  )
}
