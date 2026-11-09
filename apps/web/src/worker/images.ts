import sharp from 'sharp'

/** 重新编码并丢掉 EXIF（含 GPS）。调用方不要保存原始字节。 */
export async function reencodeUpload(bytes: Buffer): Promise<Buffer> {
  return sharp(bytes).rotate().jpeg({ quality: 80 }).toBuffer()
}
