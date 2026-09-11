import { afterEach, describe, expect, it, vi } from 'vitest'
import { CUE_WAIT_LIMIT, SoundPlayer } from '../src/audio/SoundPlayer'

function audioDevice() {
  const sources: {
    start: ReturnType<typeof vi.fn>
    stop: ReturnType<typeof vi.fn>
  }[] = []
  const context = {
    state: 'running',
    destination: {},
    resume: vi.fn(() => Promise.resolve()),
    suspend: vi.fn(() => Promise.resolve()),
    close: vi.fn(() => Promise.resolve()),
    decodeAudioData: vi.fn(async () => ({ duration: 0.53 })),
    createBufferSource: vi.fn(() => {
      const source = {
        connect: vi.fn(),
        disconnect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
      }
      sources.push(source)
      return source
    }),
    createGain: () => ({
      gain: { value: 0 },
      connect: vi.fn(),
      disconnect: vi.fn(),
    }),
  }
  vi.stubGlobal(
    'AudioContext',
    class {
      constructor() {
        return context
      }
    },
  )
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(8),
    })),
  )
  return { context, sources }
}
const flush = async () => {
  for (let i = 0; i < 15; i++) await Promise.resolve()
}
afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('bundled voice cues', () => {
  it('starts the visual callback with real buffer scheduling and stops the previous cue', async () => {
    const { sources } = audioDevice()
    const player = new SoundPlayer()
    const reveal = vi.fn()
    player.playCue('hide')
    await flush()
    expect(sources[0].start).toHaveBeenCalledOnce()
    player.playCue('reveal', reveal)
    expect(sources[0].stop).toHaveBeenCalledOnce()
    await flush()
    expect(sources[1].start).toHaveBeenCalledOnce()
    expect(reveal).toHaveBeenCalledOnce()
    player.setMuted(true)
    expect(sources[1].stop).toHaveBeenCalledOnce()
    player.dispose()
  })
  it('caps a slow load and never plays a stale cue when download later completes', async () => {
    vi.useFakeTimers()
    const { sources } = audioDevice()
    let resolve!: (value: unknown) => void
    vi.stubGlobal(
      'fetch',
      vi.fn(
        () =>
          new Promise((done) => {
            resolve = done
          }),
      ),
    )
    const player = new SoundPlayer()
    const reveal = vi.fn()
    player.playCue('reveal', reveal)
    await vi.advanceTimersByTimeAsync(CUE_WAIT_LIMIT)
    expect(reveal).toHaveBeenCalledOnce()
    resolve({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) })
    await flush()
    expect(sources).toHaveLength(0)
    expect(reveal).toHaveBeenCalledOnce()
    player.dispose()
  })
  it('muting a pending resume immediately releases play without late speech', async () => {
    const { context, sources } = audioDevice()
    context.state = 'suspended'
    let resume!: () => void
    context.resume.mockImplementation(
      () =>
        new Promise<void>((done) => {
          resume = done
        }),
    )
    const player = new SoundPlayer()
    const reveal = vi.fn()
    player.playCue('reveal', reveal)
    player.setMuted(true)
    expect(reveal).toHaveBeenCalledOnce()
    context.state = 'running'
    resume()
    await flush()
    expect(sources).toHaveLength(0)
    player.dispose()
  })
  it('continues once on decode failure and stops speech when suspended', async () => {
    const { context, sources } = audioDevice()
    const player = new SoundPlayer()
    player.playCue('hide')
    await flush()
    player.suspend()
    expect(sources[0].stop).toHaveBeenCalledOnce()
    player.dispose()
    context.decodeAudioData.mockRejectedValue(new Error('Invalid WAV'))
    const second = new SoundPlayer()
    const reveal = vi.fn()
    second.playCue('reveal', reveal)
    await flush()
    expect(reveal).toHaveBeenCalledOnce()
    expect(sources).toHaveLength(1)
    second.dispose()
  })
})
