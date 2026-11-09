export type TagState = 'yes' | 'no' | 'unknown'

export function assertTagVerification(tag: string, state: TagState, verifiedOnline: boolean): void {
  if (tag === 'no_forced_ads' && state === 'yes' && !verifiedOnline) {
    throw new Error('no_forced_ads=yes requires verifiedOnline')
  }
}

export function assertDimensionNoted(score: number | null, rationale: string | undefined): void {
  if (score === null || score === undefined) return
  if (!rationale || rationale.trim().length === 0) {
    throw new Error('a scored dimension requires a rationale')
  }
}
