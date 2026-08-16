import { mulberry32 } from '../../lib/rng'

/**
 * Logistics chapter target - torus route loop.
 *
 * A closed loop of flowing strands: goods circulating through a supply chain
 * that never stops. Particles are wound around the tube of a torus with a bit
 * of thickness jitter so it reads as a woven cable ring, matching the
 * reference video's torus state.
 */
export function torusTarget(count: number, seed = 4004): Float32Array {
  const rng = mulberry32(seed)
  const pos = new Float32Array(count * 3)

  const R = 1.15 // major radius
  const r = 0.42 // minor radius
  const winds = 7 // how many times strands wrap the tube per loop

  for (let i = 0; i < count; i++) {
    const u = (i / count) * Math.PI * 2 // around the main ring
    const v = u * winds + rng() * 0.4 // around the tube
    const tube = r * (0.72 + rng() * 0.28)

    const cx = Math.cos(u)
    const cz = Math.sin(u)
    const rad = R + tube * Math.cos(v)

    pos[i * 3] = rad * cx
    pos[i * 3 + 1] = tube * Math.sin(v)
    pos[i * 3 + 2] = rad * cz
  }
  return pos
}
