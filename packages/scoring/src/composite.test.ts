import { describe, expect, it } from 'vitest'
import {
  assertDimTenths,
  assertWeights,
  composite,
  formatScore,
  prepareReviewVersion,
  publicScore,
  WEIGHTS_V1,
} from './index.ts'

const dims = { G: 80, A: 70, F: 80, C: 60, U: 80 }

describe('TC-SCORE composite', () => {
  it('TC-SCORE-01 文档示例 7.500 展示为 7.5，逢五进位', () => {
    expect(composite(dims)).toEqual({ raw: 7500, displayedTenths: 75 })
    expect(formatScore(75)).toBe('7.5')
    const sevenPointTwoFive = { G: 75, A: 70, F: 75, C: 65, U: 75 }
    expect(composite(sevenPointTwoFive)).toEqual({ raw: 7250, displayedTenths: 73 })
    expect(formatScore(73)).toBe('7.3')
    const sevenPointTwoFour = { G: 74, A: 71, F: 75, C: 65, U: 75 }
    expect(composite(sevenPointTwoFour)).toEqual({ raw: 7240, displayedTenths: 72 })
    expect(formatScore(72)).toBe('7.2')
  })

  it('TC-SCORE-02 缺任一维返回 null，不是 0 也不是 10', () => {
    for (const key of ['G', 'A', 'F', 'C', 'U'] as const) {
      const result = composite({ ...dims, [key]: null })
      expect(result).toBeNull()
      expect(result).not.toBe(0)
      expect(formatScore(result && 'displayedTenths' in (result ?? {}) ? 0 : null)).toBeNull()
    }
    expect(formatScore(null)).toBeNull()
    expect(formatScore(null)).not.toBe('0.0')
    expect(formatScore(null)).not.toBe('10.0')
  })

  it('TC-SCORE-03 端点 0 与 10.0', () => {
    const zeros = { G: 0, A: 0, F: 0, C: 0, U: 0 }
    const full = { G: 100, A: 100, F: 100, C: 100, U: 100 }
    expect(composite(zeros)).toEqual({ raw: 0, displayedTenths: 0 })
    expect(formatScore(0)).toBe('0.0')
    expect(composite(full)).toEqual({ raw: 10000, displayedTenths: 100 })
    expect(formatScore(100)).toBe('10.0')
  })

  it('TC-SCORE-04 越界、小数、非整数直接拒绝', () => {
    expect(() => composite({ ...dims, G: -1 })).toThrow(/G/)
    expect(() => composite({ ...dims, A: 101 })).toThrow(/A/)
    expect(() => composite({ ...dims, F: 80.5 })).toThrow(/F/)
    expect(() => assertDimTenths(Number.NaN, 'C')).toThrow(/C/)
    expect(() => assertWeights({ ...WEIGHTS_V1, G: 31 })).toThrow(/100/)
  })

  it('初测即使五维齐全也不对外给综合分', () => {
    expect(publicScore('initial', dims)).toBeNull()
    expect(publicScore('full', dims)?.displayedTenths).toBe(75)
  })

  it('服务器丢弃客户端提交的综合分', () => {
    const prepared = prepareReviewVersion({
      reviewType: 'full',
      dims,
      compositeTenths: 100,
      compositeRaw: 1,
    })
    expect(prepared.compositeTenths).toBe(75)
    expect(prepared.compositeRaw).toBe(7500)
    const initial = prepareReviewVersion({
      reviewType: 'initial',
      dims,
      compositeTenths: 75,
    })
    expect(initial.compositeTenths).toBeNull()
    expect(initial.compositeRaw).toBeNull()
  })
})
