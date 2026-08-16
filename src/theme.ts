/**
 * Visual system constants shared between the WebGL scene and the DOM chrome,
 * so the two layers stay in lockstep. Colors are warm cream + ember, matching
 * the reference design.
 */

export const THEME = {
  /** Warm cream page background (faint pink undertone). */
  background: '#F2ECE3',
  backgroundDeep: '#E9E0D2',
  /** Particles at rest (portrait / structural states). */
  particleDark: '#1A1512',
  /** Strand / highlight white. */
  strandLight: '#FFF8F0',
  /** Ember accent - the morph-front glow. */
  ember: '#FF5A1F',
  emberHot: '#FFC24B',
  /** Text tones on cream. */
  ink: '#211B14',
  inkMuted: '#6E6156',
} as const

/** Numeric ember colors for Three.js (avoids re-parsing hex each frame). */
export const EMBER_RGB = { r: 1.0, g: 0.353, b: 0.122 } // #FF5A1F
export const EMBER_HOT_RGB = { r: 1.0, g: 0.761, b: 0.294 } // #FFC24B
export const PARTICLE_DARK_RGB = { r: 0.102, g: 0.082, b: 0.071 } // #1A1512

/**
 * Per-domain glow palette. Particles rest dark (crisp on cream); as they light
 * up - outer tips at rest, and the whole cloud as it disperses on scroll - they
 * heat toward `mid` then `hot`. Each domain gets its own hue so every
 * disappear/reappear moment reads distinctly, while the hero forms (portrait,
 * nerves) keep the signature ember. Tweak these triples to recolor a domain.
 */
export type RGB = readonly [number, number, number]
export interface GlowPair {
  mid: RGB
  hot: RGB
}

const EMBER_GLOW: GlowPair = {
  mid: [1.0, 0.353, 0.122], // ember #FF5A1F
  hot: [1.0, 0.761, 0.294], // hot #FFC24B
}

/** Keyed by TargetKey (kept as a plain map so theme.ts stays dependency-free). */
export const DOMAIN_GLOW: Record<string, GlowPair> = {
  portrait: EMBER_GLOW,
  nerves: EMBER_GLOW,
  // Health - vital emerald (monitor green).
  signal: { mid: [0.063, 0.725, 0.506], hot: [0.435, 0.925, 0.72] },
  // Aviation - jet / sky blue.
  flightArc: { mid: [0.184, 0.502, 0.929], hot: [0.6, 0.79, 1.0] },
  // Crypto - mining gold.
  hashGrid: { mid: [0.898, 0.63, 0.086], hot: [1.0, 0.855, 0.42] },
  // Logistics - container cyan (sea / flow).
  torus: { mid: [0.055, 0.647, 0.718], hot: [0.42, 0.912, 0.976] },
}
