import { describe, expect, it } from 'vitest'
import {
  acceptGuideSubmission,
  ageGate,
  articleJsonLd,
  assertNoAggregateRating,
  canGenerateCompare,
  canGenerateGuideIndex,
  canGenerateNeedList,
  canGenerateSimilar,
  canPublishGuide,
  canPublishReview,
  comparePair,
  emailRetentionExpired,
  hashIp,
  ipHashRetentionExpired,
  rankingFilterHeaders,
  itemListJsonLd,
  metaDescription,
  organizationJsonLd,
  reviewJsonLd,
  websiteJsonLd,
  robotsFor,
  sanitizeGuideMarkdown,
  sitemapXml,
} from './index.ts'

const longBody = `${'Move the red bottle onto the empty slot, then clear the top row. '.repeat(12)}No names.`

const adult = {
  birthYear: 1990,
  birthMonth: 1,
  gameSlug: 'prism-pocket-sort',
  platform: 'ios' as const,
  appVersion: '1.4.2',
  levelRange: 'Levels 1-20',
  title: 'Early bottles without boosters',
  body: `See the walkthrough. ${longBody} Visit https://spam.example and <script>alert(1)</script> [click](https://spam.example).`,
  penName: 'BottleNote',
  imageCount: 2,
  licenseAccepted: true,
  aiAssisted: false,
}

describe('TC-SEO urls', () => {
  it('TC-SEO-01 筛选参数 noindex，canonical 回到榜单本身', () => {
    const filtered = rankingFilterHeaders(new URL('https://example.com/rankings/color-sort-ios/?offline=yes'))
    expect(filtered).toEqual({ robots: 'noindex,follow', canonicalPath: '/rankings/color-sort-ios/' })
    expect(robotsFor({ kind: 'ranking-query', indexable: true })).toBe('noindex,follow')
    const plain = rankingFilterHeaders(new URL('https://example.com/rankings/color-sort-ios/'))
    expect(plain.robots).toBe('index,follow')
  })

  it('TC-SEO-02 比较页按字母序固定，反序需要 301', () => {
    expect(comparePair('prism-pocket-sort', 'tile-path-daily')).toEqual({
      canonicalSlug: 'prism-pocket-sort-vs-tile-path-daily',
      redirectFrom: null,
    })
    expect(comparePair('tile-path-daily', 'prism-pocket-sort')).toEqual({
      canonicalSlug: 'prism-pocket-sort-vs-tile-path-daily',
      redirectFrom: 'tile-path-daily-vs-prism-pocket-sort',
    })
  })

  it('投稿页和预览页 noindex', () => {
    expect(robotsFor({ kind: 'submit', indexable: true })).toBe('noindex,follow')
    expect(robotsFor({ kind: 'preview', indexable: true })).toBe('noindex,follow')
  })
})

