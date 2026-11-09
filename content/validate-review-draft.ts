import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  DIM_KEYS,
  assertDimensionNoted,
  assertDimTenths,
  assertTagVerification,
  publicScore,
  type DimKey,
} from '@puzzle/scoring'

type DraftReview = {
  slug: string
  reviewType: 'initial' | 'full'
  dims: Record<DimKey, number | null>
  rationales: Partial<Record<DimKey, string>>
  tags: Record<string, 'yes' | 'no' | 'unknown'>
  verifiedOnline: boolean
}

function fail(message: string): never {
  console.error(`content:validate — ${message}`)
  process.exit(1)
}

function loadDraft(path: string): DraftReview {
  const abs = resolve(process.cwd(), path)
  let raw: unknown
  try {
    raw = JSON.parse(readFileSync(abs, 'utf8'))
  } catch {
    fail(`cannot read or parse JSON: ${abs}`)
  }
  if (!raw || typeof raw !== 'object') fail('root must be an object')
  const d = raw as Record<string, unknown>
  for (const key of ['slug', 'reviewType', 'dims', 'rationales', 'tags', 'verifiedOnline']) {
    if (!(key in d)) fail(`missing field: ${key}`)
  }
  return d as DraftReview
}

function main() {
  const file = process.argv[2]
  if (!file) fail('usage: pnpm content:validate <path-to.review.json>')

  const draft = loadDraft(file)

  for (const key of DIM_KEYS) {
    const value = draft.dims[key]
    if (value === null || value === undefined) continue
    try {
      assertDimTenths(value, key)
    } catch (e) {
      fail(e instanceof Error ? e.message : String(e))
    }
    try {
      assertDimensionNoted(value, draft.rationales[key])
    } catch (e) {
      fail(e instanceof Error ? e.message : String(e))
    }
  }

  const noForced = draft.tags.no_forced_ads
  if (noForced) {
    try {
      assertTagVerification('no_forced_ads', noForced, draft.verifiedOnline)
    } catch (e) {
      fail(e instanceof Error ? e.message : String(e))
    }
  }

  const score = publicScore(draft.reviewType, draft.dims)
  if (draft.reviewType === 'initial' && score !== null) {
    fail('initial review must not have a complete composite (check dims — partial scores are ok, all five scored is not)')
  }

  console.log(`OK: ${draft.slug} (${draft.reviewType})${score ? ` — composite tenths ${score.displayedTenths}` : ' — no public composite'}`)
}

main()
