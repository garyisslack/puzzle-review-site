import {
  DIMENSIONS,
  buildSnapshot,
  formatScore,
  prepareReviewVersion,
  type RankCandidate,
} from '@puzzle/scoring'
import {
  articleJsonLd,
  breadcrumbJsonLd,
  canGenerateCompare,
  canGenerateGuideIndex,
  canGenerateNeedList,
  canGenerateSimilar,
  canPublishGuide,
  canPublishReview,
  comparePair,
  reviewJsonLd,
  robotsTxt,
  sitemapXml,
} from '@puzzle/seo'
import { authors, guides, needs, rankingDefinition, reviews } from '../data/catalog.ts'

export const SITE_URL = 'https://dimpuzzle.com'
export const SITE_NAME = 'DimPuzzle'
const GENERATED_AT = '2026-11-08T00:00:00.000Z'

export function authorBySlug(slug: string) {
  return authors.find((author) => author.slug === slug)
}

export function candidates(): RankCandidate[] {
  return reviews.map((review) => ({
    gameId: review.gameId,
    name: review.name,
    platform: review.platform,
    mechanicFamily: review.mechanicFamily,
    reviewType: review.reviewType,
    status: review.status,
    sponsored: review.sponsored,
    dims: review.dims,
    tags: review.tags,
  }))
}

export function publishedReviews() {
  return reviews.flatMap((review) => {
    const prepared = prepareReviewVersion(review)
    const gate = canPublishReview({
      reviewType: review.reviewType,
      dims: review.dims,
      rationales: review.rationales,
      testingBoundaries: review.testingBoundaries,
      storeUrl: review.storeUrl,
      authorSlugs: [review.authorSlug],
      publicEvidenceCount: review.publicEvidenceCount,
      sponsored: review.sponsored,
    })
    if (review.reviewType === 'full' && gate.errors.length) return []
    const author = authorBySlug(review.authorSlug)
    return [{
      ...review,
      compositeTenths: prepared.compositeTenths,
      displayed: formatScore(prepared.compositeTenths),
      authorName: author?.name ?? review.authorSlug,
      warnings: gate.warnings,
    }]
  })
}

export function reviewBySlug(slug: string | undefined) {
  return publishedReviews().find((review) => review.slug === slug)
}

export function colorSortSnapshot() {
  return buildSnapshot(rankingDefinition, candidates(), GENERATED_AT)
}

export function needSnapshots() {
  return needs.flatMap((need) => {
    const yesCount = reviews.filter(
      (review) =>
        review.platform === 'ios' &&
        review.mechanicFamily === 'color-sort' &&
        review.reviewType === 'full' &&
        !review.sponsored &&
        review.tags[need.tag] === 'yes',
    ).length
    if (!canGenerateNeedList(yesCount)) return []
    const result = buildSnapshot(
      {
        slug: need.slug,
        title: `${need.title} color-sort games we've fully reviewed`,
        mechanicFamily: 'color-sort',
        platform: 'ios',
        requiredTag: need.tag,
        minQualified: 5,
      },
      candidates(),
      GENERATED_AT,
    )
    return result.ok ? [{ need, snapshot: result.snapshot, yesCount }] : []
  })
}

export function needCards() {
  return needs.map((need) => {
    const reviewed = reviews.filter(
      (review) => review.reviewType === 'full' && !review.sponsored && review.platform === 'ios' && review.tags[need.tag] === 'yes',
    ).length
    return { ...need, reviewed, ready: canGenerateNeedList(reviewed) }
  })
}

export function similarSlugs(slug: string) {
  const review = reviewBySlug(slug)
  if (!review || review.reviewType !== 'full' || review.sponsored) return []
  const others = publishedReviews().filter(
    (item) =>
      item.slug !== slug &&
      item.reviewType === 'full' &&
      !item.sponsored &&
      item.mechanicFamily === review.mechanicFamily &&
      item.platform === review.platform,
  )
  return canGenerateSimilar(others.length) ? others.map((item) => item.slug) : []
}

export function comparePages() {
  const pool = publishedReviews().filter((review) => review.reviewType === 'full' && !review.sponsored)
  const pages: { slug: string; a: string; b: string }[] = []
  for (let i = 0; i < pool.length; i++) {
    for (let j = i + 1; j < pool.length; j++) {
      const left = pool[i]
      const right = pool[j]
      if (!left || !right) continue
      if (!canGenerateCompare({ aFull: true, bFull: true, sameFamily: left.mechanicFamily === right.mechanicFamily && left.platform === right.platform })) {
        continue
      }
      const pair = comparePair(left.slug, right.slug)
      const [a, b] = pair.canonicalSlug.split('-vs-')
      if (!a || !b) continue
      pages.push({ slug: pair.canonicalSlug, a, b })
    }
  }
  return pages
}

