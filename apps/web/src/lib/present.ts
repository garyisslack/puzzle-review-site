import { listingArt } from '../data/store-listings.ts'

export const TAGS = [
  { key: 'no_forced_ads', label: 'No forced ads', filter: 'No forced ads', param: 'no_forced_ads' },
  { key: 'plays_offline', label: 'Offline play', filter: 'Offline', param: 'offline' },
  { key: 'one_handed', label: 'One-handed', filter: 'One-handed', param: 'one_handed' },
  { key: 'short_rounds', label: 'Short rounds', filter: 'Short rounds', param: 'short_rounds' },
  { key: 'no_timers', label: 'No timers', filter: 'Untimed', param: 'no_timers' },
] as const

export const NEED_VISUAL = {
  no_forced_ads: { bg: '#FFECEC', color: '#F2545B', icon: 'megaphone-off' },
  plays_offline: { bg: '#E5F5FC', color: '#0E9BD8', icon: 'wifi-off' },
  one_handed: { bg: '#F1EBFF', color: '#8B5CF6', icon: 'hand' },
  short_rounds: { bg: '#FFF2DE', color: '#F08C00', icon: 'hourglass' },
  no_timers: { bg: '#E7F3EC', color: '#1C7C4A', icon: 'timer-off' },
} as const

export const DIM_ICON = {
  G: 'gamepad-2',
  A: 'megaphone',
  F: 'shield-check',
  C: 'file-text',
  U: 'smartphone',
} as const

const ART: Record<string, { icon: string; key: string }> = {
  'prism-pocket-sort': { icon: '/media/icon-a.jpg', key: '/media/key-a.jpg' },
  'prism-pocket-sort-android': { icon: '/media/icon-a.jpg', key: '/media/key-a.jpg' },
  'tile-path-daily': { icon: '/media/icon-b.jpg', key: '/media/key-b.jpg' },
  marblesque: { icon: '/media/icon-c.jpg', key: '/media/key-b.jpg' },
  'hex-cascade': { icon: '/media/icon-d.jpg', key: '/media/key-a.jpg' },
  'sponsored-sort-deluxe': { icon: '/media/icon-c.jpg', key: '/media/key-b.jpg' },
}

export function artFor(slug: string) {
  return ART[slug] ?? listingArt[slug] ?? { icon: '', key: '' }
}

export function tagStateLabel(state: string) {
  if (state === 'yes') return 'YES'
  if (state === 'no') return 'NO'
  return 'NOT VERIFIED YET'
}

export function tagIcon(state: string) {
  if (state === 'yes') return 'check'
  if (state === 'no') return 'x'
  return 'circle-dashed'
}

export function scoreBand(displayed: string | null) {
  if (!displayed) return null
  const value = Number(displayed)
  if (value >= 9) return 'Outstanding'
  if (value >= 8) return 'Great'
  if (value >= 7) return 'Good'
  if (value >= 5) return 'OK'
  return 'Weak'
}

export function weightedFormula(
  rows: { weight: number; displayed: string | null; width: number }[],
  displayed: string | null,
) {
  if (!displayed || rows.some((row) => row.displayed == null)) {
    return 'A missing dimension is never filled with 0 or 10.'
  }
  const parts = rows.map((row) => `.${String(row.weight).padStart(2, '0')}×${row.displayed}`)
  const sum = rows.reduce((total, row) => total + (row.weight / 100) * (row.width / 10), 0)
  return `${parts.join(' + ')} = ${sum.toFixed(2)} → ${displayed}`
}

export function shortDate(iso: string) {
  const date = new Date(iso.length === 10 ? `${iso}T00:00:00Z` : iso)
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(date)
}

export function testedRange(from: string, to: string) {
  const start = new Date(`${from}T00:00:00Z`)
  const end = new Date(`${to}T00:00:00Z`)
  const month = new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' })
  const day = new Intl.DateTimeFormat('en-US', { day: 'numeric', timeZone: 'UTC' })
  const year = new Intl.DateTimeFormat('en-US', { year: 'numeric', timeZone: 'UTC' })
  if (start.getUTCFullYear() === end.getUTCFullYear() && start.getUTCMonth() === end.getUTCMonth()) {
    return `${month.format(start)} ${day.format(start)}–${day.format(end)}, ${year.format(end)}`
  }
  if (start.getUTCFullYear() === end.getUTCFullYear()) {
    return `${month.format(start)} ${day.format(start)} – ${month.format(end)} ${day.format(end)}, ${year.format(end)}`
  }
  return `${shortDate(from)} – ${shortDate(to)}`
}

export function storeLabel(platform: string) {
  return platform === 'ios' ? 'App Store' : 'Google Play'
}

export function impressionOutOf10(score100: number) {
  return (score100 / 10).toFixed(1)
}

export function storeCta(platform: string) {
  return platform === 'ios' ? 'View on the App Store' : 'View on Google Play'
}

const EXCLUSION: Record<string, { label: string; tone: string }> = {
  not_full_review: { label: 'INITIAL REVIEW — no composite score yet', tone: 'muted' },
  missing_dimension: { label: 'INCOMPLETE — a dimension is not scored', tone: 'no' },
  sponsored: { label: 'SPONSORED — excluded from every ranking', tone: 'warn' },
  platform_mismatch: { label: 'OTHER PLATFORM — iOS and Android are never combined', tone: 'muted' },
  expired: { label: 'MAY BE OUTDATED — major update since test, retest queued', tone: 'warn' },
  family_mismatch: { label: 'DIFFERENT GENRE — not in this list', tone: 'muted' },
  tag_not_yes: { label: 'TAG NOT YES — need lists only count verified yes', tone: 'muted' },
  not_published: { label: 'NOT PUBLISHED', tone: 'muted' },
  withdrawn: { label: 'WITHDRAWN', tone: 'muted' },
}

export function exclusionCopy(reason: string) {
  return EXCLUSION[reason] ?? { label: reason.replaceAll('_', ' ').toUpperCase(), tone: 'muted' }
}
