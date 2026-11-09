const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi
const PHONE = /(?:\+?\d[\d\s().-]{7,}\d)/g
const URL = /\bhttps?:\/\/\S+/gi
const MD_LINK = /\[([^\]]+)\]\(([^)]+)\)/g
const MD_IMAGE = /!\[([^\]]*)\]\(([^)]+)\)/g
const HTML = /<\/?[a-z][^>]*>/gi

export function sanitizeGuideMarkdown(input: string): string {
  return input
    .replace(MD_IMAGE, '$1')
    .replace(MD_LINK, '$1')
    .replace(HTML, '')
    .replace(URL, '')
    .replace(/[<>]/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function flagPii(text: string): string[] {
  const flags: string[] = []
  if (EMAIL.test(text)) flags.push('email')
  EMAIL.lastIndex = 0
  if (PHONE.test(text)) flags.push('phone')
  PHONE.lastIndex = 0
  if (/\b(school|discord|friend code|snapchat|instagram)\b/i.test(text)) flags.push('contact-or-school')
  return flags
}

/** 只知道年月时，生日当月仍视为未满 13 岁，避免把当天未过生日的人放进来。 */
export function ageGate(birthYear: number, birthMonth: number, now: Date): 'allow' | 'block' {
  if (!Number.isInteger(birthYear) || !Number.isInteger(birthMonth) || birthMonth < 1 || birthMonth > 12) {
    throw new Error('birth year and month are required')
  }
  const yearDelta = now.getUTCFullYear() - birthYear
  const monthDelta = now.getUTCMonth() + 1 - birthMonth
  const age = monthDelta < 0 ? yearDelta - 1 : yearDelta
  if (monthDelta === 0) return 'block'
  return age >= 13 ? 'allow' : 'block'
}

export type SubmissionInput = {
  birthYear: number
  birthMonth: number
  gameSlug: string
  platform: 'ios' | 'android'
  appVersion: string
  levelRange: string
  title: string
  body: string
  penName: string
  contactEmail?: string
  imageCount: number
  licenseAccepted: boolean
  aiAssisted: boolean | null
}

export type QueuedSubmission = {
  gameSlug: string
  platform: 'ios' | 'android'
  appVersion: string
  levelRange: string
  title: string
  body: string
  penName: string
  contactEmail: string | null
  imageCount: number
  aiAssisted: boolean
  piiFlags: string[]
}

export type SubmissionDecision =
  | { action: 'block_under_13' }
  | { action: 'reject'; errors: string[] }
  | { action: 'queue'; submission: QueuedSubmission }

export function acceptGuideSubmission(
  input: SubmissionInput,
  options: { now: Date; catalogSlugs: readonly string[]; submissionsToday: number },
): SubmissionDecision {
  if (ageGate(input.birthYear, input.birthMonth, options.now) === 'block') {
    return { action: 'block_under_13' }
  }
  const errors: string[] = []
  if (options.submissionsToday >= 3) errors.push('daily limit')
  if (!options.catalogSlugs.includes(input.gameSlug)) errors.push('unknown game')
  if (input.platform !== 'ios' && input.platform !== 'android') errors.push('platform')
  if (!input.appVersion.trim()) errors.push('missing app version')
  if (!input.levelRange.trim()) errors.push('missing level range')
  if (input.title.trim().length < 8 || input.title.trim().length > 80) errors.push('title length')
  if (/\s/.test(input.penName.trim()) || input.penName.trim().length < 2 || input.penName.trim().length > 24) {
    errors.push('pen name must be a single nickname')
  }
  if (!input.licenseAccepted) errors.push('license not accepted')
  if (input.aiAssisted === null) errors.push('ai assistance must be declared')
  if (input.imageCount < 0 || input.imageCount > 6) errors.push('image count')
  let email: string | null = null
  if (input.contactEmail?.trim()) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.contactEmail.trim())) errors.push('email')
    else email = input.contactEmail.trim()
  }
  const body = sanitizeGuideMarkdown(input.body)
  if (body.length < 280 || body.length > 8000) errors.push('body length')
  if (errors.length) return { action: 'reject', errors }
  return {
    action: 'queue',
    submission: {
      gameSlug: input.gameSlug,
      platform: input.platform,
      appVersion: input.appVersion.trim(),
      levelRange: input.levelRange.trim(),
      title: input.title.trim(),
      body,
      penName: input.penName.trim(),
      contactEmail: email,
      imageCount: input.imageCount,
      aiAssisted: input.aiAssisted === true,
      piiFlags: flagPii(body),
    },
  }
}

export function emailRetentionExpired(processedAt: Date, now: Date): boolean {
  return now.getTime() - processedAt.getTime() >= 30 * 24 * 60 * 60 * 1000
}

export function ipHashRetentionExpired(storedAt: Date, now: Date): boolean {
  return now.getTime() - storedAt.getTime() >= 7 * 24 * 60 * 60 * 1000
}

export async function hashIp(ip: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${ip}`)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}
