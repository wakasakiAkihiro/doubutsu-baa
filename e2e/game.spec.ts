import { expect, test, type Page, type TestInfo } from '@playwright/test'
async function captureStage(page: Page, info: TestInfo, stage: string) {
  // WebKit screenshots inject an empty inline stylesheet to sync animations.
  // Keep production CSP and console checks intact by capturing Chromium only.
  if (info.project.use.browserName === 'webkit') return
  await page.screenshot({
    path: `artifacts/qa/${info.project.name}-${stage}.png`,
    fullPage: true,
  })
}
async function reveal(page: Page) {
  await page.waitForTimeout(170)
  await page.getByTestId('play-area').click()
  await expect(page.locator('main')).toHaveAttribute('data-phase', 'revealed')
  const picture = page.getByTestId('animal').locator('img')
  await expect(picture).toHaveJSProperty('complete', true)
  await expect(picture).not.toHaveAttribute('src', '/fallback.svg')
  expect(
    await picture.evaluate((img: HTMLImageElement) => img.naturalWidth),
  ).toBeGreaterThan(0)
}
test('welcome → reveal → react → next, responsive and error free', async ({
  page,
}, info) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })
  page.on('response', (r) => {
    if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`)
  })
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'あそぼう' })).toBeVisible()
  await page.evaluate(() => document.fonts.ready)
  await expect(page.getByAltText('いぬ')).toHaveJSProperty('complete', true)
  await captureStage(page, info, 'welcome')
  const width = page.viewportSize()!.width
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(width)
  const start = await page
    .getByRole('button', { name: 'あそぼう' })
    .boundingBox()
  expect(start!.height).toBeGreaterThanOrEqual(60)
  expect(start!.y + start!.height).toBeLessThanOrEqual(
    page.viewportSize()!.height,
  )
  await page.getByRole('button', { name: 'あそぼう' }).click()
  await expect(page.locator('main')).toHaveAttribute('data-phase', 'hiding')
  const area = await page.getByTestId('play-area').boundingBox()
  expect(area!.width).toBeGreaterThanOrEqual(300)
  await captureStage(page, info, 'hidden')
  const seen = new Set<string>()
  for (let turn = 0; turn < 3; turn++) {
    await reveal(page)
    const animal = page.getByTestId('animal')
    const id = (await animal.getAttribute('data-animal'))!
    expect(seen.has(id)).toBe(false)
    seen.add(id)
    await page.waitForTimeout(750)
    const box = await animal.boundingBox()
    expect(box!.width).toBeGreaterThanOrEqual(220)
    expect(box!.x).toBeGreaterThanOrEqual(0)
    expect(box!.x + box!.width).toBeLessThanOrEqual(width + 1)
    expect(box!.y).toBeGreaterThanOrEqual(0)
    expect(box!.y + box!.height).toBeLessThanOrEqual(
      page.viewportSize()!.height,
    )
    const heading = await page.getByRole('heading', { level: 1 }).boundingBox()
    expect(
      box!.y >= heading!.y + heading!.height ||
        box!.x >= heading!.x + heading!.width,
    ).toBe(true)
    if (turn === 0) await captureStage(page, info, 'revealed')
    await page.getByTestId('play-area').click()
    await expect(animal).toHaveAttribute('data-reaction', '1')
    await expect(
      page.getByRole('button', { name: 'つぎのどうぶつ' }),
    ).toBeVisible()
    const nextButton = await page
      .getByRole('button', { name: 'つぎのどうぶつ' })
      .boundingBox()
    expect(nextButton!.y + nextButton!.height).toBeLessThanOrEqual(
      page.viewportSize()!.height,
    )
    await page.getByRole('button', { name: 'つぎのどうぶつ' }).click()
    await expect(page.locator('main')).toHaveAttribute('data-phase', 'hiding')
    await expect(page.locator('main')).toHaveAttribute(
      'data-turn',
      String(turn + 1),
    )
  }
  expect(errors).toEqual([])
})
test('rapid taps and audio failure do not break play', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.addInitScript(() => {
    Object.defineProperty(window, 'AudioContext', {
      configurable: true,
      value: class {
        constructor() {
          throw new Error('Audio device unavailable')
        }
      },
    })
    Object.defineProperty(window, 'webkitAudioContext', {
      configurable: true,
      value: undefined,
    })
  })
  await page.goto('/')
  await page.getByRole('button', { name: 'あそぼう' }).click()
  await reveal(page)
  await page.getByTestId('play-area').evaluate((button) => {
    for (let i = 0; i < 150; i++) (button as HTMLButtonElement).click()
  })
  await expect(page.locator('main')).toHaveAttribute('data-turn', '0')
  await expect(
    page.getByRole('button', { name: 'つぎのどうぶつ' }),
  ).toBeVisible()
  await page
    .getByRole('button', { name: 'つぎのどうぶつ' })
    .evaluate((button) => {
      for (let i = 0; i < 100; i++) (button as HTMLButtonElement).click()
    })
  await expect(page.locator('main')).toHaveAttribute('data-phase', 'hiding')
  await expect(page.locator('main')).toHaveAttribute('data-turn', '1')
  await reveal(page)
  expect(errors).toEqual([])
})
test('reduced motion and keyboard play', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.getByRole('button', { name: '音をオフにする' }).click()
  await expect(
    page.getByRole('button', { name: '音をオンにする' }),
  ).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: 'あそぼう' }).focus()
  await page.keyboard.press('Enter')
  await page.waitForTimeout(170)
  await page.getByTestId('play-area').focus()
  await page.keyboard.press('Enter')
  await expect(page.locator('main')).toHaveAttribute('data-phase', 'revealed')
  expect(
    await page
      .getByTestId('animal')
      .evaluate((el) => getComputedStyle(el).animationName),
  ).toBe('none')
})
test('all 30 images render over two complete shuffle cycles', async ({
  page,
}, info) => {
  test.skip(
    info.project.name !== 'desktop-1440',
    'One full catalog check is sufficient.',
  )
  test.setTimeout(120000)
  await page.clock.install()
  await page.goto('/')
  await page.getByRole('button', { name: 'あそぼう' }).click()
  let last: string | undefined
  for (let cycle = 0; cycle < 2; cycle++) {
    const seen = new Set<string>()
    for (let turn = 0; turn < 30; turn++) {
      await page.clock.runFor(200)
      await page.getByTestId('play-area').click()
      await expect(page.locator('main')).toHaveAttribute(
        'data-phase',
        'revealed',
      )
      const animal = page.getByTestId('animal')
      const id = (await animal.getAttribute('data-animal'))!
      expect(id).not.toBe(last)
      expect(seen.has(id)).toBe(false)
      seen.add(id)
      last = id
      const img = animal.locator('img')
      await expect(img).toHaveJSProperty('complete', true)
      await expect(img).not.toHaveAttribute('src', '/fallback.svg')
      expect(
        await img.evaluate((image: HTMLImageElement) => image.naturalWidth),
      ).toBeGreaterThan(0)
      await page.clock.runFor(1800)
      await page.getByRole('button', { name: 'つぎのどうぶつ' }).click()
      await page.clock.runFor(600)
      await expect(page.locator('main')).toHaveAttribute('data-phase', 'hiding')
    }
    expect(seen.size).toBe(30)
  }
})
