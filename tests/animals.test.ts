// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { animals } from '../src/data/animals'
describe('animal collection', () => {
  it('contains all 30 requested animals with unique identifiers', () => {
    expect(animals).toHaveLength(30)
    expect(new Set(animals.map((a) => a.id)).size).toBe(30)
    expect(new Set(animals.map((a) => a.name)).size).toBe(30)
    expect(animals.map((a) => a.name)).toContain('たぬき')
  })
  it('has an actual WebP asset for each animal', () => {
    for (const animal of animals) {
      const path = resolve('public', animal.image.slice(1))
      expect(existsSync(path), path).toBe(true)
      const data = readFileSync(path)
      expect(data.toString('ascii', 0, 4)).toBe('RIFF')
      expect(data.toString('ascii', 8, 12)).toBe('WEBP')
      expect(data.byteLength).toBeLessThan(250000)
    }
  })
})
