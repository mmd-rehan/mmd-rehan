import { describe, expect, it } from 'vitest'
import { morphStateAt } from './timeline'
import { CHAPTERS } from '../content/chapters'

const KEYS = new Set(['portrait', 'nerves'])

describe('morphStateAt', () => {
  it('picks the chapter whose slice contains t', () => {
    expect(morphStateAt(0).active.id).toBe('intro')
    expect(morphStateAt(0.3).active.id).toBe('intro')
    expect(morphStateAt(0.9).active.id).toBe('nerves')
  })

  it('clamps out-of-range t to the ends', () => {
    expect(morphStateAt(-1).active.id).toBe(CHAPTERS[0].id)
    expect(morphStateAt(5).active.id).toBe(CHAPTERS[CHAPTERS.length - 1].id)
  })

  it('always reports valid from/to target keys', () => {
    for (let t = 0; t <= 1.0001; t += 0.05) {
      const s = morphStateAt(t)
      expect(KEYS.has(s.from), `from=${s.from} at t=${t.toFixed(2)}`).toBe(true)
      expect(KEYS.has(s.to), `to=${s.to} at t=${t.toFixed(2)}`).toBe(true)
    }
  })

  it('blend and energy stay within [0, 1]', () => {
    for (let t = 0; t <= 1.0001; t += 0.02) {
      const s = morphStateAt(t)
      expect(s.blend).toBeGreaterThanOrEqual(0)
      expect(s.blend).toBeLessThanOrEqual(1)
      expect(s.energy).toBeGreaterThanOrEqual(0)
      expect(s.energy).toBeLessThanOrEqual(1)
    }
  })

  it('settles on the first chapter shape at the very start (blend 0)', () => {
    expect(morphStateAt(0).blend).toBe(0)
    expect(morphStateAt(0).from).toBe('portrait')
  })

  it('is mid-morph from portrait toward nerves partway through the intro slice', () => {
    const s = morphStateAt(0.45)
    expect(s.from).toBe('portrait')
    expect(s.to).toBe('nerves')
    expect(s.blend).toBeGreaterThan(0)
  })

  it('holds the final shape through the last chapter (no next to morph to)', () => {
    const s = morphStateAt(0.95)
    expect(s.from).toBe('nerves')
    expect(s.to).toBe('nerves')
    expect(s.blend).toBe(0)
  })
})
