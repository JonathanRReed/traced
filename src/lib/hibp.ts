import type { HibpBreach } from './types'

const HIBP_BASE = 'https://haveibeenpwned.com/api/v3'
const PWNED_PASSWORDS_BASE = 'https://api.pwnedpasswords.com'

export async function getAllBreaches(): Promise<HibpBreach[]> {
  const res = await fetch(`${HIBP_BASE}/breaches`, {
    headers: { 'User-Agent': 'Traced/1.0 (traced.jonathanrreed.com)' },
  })
  if (!res.ok) throw new Error(`HIBP API error: ${res.status}`)
  const data: HibpBreach[] = await res.json()
  return data.filter((b) => !b.IsFabricated && !b.IsSpamList)
}

export async function getBreach(name: string): Promise<HibpBreach | null> {
  const res = await fetch(`${HIBP_BASE}/breach/${encodeURIComponent(name)}`, {
    headers: { 'User-Agent': 'Traced/1.0 (traced.jonathanrreed.com)' },
  })
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`HIBP API error: ${res.status}`)
  return res.json()
}

export async function checkPasswordRange(prefix: string): Promise<Map<string, number>> {
  const res = await fetch(`${PWNED_PASSWORDS_BASE}/range/${prefix}`, {
    headers: { 'Add-Padding': 'true' },
  })
  if (!res.ok) throw new Error(`Pwned Passwords API error: ${res.status}`)
  const text = await res.text()
  const map = new Map<string, number>()
  for (const line of text.split('\n')) {
    const [suffix, count] = line.trim().split(':')
    if (suffix && count) {
      map.set(suffix.toUpperCase(), parseInt(count, 10))
    }
  }
  return map
}
