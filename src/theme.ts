import * as THREE from 'three'

/**
 * Visual system constants shared between the WebGL scene and the DOM chrome.
 *
 * Palette: a soft, pale environment — a warm blush/stone that shifts toward a
 * cool gray-green as the abstract form develops, matching the reference. These
 * are RENDER-TARGET colours (what should land on screen), not eyedropped source
 * samples: the renderer runs with colour management on and tone mapping off, so
 * a shader that outputs `*_RGB` (converted to linear below) reproduces the hex.
 */

export const PALETTE = {
  /** Warm blush/stone — the rest-state background. */
  warmBg: '#DED4CC',
  /** Cool gray-green — the background once the form has developed. */
  coolBg: '#D4DEDA',
  /** Strand body / drifting dust. */
  strandBody: '#E8ECE5',
  /** Cool energy — contour lines, cool conduits. */
  coolEnergy: '#7CDDED',
  /** Blazing core (sphere / vortex centre). */
  hotCore: '#FFF8D0',
  /** Yellow energy — strand tips, mid-heat. */
  yellowEnergy: '#FFD34D',
  /** Amber rim — the burn front, hot edges, rim light. */
  amberRim: '#F59632',
} as const

export const THEME = {
  background: PALETTE.warmBg,
  backgroundCool: PALETTE.coolBg,
  strandLight: PALETTE.strandBody,
  ember: PALETTE.amberRim,
  emberHot: PALETTE.yellowEnergy,
  /** DOM text tones on pale stone. */
  ink: '#2C2723',
  inkMuted: '#6E655C',
  inkFaint: '#A79C8F',
} as const

/** sRGB hex -> linear RGB triple (ColorManagement is on, so THREE.Color stores
 *  linear). Shader uniforms want these; the renderer encodes back to sRGB. */
function lin(hex: string): { r: number; g: number; b: number } {
  const c = new THREE.Color(hex)
  return { r: c.r, g: c.g, b: c.b }
}

export const WARM_BG_RGB = lin(PALETTE.warmBg)
export const COOL_BG_RGB = lin(PALETTE.coolBg)
export const STRAND_RGB = lin(PALETTE.strandBody)
export const COOL_ENERGY_RGB = lin(PALETTE.coolEnergy)
export const HOT_CORE_RGB = lin(PALETTE.hotCore)
export const YELLOW_RGB = lin(PALETTE.yellowEnergy)
export const AMBER_RGB = lin(PALETTE.amberRim)

/** Back-compat aliases for shaders written against the old names. */
export const EMBER_RGB = AMBER_RGB
export const EMBER_HOT_RGB = YELLOW_RGB
export const PARTICLE_LIGHT_RGB = STRAND_RGB
