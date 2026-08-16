import { mulberry32 } from '../../lib/rng'

/**
 * Crypto chapter target - a hash lattice grid.
 *
 * A 3D grid of nodes (miners) with small per-node jitter, evoking racks of
 * machines. A subset glow brighter later via the shader; here we only place
 * them on a regular lattice so the structure reads as ordered infrastructure,
 * the opposite of the organic signal/arc shapes.
 */
export function hashGridTarget(count: number, seed = 3003): Float32Array {
  const rng = mulberry32(seed)
  const pos = new Float32Array(count * 3)

  // Pick grid dims close to a cube that holds `count` nodes.
  const side = Math.max(2, Math.round(Math.cbrt(count)))
  const spacing = 2.6 / side
  const half = (side - 1) / 2

  for (let i = 0; i < count; i++) {
    const gx = i % side
    const gy = Math.floor(i / side) % side
    const gz = Math.floor(i / (side * side)) % side

    const jitter = spacing * 0.16
    pos[i * 3] = (gx - half) * spacing + (rng() - 0.5) * jitter
    pos[i * 3 + 1] = (gy - half) * spacing + (rng() - 0.5) * jitter
    pos[i * 3 + 2] = (gz - half) * spacing + (rng() - 0.5) * jitter
  }
  return pos
}