describe('JSON-LD', () => {
  it('首页组织信息和榜单列表不写 aggregateRating', () => {
    const org = organizationJsonLd({ siteUrl: 'https://puzzlereviewlab.com', name: 'puzzlereviewlab' })
    const site = websiteJsonLd({ siteUrl: 'https://puzzlereviewlab.com', name: 'puzzlereviewlab' })
    const list = itemListJsonLd({
      siteUrl: 'https://puzzlereviewlab.com',
      path: '/rankings/sudoku-logic-ios/',
      name: 'Sudoku Logic',
      items: [{ name: 'Meowdoku!', path: '/reviews/meowdoku-ios-6761760135/' }],
    })
    expect(org).toMatchObject({ '@type': 'Organization', name: 'puzzlereviewlab' })
    expect(site).toMatchObject({ '@type': 'WebSite', url: 'https://puzzlereviewlab.com/' })
    expect(list).toMatchObject({ '@type': 'ItemList', numberOfItems: 1 })
    assertNoAggregateRating(org)
    assertNoAggregateRating(site)
    assertNoAggregateRating(list)
    expect(metaDescription('Short note.')).toBe('Short note.')
    expect(metaDescription('Word '.repeat(80)).length).toBeLessThanOrEqual(160)
  })

  it('评测用本站分数，不写 aggregateRating', () => {
    const node = reviewJsonLd({
      siteUrl: 'https://example.com',
      slug: 'prism-pocket-sort',
      name: 'Prism Pocket Sort',
      platform: 'iOS',
      operatingSystem: 'iOS',
      priceUsd: 0,
      description: 'A color-sort review.',
      authorName: 'Samira Adel',
      authorSlug: 'samira-adel',
      datePublished: '2026-10-02',
      displayedScore: '7.5',
      sponsored: false,
    })
    assertNoAggregateRating(node)
    expect(JSON.stringify(node)).not.toContain('aggregateRating')
    expect(node.review).toMatchObject({
      reviewRating: { ratingValue: '7.5', bestRating: 10, worstRating: 0 },
    })
  })

  it('赞助内容不输出 Review', () => {
    const node = reviewJsonLd({
      siteUrl: 'https://example.com',
      slug: 'sponsored-sort',
      name: 'Sponsored Sort',
      platform: 'iOS',
      operatingSystem: 'iOS',
      priceUsd: 0,
      description: 'Sponsored.',
      authorName: 'Samira Adel',
      authorSlug: 'samira-adel',
      datePublished: '2026-10-02',
      displayedScore: '9.0',
      sponsored: true,
    })
    expect(node.review).toBeUndefined()
    expect(JSON.stringify(node)).not.toContain('"Review"')
  })

  it('攻略用 Article，作者是笔名，编辑是核实人', () => {
    const node = articleJsonLd({
      siteUrl: 'https://example.com',
      path: '/guides/prism-pocket-sort/early-bottles/',
      headline: 'Early bottles',
      datePublished: '2026-11-01',
      dateModified: '2026-11-08',
      authorName: 'BottleNote',
      editorName: 'Samira Adel',
    })
    expect(node['@type']).toBe('Article')
    expect(JSON.stringify(node)).not.toContain('HowTo')
  })
})

describe('sitemap', () => {
  it('lastmod 必须是内容日期，拒绝把构建时间戳直接写进去', () => {
    const xml = sitemapXml([{ loc: 'https://example.com/reviews/prism-pocket-sort/', lastmod: '2026-10-02' }])
    expect(xml).toContain('<lastmod>2026-10-02</lastmod>')
    expect(() => sitemapXml([{ loc: 'https://example.com/', lastmod: new Date().toISOString() }])).toThrow(/lastmod/)
  })
})

describe('薄内容闸门', () => {
  it('相似、比较、需求榜、攻略汇总按门槛决定是否生成', () => {
    expect(canGenerateSimilar(1)).toBe(false)
    expect(canGenerateSimilar(2)).toBe(true)
    expect(canGenerateCompare({ aFull: true, bFull: false, sameFamily: true })).toBe(false)
    expect(canGenerateCompare({ aFull: true, bFull: true, sameFamily: false })).toBe(false)
    expect(canGenerateCompare({ aFull: true, bFull: true, sameFamily: true })).toBe(true)
    expect(canGenerateNeedList(4)).toBe(false)
    expect(canGenerateNeedList(5)).toBe(true)
    expect(canGenerateGuideIndex(1)).toBe(false)
    expect(canGenerateGuideIndex(2)).toBe(true)
  })

  it('完整评测缺边界、商店链接或作者不能发布', () => {
    const result = canPublishReview({
      reviewType: 'full',
      dims: { G: 80, A: 70, F: 80, C: 60, U: null },
      rationales: {},
      publicEvidenceCount: 0,
      sponsored: false,
    })
    expect(result.errors).toEqual(expect.arrayContaining(['missing testing boundaries', 'missing store url', 'missing author']))
    expect(result.errors).toContain('full review is missing a dimension score')
  })

  it('未核实、过短、重复关卡或未清理个人信息的攻略不发布', () => {
    const draft = {
      status: 'verified' as const,
      verifiedOnVersion: '1.4.2',
      body: longBody,
      gameSlug: 'prism-pocket-sort',
      platform: 'ios' as const,
      levelRange: 'Levels 1-20',
      piiCleared: true,
    }
    expect(canPublishGuide({ ...draft, status: 'pending' }, []).errors).toContain('guide is not verified')
    expect(canPublishGuide({ ...draft, body: 'too short' }, []).errors).toContain('guide body is too short')
    expect(canPublishGuide(draft, [{ gameSlug: 'prism-pocket-sort', platform: 'ios', levelRange: 'Levels 1-20' }]).errors).toContain(
      'duplicate level range',
    )
    expect(canPublishGuide({ ...draft, piiCleared: false }, []).errors).toContain('personal information was not cleared')
    expect(canPublishGuide(draft, []).errors).toEqual([])
  })
})

