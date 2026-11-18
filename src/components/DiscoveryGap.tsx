import type { DiscoveryGap as DiscoveryGapType } from '../lib/types'

interface Props {
  gap: DiscoveryGapType
}

/** The stretch between a breach and HIBP listing it. Rendered once at build time; no script. */
export function DiscoveryGap({ gap }: Props) {
  return (
    <div className="gap-wrap">
      <div className="gap-timeline" role="group" aria-label="Time between the recorded breach date and HIBP listing">
        <div className="gap-endpoint">
          <span className="gap-endpoint-label">Breach occurred</span>
          <span className="gap-endpoint-date">{gap.breachFormatted}</span>
        </div>

        <div className="gap-bar-wrap">
          <div className="gap-bar-track" />
          <span className="gap-duration-label">{gap.label}</span>
        </div>

        <div className="gap-endpoint">
          <span className="gap-endpoint-label">Added to HIBP</span>
          <span className="gap-endpoint-date">{gap.discoveredFormatted}</span>
        </div>
      </div>

      <p className="gap-note">
        This interval does not establish when the breach was discovered or publicly disclosed, or whether data circulated during that time.
      </p>
    </div>
  )
}
