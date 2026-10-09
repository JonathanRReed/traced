import { describe, expect, test } from 'bun:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { readFileSync } from 'node:fs'
import { DiscoveryGap } from './DiscoveryGap'
import { getDiscoveryGap } from '../lib/utils'
import type { HibpBreach } from '../lib/types'

const record = (added: string): HibpBreach => ({
  Name: 'Example', Title: 'Example', Domain: 'example.com',
  BreachDate: '2020-01-01', AddedDate: added, ModifiedDate: added,
  PwnCount: 10, Description: 'Source description.', LogoPath: '',
  DataClasses: ['Emails'], IsVerified: true, IsFabricated: false,
  IsSensitive: false, IsRetired: false, IsSpamList: false,
  IsMalware: false, IsSubscriptionFree: true,
})

describe('HIBP listing interval', () => {
  for (const [added, months] of [
    ['2020-03-01', 2], ['2021-02-01', 13], ['2024-02-01', 49],
  ] as const) {
    test(`${months}-month interval describes listing, not detection or circulation`, () => {
      const gap = getDiscoveryGap(record(added))!
      expect(gap.months).toBe(months)
      expect(gap.label).not.toContain('dark')
      const html = renderToStaticMarkup(createElement(DiscoveryGap, { gap }))
      expect(html).toContain('HIBP LISTING INTERVAL')
      expect(html).toContain('ADDED TO HIBP')
      expect(html).toContain('does not establish when the breach was discovered or publicly disclosed')
      expect(html).not.toMatch(/went undetected|actively in circulation|surfaced publicly|passed before this incident was disclosed|DATA SURFACED|DISCOVERY GAP/)
    })
  }
  test('retains short, invalid, and reversed date exclusions', () => {
    expect(getDiscoveryGap(record('2020-01-15'))).toBeNull()
    expect(getDiscoveryGap(record('2019-12-01'))).toBeNull()
    expect(getDiscoveryGap(record('invalid'))).toBeNull()
  })
  test('case and overview labels attribute AddedDate to HIBP', () => {
    const evidence = readFileSync(new URL('./CaseReveal.astro', import.meta.url), 'utf8')
    const page = readFileSync(new URL('../pages/case/[name].astro', import.meta.url), 'utf8')
    const overview = readFileSync(new URL('./FieldBriefing.astro', import.meta.url), 'utf8')
    expect(evidence).toContain('ADDED TO HIBP')
    expect(evidence).not.toContain('>SURFACED<')
    expect(page).toContain('HIBP LISTING INTERVAL')
    expect(page).not.toMatch(/DARK PERIOD|DISCOVERY GAP/)
    expect(overview).toContain('added it to the database')
    expect(overview).not.toMatch(/took to become public|when it became\s+public/)
  })
})
