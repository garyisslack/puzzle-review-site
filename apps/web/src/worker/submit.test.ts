import { describe, expect, it, vi } from 'vitest'
import { handleGuidePost } from './submit.ts'
import type { SubmissionInput } from '@puzzle/seo'

const body = `${'Move the red bottle onto the empty slot, then clear the top row. '.repeat(12)}Done.`

const input: SubmissionInput = {
  birthYear: 1990,
  birthMonth: 4,
  gameSlug: 'prism-pocket-sort',
  platform: 'ios',
  appVersion: '1.4.2',
  levelRange: 'Levels 1-20',
  title: 'Early bottles without boosters',
  body,
  penName: 'BottleNote',
  imageCount: 1,
  licenseAccepted: true,
  aiAssisted: false,
}

describe('投稿接口', () => {
  it('未满 13 岁不调用保存', async () => {
    const save = vi.fn()
    const result = await handleGuidePost(
      { ...input, birthYear: 2015, birthMonth: 1, contactEmail: 'kid@example.com' },
      { now: new Date('2026-11-08T00:00:00.000Z'), submissionsToday: 0, ip: '203.0.113.8', salt: 'salt', turnstileOk: true, save },
    )
    expect(result.status).toBe(403)
    expect(save).not.toHaveBeenCalled()
    expect(JSON.stringify(result.body)).not.toContain('kid@example.com')
  })

  it('通过校验后只把笔名和正文交给保存，图片必须已去 EXIF 的标记由上游负责', async () => {
    const save = vi.fn(async () => {})
    const result = await handleGuidePost(input, {
      now: new Date('2026-11-08T00:00:00.000Z'),
      submissionsToday: 0,
      ip: '203.0.113.8',
      salt: 'salt',
      turnstileOk: true,
      save,
    })
    expect(result.status).toBe(202)
    expect(save).toHaveBeenCalledOnce()
    const saved = save.mock.calls[0]?.[0] as { ipHash: string; submission: { body: string } }
    expect(saved.ipHash).not.toContain('203.0.113.8')
    expect(saved.submission.body).not.toContain('<')
  })

  it('人机验证失败时不保存', async () => {
    const save = vi.fn()
    const result = await handleGuidePost(input, {
      now: new Date('2026-11-08T00:00:00.000Z'),
      submissionsToday: 0,
      ip: '203.0.113.8',
      salt: 'salt',
      turnstileOk: false,
      save,
    })
    expect(result.status).toBe(400)
    expect(save).not.toHaveBeenCalled()
  })
})
