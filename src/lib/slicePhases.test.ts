import { describe, expect, it } from 'vitest'
import { slicePhasesAt } from './slicePhases'

describe('slicePhasesAt', () => {
  const phaseKeys = ['tilt', 'contour', 'dissolve', 'filament', 'settle'] as const

  it('every phase value stays within [0, 1] across the whole timeline', () => {
    for (let t = 0; t <= 1.0001; t += 0.01) {
      const p = slicePhasesAt(t)
      for (const k of phaseKeys) {
        expect(p[k], `${k} at t=${t.toFixed(2)}`).toBeGreaterThanOrEqual(0)
        expect(p[k], `${k} at t=${t.toFixed(2)}`).toBeLessThanOrEqual(1)
      }
    }
  })

  it('at rest (t=0) nothing has started', () => {
    const p = slicePhasesAt(0)
    expect(p.tilt).toBe(0)
    expect(p.contour).toBe(0)
    expect(p.dissolve).toBe(0)
    expect(p.filament).toBe(0)
    expect(p.settle).toBe(0)
  })

  it('at the end (t=1) the transforming beats are complete', () => {
    const p = slicePhasesAt(1)
    expect(p.tilt).toBe(1)
    expect(p.dissolve).toBe(1)
    expect(p.filament).toBe(1)
    expect(p.settle).toBe(1)
  })

  it('tilt, dissolve, filament and settle are monotonically non-decreasing', () => {
    const mono = ['tilt', 'dissolve', 'filament', 'settle'] as const
    let prev = slicePhasesAt(0)
    for (let t = 0.02; t <= 1.0001; t += 0.02) {
      const cur = slicePhasesAt(t)
      for (const k of mono) {
        expect(cur[k], `${k} decreased at t=${t.toFixed(2)}`).toBeGreaterThanOrEqual(
          prev[k] - 1e-9,
        )
      }
      prev = cur
    }
  })

  it('contour is a pulse — zero at both ends, positive in the middle', () => {
    expect(slicePhasesAt(0).contour).toBe(0)
    expect(slicePhasesAt(1).contour).toBeCloseTo(0, 5)
    expect(slicePhasesAt(0.32).contour).toBeGreaterThan(0.3)
  })

  it('is deterministic', () => {
    expect(slicePhasesAt(0.37)).toEqual(slicePhasesAt(0.37))
  })
})
