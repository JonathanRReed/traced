import type { HibpBreach } from './types'
import { isIndexableCase } from './index-policy'

/**
 * Shared definition of the server-rendered case index at /archive/.
 *
 * The homepage archive is a client-side React island, so a crawler that does
 * not execute JavaScript sees no links to any case page. Before this hub the
 * only inbound path to most case files was sitemap.xml plus the four related
 * cases on each page, which left the corpus effectively flat and pushed a large
 * share of it past three clicks from the homepage. /archive/ is the static,
 * paginated counterpart: plain <a> links, deterministic order, every indexable
 * case reachable in three clicks.
 *
 * Only indexable cases are listed. Records that fail `isIndexableCase` render
 * noindex,follow and stay out of sitemap.xml, so spending hub link slots and
 * crawl budget on them would dilute the pages that can actually rank. They
 * remain reachable through the client archive, the command palette, and the
 * related-cases module.
 *
 * `sitemap.xml.ts` and `pages/archive/[...page].astro` both import from here so
 * the submitted URL set and the generated route set can never drift apart.
 */

export const ARCHIVE_PAGE_SIZE = 50

/**
 * Deterministic listing order: newest breach date first, then name as a
 * tiebreak so two incidents sharing a date never swap places between builds
 * (a shuffled page would churn canonicals and lastmod for no reason).
 */
export function archiveCases(breaches: HibpBreach[]): HibpBreach[] {
  return breaches
    .filter(isIndexableCase)
    .sort(
      (a, b) =>
        b.BreachDate.localeCompare(a.BreachDate) || a.Name.localeCompare(b.Name),
    )
}

export function archivePageCount(total: number): number {
  return Math.max(1, Math.ceil(total / ARCHIVE_PAGE_SIZE))
}

/**
 * Page 1 lives at the bare /archive/ so the hub has a single canonical entry
 * point; there is deliberately no /archive/1/.
 */
export function archivePagePath(page: number): string {
  return page <= 1 ? '/archive/' : `/archive/${page}/`
}
