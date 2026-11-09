export const DIM_KEYS = ['G', 'A', 'F', 'C', 'U'] as const
export type DimKey = (typeof DIM_KEYS)[number]

export const WEIGHTS_V1 = { G: 30, A: 20, F: 20, C: 15, U: 15 } as const

export const METHODOLOGY_VERSION = 'score-model-v1' as const

export const DIMENSIONS: readonly {
  key: DimKey
  label: string
  weight: number
  question: string
}[] = [
  { key: 'G', label: 'Gameplay', weight: 30, question: 'Is it fun?' },
  { key: 'A', label: 'Ads', weight: 20, question: 'Are ads annoying?' },
  { key: 'F', label: 'Fairness', weight: 20, question: 'Fair without paying?' },
  { key: 'C', label: 'Content', weight: 15, question: 'Lots to do?' },
  { key: 'U', label: 'Stability', weight: 15, question: 'Runs smoothly?' },
]

const weightSum = Object.values(WEIGHTS_V1).reduce((sum, weight) => sum + weight, 0)
if (weightSum !== 100) {
  throw new Error(`WEIGHTS_V1 must sum to 100, got ${weightSum}`)
}

export type Dims = Record<DimKey, number | null>

export function assertDimTenths(value: number, key: DimKey): void {
  if (!Number.isInteger(value) || value < 0 || value > 100) {
    throw new Error(`${key} must be an integer from 0 to 100 (tenths), got ${value}`)
  }
}

export function assertWeights(weights: Record<DimKey, number>): void {
  for (const key of DIM_KEYS) {
    const weight = weights[key]
    if (!Number.isInteger(weight) || weight < 0) {
      throw new Error(`weight ${key} must be a non-negative integer`)
    }
  }
  const sum = DIM_KEYS.reduce((total, key) => total + weights[key], 0)
  if (sum !== 100) throw new Error(`weights must sum to 100, got ${sum}`)
}

/** 任一维缺失时返回 null，绝不当成 0 或 10。 */
export function composite(dims: Dims): { raw: number; displayedTenths: number } | null {
  let raw = 0
  for (const key of DIM_KEYS) {
    const value = dims[key]
    if (value === null || value === undefined) return null
    assertDimTenths(value, key)
    raw += WEIGHTS_V1[key] * value
  }
  return { raw, displayedTenths: Math.floor((raw + 50) / 100) }
}

export function formatScore(displayedTenths: number | null): string | null {
  if (displayedTenths === null) return null
  if (!Number.isInteger(displayedTenths) || displayedTenths < 0 || displayedTenths > 100) {
    throw new Error(`displayedTenths out of range: ${displayedTenths}`)
  }
  return (displayedTenths / 10).toFixed(1)
}

export type ReviewType = 'initial' | 'full'

/** 初测不对外展示综合分，即使五维都填了。 */
export function publicScore(reviewType: ReviewType, dims: Dims): { raw: number; displayedTenths: number } | null {
  if (reviewType !== 'full') return null
  return composite(dims)
}

export type ReviewDraft = {
  reviewType: ReviewType
  dims: Dims
  /** 客户端传来的综合分一律丢弃。 */
  compositeTenths?: number | null
  compositeRaw?: number | null
}

export type PreparedReview = {
  reviewType: ReviewType
  dims: Dims
  compositeTenths: number | null
  compositeRaw: number | null
}

export function prepareReviewVersion(draft: ReviewDraft): PreparedReview {
  const score = publicScore(draft.reviewType, draft.dims)
  return {
    reviewType: draft.reviewType,
    dims: { ...draft.dims },
    compositeTenths: score?.displayedTenths ?? null,
    compositeRaw: score?.raw ?? null,
  }
}
