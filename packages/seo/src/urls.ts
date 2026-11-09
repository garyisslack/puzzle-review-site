export type RobotsDirective = 'index,follow' | 'noindex,follow'

export function comparePair(a: string, b: string): { canonicalSlug: string; redirectFrom: string | null } {
  if (a === b) throw new Error('cannot compare a game with itself')
  const [first, second] = a.localeCompare(b, 'en') <= 0 ? [a, b] : [b, a]
  const canonicalSlug = `${first}-vs-${second}`
  const requested = `${a}-vs-${b}`
  return {
    canonicalSlug,
    redirectFrom: requested === canonicalSlug ? null : requested,
  }
}

export function robotsFor(input: {
  kind: 'review' | 'ranking' | 'ranking-query' | 'category' | 'similar' | 'compare' | 'page' | 'author' | 'guide' | 'guide-index' | 'submit' | 'preview'
  indexable: boolean
}): RobotsDirective {
  if (input.kind === 'preview' || input.kind === 'submit' || input.kind === 'ranking-query') return 'noindex,follow'
  return input.indexable ? 'index,follow' : 'noindex,follow'
}

export function canonicalPath(input: { path: string; kind: 'ranking' | 'ranking-query' }): string {
  if (input.kind === 'ranking-query') return input.path.split('?')[0] ?? input.path
  return input.path
}

export function rankingFilterHeaders(url: URL): { robots: RobotsDirective; canonicalPath: string } {
  const path = url.pathname.endsWith('/') ? url.pathname : `${url.pathname}/`
  if (url.pathname.startsWith('/rankings/') && url.searchParams.size > 0) {
    return { robots: 'noindex,follow', canonicalPath: path }
  }
  return { robots: 'index,follow', canonicalPath: path }
}
