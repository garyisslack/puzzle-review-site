import { describe, expect, it } from 'vitest'
import { colorSortSnapshot, comparePages, compareRedirects, guideIndexSlugs, needSnapshots, publishedGuides, publishedReviews, rankingPages, reviewJson, similarSlugs, unrankedReviews } from './site.ts'

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

  it('500 篇研究稿用默认分，广告样本分不进色块榜', () => {
    const notes = publishedReviews().filter((review) => review.origin === 'store-listing')
    expect(notes).toHaveLength(500)
    expect(notes.filter((review) => review.cohort === 'official_top100')).toHaveLength(100)
    expect(notes.filter((review) => review.analysisType === 'player_review_digest')).toHaveLength(235)
    expect(notes.every((review) => review.defaultScore && review.reviewType === 'full')).toBe(true)
    expect(notes.every((review) => review.dims.G === 70 && review.dims.F === 70 && review.dims.C === 70 && review.dims.U === 70)).toBe(true)
    const note = notes.find((review) => review.slug === 'meowdoku-ios-6761760135')
    expect(note?.dims.A).toBe(80)
    expect(note?.displayed).toBe('7.2')
    expect(note?.screenshotImpression?.score100).toBe(80)
    expect(note?.storeShots).toHaveLength(3)
    expect(note?.tags.no_forced_ads).toBe('unknown')
    expect(note?.bodyMarkdown).toContain('Player-review digest, not a playtest')
    expect(note?.chartRank).toBe(1)
    expect(note?.rationales.A).toContain('Sampled Ads score')
    expect(note?.seoTitle).toContain('Meowdoku')
    expect(note?.seoDescription?.length).toBeGreaterThan(40)
    expect(note?.storeShots?.[0]?.alt).toContain('Meowdoku')
    expect(similarSlugs('meowdoku-ios-6761760135')).toEqual([])
    expect(comparePages().some((page) => page.slug.includes('meowdoku'))).toBe(false)
    const plain = notes.find((review) => review.dims.A === 70 && review.cohort === 'unranked_candidate')
    expect(plain?.displayed).toBe('7.0')
    expect(plain?.screenshotImpression).toBeUndefined()
    const snapshot = colorSortSnapshot()
    if (!snapshot.ok) throw new Error('snapshot failed')
    expect(snapshot.snapshot.items.some((item) => item.gameId === 'app-6761760135')).toBe(false)
    const family = rankingPages().find((page) => page.definition.slug === 'region-placement-ios')
    expect(family?.snapshot.items.some((item) => item.gameId === 'app-6761760135' && item.displayedTenths === 72)).toBe(true)
    const json = JSON.stringify(reviewJson('meowdoku-ios-6761760135'))
    expect(json).not.toContain('aggregateRating')
    expect(json).not.toContain('ratingValue')
  })

  it('能计分的完整评测都进榜，初测和赞助不进', () => {
    const pages = rankingPages()
    const ranked = new Set(pages.flatMap((page) => page.snapshot.items.map((item) => item.gameId)))
    const all = pages.find((page) => page.definition.slug === 'reviewed-ios')
    expect(all?.snapshot.items.some((item) => item.gameId === 'app-6761760135')).toBe(true)
    expect(all?.snapshot.items.some((item) => item.gameId === 'prism')).toBe(true)
    expect(all?.snapshot.items.some((item) => item.gameId === 'sponsor' || item.gameId === 'initial' || item.gameId === 'prism-android')).toBe(false)
    expect(pages.find((page) => page.definition.slug === 'color-sort-ios')?.snapshot.items.some((item) => item.gameId.startsWith('app-'))).toBe(false)
    expect(pages.find((page) => page.definition.slug === 'color-sort-android')?.snapshot.items.map((item) => item.gameId)).toEqual(['prism-android'])
    const unranked = new Map(unrankedReviews().map((item) => [item.gameId, item.reason]))
    expect(unranked.get('initial')).toBe('not_full_review')
    expect(unranked.get('sponsor')).toBe('sponsored')
    expect(unranked.has('app-6761760135')).toBe(false)
    expect(unranked.size).toBe(2)
    for (const review of publishedReviews()) {
      if (review.sponsored || review.reviewType !== 'full') continue
      expect(ranked.has(review.gameId)).toBe(true)
    }
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
