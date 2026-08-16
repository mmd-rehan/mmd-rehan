import type { TargetKey } from '../../content/chapters'
import { samplePortraitTarget } from './portrait'
import { nervesTarget } from './nerves'
import { signalTarget } from './signal'
import { flightArcTarget } from './flightArc'
import { hashGridTarget } from './hashGrid'
import { torusTarget } from './torus'

/** Position buffer per shape (all the same length for 1:1 morphing). */
export type PositionBuffers = Record<TargetKey, Float32Array>

export interface TargetSet {
  positions: PositionBuffers
  /** Per-particle RGB from the photo; only meaningful for portrait forms. */
  colors: Float32Array
}

/**
 * Build every shape the particle field can take, all with the same `count`, so
 * morphing between any two is a straight per-particle interpolation. The
 * portrait is async (it samples an image, and yields per-particle colors); the
 * rest are synchronous position generators.
 */
export async function buildTargets(count: number): Promise<TargetSet> {
  const portrait = await samplePortraitTarget(count)
  return {
    positions: {
      portrait: portrait.positions,
      nerves: nervesTarget(count),
      signal: signalTarget(count),
      flightArc: flightArcTarget(count),
      hashGrid: hashGridTarget(count),
      torus: torusTarget(count),
    },
    colors: portrait.colors,
  }
}

export {
  samplePortraitTarget,
  nervesTarget,
  signalTarget,
  flightArcTarget,
  hashGridTarget,
  torusTarget,
}
