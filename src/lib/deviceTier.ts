/**
 * Capability + performance tiering. Decides how many particles to render, the
 * device-pixel-ratio cap, and whether WebGL is usable at all. Keeping this pure
 * and centralized means the render path and the fallback path agree on one
 * verdict.
 */

export interface DeviceTier {
  /** Particle count for the single shared buffer. */
  particleCount: number
  /** Upper bound on devicePixelRatio passed to the renderer. */
  dprCap: number
  /** Whether WebGL is available in this browser. */
  webgl: boolean
  /** Whether the user asked for reduced motion. */
  reducedMotion: boolean
  /** Coarse label, useful for debugging / analytics. */
  label: 'high' | 'mid' | 'low' | 'none'
}

function hasWebGL(): boolean {
  if (typeof document === 'undefined') return false
  try {
    const canvas = document.createElement('canvas')
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    )
  } catch {
    return false
  }
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Rough mobile / low-power heuristic. */
function isSmallOrTouch(): boolean {
  if (typeof window === 'undefined') return false
  const narrow = window.matchMedia('(max-width: 820px)').matches
  const coarse = window.matchMedia('(pointer: coarse)').matches
  const fewCores =
    typeof navigator !== 'undefined' &&
    typeof navigator.hardwareConcurrency === 'number' &&
    navigator.hardwareConcurrency <= 4
  return narrow || (coarse && fewCores)
}

export function detectDeviceTier(): DeviceTier {
  const webgl = hasWebGL()
  const reducedMotion = prefersReducedMotion()

  if (!webgl) {
    return { particleCount: 0, dprCap: 1, webgl: false, reducedMotion, label: 'none' }
  }

  if (isSmallOrTouch()) {
    return { particleCount: 24000, dprCap: 1.5, webgl: true, reducedMotion, label: 'low' }
  }

  const cores =
    typeof navigator !== 'undefined' ? navigator.hardwareConcurrency ?? 8 : 8
  if (cores >= 8) {
    return { particleCount: 90000, dprCap: 2, webgl: true, reducedMotion, label: 'high' }
  }

  return { particleCount: 55000, dprCap: 1.75, webgl: true, reducedMotion, label: 'mid' }
}
