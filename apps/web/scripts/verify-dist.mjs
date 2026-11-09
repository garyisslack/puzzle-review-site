import fs from 'node:fs'
import path from 'node:path'

const dist = path.resolve(import.meta.dirname, '../dist')
const read = (rel) => fs.readFileSync(path.join(dist, rel), 'utf8')

const home = read('index.html')
if (!home.includes('list at 5 games')) throw new Error('need-list gate copy missing')
if (!home.includes('7.5')) throw new Error('home score missing')

const review = read('reviews/prism-pocket-sort/index.html')
if (!review.includes('SoftwareApplication')) throw new Error('review JSON-LD missing')
if (review.includes('aggregateRating')) throw new Error('aggregateRating leaked')
if (!review.includes('7.5')) throw new Error('review score missing')
for (const img of review.match(/<img\b[^>]*>/g) ?? []) {
  if (!/\swidth=/.test(img) || !/\sheight=/.test(img)) throw new Error(`image missing dimensions: ${img}`)
}

const initial = read('reviews/sample-initial-entry/index.html')
if (!initial.includes('No composite score')) throw new Error('initial review shows a number')

const ranking = read('rankings/color-sort-ios/index.html')
if (!ranking.includes('<td>2</td>') || !ranking.includes('<td>4</td>')) throw new Error('tie ranks missing')
if (/top\s+10/i.test(ranking)) throw new Error('dishonest Top 10 title')
if (fs.existsSync(path.join(dist, 'rankings/no-forced-ads/index.html'))) throw new Error('thin need list was published')

const submit = read('guides/submit/index.html')
if (!submit.includes('noindex,follow')) throw new Error('submit page is indexable')
if (!read('guides/prism-pocket-sort/early-bottles/index.html').includes('"@type":"Article"')) {
  throw new Error('guide JSON-LD missing')
}
if (!fs.existsSync(path.join(dist, 'guides/prism-pocket-sort/index.html'))) throw new Error('guide index missing')

const sitemap = read('sitemap.xml')
if (!sitemap.includes('<lastmod>2026-10-02</lastmod>')) throw new Error('sitemap lastmod is not the content date')
if (sitemap.includes('/guides/submit/')) throw new Error('submit URL is in the sitemap')
if (sitemap.includes('sponsored-sort-deluxe')) throw new Error('sponsored URL is in the sitemap')

const sponsored = read('reviews/sponsored-sort-deluxe/index.html')
if (sponsored.includes('"@type":"Review"')) throw new Error('sponsored page emitted Review schema')

const redirects = read('_redirects')
if (!redirects.includes('/compare/tile-path-daily-vs-prism-pocket-sort /compare/prism-pocket-sort-vs-tile-path-daily/ 301')) {
  throw new Error('compare reverse URL is not a 301')
}

console.log('dist checks ok')
