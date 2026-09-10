import { describe, it, expect } from 'vitest'
import { playgroundReducer, initialPlaygroundState } from './playgroundState'

describe('playgroundReducer', () => {
  it('selects and records discovery', () => {
    const s = playgroundReducer(initialPlaygroundState, { type: 'select', id: 'streaming' })
    expect(s.selectedId).toBe('streaming')
    expect(s.discovered.has('streaming')).toBe(true)
  })

  it('keeps discovered growing, never shrinking on reselect', () => {
    let s = playgroundReducer(initialPlaygroundState, { type: 'select', id: 'streaming' })
    s = playgroundReducer(s, { type: 'select', id: 'cloud' })
    s = playgroundReducer(s, { type: 'select', id: 'streaming' })
    expect([...s.discovered].sort()).toEqual(['cloud', 'streaming'])
  })

  it('reset returns selection to apis but preserves discovered', () => {
    let s = playgroundReducer(initialPlaygroundState, { type: 'select', id: 'cloud' })
    s = playgroundReducer(s, { type: 'reset' })
    expect(s.selectedId).toBe('apis')
    expect(s.discovered.has('cloud')).toBe(true)
  })

  it('is a no-op when selecting the already-selected id', () => {
    const first = playgroundReducer(initialPlaygroundState, { type: 'select', id: 'apis' })
    const again = playgroundReducer(first, { type: 'select', id: 'apis' })
    expect(again).toBe(first)
  })
})