describe('攻略投稿', () => {
  const now = new Date('2026-11-08T00:00:00.000Z')

  it('未满 13 岁不返回任何投稿内容', () => {
    const decision = acceptGuideSubmission(
      { ...adult, birthYear: 2014, birthMonth: 1, contactEmail: 'kid@example.com', penName: 'Real Name' },
      { now, catalogSlugs: ['prism-pocket-sort'], submissionsToday: 0 },
    )
    expect(decision).toEqual({ action: 'block_under_13' })
    expect(JSON.stringify(decision)).not.toContain('kid@example.com')
    expect(JSON.stringify(decision)).not.toContain('Real Name')
    expect(JSON.stringify(decision)).not.toContain('walkthrough')
  })

  it('年龄：已过 13 岁生日放行，生日当月仍拦截', () => {
    expect(ageGate(2013, 10, now)).toBe('allow')
    expect(ageGate(2013, 11, now)).toBe('block')
    expect(ageGate(2013, 12, now)).toBe('block')
  })

  it('剥掉 HTML 和外链，超限或未知游戏拒绝', () => {
    const decision = acceptGuideSubmission(adult, { now, catalogSlugs: ['prism-pocket-sort'], submissionsToday: 0 })
    expect(decision.action).toBe('queue')
    if (decision.action !== 'queue') return
    expect(decision.submission.body).not.toContain('http')
    expect(decision.submission.body).not.toContain('<script>')
    expect(decision.submission.body).toContain('Move the red bottle')
    expect(acceptGuideSubmission(adult, { now, catalogSlugs: ['prism-pocket-sort'], submissionsToday: 3 }).action).toBe('reject')
    expect(acceptGuideSubmission({ ...adult, gameSlug: 'not-a-game' }, { now, catalogSlugs: ['prism-pocket-sort'], submissionsToday: 0 })).toMatchObject({
      action: 'reject',
    })
  })

  it('正文里的邮箱和电话会被标出，图片计数超过 6 张拒绝', () => {
    const flagged = acceptGuideSubmission(
      { ...adult, body: `${longBody} mail me at helper@example.com or 415-555-0134.` },
      { now, catalogSlugs: ['prism-pocket-sort'], submissionsToday: 0 },
    )
    expect(flagged.action).toBe('queue')
    if (flagged.action !== 'queue') return
    expect(flagged.submission.piiFlags).toEqual(expect.arrayContaining(['email', 'phone']))
    const images = acceptGuideSubmission({ ...adult, imageCount: 7 }, { now, catalogSlugs: ['prism-pocket-sort'], submissionsToday: 0 })
    expect(images).toMatchObject({ action: 'reject' })
  })

  it('sanitize 去掉链接语法', () => {
    expect(sanitizeGuideMarkdown('See [this](https://evil.test) and https://evil.test')).toBe('See this and')
  })

  it('邮箱保留 30 天，IP 哈希保留 7 天，哈希不等于原 IP', async () => {
    const processed = new Date('2026-10-01T00:00:00.000Z')
    expect(emailRetentionExpired(processed, new Date('2026-10-30T00:00:00.000Z'))).toBe(false)
    expect(emailRetentionExpired(processed, new Date('2026-10-31T00:00:00.000Z'))).toBe(true)
    const stored = new Date('2026-11-01T00:00:00.000Z')
    expect(ipHashRetentionExpired(stored, new Date('2026-11-07T00:00:00.000Z'))).toBe(false)
    expect(ipHashRetentionExpired(stored, new Date('2026-11-08T00:00:00.000Z'))).toBe(true)
    const hashed = await hashIp('203.0.113.5', 'salt')
    expect(hashed).not.toContain('203.0.113.5')
    expect(hashed).toHaveLength(64)
  })
})
