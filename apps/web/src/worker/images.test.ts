import sharp from 'sharp'
import { describe, expect, it } from 'vitest'
import { reencodeUpload } from './images.ts'

describe('投稿图片', () => {
  it('重新编码后不再带 EXIF', async () => {
    const original = await sharp({
      create: { width: 16, height: 16, channels: 3, background: { r: 40, g: 80, b: 200 } },
    })
      .jpeg()
      .withMetadata({ exif: { IFD0: { Copyright: 'secret player' } } })
      .toBuffer()
    expect((await sharp(original).metadata()).exif).toBeDefined()
    const clean = await reencodeUpload(original)
    expect((await sharp(clean).metadata()).exif).toBeUndefined()
  })
})
