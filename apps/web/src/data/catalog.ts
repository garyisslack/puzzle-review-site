import type { Dims, Platform, ReviewStatus, ReviewType, TagState } from '@puzzle/scoring'
import { storeListings } from './store-listings.ts'

export type CatalogReview = {
  gameId: string
  slug: string
  name: string
  developer: string
  mechanicFamily: string
  platform: Platform
  reviewType: ReviewType
  status: ReviewStatus
  sponsored: boolean
  appVersion: string
  osVersion: string
  testedFrom: string
  testedTo: string
  publishedOn: string
  testerRegion: string
  storeLocale: string
  dims: Dims
  rationales: Partial<Record<keyof Dims, string>>
  testingBoundaries: string
  storeUrl: string
  priceUsd: number
  authorSlug: string
  publicEvidenceCount: number
  tags: Record<string, TagState>
  verifiedOnline: boolean
  summary: string
  verdict: string
  familyNotes: string[]
  faqs: { q: string; a: string }[]
  origin?: 'demo' | 'store-listing'
  chartRank?: number
  aiAssisted?: boolean
  analysisType?: 'player_review_digest' | 'store_listing_analysis'
  cohort?: 'official_top100' | 'unranked_candidate'
  bodyMarkdown?: string
  screenshotImpression?: {
    score100: number
    confidence: 'low' | 'medium'
    rationale: string
  }
  defaultScore?: boolean
  storeShots?: { src: string; label: string }[]
}

const colorDims = {
  prism: { G: 80, A: 70, F: 80, C: 60, U: 80 },
  marble: { G: 75, A: 70, F: 75, C: 65, U: 70 },
  tile: { G: 75, A: 70, F: 75, C: 65, U: 70 },
  hex: { G: 70, A: 65, F: 70, C: 60, U: 70 },
} satisfies Record<string, Dims>

const rationale = {
  G: 'The loop is readable and the early levels teach one rule at a time.',
  A: 'Forced interstitials show up between levels, not on top of a move. Rewarded ads are optional.',
  F: 'The tested range is solvable without paying. Boosters exist but were not required.',
  C: 'There is a large level count, with more variety after the opening band.',
  U: 'No crash in the tested sessions. Leaving during an ad and coming back kept the board.',
}

export const authors = [
  {
    slug: 'samira-adel',
    name: 'Samira Adel',
    role: 'Reviewer',
    bio: 'Plays mobile puzzle games on iOS and Android and writes the dimension notes for this site.',
  },
  {
    slug: 'listing-desk',
    name: 'Listing desk',
    role: 'Store research',
    bio: 'Writes initial notes from the public US App Store listing. These notes are not playtests and have no editorial score.',
  },
] as const

