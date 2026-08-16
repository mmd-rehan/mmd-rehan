import { mulberry32 } from '../../lib/rng'

/**
 * Background chapter target - network / system strands.
 * of this site: the shape the particle portrait dissolves into on first scroll.
 *
 * Filaments radiate from a small dense core out to distant tips. Each strand is
 * a curved quadratic-bezier path (core -> control -> tip) with organic wobble,
 * and points cluster toward the tip so the ends read as bright nerve endings.
 * Because tips sit at a large radius, the shader's radius-driven tip glow lights
 * them ember-hot at rest — the strands stay lit even when the form is settled.
 */
export function nervesTarget(count: number, seed = 7007): Float32Array {
  const rng = mulberry32(seed)
  const pos = new Float32Array(count * 3)

  // More strands on higher particle counts; each gets a slice of the budget.
  const strands = Math.max(90, Math.floor(count / 150))
  const perStrand = Math.max(2, Math.floor(count / strands))

  let i = 0
  for (let s = 0; s < strands && i < count; s++) {
    // Outward direction, slightly compressed vertically so it reads head-ish
    // (taller than wide) rather than a perfect sphere.
    const phi = rng() * Math.PI * 2
    const cosT = 2 * rng() - 1
    const sinT = Math.sqrt(Math.max(0, 1 - cosT * cosT))
    const dx = sinT * Math.cos(phi)
    const dy = cosT * 0.95
    const dz = sinT * Math.sin(phi) * 0.85

    const tipR = 1.5 + rng() * 0.7 // 1.5 .. 2.2 — into the glowing zone
    const cxs = (rng() - 0.5) * 0.26
    const cys = (rng() - 0.5) * 0.26 + 0.06
    const czs = (rng() - 0.5) * 0.26
    const tx = dx * tipR
    const ty = dy * tipR
    const tz = dz * tipR

    // Control point near the midpoint, pushed sideways so the strand curves.
    const bend = 0.45 + rng() * 0.95
    const bx = (cxs + tx) * 0.5 + (rng() - 0.5) * bend
    const by = (cys + ty) * 0.5 + (rng() - 0.5) * bend
    const bz = (czs + tz) * 0.5 + (rng() - 0.5) * bend

    const n = Math.min(perStrand, count - i)
    for (let k = 0; k < n; k++) {
      // Bias sampling toward the tip so nerve endings are denser + brighter.
      const u = n > 1 ? k / (n - 1) : 1
      const t = 0.12 + 0.88 * (u * u * (3 - 2 * u)) // smoothstep, tip-weighted
      const mt = 1 - t
      const a = mt * mt
      const b = 2 * mt * t
      const c = t * t
      // Wobble grows toward the tip so ends fan out like frayed fibers.
      const w = 0.03 + t * 0.07
      pos[i * 3] = a * cxs + b * bx + c * tx + (rng() - 0.5) * w
      pos[i * 3 + 1] = a * cys + b * by + c * ty + (rng() - 0.5) * w
      pos[i * 3 + 2] = a * czs + b * bz + c * tz + (rng() - 0.5) * w
      i++
    }
  }

  // Any rounding remainder becomes core dust.
  for (; i < count; i++) {
    pos[i * 3] = (rng() - 0.5) * 0.22
    pos[i * 3 + 1] = (rng() - 0.5) * 0.22
    pos[i * 3 + 2] = (rng() - 0.5) * 0.22
  }

  return pos
}
