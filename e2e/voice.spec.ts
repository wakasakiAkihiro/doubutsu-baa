import { expect, test } from '@playwright/test'

test('decoded voices synchronize with reveal and respect mute', async ({
  page,
}, info) => {
  test.skip(
    info.project.use.browserName === 'webkit',
    'WebKit automation can omit an audio output device; game.spec verifies its silent fallback.',
  )
  await page.addInitScript(() => {
    const events: { kind: string; time: number; duration?: number }[] = []
    Object.assign(window, { voiceEvents: events })
    const create = AudioContext.prototype.createBufferSource
    AudioContext.prototype.createBufferSource = function () {
      const source = create.call(this)
      const start = source.start.bind(source)
      const stop = source.stop.bind(source)
      source.start = (...args: Parameters<typeof source.start>) => {
        events.push({
          kind: 'start',
          time: performance.now(),
          duration: source.buffer?.duration,
        })
        start(...args)
      }
      source.stop = (...args: Parameters<typeof source.stop>) => {
        events.push({ kind: 'stop', time: performance.now() })
        stop(...args)
      }
      return source
    }
    new MutationObserver(() => {
      if (
        document.querySelector('main')?.getAttribute('data-phase') ===
          'revealed' &&
        !events.some((e) => e.kind === 'reveal')
      ) {
        events.push({ kind: 'reveal', time: performance.now() })
      }
    }).observe(document, { attributes: true, subtree: true })
  })
  await page.goto('/')
  await page.getByRole('button', { name: 'あそぼう' }).click()
  const events = () =>
    page.evaluate(
      () =>
        (
          window as Window & {
            voiceEvents?: { kind: string; time: number; duration?: number }[]
          }
        ).voiceEvents!,
    )
  await expect
    .poll(async () => (await events()).filter((e) => e.kind === 'start').length)
    .toBe(1)
  await page.waitForTimeout(1900)
  await page.getByTestId('play-area').click()
  await expect(page.locator('main')).toHaveAttribute('data-phase', 'revealed')
  const observed = await events()
  const starts = observed.filter((e) => e.kind === 'start')
  expect(starts).toHaveLength(2)
  expect(starts[0].duration).toBeGreaterThan(1.5)
  expect(starts[1].duration).toBeGreaterThan(0.4)
  expect(starts[1].duration).toBeLessThan(0.8)
  expect(
    Math.abs(observed.find((e) => e.kind === 'reveal')!.time - starts[1].time),
  ).toBeLessThan(100)
  await expect(page.getByTestId('animal')).toHaveClass(/react-peekaboo/)
  await page.getByRole('button', { name: '音をオフにする' }).click()
  expect(
    (await events()).filter((e) => e.kind === 'stop').length,
  ).toBeGreaterThanOrEqual(1)
  await page.getByRole('button', { name: 'つぎのどうぶつ' }).click()
  await expect(page.locator('main')).toHaveAttribute('data-phase', 'hiding')
  await page.waitForTimeout(180)
  await page.getByTestId('play-area').click()
  await expect(page.locator('main')).toHaveAttribute('data-phase', 'revealed')
  expect((await events()).filter((e) => e.kind === 'start')).toHaveLength(2)
  await page.getByRole('button', { name: '音をオンにする' }).click()
  await page.getByRole('button', { name: 'つぎのどうぶつ' }).click()
  await expect
    .poll(async () => (await events()).filter((e) => e.kind === 'start').length)
    .toBe(3)
})

test('failed voice downloads keep the complete play flow usable', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.route('**/audio/*.wav', (route) => route.abort())
  await page.goto('/')
  await page.getByRole('button', { name: 'あそぼう' }).click()
  await page.waitForTimeout(180)
  await page.getByTestId('play-area').click()
  await expect(page.locator('main')).toHaveAttribute('data-phase', 'revealed')
  await page.getByRole('button', { name: 'つぎのどうぶつ' }).click()
  await expect(page.locator('main')).toHaveAttribute('data-phase', 'hiding')
  expect(errors).toEqual([])
})
