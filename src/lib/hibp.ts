import type { HibpBreach } from './types'

const HIBP_BASE = 'https://haveibeenpwned.com/api/v3'

export async function getAllBreaches(): Promise<HibpBreach[]> {
  const res = await fetch(`${HIBP_BASE}/breaches`, {
    headers: { 'User-Agent': 'Traced/1.0 (traced.jonathanrreed.com)' },
  })
  if (!res.ok) throw new Error(`HIBP API error: ${res.status}`)
  const data: HibpBreach[] = await res.json()
  return data.filter((b) => !b.IsFabricated && !b.IsSpamList)
}

