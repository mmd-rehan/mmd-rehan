import { describe, it, expect } from 'vitest'
import { PLAYGROUND } from './data'

describe('PLAYGROUND catalog', () => {
  it('has the six expected ids', () => {
    expect(PLAYGROUND.map((e) => e.id).sort()).toEqual([
      'apis',
      'aviation',
      'cloud',
      'healthcare',
      'logistics',
      'streaming',
    ])
  })

  it('gives every entry a valid story href and complete copy', () => {
    for (const e of PLAYGROUND) {
      expect(e.storyHref).toMatch(/^(https:\/\/|#)/)
      expect(Boolean(e.eyebrow && e.title && e.body && e.cta && e.caption)).toBe(true)
    }
  })
})
