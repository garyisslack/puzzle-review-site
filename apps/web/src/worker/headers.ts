import { rankingFilterHeaders } from '@puzzle/seo'

export function filterHeaders(url: URL, headers: Headers): Headers {
  const next = new Headers(headers)
  if (!url.pathname.startsWith('/rankings/')) return next
  const decision = rankingFilterHeaders(url)
  next.set('X-Robots-Tag', decision.robots)
  next.set('Link', `<https://example.com${decision.canonicalPath}>; rel="canonical"`)
  return next
}
