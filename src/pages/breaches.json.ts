import type { APIRoute } from 'astro'
import { getAllBreaches } from '../lib/hibp'
import type { BreachSummary } from '../lib/types'

export const GET: APIRoute = async () => {
  const breaches = await getAllBreaches()
  // Ship only the fields the client reads. Dropping Description (~487KB) and
  // the other build-only fields cuts the payload by ~70% raw / ~75% gzip.
  const summaries: BreachSummary[] = breaches.map((b) => ({
    Name: b.Name,
    Title: b.Title,
    Domain: b.Domain,
    BreachDate: b.BreachDate,
    AddedDate: b.AddedDate,
    PwnCount: b.PwnCount,
    DataClasses: b.DataClasses,
    IsSensitive: b.IsSensitive,
    LogoPath: b.LogoPath,
  }))
  return new Response(JSON.stringify(summaries), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600, must-revalidate',
    },
  })
}
