/**
 * Visual system constants shared between the WebGL scene and the DOM chrome so
 * the two layers stay in lockstep.
 *
 * Palette: dark warm charcoal + ember. Matches Rehan's brand photos (dark
 * studio backgrounds, ember rim light, the ✦ sparkle mark) and makes the
 * particle bloom actually glow. The reference video is cream; this deliberately
 * is not — it is his identity, not a clone.
 */

export const THEME = {
  /** Near-black, faintly warm page background. */
  background: '#0C0B0D',
  /** Deeper tone used at the vignette edges. */
  backgroundDeep: '#050505',
  /** Structural particles at rest (disintegration debris) — warm off-white. */
  particleLight: '#F1E8DA',
  /** Strand / contour-line white. */
  strandLight: '#FFF6EC',
  /** Ember accent — the morph-front glow. */
  ember: '#FF5A1F',
  /** Incandescent tip. */
  emberHot: '#FFB43C',
  /** Text tones on charcoal. */
  ink: '#ECE4D8',
  inkMuted: '#8B8178',
  inkFaint: '#5A544D',
} as const

/** Numeric colors for Three.js (avoids re-parsing hex each frame). */
export const EMBER_RGB = { r: 1.0, g: 0.353, b: 0.122 } // #FF5A1F
export const EMBER_HOT_RGB = { r: 1.0, g: 0.706, b: 0.235 } // #FFB43C
export const PARTICLE_LIGHT_RGB = { r: 0.945, g: 0.91, b: 0.855 } // #F1E8DA
export const STRAND_RGB = { r: 1.0, g: 0.965, b: 0.925 } // #FFF6EC

/**
 * Per-domain glow palette. Particles rest light (visible on charcoal); as they
 * heat up — outer tips at rest, and the whole cloud as it disperses on scroll —
 * they climb toward `mid` then `hot`. Each domain gets its own hue so every
 * disappear / reappear moment reads distinctly, while the hero forms (portrait,
 * nerves) keep the signature ember.
 */
export type RGB = readonly [number, number, number]
export interface GlowPair {
  mid: RGB
  hot: RGB
}

const EMBER_GLOW: GlowPair = {
  mid: [1.0, 0.353, 0.122], // ember #FF5A1F
  hot: [1.0, 0.706, 0.235], // hot #FFB43C
}

/** Keyed by TargetKey (kept as a plain map so theme.ts stays dependency-free). */
export const DOMAIN_GLOW: Record<string, GlowPair> = {
  portrait: EMBER_GLOW,
  nerves: EMBER_GLOW,
  // Health — vital emerald (monitor green).
  signal: { mid: [0.15, 0.78, 0.55], hot: [0.55, 0.95, 0.75] },
  // Aviation — jet / sky blue.
  flightArc: { mid: [0.28, 0.6, 0.98], hot: [0.62, 0.83, 1.0] },
  // Crypto — mining gold.
  hashGrid: { mid: [0.95, 0.68, 0.12], hot: [1.0, 0.87, 0.45] },
  // Logistics — container cyan (sea / flow).
  torus: { mid: [0.1, 0.7, 0.78], hot: [0.45, 0.92, 0.98] },
}
