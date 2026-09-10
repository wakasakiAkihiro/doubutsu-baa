import { describe, it, expect, vi } from 'vitest'
import { ShuffleBag } from '../src/game/shuffleBag'
import { animals } from '../src/data/animals'
describe('shuffle bag', () => {
  it('delivers all animals exactly once for 100 cycles without repeated boundaries', () => {
    const bag = new ShuffleBag(animals)
    let previous: string | undefined
    for (let cycle = 0; cycle < 100; cycle++) {
      const batch = Array.from({ length: 30 }, () => bag.next().id)
      expect(new Set(batch).size).toBe(30)
      expect([...batch].sort()).toEqual(animals.map((a) => a.id).sort())
      expect(batch[0]).not.toBe(previous)
      previous = batch[29]
    }
  })
  it('reshuffles after exhaustion and does not consume peeked entries', () => {
    const random = vi.fn(() => 0.4)
    const bag = new ShuffleBag([1, 2, 3], random)
    const first = bag.peek()
    expect(bag.peek()).toBe(first)
    expect(bag.next()).toBe(first)
    bag.next()
    bag.next()
    expect(random).toHaveBeenCalledTimes(2)
    bag.next()
    expect(random.mock.calls.length).toBeGreaterThanOrEqual(4)
  })
  it.each([0, 0.999999])(
    'avoids cycle-boundary repeats under deterministic randomness %s',
    (random) => {
      const bag = new ShuffleBag([1, 2], () => random)
      const values = Array.from({ length: 40 }, () => bag.next())
      for (let i = 1; i < values.length; i++)
        expect(values[i]).not.toBe(values[i - 1])
    },
  )
  it('rejects empty, singleton, and duplicate collections', () => {
    expect(() => new ShuffleBag([])).toThrow()
    expect(() => new ShuffleBag([1])).toThrow()
    expect(() => new ShuffleBag([1, 1])).toThrow()
  })
})
