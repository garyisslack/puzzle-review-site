import { describe, expect, it } from 'vitest'
import { colorSortSnapshot, comparePages, compareRedirects, guideIndexSlugs, needSnapshots, publishedGuides, publishedReviews, reviewJson, similarSlugs } from './site.ts'

describe('站点内容遵守计分和发布规则', () => {
  it('iOS 色块榜是 1、2、2、4，赞助页不在里面', () => {
    const snapshot = colorSortSnapshot()
    expect(snapshot.ok).toBe(true)
    if (!snapshot.ok) return
    expect(snapshot.snapshot.items.map((item) => [item.rank, item.name])).toEqual([
      [1, 'Prism Pocket Sort'],
      [2, 'Marblesque'],
      [2, 'Tile Path Daily'],
      [4, 'Hex Cascade'],
    ])
    expect(snapshot.snapshot.items.some((item) => item.name.includes('Sponsored'))).toBe(false)
  })

  it('初测没有综合分，Android 不进 iOS 榜', () => {
    const initial = publishedReviews().find((review) => review.slug === 'sample-initial-entry')
    expect(initial?.displayed).toBeNull()
    const snapshot = colorSortSnapshot()
    if (!snapshot.ok) throw new Error('snapshot failed')
    expect(snapshot.snapshot.items.some((item) => item.gameId === 'prism-android')).toBe(false)
  })

  it('需求榜不满 5 款就不生成', () => {
    expect(needSnapshots()).toEqual([])
  })

  it('同类完整评测够 2 款才有相似页，比较页只保留字母序', () => {
    expect(similarSlugs('prism-pocket-sort').length).toBeGreaterThanOrEqual(2)
    expect(similarSlugs('sample-initial-entry')).toEqual([])
    const pages = comparePages()
    expect(pages.some((page) => page.slug === 'prism-pocket-sort-vs-tile-path-daily')).toBe(true)
    expect(pages.some((page) => page.slug.includes('sample-initial'))).toBe(false)
    expect(compareRedirects()['/compare/tile-path-daily-vs-prism-pocket-sort']).toBe('/compare/prism-pocket-sort-vs-tile-path-daily/')
  })

  it('赞助页的结构化数据没有 Review', () => {
    const node = reviewJson('sponsored-sort-deluxe')
    expect(node?.review).toBeUndefined()
    expect(JSON.stringify(reviewJson('prism-pocket-sort'))).not.toContain('aggregateRating')
  })

  it('两篇已核实攻略才生成汇总', () => {
    expect(publishedGuides().map((guide) => guide.slug).sort()).toEqual(['early-bottles', 'mid-board'])
    expect(guideIndexSlugs()).toEqual(['prism-pocket-sort'])
  })
})
