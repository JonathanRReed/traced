import type { BreachStatus } from '../lib/types'
import { STATUS_LABELS } from '../lib/utils'

export function StatusBadge({ status }: { status: BreachStatus }) {
  return (
    <span className="badge-status" data-status={status}>
      {STATUS_LABELS[status]}
    </span>
  )
}
