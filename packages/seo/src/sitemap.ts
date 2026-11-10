export type SitemapEntry = {
  loc: string
  lastmod: string
}

const DATE = /^\d{4}-\d{2}-\d{2}$/

export function sitemapIndexXml(entries: readonly SitemapEntry[]): string {
  const body = entries
    .map((entry) => {
      if (!DATE.test(entry.lastmod)) throw new Error(`lastmod must be YYYY-MM-DD from content, got ${entry.lastmod}`)
      return `  <sitemap><loc>${entry.loc}</loc><lastmod>${entry.lastmod}</lastmod></sitemap>`
    })
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</sitemapindex>\n`
}

export function sitemapXml(entries: readonly SitemapEntry[]): string {
  const body = entries
    .map((entry) => {
      if (!DATE.test(entry.lastmod)) throw new Error(`lastmod must be YYYY-MM-DD from content, got ${entry.lastmod}`)
      return `  <url><loc>${entry.loc}</loc><lastmod>${entry.lastmod}</lastmod></url>`
    })
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`
}

export function robotsTxt(input: { siteUrl: string; allowAiTraining: boolean }): string {
  const lines = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /guides/submit/',
    '',
    'User-agent: Googlebot',
    'Allow: /',
    '',
    'User-agent: Bingbot',
    'Allow: /',
    '',
    'User-agent: OAI-SearchBot',
    'Allow: /',
    '',
    'User-agent: GPTBot',
    input.allowAiTraining ? 'Allow: /' : 'Disallow: /',
    '',
    'User-agent: Google-Extended',
    input.allowAiTraining ? 'Allow: /' : 'Disallow: /',
    '',
    `Sitemap: ${input.siteUrl}/sitemap.xml`,
    '',
  ]
  return lines.join('\n')
}