export const reviews: CatalogReview[] = [
  ...storeListings,
  {
    gameId: 'prism',
    slug: 'prism-pocket-sort',
    name: 'Prism Pocket Sort',
    developer: 'Northwind Games',
    mechanicFamily: 'color-sort',
    platform: 'ios',
    reviewType: 'full',
    status: 'published',
    sponsored: false,
    origin: 'demo',
    appVersion: '1.4.2',
    osVersion: 'iOS 18.6',
    testedFrom: '2026-09-28',
    testedTo: '2026-10-02',
    publishedOn: '2026-10-02',
    testerRegion: 'US',
    storeLocale: 'en-US',
    dims: colorDims.prism,
    rationales: rationale,
    testingBoundaries: 'Levels 1–60. No purchases. US App Store, Wi-Fi on.',
    storeUrl: 'https://apps.apple.com/us/app/prism-pocket-sort/id000000001',
    priceUsd: 0,
    authorSlug: 'samira-adel',
    publicEvidenceCount: 3,
    tags: { no_forced_ads: 'no', plays_offline: 'yes', one_handed: 'yes', short_rounds: 'yes', no_timers: 'yes' },
    verifiedOnline: true,
    summary: 'A clear color-sort loop. Ads sit between levels, and the opening band does not ask for money.',
    verdict: 'Worth playing if you want a calm sort puzzle and can ignore the interstitial between levels.',
    familyNotes: ['Store age rating: 4+', 'Has in-app purchases', 'Forced ads between some levels', 'No chat'],
    faqs: [
      { q: 'Does Prism Pocket Sort have forced ads?', a: 'Yes. Full-screen ads appeared between levels in the tested range, not on top of a move.' },
      { q: 'Can you play offline?', a: 'Yes. After the first launch, levels 1–60 continued on a device in airplane mode.' },
    ],
  },
  {
    gameId: 'marblesque',
    slug: 'marblesque',
    name: 'Marblesque',
    developer: 'Harbor Play',
    mechanicFamily: 'color-sort',
    platform: 'ios',
    reviewType: 'full',
    status: 'published',
    sponsored: false,
    origin: 'demo',
    appVersion: '2.0.1',
    osVersion: 'iOS 18.6',
    testedFrom: '2026-10-03',
    testedTo: '2026-10-06',
    publishedOn: '2026-10-06',
    testerRegion: 'US',
    storeLocale: 'en-US',
    dims: colorDims.marble,
    rationales: rationale,
    testingBoundaries: 'Levels 1–60. No purchases. US App Store.',
    storeUrl: 'https://apps.apple.com/us/app/marblesque/id000000002',
    priceUsd: 0,
    authorSlug: 'samira-adel',
    publicEvidenceCount: 1,
    tags: { no_forced_ads: 'unknown', plays_offline: 'unknown', one_handed: 'yes', short_rounds: 'yes', no_timers: 'yes' },
    verifiedOnline: false,
    summary: 'Another bottle sort with a slightly busier board and the same score band as Tile Path Daily.',
    verdict: 'Fine if you already like this mechanic. Nothing here is paid placement.',
    familyNotes: ['Store age rating: 4+', 'In-app purchases present', 'Chat: not observed'],
    faqs: [{ q: 'Is Marblesque a paid placement?', a: 'No. The score is from the same method as every other full review.' }],
  },
  {
    gameId: 'tile',
    slug: 'tile-path-daily',
    name: 'Tile Path Daily',
    developer: 'Lumen Bits',
    mechanicFamily: 'color-sort',
    platform: 'ios',
    reviewType: 'full',
    status: 'published',
    sponsored: false,
    origin: 'demo',
    appVersion: '3.2.0',
    osVersion: 'iOS 18.6',
    testedFrom: '2026-10-04',
    testedTo: '2026-10-07',
    publishedOn: '2026-10-07',
    testerRegion: 'US',
    storeLocale: 'en-US',
    dims: colorDims.tile,
    rationales: rationale,
    testingBoundaries: 'Levels 1–60. No purchases. US App Store.',
    storeUrl: 'https://apps.apple.com/us/app/tile-path-daily/id000000003',
    priceUsd: 0,
    authorSlug: 'samira-adel',
    publicEvidenceCount: 2,
    tags: { no_forced_ads: 'yes', plays_offline: 'no', one_handed: 'unknown', short_rounds: 'yes', no_timers: 'unknown' },
    verifiedOnline: true,
    summary: 'A daily color-sort with no forced ads in the tested band, and a score tied with Marblesque.',
    verdict: 'The calmer ad pattern is the reason to pick it over Prism, not a higher score.',
    familyNotes: ['Store age rating: 4+', 'No forced ads observed in levels 1–60', 'Online check passed'],
    faqs: [{ q: 'Why is Tile Path Daily tied?', a: 'It and Marblesque land on the same displayed score, 7.2. Tied games share a rank.' }],
  },
  {
    gameId: 'hex',
    slug: 'hex-cascade',
    name: 'Hex Cascade',
    developer: 'Paper North',
    mechanicFamily: 'color-sort',
    platform: 'ios',
    reviewType: 'full',
    status: 'published',
    sponsored: false,
    origin: 'demo',
    appVersion: '1.1.0',
    osVersion: 'iOS 18.6',
    testedFrom: '2026-10-08',
    testedTo: '2026-10-09',
    publishedOn: '2026-10-09',
    testerRegion: 'US',
    storeLocale: 'en-US',
    dims: colorDims.hex,
    rationales: rationale,
    testingBoundaries: 'Levels 1–60. No purchases. US App Store.',
    storeUrl: 'https://apps.apple.com/us/app/hex-cascade/id000000004',
    priceUsd: 0,
    authorSlug: 'samira-adel',
    publicEvidenceCount: 1,
    tags: { no_forced_ads: 'no', plays_offline: 'yes', one_handed: 'no', short_rounds: 'no', no_timers: 'yes' },
    verifiedOnline: true,
    summary: 'A slower color-sort. Playable, with more interruptions than the games above it.',
    verdict: 'Below the tied pair on the displayed score. Still a full review, not a leftover.',
    familyNotes: ['Store age rating: 9+', 'Forced ads observed'],
    faqs: [{ q: 'Why is Hex Cascade rank 4?', a: 'Two games share rank 2, so the next rank is 4.' }],
  },
  {
    gameId: 'initial',
    slug: 'sample-initial-entry',
    name: 'Sample Initial Entry',
    developer: 'Unverified Studio',
    mechanicFamily: 'color-sort',
    platform: 'ios',
    reviewType: 'initial',
    status: 'published',
    sponsored: false,
    origin: 'demo',
    appVersion: '1.0.0',
    osVersion: 'iOS 18.6',
    testedFrom: '2026-10-10',
    testedTo: '2026-10-10',
    publishedOn: '2026-10-10',
    testerRegion: 'US',
    storeLocale: 'en-US',
    dims: { G: 70, A: null, F: null, C: null, U: null },
    rationales: { G: 'One short session. Not enough to score the other dimensions.' },
    testingBoundaries: '20 minutes. Not a full review.',
    storeUrl: 'https://apps.apple.com/us/app/sample-initial-entry/id000000005',
    priceUsd: 0,
    authorSlug: 'samira-adel',
    publicEvidenceCount: 0,
    tags: { no_forced_ads: 'unknown', plays_offline: 'unknown', one_handed: 'unknown', short_rounds: 'unknown', no_timers: 'unknown' },
    verifiedOnline: false,
    summary: 'An initial look only. There is no composite score and it is not on a numbered list.',
    verdict: 'Not scored. A full review has to cover every dimension.',
    familyNotes: ['Not enough observation for a parent note yet.'],
    faqs: [{ q: 'Why is there no score?', a: 'Initial notes never receive a composite score, even if one dimension was filled in.' }],
  },
  {
    gameId: 'sponsor',
    slug: 'sponsored-sort-deluxe',
    name: 'Sponsored Sort Deluxe',
    developer: 'Paid Partner',
    mechanicFamily: 'color-sort',
    platform: 'ios',
    reviewType: 'full',
    status: 'published',
    sponsored: true,
    origin: 'demo',
    appVersion: '9.9.0',
    osVersion: 'iOS 18.6',
    testedFrom: '2026-10-11',
    testedTo: '2026-10-11',
    publishedOn: '2026-10-11',
    testerRegion: 'US',
    storeLocale: 'en-US',
    dims: { G: 100, A: 100, F: 100, C: 100, U: 100 },
    rationales: rationale,
    testingBoundaries: 'Paid placement. Excluded from every ranking.',
    storeUrl: 'https://apps.apple.com/us/app/sponsored-sort-deluxe/id000000006',
    priceUsd: 0,
    authorSlug: 'samira-adel',
    publicEvidenceCount: 1,
    tags: { no_forced_ads: 'yes', plays_offline: 'yes', one_handed: 'yes', short_rounds: 'yes', no_timers: 'yes' },
    verifiedOnline: true,
    summary: 'This page is a paid placement. It is labeled, and it is not part of any ranking.',
    verdict: 'Sponsored. The numbers on this page are not used for lists.',
    familyNotes: ['Sponsored placement.'],
    faqs: [{ q: 'Does this affect the ranking?', a: 'No. Sponsored pages are left out of every snapshot.' }],
  },
  {
    gameId: 'prism-android',
    slug: 'prism-pocket-sort-android',
    name: 'Prism Pocket Sort',
    developer: 'Northwind Games',
    mechanicFamily: 'color-sort',
    platform: 'android',
    reviewType: 'full',
    status: 'published',
    sponsored: false,
    origin: 'demo',
    appVersion: '1.4.1',
    osVersion: 'Android 15',
    testedFrom: '2026-10-12',
    testedTo: '2026-10-12',
    publishedOn: '2026-10-12',
    testerRegion: 'US',
    storeLocale: 'en-US',
    dims: { G: 70, A: 60, F: 70, C: 60, U: 60 },
    rationales: rationale,
    testingBoundaries: 'Levels 1–40 on a Pixel. Not merged with the iOS score.',
    storeUrl: 'https://play.google.com/store/apps/details?id=com.example.prism',
    priceUsd: 0,
    authorSlug: 'samira-adel',
    publicEvidenceCount: 1,
    tags: { no_forced_ads: 'no', plays_offline: 'yes', one_handed: 'yes', short_rounds: 'yes', no_timers: 'yes' },
    verifiedOnline: true,
    summary: 'The Android build is scored on its own. It does not inherit the iOS 7.5.',
    verdict: 'A separate review. Compare platforms on their own pages.',
    familyNotes: ['Store listing age rating recorded by the editor. There is no official public Play metadata API.'],
    faqs: [{ q: 'Why is Android not on the iOS list?', a: 'iOS and Android scores are never merged.' }],
  },
]

