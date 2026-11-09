import { composite, type DimKey, type Dims, type ReviewType } from '@puzzle/scoring'

export type PublishReviewInput = {
  reviewType: ReviewType
  dims: Dims
  rationales: Partial<Record<DimKey, string>>
  testingBoundaries?: string
  storeUrl?: string
  authorSlugs?: string[]
  publicEvidenceCount: number
  sponsored: boolean
}

export type GateResult = { errors: string[]; warnings: string[] }

export function canPublishReview(input: PublishReviewInput): GateResult {
  const errors: string[] = []
  const warnings: string[] = []
  if (input.reviewType === 'full') {
    if (!input.testingBoundaries?.trim()) errors.push('missing testing boundaries')
    if (!input.storeUrl?.trim()) errors.push('missing store url')
    if (!input.authorSlugs?.length) errors.push('missing author')
    if (!composite(input.dims)) errors.push('full review is missing a dimension score')
    for (const key of ['G', 'A', 'F', 'C', 'U'] as const) {
      if (!input.rationales[key]?.trim()) warnings.push(`missing ${key} rationale`)
    }
    if (input.publicEvidenceCount < 1) warnings.push('missing public evidence image')
  }
  return { errors, warnings }
}

export function canGenerateSimilar(otherFullReviewsInFamily: number): boolean {
  return otherFullReviewsInFamily >= 2
}

export function canGenerateCompare(input: {
  aFull: boolean
  bFull: boolean
  sameFamily: boolean
}): boolean {
  return input.aFull && input.bFull && input.sameFamily
}

export function canGenerateNeedList(qualifiedTagYes: number): boolean {
  return qualifiedTagYes >= 5
}

export function canGenerateGuideIndex(publishedGuides: number): boolean {
  return publishedGuides >= 2
}

export type GuideDraft = {
  status: 'pending' | 'verified' | 'draft'
  verifiedOnVersion?: string
  body: string
  gameSlug: string
  platform: 'ios' | 'android'
  levelRange: string
  piiCleared: boolean
}

export function canPublishGuide(draft: GuideDraft, existing: readonly { gameSlug: string; platform: string; levelRange: string }[]): GateResult {
  const errors: string[] = []
  if (draft.status !== 'verified') errors.push('guide is not verified')
  if (!draft.verifiedOnVersion?.trim()) errors.push('missing verified version')
  if (draft.body.trim().length < 280) errors.push('guide body is too short')
  if (!draft.piiCleared) errors.push('personal information was not cleared')
  const duplicate = existing.some(
    (guide) =>
      guide.gameSlug === draft.gameSlug && guide.platform === draft.platform && guide.levelRange === draft.levelRange,
  )
  if (duplicate) errors.push('duplicate level range')
  return { errors, warnings: [] }
}
