import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const pack = process.argv[2]
const images = process.argv[3]
if (!pack || !images) {
  console.error('usage: node content/import-research-500.mjs <core-dir> <images-dir>')
  process.exit(1)
}

const privateDir = path.join(pack, 'private/json')
const files = readdirSync(privateDir).filter((name) => name.endsWith('.json'))
const records = files.map((name) => JSON.parse(readFileSync(path.join(privateDir, name), 'utf8')))
records.sort((a, b) => a.recordIndex - b.recordIndex)

const tags = {
  no_forced_ads: 'unknown',
  plays_offline: 'unknown',
  one_handed: 'unknown',
  short_rounds: 'unknown',
  no_timers: 'unknown',
}

function slugFamily(value) {
  const slug = String(value || 'unclassified')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return slug || 'unclassified'
}

function text(value, fallback) {
  const cleaned = String(value ?? '').replace(/\s+/g, ' ').trim()
  return cleaned || fallback
}

const draftDir = path.join(root, 'content/drafts/ios-us-top100')
const drafts = new Map()
if (existsSync(draftDir)) {
  for (const name of readdirSync(draftDir)) {
    if (!name.endsWith('.review.json')) continue
    const draft = JSON.parse(readFileSync(path.join(draftDir, name), 'utf8'))
    drafts.set(draft.slug, draft)
  }
}

function defaultRationales() {
  const line = 'Default score 7.0. This dimension was not playtested, and the default is what the ranking uses.'
  return {
    G: `Gameplay was not playtested. ${line}`,
    A: `Ads were not playtested, and this game has no separate store-ad sample. The no-forced-ads tag stays unknown. ${line}`,
    F: `Whether a purchase is required to keep playing was not playtested. ${line}`,
    C: `Content depth was not playtested. ${line}`,
    U: `Stability was not playtested. ${line}`,
  }
}

function impressionFromDraft(draft) {
  const rationale = draft.rationales?.G ?? ''
  const match = rationale.match(/(?:Screenshot|Shot) impression (\d+\.\d)\/10: (.+?) Default score/)
  if (!match) return undefined
  const score100 = Math.round(Number(match[1]) * 10)
  if (!Number.isInteger(score100) || score100 < 0 || score100 > 100) return undefined
  const confidence = /low confidence/i.test(`${draft.summary ?? ''} ${rationale}`) ? 'low' : 'medium'
  return { score100, confidence, rationale: match[2].trim() }
}

const mediaRoot = path.join(root, 'apps/web/public/media/listings')
const reviews = []
const art = {}
const slugs = new Set()

