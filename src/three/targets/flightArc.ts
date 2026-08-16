import { mulberry32 } from '../../lib/rng'

/**
 * Aviation chapter target - an airplane model.
 * low-left as if on a runway. It reads as a real plane (fuselage, swept wings,
 * tailplane, vertical fin), pointing along +x (nose forward).
 *
 * The takeoff is produced by the render pipeline, not baked here: the shape sits
 * parked at rest; then the shader's `uLift` pitches the nose up and arcs it into
 * a climb across the aviation chapter, while the morph toward the (centered) next
 * shape carries it up-and-across the field — so it taxis, rotates, lifts off and
 * disperses. Building it low-left is what makes that flight path read.
 */

// Parked-on-runway offset applied to every point.
const OX = -0.35
const OY = -0.72

export function flightArcTarget(count: number, seed = 2002): Float32Array {
  const rng = mulberry32(seed)
  const pos = new Float32Array(count * 3)

  // Particle budget per component (must sum to <= 1; remainder -> fuselage).
  const nFus = Math.floor(count * 0.36)
  const nWing = Math.floor(count * 0.36) // both wings combined
  const nTail = Math.floor(count * 0.14) // horizontal stabilizers
  const nFin = count - nFus - nWing - nTail // vertical fin (absorbs remainder)

  let i = 0
  const put = (x: number, y: number, z: number) => {
    pos[i * 3] = x + OX
    pos[i * 3 + 1] = y + OY
    pos[i * 3 + 2] = z
    i++
  }

  // --- Fuselage: pointed nose (+x), tapered tail (-x) ---
  for (let k = 0; k < nFus; k++) {
    const t = k / nFus // 0 tail .. 1 nose
    const x = -0.78 + t * 1.73 // -0.78 .. 0.95
    // sin profile => tapers to a point at both nose and tail; belly in middle.
    const rad = 0.115 * Math.sqrt(Math.max(0, Math.sin(t * Math.PI))) + 0.006
    const a = rng() * Math.PI * 2
    const y = rad * Math.sin(a) * 0.9
    const z = rad * Math.cos(a)
    put(x, y, z)
  }

  // --- Main wings: swept back, slight dihedral, thin ---
  for (let k = 0; k < nWing; k++) {
    const sgn = k % 2 === 0 ? 1 : -1
    const sv = rng() // 0 root .. 1 tip
    const xLE = 0.14 - sv * 0.46 // leading edge sweeps back toward the tip
    const chord = 0.34 * (1 - 0.55 * sv)
    const x = xLE - rng() * chord
    const y = 0.02 + sv * 0.06 + (rng() - 0.5) * 0.015 // dihedral + thin skin
    const z = sgn * (0.08 + sv * 0.72)
    put(x, y, z)
  }

  // --- Horizontal stabilizers (tailplane) ---
  for (let k = 0; k < nTail; k++) {
    const sgn = k % 2 === 0 ? 1 : -1
    const sv = rng()
    const xLE = -0.52 - sv * 0.16
    const chord = 0.17 * (1 - 0.5 * sv)
    const x = xLE - rng() * chord
    const y = 0.03 + sv * 0.03 + (rng() - 0.5) * 0.012
    const z = sgn * (0.05 + sv * 0.26)
    put(x, y, z)
  }

  // --- Vertical fin (tail) rising in +y at the rear ---
  for (let k = 0; k < nFin; k++) {
    const hv = rng() // 0 base .. 1 top
    const chord = 0.22 * (1 - 0.55 * hv)
    const xLE = -0.66 + hv * 0.2 // swept forward as it rises
    const x = xLE + rng() * chord
    const y = 0.08 + hv * 0.34
    const z = (rng() - 0.5) * 0.03
    put(x, y, z)
  }

  return pos
}
