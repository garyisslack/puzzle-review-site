import type { APIRoute } from 'astro'
import { sitemapReviewsDocument } from '../lib/site.ts'

export const GET: APIRoute = () => new Response(sitemapReviewsDocument(), { headers: { 'Content-Type': 'application/xml' } })
