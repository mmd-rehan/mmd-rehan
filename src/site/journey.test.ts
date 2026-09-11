import { describe, it, expect } from 'vitest'
import { JOURNEY } from './data'

describe('JOURNEY', () => {
  it('is newest-first and fully populated', () => {
    expect(JOURNEY.length).toBeGreaterThanOrEqual(4)
    const years = JOURNEY.map((e) => parseInt(e.start.match(/\d{4}/)![0], 10))
    expect(years).toEqual([...years].sort((a, b) => b - a))
    for (const e of JOURNEY) {
      expect(Boolean(e.company && e.role && e.blurb && e.industry)).toBe(true)
    }
  })
})
