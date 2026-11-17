import { writeFileSync } from 'node:fs'
import { compareRedirects } from '../src/lib/site.ts'
import { reviews } from '../src/data/catalog.ts'

const redirects = { '/reviews/page/1': '/reviews/', '/reviews/page/1/': '/reviews/', ...compareRedirects() }
for (const [from, to] of Object.entries(compareRedirects())) redirects[`${from}/`] = to
writeFileSync(new URL('../public/_redirects', import.meta.url), `${Object.entries(redirects).map(([from, to]) => `${from} ${to} 301`).join('\n')}\n`)
const demos = reviews.filter((review) => review.origin === 'demo')
const retired = demos.flatMap((review) => [`/reviews/${review.slug}`, `/reviews/${review.slug}/*`, `/guides/${review.slug}`, `/guides/${review.slug}/*`])
for (const a of demos) {
  for (const b of demos) {
    if (a.slug === b.slug || a.mechanicFamily !== b.mechanicFamily || a.platform !== b.platform) continue
    retired.push(`/compare/${a.slug}-vs-${b.slug}`, `/compare/${a.slug}-vs-${b.slug}/*`)
  }
}
const caddy = [
  ...Object.entries(redirects).map(([from, to]) => `redir ${from} ${to} 301`),
  `@retiredDemo path ${retired.join(' ')}`,
  'header @retiredDemo X-Robots-Tag "noindex, follow"',
  'respond @retiredDemo "This demonstration page has been retired." 410',
]
writeFileSync(new URL('../public/seo-redirects.caddy', import.meta.url), `${caddy.join('\n')}\n`)