for (const row of records) {
  if (slugs.has(row.slug)) throw new Error(`duplicate slug ${row.slug}`)
  slugs.add(row.slug)
  const appId = String(row.appId)
  const srcDir = path.join(images, 'images', appId)
  const destDir = path.join(mediaRoot, appId)
  mkdirSync(destDir, { recursive: true })
  const iconSrc = path.join(srcDir, 'icon.jpg')
  if (!existsSync(iconSrc)) throw new Error(`missing icon ${appId}`)
  copyFileSync(iconSrc, path.join(destDir, 'icon.jpg'))
  const shots = []
  for (let index = 1; index <= 3; index += 1) {
    const shotSrc = path.join(srcDir, `screenshot_${index}.jpg`)
    if (!existsSync(shotSrc)) continue
    const file = `shot-${index}.jpg`
    copyFileSync(shotSrc, path.join(destDir, file))
    if (index === 1) copyFileSync(shotSrc, path.join(destDir, 'key.jpg'))
    const image = (row.images ?? []).find((item) => item.localPath?.endsWith(`screenshot_${index}.jpg`))
    shots.push({
      src: `/media/listings/${appId}/${file}`,
      label: `App Store screenshot ${index}`,
      alt: text(image?.alt, `${text(row.name, appId)} official App Store screenshot ${index}`),
    })
  }
  if (!existsSync(path.join(destDir, 'key.jpg'))) copyFileSync(iconSrc, path.join(destDir, 'key.jpg'))
  art[row.slug] = {
    icon: `/media/listings/${appId}/icon.jpg`,
    key: `/media/listings/${appId}/key.jpg`,
  }

  const cohort = row.cohort === 'official_top100' ? 'official_top100' : 'unranked_candidate'
  const analysisType = row.analysisType === 'player_review_digest' ? 'player_review_digest' : 'store_listing_analysis'
  const rankNote = cohort === 'official_top100' && row.rank
    ? `US free Puzzle chart rank ${row.rank} in the 2026-11-10 research snapshot. Not an editorial rank.`
    : 'Unranked candidate. Not an official chart position and not part of a top 500.'
  const kindNote = analysisType === 'player_review_digest'
    ? 'Player-review digest from saved US App Store reviews. Player reports are not independently verified.'
    : 'Store-listing analysis. No saved review bodies, so this is not a player-review digest.'

  const faqs = (row.faqs || []).map((faq) => ({
    q: text(faq.q, 'Question'),
    a: text(faq.a, 'Answer'),
  }))
  if (!faqs.length) throw new Error(`missing faqs ${row.slug}`)

  const review = {
    gameId: `app-${appId}`,
    slug: row.slug,
    name: text(row.name, appId),
    seoTitle: text(row.metaTitle, `${text(row.name, appId)} iOS review`),
    seoDescription: text(row.metaDescription, row.summary || row.excerpt || row.name),
    developer: text(row.developer, 'Unknown'),
    mechanicFamily: slugFamily(row.mechanicFamilyGuess),
    platform: 'ios',
    reviewType: 'full',
    status: 'published',
    sponsored: false,
    appVersion: text(row.appVersion, 'unknown'),
    osVersion: 'iOS',
    testedFrom: '2026-11-10',
    testedTo: '2026-11-10',
    publishedOn: '2026-11-10',
    testerRegion: 'US',
    storeLocale: 'en-US',
    dims: { G: 70, A: 70, F: 70, C: 70, U: 70 },
    rationales: defaultRationales(),
    testingBoundaries: text(row.testingBoundaries, 'No gameplay, ad, purchase, offline, or stability testing performed.'),
    storeUrl: row.storeUrl,
    priceUsd: 0,
    authorSlug: 'listing-desk',
    publicEvidenceCount: 0,
    tags,
    verifiedOnline: false,
    summary: text(row.summary || row.excerpt, row.name),
    verdict: text(row.verdict, row.summary || row.name),
    familyNotes: [
      rankNote,
      kindNote,
      'No play session. Ads, purchases, offline play, and stability were not tested.',
    ],
    faqs,
    aiAssisted: true,
    origin: 'store-listing',
    analysisType,
    cohort,
    storeShots: shots,
    bodyMarkdown: String(row.bodyMarkdown || '').trim(),
    defaultScore: true,
  }
  const prior = drafts.get(row.slug)
  if (prior?.dims && prior.rationales?.G && prior.rationales.A && prior.rationales.F && prior.rationales.C && prior.rationales.U) {
    review.dims = {
      G: 70,
      A: prior.dims.A,
      F: 70,
      C: 70,
      U: 70,
    }
    review.rationales = {
      G: prior.rationales.G,
      A: prior.rationales.A,
      F: prior.rationales.F,
      C: prior.rationales.C,
      U: prior.rationales.U,
    }
    const impression = impressionFromDraft(prior)
    if (impression) review.screenshotImpression = impression
  }
  if (cohort === 'official_top100' && Number.isInteger(row.rank)) review.chartRank = row.rank
  if (review.bodyMarkdown.length < 400) throw new Error(`short body ${row.slug}`)
  for (const key of ['G', 'F', 'C', 'U']) {
    if (review.dims[key] !== 70) throw new Error(`${row.slug} ${key} is not the default 70`)
  }
  if (!Number.isInteger(review.dims.A) || review.dims.A < 0 || review.dims.A > 100 || review.dims.A % 5 !== 0) {
    throw new Error(`${row.slug} ads score ${review.dims.A}`)
  }
  reviews.push(review)
}

if (reviews.length !== 500) throw new Error(`expected 500 reviews, got ${reviews.length}`)
const titles = new Set()
for (const review of reviews) {
  if (titles.has(review.seoTitle)) throw new Error(`duplicate seo title ${review.seoTitle}`)
  titles.add(review.seoTitle)
  if (review.seoDescription.length < 50) throw new Error(`short seo description ${review.slug}`)
}
const official = reviews.filter((review) => review.cohort === 'official_top100').length
const digests = reviews.filter((review) => review.analysisType === 'player_review_digest').length
if (official !== 100 || digests !== 235) throw new Error(`unexpected mix official=${official} digests=${digests}`)

const out = path.join(root, 'apps/web/src/data/store-listings.ts')
writeFileSync(
  out,
  `// Generated by content/import-research-500.mjs from the 500-game research pack.\n// G/F/C/U stay at the default 70. Ads uses a prior store sample when one exists, otherwise 70.\n// defaultScore marks the composite as unpublished in JSON-LD. These are not playtest scores.\nexport const storeListings = ${JSON.stringify(reviews, null, 2)}\n\nexport const listingArt: Record<string, { icon: string; key: string }> = ${JSON.stringify(art, null, 2)}\n`,
)
const sampled = reviews.filter((review) => review.dims.A !== 70).length
const impressions = reviews.filter((review) => review.screenshotImpression).length
console.log(`wrote ${reviews.length} reviews (${official} chart, ${digests} digests, ${sampled} sampled ads, ${impressions} impressions)`)
