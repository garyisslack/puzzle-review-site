import { describe, expect, it } from 'vitest'
import { assertDimensionNoted, assertTagVerification, buildSnapshot, keepLastGoodSnapshot } from './index.ts'
import type { RankCandidate, RankingDefinition } from './index.ts'

const base = {
  platform: 'ios' as const,
  mechanicFamily: 'color-sort',
  reviewType: 'full' as const,
  status: 'published' as const,
  sponsored: false,
}

const games: RankCandidate[] = [
  { ...base, gameId: 'prism', name: 'Prism Pocket Sort', dims: { G: 80, A: 70, F: 80, C: 60, U: 80 } },
  { ...base, gameId: 'marblesque', name: 'Marblesque', dims: { G: 75, A: 70, F: 75, C: 65, U: 70 } },
  { ...base, gameId: 'tile', name: 'Tile Path Daily', dims: { G: 75, A: 70, F: 75, C: 65, U: 70 } },
  { ...base, gameId: 'hex', name: 'Hex Cascade', dims: { G: 70, A: 65, F: 70, C: 60, U: 70 } },
]

const definition: RankingDefinition = {
  slug: 'color-sort-ios',
  title: "Compared color-sort games we've fully reviewed (iOS)",
  mechanicFamily: 'color-sort',
  platform: 'ios',
  minQualified: 1,
}

describe('TC-RANK', () => {
  it('TC-RANK-01 并列名次为 1、2、2、4，同分只按名字排显示顺序', () => {
    const result = buildSnapshot(definition, games, '2026-11-08T00:00:00.000Z')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.snapshot.items.map((item) => [item.rank, item.name, item.displayedTenths])).toEqual([
      [1, 'Prism Pocket Sort', 75],
      [2, 'Marblesque', 72],
      [2, 'Tile Path Daily', 72],
      [4, 'Hex Cascade', 68],
    ])
    expect(result.snapshot.items[1]?.tieGroup).toBe(result.snapshot.items[2]?.tieGroup)
    expect(result.snapshot.items[0]?.tieGroup).not.toBe(result.snapshot.items[1]?.tieGroup)
  })

  it('TC-RANK-02 初测、缺维、过期、下架、草稿、跨平台、跨类别都不进名次，也不被编成 0 分', () => {
    const extra: RankCandidate[] = [
      { ...base, gameId: 'initial', name: 'Sample Initial', reviewType: 'initial', dims: games[0]!.dims },
      { ...base, gameId: 'partial', name: 'Partial', dims: { ...games[0]!.dims, U: null } },
      { ...base, gameId: 'old', name: 'Old Build', status: 'expired', dims: games[0]!.dims },
      { ...base, gameId: 'gone', name: 'Gone', status: 'withdrawn', dims: games[0]!.dims },
      { ...base, gameId: 'draft', name: 'Draft', status: 'draft', dims: games[0]!.dims },
      { ...base, gameId: 'android', name: 'Prism Android', platform: 'android', dims: { G: 100, A: 100, F: 100, C: 100, U: 100 } },
      { ...base, gameId: 'screw', name: 'Screw Loose', mechanicFamily: 'screw-puzzle', dims: games[0]!.dims },
    ]
    const result = buildSnapshot(definition, [...games, ...extra], '2026-11-08T00:00:00.000Z')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.snapshot.items.map((item) => item.gameId)).toEqual(['prism', 'marblesque', 'tile', 'hex'])
    expect(result.snapshot.excluded.map((item) => [item.gameId, item.reason])).toEqual([
      ['draft', 'not_published'],
      ['gone', 'withdrawn'],
      ['old', 'expired'],
      ['partial', 'missing_dimension'],
      ['android', 'platform_mismatch'],
      ['initial', 'not_full_review'],
      ['screw', 'family_mismatch'],
    ])
    expect(JSON.stringify(result.snapshot.excluded)).not.toContain('"displayedTenths":0')
  })

  it('TC-RANK-03 合格数不够时不能叫 Top N，低于 minQualified 不发布', () => {
    const top = buildSnapshot({ ...definition, title: 'Top 10 color-sort games' }, games, '2026-11-08')
    expect(top).toMatchObject({ ok: false, code: 'top_n_mismatch', qualifiedCount: 4 })
    const thin = buildSnapshot({ ...definition, minQualified: 5 }, games, '2026-11-08')
    expect(thin).toMatchObject({ ok: false, code: 'below_minimum', qualifiedCount: 4 })
    const previous = buildSnapshot(definition, games, '2026-11-01')
    expect(previous.ok).toBe(true)
    if (!previous.ok) return
    expect(keepLastGoodSnapshot(previous.snapshot, thin)).toEqual(previous.snapshot)
  })

  it('TC-RANK-04 iOS 与 Android 分数不合并', () => {
    const android = buildSnapshot(
      { ...definition, slug: 'color-sort-android', platform: 'android', title: 'Color-sort on Android' },
      [
        ...games,
        { ...base, gameId: 'prism-android', name: 'Prism Pocket Sort', platform: 'android', dims: games[0]!.dims },
      ],
      '2026-11-08',
    )
    expect(android.ok).toBe(true)
    if (!android.ok) return
    expect(android.snapshot.items).toHaveLength(1)
    expect(android.snapshot.items[0]?.gameId).toBe('prism-android')
  })

  it('需求榜只收标签为 yes 的游戏，unknown 和 no 排除', () => {
    const need: RankingDefinition = {
      ...definition,
      slug: 'no-forced-ads-ios',
      title: 'Color-sort games with no forced ads',
      requiredTag: 'no_forced_ads',
      minQualified: 1,
    }
    const tagged = games.map((game, index) => ({
      ...game,
      tags: { no_forced_ads: index === 0 ? ('yes' as const) : index === 1 ? ('no' as const) : ('unknown' as const) },
    }))
    const result = buildSnapshot(need, tagged, '2026-11-08')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.snapshot.items.map((item) => item.gameId)).toEqual(['prism'])
    expect(result.snapshot.excluded.filter((item) => item.reason === 'tag_not_yes').map((item) => item.gameId).sort()).toEqual([
      'hex',
      'marblesque',
      'tile',
    ])
  })
})

