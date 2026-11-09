import { describe, expect, it } from 'vitest'
import { applyServerScore } from './score-review.ts'
import { assertCanPublish, submissionCreateAllowed } from './access.ts'

describe('后台权限和计分钩子', () => {
  it('编辑不能发布，审核人可以', () => {
    expect(() => assertCanPublish('editor', 'published')).toThrow(/Editor/)
    expect(() => assertCanPublish('reviewer', 'published')).not.toThrow()
    expect(() => assertCanPublish('editor', 'draft')).not.toThrow()
  })

  it('投稿只能用足够长的服务令牌创建', () => {
    expect(submissionCreateAllowed('Bearer short', 'short')).toBe(false)
    expect(submissionCreateAllowed('Bearer local-dev-token-1', 'local-dev-token-1')).toBe(true)
    expect(submissionCreateAllowed(null, 'local-dev-token-1')).toBe(false)
  })

  it('保存时丢掉客户端传来的综合分', () => {
    const saved = applyServerScore({
      reviewType: 'full',
      dimG: 80,
      dimA: 70,
      dimF: 80,
      dimC: 60,
      dimU: 80,
      compositeTenths: 100,
    })
    expect(saved.compositeTenths).toBe(75)
    expect(saved.compositeRaw).toBe(7500)
    const initial = applyServerScore({ reviewType: 'initial', dimG: 80, dimA: 70, dimF: 80, dimC: 60, dimU: 80, compositeTenths: 75 })
    expect(initial.compositeTenths).toBeNull()
  })
})
