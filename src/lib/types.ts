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
 * The subset of HibpBreach fields the client actually reads (archive grid,
 * timeline, command palette). The /breaches.json endpoint ships only these to
 * keep the client payload small — full records (incl. Description, IsVerified)
 * are only needed at build time for case pages.
 */
export type BreachSummary = Pick<
  HibpBreach,
  | 'Name'
  | 'Title'
  | 'Domain'
  | 'BreachDate'
  | 'AddedDate'
  | 'PwnCount'
  | 'DataClasses'
  | 'IsSensitive'
  | 'LogoPath'
>

export type BreachStatus = 'CRITICAL' | 'UNSOLVED' | 'COLD CASE'

export interface DiscoveryGap {
  label: string
  months: number
  breachFormatted: string
  discoveredFormatted: string
}
