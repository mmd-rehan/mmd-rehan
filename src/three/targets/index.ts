import type { TargetKey } from '../../content/chapters'
import { sampleHeadCloud, type HeadBuffers } from './headCloud'
import { nervesTarget } from './nerves'
import { mulberry32 } from '../../lib/rng'

/** Position buffer per shape (all the same length for 1:1 morphing). */
export type PositionBuffers = Record<TargetKey, Float32Array>

export interface TargetSet {
  positions: PositionBuffers
  /** Per-particle RGB, from the head texture. */
  colors: Float32Array
  /** Per-particle surface normal from the head mesh (for real lighting). */
  normals: Float32Array
}

/**
 * Build every shape the particle field can take, all with the same `count`, so
 * morphing between any two is a straight per-particle interpolation.
 *
 * The portrait is sampled from a real 3D head mesh (async); `nerves` is a
 * synthetic radial strand cloud. Both share the same point count.
 */
export async function buildTargets(count: number): Promise<TargetSet> {
  let head: HeadBuffers
  try {
    head = await sampleHeadCloud(count)
  } catch (err) {
    console.warn('[targets] head GLB sample failed, using synthetic fallback:', err)
    head = syntheticHead(count)
  }
  return {
    positions: {
      portrait: head.positions,
      nerves: nervesTarget(count),
    },
    colors: head.colors,
    normals: head.normals,
  }
}

/** Head-and-shoulders blob, used only if the GLB can't be loaded/sampled. */
function syntheticHead(count: number, seed = 5005): HeadBuffers {
  const rng = mulberry32(seed)
  const positions = new Float32Array(count * 3)
  const normals = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const theta = Math.acos(2 * rng() - 1)
    const phi = rng() * Math.PI * 2
    const nx = Math.sin(theta) * Math.cos(phi)
    const ny = Math.cos(theta)
    const nz = Math.sin(theta) * Math.sin(phi)
    positions[i * 3] = nx * 0.85
    positions[i * 3 + 1] = 0.2 + ny * 1.1
    positions[i * 3 + 2] = nz * 0.9
    normals[i * 3] = nx
    normals[i * 3 + 1] = ny
    normals[i * 3 + 2] = nz
    colors[i * 3] = 0.82
    colors[i * 3 + 1] = 0.63
    colors[i * 3 + 2] = 0.5
  }
  return { positions, normals, colors }
}

export { sampleHeadCloud, nervesTarget }
