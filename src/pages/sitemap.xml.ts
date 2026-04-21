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

function urlEntry(path: string): string {
  return `  <url>\n    <loc>${escapeXml(new URL(path, siteUrl).toString())}</loc>\n  </url>`
}

export const GET: APIRoute = async () => {
  const breaches = await getAllBreaches()
  const paths = [
    '/',
    '/check/',
    '/about/',
    '/contact/',
    '/privacy/',
    ...breaches.map((breach) => `/case/${slugify(breach.Name)}/`),
  ]

  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${paths
    .map(urlEntry)
    .join('\n')}\n</urlset>\n`

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  })
}
