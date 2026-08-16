import { CHAPTERS, type Chapter, type TargetKey } from '../content/chapters'

export interface MorphState {
  /** Index of the chapter whose slice contains t. */
  activeIndex: number
  /** The chapter object currently active. */
  active: Chapter
  /** Progress 0..1 within the active chapter's slice. */
  local: number
  /** Shape we are morphing FROM. */
  from: TargetKey
  /** Shape we are morphing TO. */
  to: TargetKey
  /**
   * Blend factor 0..1 between `from` and `to`. 0 = fully settled on the active
   * chapter's shape; ramps to 1 across the last part of the slice as we head
   * into the next chapter.
   */
  blend: number
  /**
   * Transition energy 0..1 - how mid-morph we are. Peaks at blend≈0.5 and is 0
   * when settled. Drives turbulence + ember glow in the shader.
   */
  energy: number
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)

/**
 * Given global progress t, work out which shapes to blend and by how much.
 *
 * Within a chapter's slice, only the first ~22% is "settled" on that shape; the
 * rest morphs toward the next chapter's shape, so transitions are near-continuous
 * - the next form is already arriving as the current one disperses.
 */
export function morphStateAt(t: number): MorphState {
  const p = clamp01(t)

  let idx = CHAPTERS.findIndex((c) => p >= c.start && p < c.end)
  if (idx === -1) idx = CHAPTERS.length - 1

  const chapter = CHAPTERS[idx]
  const span = chapter.end - chapter.start
  const local = span > 0 ? (p - chapter.start) / span : 0

  // Keep the forms in near-continuous motion: a brief settled beat to register
  // the shape, then a long transition that runs right up to the next chapter, so
  // one form is still arriving as the previous one disperses (no dead gap).
  const settleUntil = 0.22
  const next = CHAPTERS[idx + 1]

  let blend = 0
  let to = chapter.target
  if (next && local > settleUntil) {
    blend = (local - settleUntil) / (1 - settleUntil)
    to = next.target
  }
  const b = clamp01(blend)

  // Dispersal energy: rises fast to a sustained plateau across the middle of the
  // transition, then falls - so particles stay blown-apart as an ember cloud for
  // a real beat instead of pinching through a single instant.
  const energy = smoothstep(0.0, 0.28, b) * (1 - smoothstep(0.74, 1.0, b))

  return {
    activeIndex: idx,
    active: chapter,
    local,
    from: chapter.target,
    to,
    blend: b,
    energy,
  }
}

/** Hermite smoothstep, matching the GLSL one. */
function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0))
  return t * t * (3 - 2 * t)
}
