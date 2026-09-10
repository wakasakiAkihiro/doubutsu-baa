import { readFile, mkdir, writeFile } from 'node:fs/promises'
import sharp from 'sharp'
const manifest = JSON.parse(
  await readFile('artifacts/asset-sources.json', 'utf8'),
)
await mkdir('public/animals', { recursive: true })
const output = []
for (const asset of manifest) {
  if (!asset.source) continue
  const target = `public/animals/${asset.id}.webp`
  const info = await sharp(asset.source)
    .resize(600, 600, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .webp({ quality: 83, alphaQuality: 100, effort: 5 })
    .toFile(target)
  output.push({ id: asset.id, path: target, bytes: info.size })
}
await writeFile('artifacts/asset-sizes.json', JSON.stringify(output, null, 2))
console.log(
  JSON.stringify({
    count: output.length,
    totalBytes: output.reduce((n, a) => n + a.bytes, 0),
    largestBytes: Math.max(...output.map((a) => a.bytes)),
  }),
)