export function compareRedirects(): Record<string, string> {
  const redirects: Record<string, string> = {}
  for (const page of comparePages()) {
    const [a, b] = page.slug.split('-vs-')
    if (!a || !b) continue
    const reverse = comparePair(b, a)
    if (reverse.redirectFrom) redirects[`/compare/${reverse.redirectFrom}`] = `/compare/${reverse.canonicalSlug}/`
  }
  return redirects
}

export function publishedGuides() {
  return guides.filter((guide) => canPublishGuide(guide, []).errors.length === 0 && guide.status === 'verified')
}

export function guideIndexSlugs() {
  const counts = new Map<string, number>()
  for (const guide of publishedGuides()) counts.set(guide.gameSlug, (counts.get(guide.gameSlug) ?? 0) + 1)
  return [...counts.entries()].filter(([, count]) => canGenerateGuideIndex(count)).map(([slug]) => slug)
}

export function reviewJson(slug: string) {
  const review = reviewBySlug(slug)
  if (!review) return null
  const author = authorBySlug(review.authorSlug)
  return reviewJsonLd({
    siteUrl: SITE_URL,
    slug: review.slug,
    name: review.name,
    platform: review.platform === 'ios' ? 'iOS' : 'Android',
    operatingSystem: review.platform === 'ios' ? 'iOS' : 'Android',
    priceUsd: review.priceUsd,
    description: review.summary,
    authorName: author?.name ?? review.authorSlug,
    authorSlug: review.authorSlug,
    datePublished: review.publishedOn,
    displayedScore: review.displayed,
    sponsored: review.sponsored,
  })
}

export function guideJson(guideSlug: string) {
  const guide = publishedGuides().find((item) => item.slug === guideSlug)
  if (!guide) return null
  return articleJsonLd({
    siteUrl: SITE_URL,
    path: `/guides/${guide.gameSlug}/${guide.slug}/`,
    headline: guide.title,
    datePublished: guide.publishedOn,
    dateModified: guide.modifiedOn,
    authorName: guide.contributorName,
    editorName: guide.verifiedBy,
  })
}

export function crumbs(items: { name: string; path: string }[]) {
  return breadcrumbJsonLd(SITE_URL, items)
}

export function sitemapDocument() {
  const entries = [
    { loc: `${SITE_URL}/`, lastmod: '2026-11-08' },
    { loc: `${SITE_URL}/how-we-test/`, lastmod: '2026-11-08' },
    ...publishedReviews()
      .filter((review) => !review.sponsored)
      .map((review) => ({ loc: `${SITE_URL}/reviews/${review.slug}/`, lastmod: review.publishedOn })),
    { loc: `${SITE_URL}/rankings/${rankingDefinition.slug}/`, lastmod: '2026-11-08' },
    ...comparePages().map((page) => ({ loc: `${SITE_URL}/compare/${page.slug}/`, lastmod: '2026-11-08' })),
    ...publishedGuides().map((guide) => ({ loc: `${SITE_URL}/guides/${guide.gameSlug}/${guide.slug}/`, lastmod: guide.modifiedOn })),
    ...guideIndexSlugs().map((slug) => ({ loc: `${SITE_URL}/guides/${slug}/`, lastmod: '2026-11-08' })),
    ...authors.map((author) => ({ loc: `${SITE_URL}/authors/${author.slug}/`, lastmod: '2026-11-08' })),
  ]
  return sitemapXml(entries)
}

export function robotsDocument() {
  return robotsTxt({ siteUrl: SITE_URL, allowAiTraining: false })
}

export function dimensionRows(dims: CatalogDims, rationales: Partial<Record<string, string>>) {
  return DIMENSIONS.map((dimension) => {
    const tenths = dims[dimension.key]
    return {
      ...dimension,
      displayed: formatScore(tenths),
      width: tenths === null ? 0 : tenths,
      rationale: rationales[dimension.key] ?? '',
    }
  })
}

type CatalogDims = { G: number | null; A: number | null; F: number | null; C: number | null; U: number | null }

export { rankingDefinition }
export { DIMENSIONS }
