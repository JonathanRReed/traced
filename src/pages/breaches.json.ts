import type { APIRoute } from 'astro'
import { getAllBreaches } from '../lib/hibp'

export const GET: APIRoute = async () => {
  const breaches = await getAllBreaches()
  return new Response(JSON.stringify(breaches), {
    headers: { 'Content-Type': 'application/json' },
  })
}
