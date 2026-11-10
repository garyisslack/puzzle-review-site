import type { APIRoute } from 'astro'
import { sitemapRankingsDocument } from '../lib/site.ts'

export const GET: APIRoute = () => new Response(sitemapRankingsDocument(), { headers: { 'Content-Type': 'application/xml' } })
