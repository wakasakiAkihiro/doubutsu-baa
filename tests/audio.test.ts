import { afterEach, describe, expect, it, vi } from 'vitest'
import { SoundPlayer } from '../src/audio/SoundPlayer'
afterEach(() => vi.unstubAllGlobals())
describe('optional audio', () => {
  it('handles unsupported audio APIs', () => {
    vi.stubGlobal('AudioContext', undefined)
    const sound = new SoundPlayer()
    expect(() => {
      sound.unlock()
      sound.play('reveal')
      sound.suspend()
      sound.dispose()
    }).not.toThrow()
  })
  it('catches rejected resume promises', async () => {
    const resume = vi.fn(() => Promise.reject(new Error('Gesture required')))
    vi.stubGlobal(
      'AudioContext',
      class {
        state = 'suspended'
        resume = resume
      },
    )
    const sound = new SoundPlayer()
    expect(() => sound.play('reveal')).not.toThrow()
    await Promise.resolve()
    await Promise.resolve()
    expect(resume).toHaveBeenCalled()
  })
  it('mutes without constructing an audio context', () => {
    const Constructor = vi.fn()
    vi.stubGlobal('AudioContext', Constructor)
    const sound = new SoundPlayer()
    sound.setMuted(true)
    sound.unlock()
    sound.play('tap')
    expect(Constructor).not.toHaveBeenCalled()
  })
  it('catches synthesis failures', () => {
    vi.stubGlobal(
      'AudioContext',
      class {
        state = 'running'
        createOscillator() {
          throw new Error('Device lost')
        }
      },
    )
    expect(() => new SoundPlayer().play('sparkle')).not.toThrow()
  })
})
