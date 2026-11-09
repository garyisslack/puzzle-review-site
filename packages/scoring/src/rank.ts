import { composite, METHODOLOGY_VERSION, type Dims, type ReviewType } from './composite.ts'

export type Platform = 'ios' | 'android'
export type ReviewStatus = 'draft' | 'published' | 'expired' | 'withdrawn'

export type RankCandidate = {
  gameId: string
  name: string
  platform: Platform
  mechanicFamily: string
  reviewType: ReviewType
  status: ReviewStatus
  sponsored: boolean
  dims: Dims
  tags?: Record<string, 'yes' | 'no' | 'unknown'>
}

export type RankingDefinition = {
  slug: string
  title: string
  mechanicFamily: string
  platform: Platform
  /** 需求榜：只有该标签为 yes 才合格。 */
  requiredTag?: string
  minQualified: number
}

export type ExclusionReason =
  | 'not_full_review'
  | 'missing_dimension'
  | 'family_mismatch'
  | 'platform_mismatch'
  | 'not_published'
  | 'expired'
  | 'withdrawn'
  | 'sponsored'
  | 'tag_not_yes'

export type RankedItem = {
  rank: number
  tieGroup: number
  gameId: string
  name: string
  displayedTenths: number
  source: 'system'
}

export type ExcludedItem = {
  gameId: string
  name: string
  reason: ExclusionReason
}

export type RankingSnapshot = {
  definitionSlug: string
  generatedAt: string
  methodologyVersion: typeof METHODOLOGY_VERSION
  qualifiedCount: number
  items: RankedItem[]
  excluded: ExcludedItem[]
}

export type SnapshotResult =
  | { ok: true; snapshot: RankingSnapshot }
  | { ok: false; code: 'below_minimum' | 'top_n_mismatch'; qualifiedCount: number; title: string }

const TOP_N = /\btop\s+(\d+)\b/i

export function titleTopN(title: string): number | null {
  const match = TOP_N.exec(title)
  if (!match?.[1]) return null
  return Number(match[1])
}

export function evaluateCandidate(
  definition: RankingDefinition,
  candidate: RankCandidate,
): { ok: true; displayedTenths: number } | { ok: false; reason: ExclusionReason } {
  if (candidate.sponsored) return { ok: false, reason: 'sponsored' }
  if (candidate.platform !== definition.platform) return { ok: false, reason: 'platform_mismatch' }
  if (candidate.mechanicFamily !== definition.mechanicFamily) return { ok: false, reason: 'family_mismatch' }
  if (candidate.status === 'expired') return { ok: false, reason: 'expired' }
  if (candidate.status === 'withdrawn') return { ok: false, reason: 'withdrawn' }
  if (candidate.status !== 'published') return { ok: false, reason: 'not_published' }
  if (candidate.reviewType !== 'full') return { ok: false, reason: 'not_full_review' }
  const score = composite(candidate.dims)
  if (!score) return { ok: false, reason: 'missing_dimension' }
  if (definition.requiredTag) {
    const state = candidate.tags?.[definition.requiredTag]
    if (state !== 'yes') return { ok: false, reason: 'tag_not_yes' }
  }
  return { ok: true, displayedTenths: score.displayedTenths }
}

export function buildSnapshot(
  definition: RankingDefinition,
  candidates: readonly RankCandidate[],
  generatedAt: string,
): SnapshotResult {
  const qualified: { candidate: RankCandidate; displayedTenths: number }[] = []
  const excluded: ExcludedItem[] = []

  for (const candidate of candidates) {
    const result = evaluateCandidate(definition, candidate)
    if (result.ok) qualified.push({ candidate, displayedTenths: result.displayedTenths })
    else excluded.push({ gameId: candidate.gameId, name: candidate.name, reason: result.reason })
  }

  const qualifiedCount = qualified.length
  const topN = titleTopN(definition.title)
  if (topN !== null && qualifiedCount < topN) {
    return { ok: false, code: 'top_n_mismatch', qualifiedCount, title: definition.title }
  }
  if (qualifiedCount < definition.minQualified) {
    return { ok: false, code: 'below_minimum', qualifiedCount, title: definition.title }
  }

  const sorted = qualified.slice().sort((a, b) => {
    if (b.displayedTenths !== a.displayedTenths) return b.displayedTenths - a.displayedTenths
    return a.candidate.name.localeCompare(b.candidate.name, 'en')
  })

  let tieGroup = 0
  let previousScore: number | null = null
  const items: RankedItem[] = sorted.map((entry) => {
    if (entry.displayedTenths !== previousScore) {
      tieGroup += 1
      previousScore = entry.displayedTenths
    }
    const higher = sorted.filter((other) => other.displayedTenths > entry.displayedTenths).length
    return {
      rank: 1 + higher,
      tieGroup,
      gameId: entry.candidate.gameId,
      name: entry.candidate.name,
      displayedTenths: entry.displayedTenths,
      source: 'system',
    }
  })

  excluded.sort((a, b) => a.name.localeCompare(b.name, 'en'))

  return {
    ok: true,
    snapshot: {
      definitionSlug: definition.slug,
      generatedAt,
      methodologyVersion: METHODOLOGY_VERSION,
      qualifiedCount,
      items,
      excluded,
    },
  }
}

/** 构建失败时保留上一份成功快照。 */
export function keepLastGoodSnapshot(
  previous: RankingSnapshot | null,
  next: SnapshotResult,
): RankingSnapshot | null {
  if (!next.ok) return previous
  return next.snapshot
}
