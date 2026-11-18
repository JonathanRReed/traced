import type { HibpBreach, DiscoveryGap, LeakFamily, YearStat } from './types'

// HIBP names 165 data types. These are the ones that change what a reader
// should do next, grouped so the list can be filtered by them.
const FAMILY_MEMBERS: Record<LeakFamily, string[]> = {
  passwords: [
    'Passwords',
    'Historical passwords',
    'Password hints',
    'Security questions and answers',
    'Auth tokens',
    'PINs',
    'Encrypted keys',
    'Mnemonic phrases',
  ],
  financial: [
    'Credit cards',
    'Partial credit card data',
    'Credit card CVV',
    'Bank account numbers',
    'Bank card numbers',
    'Payment histories',
    'Account balances',
    'Financial transactions',
    'Financial investments',
    'Credit status information',
    'Credit scores',
    'Loan information',
    'Taxation records',
  ],
  ids: [
    'Government issued IDs',
    'Partial government issued IDs',
    'Passport numbers',
    'Social security numbers',
    "Driver's licenses",
  ],
  health: [
    'Health records',
    'Personal health data',
    'Health insurance information',
    'HIV statuses',
    'Disabilities',
    'Biometric data',
  ],
  messages: ['Private messages', 'Email messages', 'SMS messages', 'Chat logs', 'AI prompts', 'Audio recordings'],
}

export const LEAK_FAMILIES: { id: LeakFamily; label: string }[] = [
  { id: 'passwords', label: 'Passwords' },
  { id: 'financial', label: 'Financial' },
  { id: 'ids', label: 'Government ID' },
  { id: 'health', label: 'Health' },
  { id: 'messages', label: 'Messages' },
]

const FAMILY_OF = new Map<string, LeakFamily>()
const FAMILY_RANK = new Map<LeakFamily, number>()
LEAK_FAMILIES.forEach(({ id }, rank) => {
  FAMILY_RANK.set(id, rank)
  FAMILY_MEMBERS[id].forEach((dataClass) => FAMILY_OF.set(dataClass, id))
})

export function isSensitiveDataClass(dataClass: string): boolean {
  return FAMILY_OF.has(dataClass)
}

/** The families a breach touches, most actionable first. */
export function leakFamilies(dataClasses: string[]): LeakFamily[] {
  const found = new Set<LeakFamily>()
  dataClasses.forEach((dataClass) => {
    const family = FAMILY_OF.get(dataClass)
    if (family) found.add(family)
  })
  return LEAK_FAMILIES.map((f) => f.id).filter((id) => found.has(id))
}

/** Sensitive types first, in family order. Everything else keeps HIBP's order. */
export function sortDataClasses(dataClasses: string[]): string[] {
  const rank = (dataClass: string) => {
    const family = FAMILY_OF.get(dataClass)
    return family ? FAMILY_RANK.get(family)! : LEAK_FAMILIES.length
  }
  return dataClasses
    .map((dataClass, index) => ({ dataClass, index }))
    .sort((a, b) => rank(a.dataClass) - rank(b.dataClass) || a.index - b.index)
    .map((entry) => entry.dataClass)
}

// HIBP dates are calendar dates. Formatting them in UTC keeps "1 Oct" from
// turning into "30 Sep" for readers west of Greenwich, and keeps the
// server-rendered list identical to what the browser renders.
function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null
  const date = new Date(dateStr)
  return Number.isNaN(date.getTime()) ? null : date
}

export function formatBreachDate(dateStr: string): string {
  const date = parseDate(dateStr)
  if (!date) return 'Unknown'
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })
}

export function formatFullDate(dateStr: string): string {
  const date = parseDate(dateStr)
  if (!date) return 'Unknown'
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
}

export function breachYear(dateStr: string): number | null {
  const date = parseDate(dateStr)
  return date ? date.getUTCFullYear() : null
}

export function formatPwnCount(n: number): string {
  return n.toLocaleString('en-US')
}

/** 1,957,476,021 -> "1.96B". For tight spots where the full figure won't fit. */
export function formatCompact(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(n >= 1e10 ? 1 : 2)}B`
  if (n >= 1e6) return `${(n / 1e6).toFixed(n >= 1e8 ? 0 : 1)}M`
  if (n >= 1e4) return `${Math.round(n / 1e3)}K`
  return n.toLocaleString('en-US')
}

/** Position of an account count on a log scale from 10,000 to 3 billion, 0 to 1. */
export function magnitude(n: number): number {
  const value = (Math.log10(Math.max(n, 1)) - 4) / 5.5
  return Math.min(1, Math.max(0.04, value))
}

// AddedDate is when HIBP added the record, not its discovery or disclosure date.
// Source: https://haveibeenpwned.com/api/v3#BreachModel
export function getDiscoveryGap(breach: Pick<HibpBreach, 'BreachDate' | 'AddedDate'>): DiscoveryGap | null {
  const breachDate = parseDate(breach.BreachDate)
  const addedDate = parseDate(breach.AddedDate)
  if (!breachDate || !addedDate) return null

  const diffMs = addedDate.getTime() - breachDate.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays < 30) return null

  const months = Math.floor(diffDays / 30)
  const years = Math.floor(months / 12)
  const remainingMonths = months % 12

  let label = ''
  if (years > 0 && remainingMonths > 0) {
    label = `${years} year${years > 1 ? 's' : ''}, ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}`
  } else if (years > 0) {
    label = `${years} year${years > 1 ? 's' : ''}`
  } else {
    label = `${months} month${months > 1 ? 's' : ''}`
  }

  return {
    label,
    months,
    breachFormatted: formatBreachDate(breach.BreachDate),
    discoveredFormatted: formatBreachDate(breach.AddedDate),
  }
}

export function getTotalPwnCount(breaches: Pick<HibpBreach, 'PwnCount'>[]): number {
  return breaches.reduce((sum, b) => sum + b.PwnCount, 0)
}

export function getAllDataClasses(breaches: Pick<HibpBreach, 'DataClasses'>[]): string[] {
  const set = new Set<string>()
  breaches.forEach((b) => b.DataClasses.forEach((dc) => set.add(dc)))
  return Array.from(set).sort()
}

/** Breaches and accounts per year, with empty years filled in so the chart has no holes. */
export function yearStats(breaches: Pick<HibpBreach, 'BreachDate' | 'PwnCount'>[]): YearStat[] {
  const byYear = new Map<number, YearStat>()
  breaches.forEach((b) => {
    const year = breachYear(b.BreachDate)
    if (year === null) return
    const stat = byYear.get(year) ?? { year, count: 0, accounts: 0 }
    stat.count += 1
    stat.accounts += b.PwnCount
    byYear.set(year, stat)
  })
  if (byYear.size === 0) return []
  const years = [...byYear.keys()]
  const stats: YearStat[] = []
  for (let year = Math.min(...years); year <= Math.max(...years); year++) {
    stats.push(byYear.get(year) ?? { year, count: 0, accounts: 0 })
  }
  return stats
}

/** Newest breach first, then name, so two breaches on one date never swap between builds. */
export function byNewest(a: Pick<HibpBreach, 'BreachDate' | 'Name'>, b: Pick<HibpBreach, 'BreachDate' | 'Name'>): number {
  return b.BreachDate.localeCompare(a.BreachDate) || a.Name.localeCompare(b.Name)
}

export function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')
}
