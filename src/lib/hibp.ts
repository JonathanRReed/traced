import type { HibpBreach } from './types'

const HIBP_BASE = 'https://haveibeenpwned.com/api/v3'

let request: Promise<HibpBreach[]> | null = null

// Every page and endpoint asks for the same list, so one build (or one dev
// session) makes a single request to HIBP instead of one per route.
export function getAllBreaches(): Promise<HibpBreach[]> {
  request ??= fetchBreaches().catch((error) => {
    request = null
    throw error
  })
  return request
}

async function fetchBreaches(): Promise<HibpBreach[]> {
  const res = await fetch(`${HIBP_BASE}/breaches`, {
    headers: { 'User-Agent': 'Traced/1.0 (traced.jonathanrreed.com)' },
  })
  if (!res.ok) throw new Error(`HIBP API error: ${res.status}`)
  const data: HibpBreach[] = await res.json()
  return data.filter((b) => !b.IsFabricated && !b.IsSpamList)
}
