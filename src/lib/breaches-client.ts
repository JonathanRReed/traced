import type { BreachSummary } from './types'

let breachesCache: BreachSummary[] | null = null
let breachesPromise: Promise<BreachSummary[]> | null = null

export async function fetchBreachesClient(force = false): Promise<BreachSummary[]> {
  if (breachesCache && !force) return breachesCache
  if (breachesPromise && !force) return breachesPromise

  breachesPromise = fetch('/breaches.json')
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`Could not load case files (${response.status}).`)
      }

      const data = (await response.json()) as BreachSummary[]
      breachesCache = data
      return data
    })
    .finally(() => {
      breachesPromise = null
    })

  return breachesPromise
}
