import type { APIRoute } from 'astro'
import { sitemapPagesDocument } from '../lib/site.ts'

export const GET: APIRoute = () => new Response(sitemapPagesDocument(), { headers: { 'Content-Type': 'application/xml' } })
