export interface HibpBreach {
  Name: string
  Title: string
  Domain: string
  BreachDate: string
  AddedDate: string
  ModifiedDate: string
  PwnCount: number
  Description: string
  LogoPath: string
  DataClasses: string[]
  IsVerified: boolean
  IsFabricated: boolean
  IsSensitive: boolean
  IsRetired: boolean
  IsSpamList: boolean
  IsMalware: boolean
  IsSubscriptionFree: boolean
}

/**
 * The subset of HibpBreach fields the client actually reads (the breach list
 * and the search palette). The /breaches.json endpoint ships only these to
 * keep the client payload small. Full records (Description, IsVerified and so
 * on) are only needed at build time for case pages.
 */
export type BreachSummary = Pick<
  HibpBreach,
  'Name' | 'Title' | 'Domain' | 'BreachDate' | 'AddedDate' | 'PwnCount' | 'DataClasses' | 'LogoPath'
>

/** The kinds of leaked data worth acting on first. */
export type LeakFamily = 'passwords' | 'financial' | 'ids' | 'health' | 'messages'

export interface YearStat {
  year: number
  count: number
  accounts: number
}

export interface DiscoveryGap {
  label: string
  months: number
  breachFormatted: string
  discoveredFormatted: string
}
