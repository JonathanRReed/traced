import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { HibpBreach, BreachStatus, DiscoveryGap } from './types'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

const SENSITIVE_DATA_CLASSES = [
  'Passwords',
  'Credit cards',
  'Social security numbers',
  'Bank account numbers',
  'Payment histories',
  'Health records',
  'Physical addresses',
  'Passport numbers',
  'Private messages',
]

export function getBreachStatus(breach: HibpBreach): BreachStatus {
  if (breach.IsSensitive) return 'CRITICAL'

  const hasSensitiveData = breach.DataClasses.some((dc) =>
    SENSITIVE_DATA_CLASSES.includes(dc)
  )
  if (hasSensitiveData) return 'CRITICAL'

  const breachYear = new Date(breach.BreachDate).getFullYear()
  const fiveYearsAgo = new Date().getFullYear() - 5

  if (breachYear >= fiveYearsAgo) return 'UNSOLVED'
  return 'COLD CASE'
}

export function formatBreachDate(dateStr: string): string {
  if (!dateStr) return 'UNKNOWN'
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return 'UNKNOWN'
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase()
}

export function formatFullDate(dateStr: string): string {
  if (!dateStr) return 'UNKNOWN'
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return 'UNKNOWN'
  return date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function formatPwnCount(n: number): string {
  return n.toLocaleString('en-US')
}

export function getCaseNumber(breach: HibpBreach): string {
  const date = new Date(breach.BreachDate)
  const year = isNaN(date.getTime()) ? '0000' : String(date.getFullYear())
  const month = isNaN(date.getTime())
    ? '00'
    : String(date.getMonth() + 1).padStart(2, '0')
  const day = isNaN(date.getTime())
    ? '00'
    : String(date.getDate()).padStart(2, '0')
  return `CASE-${year}${month}${day}-${breach.Name.toUpperCase().slice(0, 8)}`
}

export function getDiscoveryGap(breach: HibpBreach): DiscoveryGap | null {
  if (!breach.BreachDate || !breach.AddedDate) return null

  const breachDate = new Date(breach.BreachDate)
  const addedDate = new Date(breach.AddedDate)

  if (isNaN(breachDate.getTime()) || isNaN(addedDate.getTime())) return null

  const diffMs = addedDate.getTime() - breachDate.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays < 30) return null

  const months = Math.floor(diffDays / 30)
  const years = Math.floor(months / 12)
  const remainingMonths = months % 12

  let label = ''
  if (years > 0 && remainingMonths > 0) {
    label = `${years} year${years > 1 ? 's' : ''}, ${remainingMonths} month${remainingMonths > 1 ? 's' : ''} dark`
  } else if (years > 0) {
    label = `${years} year${years > 1 ? 's' : ''} dark`
  } else {
    label = `${months} month${months > 1 ? 's' : ''} dark`
  }

  return {
    label,
    months,
    breachFormatted: formatBreachDate(breach.BreachDate),
    discoveredFormatted: formatBreachDate(breach.AddedDate),
  }
}

export function getTotalPwnCount(breaches: HibpBreach[]): number {
  return breaches.reduce((sum, b) => sum + b.PwnCount, 0)
}

export function getAllDataClasses(breaches: HibpBreach[]): string[] {
  const set = new Set<string>()
  breaches.forEach((b) => b.DataClasses.forEach((dc) => set.add(dc)))
  return Array.from(set).sort()
}

export function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')
}
