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
 *
 * REVISION (2026-08-04): `IsVerified` / `IsRetired` are no longer index gates.
 * The first cut used them as a provenance floor, which dropped ~38 of the
 * highest-demand records in the archive — Collection #1 (772.9M), Exploit.In,
 * Anti Public, NetEase, Cit0day, National Public Data, Badoo, Taobao, mail.ru,
 * Ticketek (retired) — even though every one of them has a full sourced
 * description, real dates and real data classes. HIBP's "unverified" flag means
 * the dump could not be attributed to the named service, not that the record is
 * empty; "retired" means HIBP withdrew the record, not that the incident is
 * fictional. Both are facts *about* the incident, so they are surfaced to the
 * reader as a visible caveat on the page (see `caseCaveat`) instead of being
 * used to suppress the page from search. Genuinely thin records — no dates, no
 * exposure figure, boilerplate description, no data-class detail — stay out.
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
  // Record completeness. IsVerified / IsRetired are deliberately NOT checked
  // here — they are disclosed on the page instead (see caseCaveat).
  if (!isValidDate(breach.BreachDate) || !isValidDate(breach.AddedDate)) return false
  if (breach.PwnCount <= 0) return false

  const words = descriptionWordCount(breach.Description || '')
  if (words < MIN_DESCRIPTION_WORDS) return false

  if (breach.DataClasses.length < MIN_DATA_CLASSES) {
    // A single-data-class record is normally a list dump. It still counts as a
    // documented incident when it is both material in scale and carries a full
    // narrative (e.g. NotSOCRadar, 282M accounts, email addresses only).
    if (
      breach.PwnCount < MIN_PWN_COUNT_FOR_SCALE ||
      words < MIN_DESCRIPTION_WORDS_FOR_DEPTH
    ) {
      return false
    }
    return true
  }

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

export interface CaseCaveat {
  label: string
  detail: string
}

/**
 * Visible provenance caveat for a case page. Returned whenever HIBP marks the
 * record unverified or retired, so an indexed page always states the limits of
 * its own source rather than presenting an unattributed dump as a confirmed
 * incident.
 */
export function caseCaveat(breach: HibpBreach): CaseCaveat | null {
  if (breach.IsRetired) {
    return {
      label: 'Retired breach',
      detail:
        'Have I Been Pwned has retired this record and no longer returns it in breach searches. It is kept here as a historical archive entry; treat the details below as a past public claim, not a current confirmation.',
    }
  }
  if (!breach.IsVerified) {
    return {
      label: 'Unverified breach: reported but not confirmed',
      detail:
        'Have I Been Pwned has not been able to confirm this data against the named service. The incident is reported and the data exists, but the source attribution is unproven. Treat everything below as a public claim rather than a confirmed breach of this company.',
    }
  }
  return null
}
