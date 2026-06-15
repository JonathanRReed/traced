import type { APIRoute } from 'astro'
import { getAllBreaches } from '../lib/hibp'
import { slugify } from '../lib/utils'

const siteUrl = 'https://traced.jonathanrreed.com'

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

function toIsoDate(value: string | undefined): string | undefined {
  if (!value) return undefined
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return undefined
  return date.toISOString().slice(0, 10)
}

function urlEntry(path: string, lastmod?: string): string {
  const loc = `    <loc>${escapeXml(new URL(path, siteUrl).toString())}</loc>`
  const lm = lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''
  return `  <url>\n${loc}${lm}\n  </url>`
}

export const GET: APIRoute = async () => {
  const breaches = await getAllBreaches()
  const buildDate = new Date().toISOString().slice(0, 10)
  const staticPaths = ['/', '/check/', '/about/', '/contact/', '/privacy/']

  const entries = [
    ...staticPaths.map((path) => urlEntry(path, buildDate)),
    ...breaches.map((breach) =>
      urlEntry(
        `/case/${slugify(breach.Name)}/`,
        toIsoDate(breach.ModifiedDate) ?? toIsoDate(breach.AddedDate),
      ),
    ),
  ]

  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join(
    '\n',
  )}\n</urlset>\n`

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  })
}
