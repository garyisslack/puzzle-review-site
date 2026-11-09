import { acceptGuideSubmission, hashIp, type SubmissionInput } from '@puzzle/seo'
import { reviews } from '../data/catalog.ts'

export type SubmitDeps = {
  now: Date
  submissionsToday: number
  ip: string
  salt: string
  turnstileOk: boolean
  save: (record: { submission: unknown; ipHash: string }) => Promise<void>
}

export async function handleGuidePost(input: SubmissionInput, deps: SubmitDeps): Promise<{ status: number; body: Record<string, unknown> }> {
  const decision = acceptGuideSubmission(input, {
    now: deps.now,
    catalogSlugs: reviews.map((review) => review.slug),
    submissionsToday: deps.submissionsToday,
  })
  if (decision.action === 'block_under_13') return { status: 403, body: { action: 'block_under_13' } }
  if (!deps.turnstileOk) return { status: 400, body: { errors: ['turnstile'] } }
  if (decision.action === 'reject') return { status: 400, body: { errors: decision.errors } }
  const ipHash = await hashIp(deps.ip, deps.salt)
  await deps.save({ submission: decision.submission, ipHash })
  return { status: 202, body: { action: 'queued' } }
}
