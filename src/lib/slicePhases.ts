/**
 * Hero choreography. Maps global scroll progress `t` ∈ [0,1] to the beats of
 * the portrait → flip → neurons sequence, so each beat starts and ends where it
 * should instead of all riding one blend value.
 *
 * Beat order (deliberately overlapping):
 *   0.00–0.06  the head, still — a portrait made of points
 *   0.06–0.34  it pitches back, face still coherent
 *   0.12–0.34  skin resolves into topographic contour lines
 *   0.40–0.68  the face disintegrates; points morph to the nerve cloud
 *   0.32–0.74  filaments grow outward from where the head was
 *   0.58–0.86  everything settles: points fade to faint debris, strands lead
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
  /** 0 = points full, 1 = points are faint drifting debris. */
  settle: number
}

export function slicePhasesAt(t: number): SlicePhases {
  const tilt = smoothstep(0.06, 0.34, t)
  const contourIn = smoothstep(0.12, 0.34, t)
  const contourOut = smoothstep(0.62, 0.82, t)
  const contour = contourIn * (1 - contourOut)
  const dissolve = smoothstep(0.4, 0.68, t)
  const filament = smoothstep(0.32, 0.74, t)
  const settle = smoothstep(0.58, 0.86, t)
  return { tilt, contour, dissolve, filament, settle }
}
