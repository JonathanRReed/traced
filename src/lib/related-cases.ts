import type { HibpBreach } from './types'
import { isIndexableCase } from './index-policy'

const DAY_MS = 86_400_000

function jaccard(a: string[], b: string[]): number {
  if (a.length === 0 && b.length === 0) return 0
  const setA = new Set(a)
  let shared = 0
  for (const item of new Set(b)) if (setA.has(item)) shared++
  return shared / (setA.size + new Set(b).size - shared)
}

function dateCloseness(a: string, b: string): number {
  const days = Math.abs(new Date(a).getTime() - new Date(b).getTime()) / DAY_MS
  return Math.max(0, 1 - days / 730)
}

function sizeProximity(a: number, b: number): number {
  const la = Math.log10(Math.max(a, 1))
  const lb = Math.log10(Math.max(b, 1))
  return 1 / (1 + Math.abs(la - lb))
}

function relevance(breach: HibpBreach, candidate: HibpBreach): number {
  return (
    3 * jaccard(breach.DataClasses, candidate.DataClasses) +
    2 * dateCloseness(breach.BreachDate, candidate.BreachDate) +
    1 * sizeProximity(breach.PwnCount, candidate.PwnCount)
  )
}

/**
 * Relevance-ranked related cases. Replaces the old alphabetical-order
 * `.slice(0, 4)`, which pointed every page at the alphabetically earliest
 * breaches of its year window and funneled internal links into noindex
 * records. Indexable cases fill the slots first (widening from a one-year
 * to a two-year window before falling back to noindex records at all), so
 * link equity lands on pages that can rank. Deterministic on purpose:
 * score, then newest breach date, then name.
 */
export function relatedCases(
  breach: HibpBreach,
  allBreaches: HibpBreach[],
  count = 4,
): HibpBreach[] {
  const breachYear = new Date(breach.BreachDate).getFullYear()
  const withinYears = (candidate: HibpBreach, years: number) =>
    Math.abs(new Date(candidate.BreachDate).getFullYear() - breachYear) <= years

  const rank = (pool: HibpBreach[]) =>
    pool
      .map((candidate) => ({ candidate, score: relevance(breach, candidate) }))
      .sort(
        (a, b) =>
          b.score - a.score ||
          b.candidate.BreachDate.localeCompare(a.candidate.BreachDate) ||
          a.candidate.Name.localeCompare(b.candidate.Name),
      )
      .map((entry) => entry.candidate)

  const others = allBreaches.filter((candidate) => candidate.Name !== breach.Name)
  const pools = [
    others.filter((c) => isIndexableCase(c) && withinYears(c, 1)),
    others.filter((c) => isIndexableCase(c) && withinYears(c, 2)),
    others.filter((c) => withinYears(c, 1)),
  ]

  const picks: HibpBreach[] = []
  for (const pool of pools) {
    for (const candidate of rank(pool)) {
      if (picks.length >= count) return picks
      if (!picks.includes(candidate)) picks.push(candidate)
    }
  }
  return picks
}
