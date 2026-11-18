import type { BreachSummary } from '../lib/types'
import {
  formatBreachDate,
  formatPwnCount,
  isSensitiveDataClass,
  magnitude,
  slugify,
  sortDataClasses,
} from '../lib/utils'

const VISIBLE_CLASSES = 4

type RowBreach = Pick<BreachSummary, 'Name' | 'Title' | 'Domain' | 'BreachDate' | 'PwnCount' | 'DataClasses' | 'LogoPath'>

interface Props {
  breach: RowBreach
  /** Replaces the leaked-data column, e.g. "Shares 3 data types" on related lists. */
  note?: string
}

/** The data types on a breach, sensitive ones first and flagged with an asterisk. */
export function LeakList({ dataClasses, limit = VISIBLE_CLASSES }: { dataClasses: string[]; limit?: number }) {
  const sorted = sortDataClasses(dataClasses)
  const shown = sorted.slice(0, limit)
  const extra = sorted.length - shown.length

  return (
    <>
      {shown.map((dataClass) =>
        isSensitiveDataClass(dataClass) ? (
          <span key={dataClass} className="leak leak-hot">
            <span aria-hidden="true">*</span>
            {dataClass}
          </span>
        ) : (
          <span key={dataClass} className="leak">
            {dataClass}
          </span>
        ),
      )}
      {extra > 0 && <span className="leak leak-more">+{extra}</span>}
    </>
  )
}

/** One line of a breach list. Used by the homepage list and by the static pages. */
export function LedgerRow({ breach, note }: Props) {
  const slug = slugify(breach.Name)

  return (
    <li className="row">
      <a href={`/case/${slug}/`} className="row-link">
        <span className="row-date">{formatBreachDate(breach.BreachDate)}</span>
        <span className="row-name">
          {breach.LogoPath ? (
            <img src={breach.LogoPath} alt="" width={24} height={24} className="row-logo" loading="lazy" decoding="async" />
          ) : (
            <span className="row-logo" />
          )}
          <span className="row-title">{breach.Title}</span>
          {breach.Domain && <span className="row-domain">{breach.Domain}</span>}
        </span>
        <span className="row-count">
          <span className="row-num">{formatPwnCount(breach.PwnCount)}</span>
          <span className="sr-only"> accounts</span>
          <span className="row-mag" aria-hidden="true">
            <span style={{ width: `${Math.round(magnitude(breach.PwnCount) * 100)}%` }} />
          </span>
        </span>
        <span className="row-leaks">{note ?? <LeakList dataClasses={breach.DataClasses} />}</span>
      </a>
    </li>
  )
}

export function LedgerHead({ lastColumn = 'What leaked' }: { lastColumn?: string }) {
  return (
    <div className="rows-head" aria-hidden="true">
      <span>Date</span>
      <span>Service</span>
      <span className="rows-head-num">Accounts</span>
      <span>{lastColumn}</span>
    </div>
  )
}
