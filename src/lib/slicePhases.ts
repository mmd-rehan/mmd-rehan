/**
 * Slice 1 choreography. The generic timeline (`morphStateAt`) drives which two
 * shapes blend; this maps global progress `t` to the *beats* of the portrait →
 * flip → neurons sequence, so each beat can start and end where it should
 * instead of all riding one blend value.
 *
 * Beat order (deliberately overlapping):
 *   0.00–0.08  photoreal scanned head, still
 *   0.08–0.22  crossfade: mesh fades out as the particle portrait fades in
 *   0.06–0.32  head pitches back — face still coherent
 *   0.12–0.32  skin resolves into topographic contour lines
 *   0.42–0.70  face disintegrates; particles morph to the nerve cloud
 *   0.34–0.76  filaments grow out from the head
 *   0.58–0.86  everything settles: particles fade to faint debris, strands lead
 */

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)
const smoothstep = (e0: number, e1: number, x: number) => {
  const t = clamp01((x - e0) / (e1 - e0))
  return t * t * (3 - 2 * t)
}

export interface SlicePhases {
  /** 0 = facing forward, 1 = tilted fully back. */
  tilt: number
  /** 0 = photo skin, 1 = warm-white contour lines (then fades as it dissolves). */
  contour: number
  /** 0 = intact, 1 = fully disintegrated / morphed to the nerve cloud. */
  dissolve: number
  /** 0 = no strands, 1 = strands fully grown. */
  filament: number
  /** 0 = particles full, 1 = particles are faint drifting debris. */
  settle: number
  /** 1 = photoreal scanned head fully opaque, 0 = fully faded out. */
  meshOpacity: number
  /** 0 = particle portrait hidden (mesh is carrying the hero), 1 = fully shown. */
  portraitReveal: number
}

export function slicePhasesAt(t: number): SlicePhases {
  const tilt = smoothstep(0.06, 0.32, t)
  const contourIn = smoothstep(0.12, 0.32, t)
  const contourOut = smoothstep(0.64, 0.84, t)
  const contour = contourIn * (1 - contourOut)
  const dissolve = smoothstep(0.42, 0.7, t)
  const filament = smoothstep(0.34, 0.76, t)
  const settle = smoothstep(0.58, 0.86, t)
  const meshOpacity = 1 - smoothstep(0.08, 0.26, t)
  const portraitReveal = smoothstep(0.04, 0.22, t)
  return { tilt, contour, dissolve, filament, settle, meshOpacity, portraitReveal }
}
