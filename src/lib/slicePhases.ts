/**
 * Hero choreography. Maps global scroll progress `t` ∈ [0,1] to the beats of
 * the reference sequence: photoreal head → pitch back → a sweep front eats the
 * mesh into particles (ember burn at the edge) → white neuron strands take over.
 *
 * Beat order (deliberately overlapping):
 *   0.00–0.05  the photoreal head, still, a subtle idle
 *   0.05–0.26  it pitches back (chin up), rotating slightly
 *   0.12–0.52  a sweep front crosses the head; mesh ahead of it stays solid,
 *              behind it becomes particles, with an ember burn at the line
 *   0.14–0.60  the surviving skin resolves into white topographic contour lines
 *   0.32–0.80  white fibre strands ("neurons") grow out of where the head was
 *   0.60–0.90  particles fade to drifting dust; the strands own the frame
 */

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)
const smoothstep = (e0: number, e1: number, x: number) => {
  const t = clamp01((x - e0) / (e1 - e0))
  return t * t * (3 - 2 * t)
}

export interface SlicePhases {
  /** 0 = facing forward, 1 = pitched fully back. */
  tilt: number
  /** 0 = photo skin, 1 = warm-white contour lines (then fades as it dissolves). */
  contour: number
  /** 0 = intact mesh, 1 = the sweep front has crossed the whole head. */
  dissolve: number
  /** 0 = no strands, 1 = strands fully grown. */
  filament: number
  /** 0 = particles full, 1 = particles are gone. */
  settle: number
  /** 0 = warm rest environment, 1 = cool once the abstract form has developed. */
  develop: number
}

export function slicePhasesAt(t: number): SlicePhases {
  const tilt = smoothstep(0.05, 0.26, t)

  const contourIn = smoothstep(0.14, 0.32, t)
  const contourOut = smoothstep(0.42, 0.6, t)
  const contour = contourIn * (1 - contourOut)

  const dissolve = smoothstep(0.12, 0.52, t)
  const filament = smoothstep(0.28, 0.62, t)
  const settle = smoothstep(0.5, 0.72, t)
  const develop = smoothstep(0.16, 0.78, t)

  return { tilt, contour, dissolve, filament, settle, develop }
}
