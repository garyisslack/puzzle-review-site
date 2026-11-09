import type { APIRoute } from 'astro'
import { sitemapDocument } from '../lib/site.ts'

export const GET: APIRoute = () => new Response(sitemapDocument(), { headers: { 'Content-Type': 'application/xml' } })
