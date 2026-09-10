import { mkdir, writeFile, readFile } from 'node:fs/promises'
const text = [
  ...new Set(
    (await readFile('src/App.tsx', 'utf8')) +
      (await readFile('src/data/animals.ts', 'utf8')),
  ),
].join('')
const url =
  'https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@500;700&display=swap&text=' +
  encodeURIComponent(text)
const response = await fetch(url)
if (!response.ok) throw new Error('Font CSS download failed')
let css = await response.text()
await mkdir('public/fonts', { recursive: true })
const urls = [
  ...new Set(
    [...css.matchAll(/url\((https:[^)]+)\)/g)].map((match) => match[1]),
  ),
]
for (let i = 0; i < urls.length; i++) {
  const response = await fetch(urls[i])
  if (!response.ok) throw new Error('Font download failed')
  await writeFile(
    `public/fonts/zen-maru-${i}.woff2`,
    Buffer.from(await response.arrayBuffer()),
  )
  css = css.replaceAll(urls[i], `/fonts/zen-maru-${i}.woff2`)
}
await writeFile('public/fonts/font.css', css)
const license = await fetch(
  'https://raw.githubusercontent.com/google/fonts/main/ofl/zenmarugothic/OFL.txt',
)
if (!license.ok) throw new Error('Font license download failed')
await writeFile('public/fonts/OFL.txt', await license.text())
console.log('Saved font files and SIL Open Font License locally.')