describe('TC-BIZ-01 赞助内容', () => {
  it('加一份高分赞助评测后，榜单快照与之前完全相同', () => {
    const before = buildSnapshot(definition, games, '2026-11-08T00:00:00.000Z')
    const sponsored: RankCandidate = {
      ...base,
      gameId: 'sponsor',
      name: 'Sponsored Sort Deluxe',
      sponsored: true,
      dims: { G: 100, A: 100, F: 100, C: 100, U: 100 },
    }
    const after = buildSnapshot(definition, [...games, sponsored], '2026-11-08T00:00:00.000Z')
    expect(before.ok && after.ok).toBe(true)
    if (!before.ok || !after.ok) return
    expect(after.snapshot.items).toEqual(before.snapshot.items)
    expect(after.snapshot.qualifiedCount).toBe(before.snapshot.qualifiedCount)
    expect(after.snapshot.excluded.some((item) => item.gameId === 'sponsor' && item.reason === 'sponsored')).toBe(true)
  })
})

describe('标签与维度理由', () => {
  it('no_forced_ads=yes 必须在线核实', () => {
    expect(() => assertTagVerification('no_forced_ads', 'yes', false)).toThrow(/verifiedOnline/)
    expect(() => assertTagVerification('no_forced_ads', 'yes', true)).not.toThrow()
    expect(() => assertTagVerification('no_forced_ads', 'no', false)).not.toThrow()
    expect(() => assertTagVerification('plays_offline', 'unknown', false)).not.toThrow()
  })

  it('有分的维度必须有理由', () => {
    expect(() => assertDimensionNoted(80, '  ')).toThrow(/rationale/)
    expect(() => assertDimensionNoted(null, undefined)).not.toThrow()
    expect(() => assertDimensionNoted(80, 'Steady loop')).not.toThrow()
  })
})
