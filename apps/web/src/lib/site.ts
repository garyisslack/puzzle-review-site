import {
  DIMENSIONS,
  METHODOLOGY_VERSION,
  buildSnapshot,
  formatScore,
  prepareReviewVersion,
  rankBlocker,
  type ExclusionReason,
  type RankCandidate,
  type RankingDefinition,
} from '@puzzle/scoring'
import {
  articleJsonLd,
  breadcrumbJsonLd,
  itemListJsonLd,
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

export const SITE_URL = 'https://puzzlereviewlab.com'
export const SITE_NAME = 'puzzlereviewlab'
export const primaryRankingSlug = 'reviewed-ios'
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

export function formatFamily(family: string) {
  return family.split('-').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
}

export function rankingDefinitions(): RankingDefinition[] {
  const definitions: RankingDefinition[] = [
    {
      slug: primaryRankingSlug,
      title: "Puzzle games we've fully reviewed (iOS)",
      mechanicFamily: null,
      platform: 'ios',
      minQualified: 1,
    },
    rankingDefinition,
  ]
  const seen = new Set(definitions.flatMap((definition) => (
    definition.mechanicFamily ? [`${definition.platform}:${definition.mechanicFamily}`] : []
  )))
  const families = new Map<string, Set<string>>()
  for (const review of candidates()) {
    if (rankBlocker(review)) continue
    const set = families.get(review.platform) ?? new Set<string>()
    set.add(review.mechanicFamily)
    families.set(review.platform, set)
  }
  for (const platform of ['ios', 'android'] as const) {
    for (const family of [...(families.get(platform) ?? [])].sort()) {
      const key = `${platform}:${family}`
      if (seen.has(key)) continue
      seen.add(key)
      definitions.push({
        slug: `${family}-${platform}`,
        title: `${formatFamily(family)} games we've fully reviewed (${platform === 'ios' ? 'iOS' : 'Android'})`,
        mechanicFamily: family,
        platform,
        minQualified: 1,
      })
    }
  }
  return definitions
}

export function unrankedReviews(): { gameId: string; name: string; reason: ExclusionReason }[] {
  return candidates()
    .flatMap((review) => {
      const reason = rankBlocker(review)
      return reason ? [{ gameId: review.gameId, name: review.name, reason }] : []
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'en'))
}

export function rankingPages() {
  return rankingDefinitions().flatMap((definition) => {
    const result = buildSnapshot(definition, candidates(), GENERATED_AT)
    return result.ok ? [{ definition, snapshot: result.snapshot }] : []
  })
}

export function rankFor(gameId: string, mechanicFamily: string, platform: 'ios' | 'android') {
  const page = rankingPages().find((entry) => entry.definition.mechanicFamily === mechanicFamily && entry.definition.platform === platform)
  const item = page?.snapshot.items.find((entry) => entry.gameId === gameId)
  if (!page || !item) return null
  return { rank: item.rank, slug: page.definition.slug, title: page.definition.title }
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
      const [a, b] = left.slug.localeCompare(right.slug, 'en') <= 0 ? [left.slug, right.slug] : [right.slug, left.slug]
      pages.push({ slug: pair.canonicalSlug, a, b })
    }
  }
  return pages
}

export function compareRedirects(): Record<string, string> {
  const redirects: Record<string, string> = {}
  for (const page of comparePages()) {
    const reverse = comparePair(page.b, page.a)
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
    displayedScore: review.defaultScore ? null : review.displayed,
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

function latestContentDate() {
  const dates = publishedReviews().map((review) => review.publishedOn)
  return dates.reduce((latest, date) => (date > latest ? date : latest), '2026-11-08')
}

export function sitemapDocument() {
  const contentDate = latestContentDate()
  const entries = [
    { loc: `${SITE_URL}/`, lastmod: contentDate },
    { loc: `${SITE_URL}/reviews/`, lastmod: contentDate },
    { loc: `${SITE_URL}/how-we-test/`, lastmod: '2026-11-08' },
    { loc: `${SITE_URL}/about/`, lastmod: '2026-11-08' },
    { loc: `${SITE_URL}/editorial-independence/`, lastmod: '2026-11-08' },
    { loc: `${SITE_URL}/contact/`, lastmod: '2026-11-08' },
    { loc: `${SITE_URL}/privacy/`, lastmod: '2026-11-08' },
    ...publishedReviews()
      .filter((review) => !review.sponsored)
      .map((review) => ({ loc: `${SITE_URL}/reviews/${review.slug}/`, lastmod: review.publishedOn })),
    ...publishedReviews().flatMap((review) => {
      if (review.sponsored || similarSlugs(review.slug).length < 2) return []
      return [{ loc: `${SITE_URL}/reviews/${review.slug}/similar/`, lastmod: review.publishedOn }]
    }),
    ...rankingPages().map((page) => ({ loc: `${SITE_URL}/rankings/${page.definition.slug}/`, lastmod: contentDate })),
    ...comparePages().map((page) => ({ loc: `${SITE_URL}/compare/${page.slug}/`, lastmod: contentDate })),
    ...publishedGuides().map((guide) => ({ loc: `${SITE_URL}/guides/${guide.gameSlug}/${guide.slug}/`, lastmod: guide.modifiedOn })),
    ...guideIndexSlugs().map((slug) => ({ loc: `${SITE_URL}/guides/${slug}/`, lastmod: '2026-11-08' })),
    ...authors.map((author) => ({ loc: `${SITE_URL}/authors/${author.slug}/`, lastmod: '2026-11-08' })),
  ]
  return sitemapXml(entries)
}

export function rankingListJson(slug: string) {
  const page = rankingPages().find((entry) => entry.definition.slug === slug)
  if (!page) return null
  return itemListJsonLd({
    siteUrl: SITE_URL,
    path: `/rankings/${page.definition.slug}/`,
    name: page.definition.title,
    items: page.snapshot.items.flatMap((item) => {
      const review = publishedReviews().find((entry) => entry.gameId === item.gameId && entry.platform === page.definition.platform)
      return review ? [{ name: item.name, path: `/reviews/${review.slug}/` }] : []
    }),
  })
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
export { DIMENSIONS, METHODOLOGY_VERSION }
