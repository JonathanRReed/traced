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

export type BreachStatus = 'CRITICAL' | 'UNSOLVED' | 'COLD CASE'

export interface DiscoveryGap {
  label: string
  months: number
  breachFormatted: string
  discoveredFormatted: string
}
