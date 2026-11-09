import { describe, expect, it } from 'vitest'
import type { RankingSnapshot, SubmissionDecision } from './index.ts'

describe('共享类型', () => {
  it('榜单快照和投稿结果可以被标注', () => {
    const decision: SubmissionDecision = { action: 'block_under_13' }
    const snapshot: RankingSnapshot = {
      definitionSlug: 'color-sort-ios',
      generatedAt: '2026-11-08',
      methodologyVersion: 'score-model-v1',
      qualifiedCount: 0,
      items: [],
      excluded: [],
    }
    expect(decision.action).toBe('block_under_13')
    expect(snapshot.qualifiedCount).toBe(0)
  })
})
