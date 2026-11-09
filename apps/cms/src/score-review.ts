import { DIM_KEYS, prepareReviewVersion, type DimKey, type ReviewType } from '@puzzle/scoring'

export type ReviewWrite = {
  reviewType?: ReviewType
  status?: string
  compositeTenths?: number | null
  compositeRaw?: number | null
} & Partial<Record<`dim${DimKey}`, number | null>>

export function applyServerScore<T extends ReviewWrite>(
  data: T,
): T & { compositeTenths: number | null; compositeRaw: number | null } {
  const dims = Object.fromEntries(DIM_KEYS.map((key) => [key, data[`dim${key}`] ?? null])) as Record<DimKey, number | null>
  const prepared = prepareReviewVersion({
    reviewType: data.reviewType === 'initial' ? 'initial' : 'full',
    dims,
    compositeTenths: data.compositeTenths,
  })
  return {
    ...data,
    compositeTenths: prepared.compositeTenths,
    compositeRaw: prepared.compositeRaw,
  }
}
