import { mkdir, writeFile } from 'node:fs/promises'
import sharp from 'sharp'

const source = 'assets/branding/app-icon-source.png'
const background = '#faf7ee'
await mkdir('public/icons', { recursive: true })

for (const [path, size] of [
  ['public/favicon-32.png', 32],
  ['public/apple-touch-icon.png', 180],
  ['public/icons/icon-192.png', 192],
  ['public/icons/icon-512.png', 512],
  ['public/icons/icon-maskable-512.png', 512],
]) {
  await sharp(source)
    .resize(size, size)
    .flatten({ background })
    .png({ compressionLevel: 9, palette: true, colours: 256 })
    .toFile(path)
}

// An ICO directory containing PNG frames supports legacy favicon discovery too.
const sizes = [16, 32, 48]
const frames = await Promise.all(
  sizes.map((size) =>
    sharp(source).resize(size, size).flatten({ background }).png().toBuffer(),
  ),
)
const header = Buffer.alloc(6 + sizes.length * 16)
header.writeUInt16LE(1, 2)
header.writeUInt16LE(sizes.length, 4)
let offset = header.length
frames.forEach((frame, index) => {
  const entry = 6 + index * 16
  header[entry] = sizes[index]
  header[entry + 1] = sizes[index]
  header.writeUInt16LE(1, entry + 4)
  header.writeUInt16LE(32, entry + 6)
  header.writeUInt32LE(frame.length, entry + 8)
  header.writeUInt32LE(offset, entry + 12)
  offset += frame.length
})
await writeFile('public/favicon.ico', Buffer.concat([header, ...frames]))
console.log('Generated browser, Apple touch, Android and maskable icons.')
