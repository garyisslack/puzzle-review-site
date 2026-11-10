export type ReviewJsonLdInput = {
  siteUrl: string
  slug: string
  name: string
  platform: 'iOS' | 'Android'
  operatingSystem: 'iOS' | 'Android'
  priceUsd: number
  description: string
  authorName: string
  authorSlug: string
  datePublished: string
  displayedScore: string | null
  sponsored: boolean
}

export function reviewJsonLd(input: ReviewJsonLdInput): Record<string, unknown> {
  const node: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: input.name,
    applicationCategory: 'GameApplication',
    operatingSystem: input.operatingSystem,
    description: input.description,
    url: `${input.siteUrl}/reviews/${input.slug}/`,
    offers: {
      '@type': 'Offer',
      price: input.priceUsd,
      priceCurrency: 'USD',
    },
  }
  if (!input.sponsored && input.displayedScore) {
    node.review = {
      '@type': 'Review',
      author: { '@type': 'Person', name: input.authorName, url: `${input.siteUrl}/authors/${input.authorSlug}/` },
      datePublished: input.datePublished,
      reviewRating: {
        '@type': 'Rating',
        ratingValue: input.displayedScore,
        bestRating: 10,
        worstRating: 0,
      },
    }
  }
  return node
}

export function articleJsonLd(input: {
  siteUrl: string
  path: string
  headline: string
  datePublished: string
  dateModified: string
  authorName: string
  editorName?: string
}): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: input.headline,
    datePublished: input.datePublished,
    dateModified: input.dateModified,
    author: { '@type': 'Person', name: input.authorName },
    ...(input.editorName ? { editor: { '@type': 'Person', name: input.editorName } } : {}),
    mainEntityOfPage: `${input.siteUrl}${input.path}`,
  }
}

export function breadcrumbJsonLd(siteUrl: string, crumbs: { name: string; path: string }[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: `${siteUrl}${crumb.path}`,
    })),
  }
}

export function organizationJsonLd(input: { siteUrl: string; name: string }): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: input.name,
    url: input.siteUrl,
  }
}

export function websiteJsonLd(input: { siteUrl: string; name: string }): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: input.name,
    url: `${input.siteUrl}/`,
  }
}

export function itemListJsonLd(input: {
  siteUrl: string
  path: string
  name: string
  items: { name: string; path: string }[]
}): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: input.name,
    url: `${input.siteUrl}${input.path}`,
    numberOfItems: input.items.length,
    itemListElement: input.items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      url: `${input.siteUrl}${item.path}`,
    })),
  }
}

export function metaDescription(text: string, max = 160): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  const cut = clean.slice(0, max - 1)
  const space = cut.lastIndexOf(' ')
  const clipped = (space > 80 ? cut.slice(0, space) : cut).replace(/[.,;:]+$/, '')
  return `${clipped}…`
}

export function assertNoAggregateRating(node: unknown): void {
  const json = JSON.stringify(node)
  if (json.includes('aggregateRating') || json.includes('AggregateRating')) {
    throw new Error('aggregateRating is not allowed')
  }
}
