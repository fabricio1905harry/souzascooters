import type { MotoStatus } from '../../types'
import { STATUS_BADGE_CLASSES, STATUS_LABELS } from '../../lib/helpers'

export default function StatusBadge({ status }: { status: MotoStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_BADGE_CLASSES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  )
}
