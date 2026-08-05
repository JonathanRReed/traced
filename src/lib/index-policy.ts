import type { HibpBreach } from './types'

/**
 * Search-index policy for /case/ pages.
 *
 * HIBP returns ~1000 usable records, but most of them render the same template
 * around a two-line incident report, so Google crawls them and drops them
 * ("crawled, currently not indexed"). A case file is only submitted and
 * indexable when its underlying record carries enough unique, sourced detail to
 * stand on its own. Excluded cases stay fully readable — they are dropped from
 * sitemap.xml and rendered noindex,follow, never removed.
 *
 * Thresholds are derived from the live HIBP corpus (1003 records after the
 * fabricated/spam-list filter): description length p10 = 35 words, median = 51;
 * DataClasses p25 = 4, median = 5.
 */

/** Below this the incident report is a single sentence of boilerplate. */
const MIN_DESCRIPTION_WORDS = 30
/** A record naming only one field is a list dump, not an incident. */
const MIN_DATA_CLASSES = 2
/** Scale path: an incident large enough to carry its own public record. */
const MIN_PWN_COUNT_FOR_SCALE = 2_000_000
/** Depth path: smaller incidents qualify only on unusually rich records. */
const MIN_DATA_CLASSES_FOR_DEPTH = 5
const MIN_DESCRIPTION_WORDS_FOR_DEPTH = 60

function descriptionWordCount(description: string): number {
  return description
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean).length
}

function isValidDate(value: string): boolean {
  return !!value && !Number.isNaN(new Date(value).getTime())
}

export function isIndexableCase(breach: HibpBreach): boolean {
  // Provenance and record completeness.
  if (!breach.IsVerified || breach.IsRetired) return false
  if (!isValidDate(breach.BreachDate) || !isValidDate(breach.AddedDate)) return false
  if (breach.PwnCount <= 0) return false
  if (breach.DataClasses.length < MIN_DATA_CLASSES) return false

  const words = descriptionWordCount(breach.Description || '')
  if (words < MIN_DESCRIPTION_WORDS) return false

  // Substance: material scale, or a small incident with an unusually rich record.
  if (breach.PwnCount >= MIN_PWN_COUNT_FOR_SCALE) return true
  return (
    !!breach.Domain?.trim() &&
    breach.DataClasses.length >= MIN_DATA_CLASSES_FOR_DEPTH &&
    words >= MIN_DESCRIPTION_WORDS_FOR_DEPTH
  )
}

export function caseRobots(breach: HibpBreach): string {
  return isIndexableCase(breach) ? 'index,follow' : 'noindex,follow'
}
