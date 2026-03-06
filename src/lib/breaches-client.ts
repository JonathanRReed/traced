import type { HibpBreach } from './types'

let breachesCache: HibpBreach[] | null = null
let breachesPromise: Promise<HibpBreach[]> | null = null

export async function fetchBreachesClient(force = false): Promise<HibpBreach[]> {
  if (breachesCache && !force) return breachesCache
  if (breachesPromise && !force) return breachesPromise

  breachesPromise = fetch('/breaches.json')
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`Could not load case files (${response.status}).`)
      }

      const data = (await response.json()) as HibpBreach[]
      breachesCache = data
      return data
    })
    .finally(() => {
      breachesPromise = null
    })

  return breachesPromise
}