export const guides = [
  {
    slug: 'early-bottles',
    gameSlug: 'prism-pocket-sort',
    title: 'Early bottles without boosters',
    platform: 'ios' as const,
    levelRange: 'Levels 1-20',
    verifiedOnVersion: '1.4.2',
    verifiedBy: 'Samira Adel',
    publishedOn: '2026-11-01',
    modifiedOn: '2026-11-08',
    status: 'verified' as const,
    piiCleared: true,
    contributorName: 'BottleNote',
    body: 'Open level 1 and ignore the booster tray. Match the rightmost bottle first, and leave one bottle empty so later colors have somewhere to go. Do not spend coins and do not tap continue for a second board. From level 12 a full-screen ad can show up between levels. Finish the pour before you leave the board, then come back and check that the bottles are unchanged. Levels 16 through 20 add a fourth color. Sort one color to completion before you touch the next, or the empty bottle gets stuck. Played on iOS 18.6, app version 1.4.2, US store, Wi-Fi on. No friend codes and no names belong in a guide.',
  },
  {
    slug: 'mid-board',
    gameSlug: 'prism-pocket-sort',
    title: 'Mid-board holds for levels 21 to 40',
    platform: 'ios' as const,
    levelRange: 'Levels 21-40',
    verifiedOnVersion: '1.4.2',
    verifiedBy: 'Samira Adel',
    publishedOn: '2026-11-06',
    modifiedOn: '2026-11-08',
    status: 'verified' as const,
    piiCleared: true,
    contributorName: 'BottleNote',
    body: 'Levels 21 to 40 add a locked bottle. Clear the color that is blocking the lock before you shuffle the rest. Keep the empty bottle for the locked color only. If an interstitial appears, wait until the pour animation has finished. Coming back should show the same board. Do not buy the extra slot. The tested path does not need it. This was checked on version 1.4.2 after the community draft was edited for length and to remove a nickname that looked like an email address.',
  },
]

export const needs = [
  { slug: 'no-forced-ads', tag: 'no_forced_ads', title: 'No forced ads', blurb: 'Fewer interruptions' },
  { slug: 'plays-offline', tag: 'plays_offline', title: 'Plays offline', blurb: 'Car rides & flights' },
  { slug: 'one-handed', tag: 'one_handed', title: 'One-handed', blurb: 'Easy to hold' },
  { slug: 'short-rounds', tag: 'short_rounds', title: 'Short rounds', blurb: 'Under 5 minutes' },
  { slug: 'no-timers', tag: 'no_timers', title: 'No timers', blurb: 'Relax, no countdowns' },
] as const

export const rankingDefinition = {
  slug: 'color-sort-ios',
  title: "Compared color-sort games we've fully reviewed (iOS)",
  mechanicFamily: 'color-sort',
  platform: 'ios' as const,
  minQualified: 1,
}
