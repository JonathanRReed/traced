import { describe, expect, test } from 'bun:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { readFileSync } from 'node:fs'
import { DiscoveryGap } from './DiscoveryGap'
import { getDiscoveryGap } from '../lib/utils'

const record = (added) => ({
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
  ]) {
    test(`${months}-month interval describes listing, not detection or circulation`, () => {
      const gap = getDiscoveryGap(record(added))
      expect(gap.months).toBe(months)
      expect(gap.label).not.toContain('dark')
      const html = renderToStaticMarkup(createElement(DiscoveryGap, { gap }))
      expect(html).toContain('Time between the recorded breach date and HIBP listing')
      expect(html).toContain('Added to HIBP')
      expect(html).toContain('does not establish when the breach was discovered or publicly disclosed')
      expect(html).not.toMatch(/went undetected|actively in circulation|surfaced publicly|passed before this incident was disclosed|data surfaced|discovery gap/i)
    })
  }
  test('retains short, invalid, and reversed date exclusions', () => {
    expect(getDiscoveryGap(record('2020-01-15'))).toBeNull()
    expect(getDiscoveryGap(record('2019-12-01'))).toBeNull()
    expect(getDiscoveryGap(record('invalid'))).toBeNull()
  })
  test('case and overview labels attribute AddedDate to HIBP', () => {
    const evidence = readFileSync(new URL('./CaseRecord.astro', import.meta.url), 'utf8')
    const page = readFileSync(new URL('../pages/case/[name].astro', import.meta.url), 'utf8')
    const overview = readFileSync(new URL('./FieldBriefing.astro', import.meta.url), 'utf8')
    expect(evidence).toContain('Added to HIBP')
    expect(evidence).not.toMatch(/>\s*Surfaced\s*</i)
    expect(page).toContain('HIBP listing interval')
    expect(page).not.toMatch(/dark period|discovery gap/i)
    expect(overview).toContain('added it to the database')
    expect(overview).not.toMatch(/took to become public|when it became\s+public/)
  })
})
