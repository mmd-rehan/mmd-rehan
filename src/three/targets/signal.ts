import { mulberry32 } from '../../lib/rng'

/**
 * Healthcare chapter target - heartbeat pulse trace.
 *
 * Earlier this was a stack of eleven faint lines that read as noise. Now it's a
 * single dominant ECG waveform (P–QRS–T, four beats) sweeping across the field,
 * with two faint monitor echo-lines above and below for context. The classic
 * heartbeat silhouette reads instantly as "health" — that's the legibility win.
 */

/** Gaussian bump — the building block of the PQRST complex. */
function gauss(x: number, mu: number, sig: number): number {
  const d = x - mu
  return Math.exp(-(d * d) / (2 * sig * sig))
}

/** One cardiac cycle, local phase in [0,1) -> vertical deflection. */
function beat(local: number): number {
  return (
    0.06 * gauss(local, 0.18, 0.03) - // P wave
    0.07 * gauss(local, 0.31, 0.012) + // Q
    0.62 * gauss(local, 0.355, 0.012) - // R (the tall spike)
    0.16 * gauss(local, 0.4, 0.015) + // S
    0.13 * gauss(local, 0.62, 0.05) // T wave
  )
}

export function signalTarget(count: number, seed = 1001): Float32Array {
  const rng = mulberry32(seed)
  const pos = new Float32Array(count * 3)

  const spanX = 3.4 // -1.7 .. 1.7
  const beats = 4

  // 80% of the particles draw the main pulse as a crisp thick ribbon; the rest
  // form two faint flat-ish echo traces so it reads like a real monitor.
  const echo = Math.floor(count * 0.1)
  const mainN = count - echo * 2

  let i = 0

  // --- Main heartbeat trace (centered) ---
  for (let k = 0; k < mainN; k++, i++) {
    const u = k / mainN
    const x = u * spanX - spanX / 2
    const phase = u * beats
    const local = phase - Math.floor(phase)
    const y = beat(local) + (rng() - 0.5) * 0.022 // slight ribbon thickness
    const z = (rng() - 0.5) * 0.14
    pos[i * 3] = x
    pos[i * 3 + 1] = y
    pos[i * 3 + 2] = z
  }

  // --- Two faint echo traces (top + bottom), gentle wiggle only ---
  for (let e = 0; e < 2; e++) {
    const baseY = e === 0 ? 0.72 : -0.72
    const n = e === 0 ? echo : count - i // last echo absorbs any remainder
    const phaseOff = rng() * Math.PI * 2
    for (let k = 0; k < n; k++, i++) {
      const u = k / n
      const x = u * spanX - spanX / 2
      const y =
        baseY +
        Math.sin(u * beats * Math.PI * 2 + phaseOff) * 0.05 +
        beat(u * beats - Math.floor(u * beats)) * 0.12 // faint echo of the beat
      const z = (rng() - 0.5) * 0.18
      pos[i * 3] = x
      pos[i * 3 + 1] = y
      pos[i * 3 + 2] = z
    }
  }

  return pos
}
