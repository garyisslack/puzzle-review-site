import { describe, expect, it } from 'vitest'
import { reviews, type CatalogReview } from '../data/catalog.ts'
import { candidates, comparePages, guideIndexSlugs, needSnapshots, publishedGuides, publishedReviews, rankingDefinitions, rankingPages, reviewJson, reviewPage, reviewPageCount, reviewPagePath, sitemapSections } from './site.ts'

describe('正式发布与 SEO 内容边界', () => {
  it('保留 500 篇真实研究稿，演示及未发布数据不进入公开内容', () => {
    const notes = publishedReviews()
    expect(notes).toHaveLength(500)
    expect(notes.every((review) => review.origin !== 'demo' && review.status === 'published')).toBe(true)
    expect(notes.filter((review) => review.analysisType === 'player_review_digest')).toHaveLength(235)
    expect(notes.every((review) => review.displayed === null && review.compositeTenths === null)).toBe(true)
    expect(notes.find((review) => review.slug === 'meowdoku-ios-6761760135')?.dims.A).toBe(80)
    expect(candidates()).toEqual([])
  })

  it('研究稿不输出虚构评分，演示页没有结构化数据', () => {
    expect(reviewJson('prism-pocket-sort')).toBeNull()
    const json = JSON.stringify(reviewJson('meowdoku-ios-6761760135'))
    expect(json).toContain('SoftwareApplication')
    expect(json).not.toContain('ratingValue')
    expect(json).not.toContain('aggregateRating')
  })

  it('当前没有正式榜单、演示比较页或演示攻略', () => {
    expect(rankingPages()).toEqual([])
    expect(rankingDefinitions().every((definition) => definition.minQualified >= 5)).toBe(true)
    expect(comparePages()).toEqual([])
    expect(publishedGuides()).toEqual([])
    expect(guideIndexSlugs()).toEqual([])
    expect(needSnapshots()).toEqual([])
  })

  it('目录分页完整覆盖 500 篇文章，无重复，拒绝越界页', () => {
    expect(reviewPageCount()).toBe(20)
    const pages = Array.from({ length: reviewPageCount() }, (_, index) => reviewPage(index + 1))
    expect(pages.every((page) => page.length === 25)).toBe(true)
    expect(new Set(pages.flat().map((review) => review.slug)).size).toBe(500)
    expect(reviewPagePath(1)).toBe('/reviews/')
    expect(reviewPagePath(2)).toBe('/reviews/page/2/')
    expect(() => reviewPage(0)).toThrow()
    expect(() => reviewPage(21)).toThrow()
  })

  it('sitemap 只包含公开内容和独立 canonical 的分页', () => {
    const sections = sitemapSections()
    expect(sections.reviews).toHaveLength(500)
    expect(sections.rankings).toEqual([])
    const json = JSON.stringify(sections)
    expect(json).not.toContain('prism-pocket-sort')
    expect(json).not.toContain('/compare/')
    expect(json).not.toContain('/guides/')
    expect(json).not.toContain('/authors/samira-adel/')
    expect(json).not.toContain('/reviews/search/')
    expect(sections.pages.filter((entry) => entry.loc.includes('/reviews/page/'))).toHaveLength(19)
  })

  it('真实实测至少五款才恢复分类榜；草稿、默认分和演示仍不能混入', () => {
    const fixture = reviews[0]!
    const real: CatalogReview[] = Array.from({ length: 5 }, (_, index) => ({
      ...fixture, gameId: `test-real-${index}`, slug: `test-real-${index}`, name: `Test real ${index}`,
      origin: undefined, defaultScore: false, analysisType: undefined, mechanicFamily: 'test-family',
    }))
    const originalLength = reviews.length
    try {
      reviews.push(...real.slice(0, 4))
      expect(rankingPages().find((page) => page.definition.mechanicFamily === 'test-family')).toBeUndefined()
      reviews.push(real[4]!, { ...real[0]!, gameId: 'test-draft', slug: 'test-draft', status: 'draft' })
      const page = rankingPages().find((entry) => entry.definition.mechanicFamily === 'test-family')
      expect(page?.snapshot.qualifiedCount).toBe(5)
      expect(page?.snapshot.items.every((item) => item.gameId.startsWith('test-real-'))).toBe(true)
      expect(publishedReviews().some((review) => review.slug === 'test-draft')).toBe(false)
      expect(reviewJson(real[0]!.slug)?.review).toBeDefined()
    } finally {
      reviews.splice(originalLength)
    }
  })
})
