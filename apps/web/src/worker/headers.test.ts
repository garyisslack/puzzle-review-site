import { describe, expect, it } from 'vitest'
import { filterHeaders } from './headers.ts'

describe('TC-SEO-01 响应头', () => {
  it('带筛选参数的榜单返回 noindex，canonical 指回榜单', () => {
    const headers = filterHeaders(new URL('https://puzzlereviewlab.com/rankings/color-sort-ios/?offline=yes'), new Headers())
    expect(headers.get('X-Robots-Tag')).toBe('noindex,follow')
    expect(headers.get('Link')).toBe('<https://puzzlereviewlab.com/rankings/color-sort-ios/>; rel="canonical"')
  })
})
