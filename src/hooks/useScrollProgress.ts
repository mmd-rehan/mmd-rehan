import { useEffect, useRef, type MutableRefObject } from 'react'
import { heroScrollRange } from '../lib/heroScroll'

/**
 * Maps window scroll position to a lerped progress value t ∈ [0, 1].
 *
 * The hero has a tall spacer (in App) that provides its scroll room; progress
 * is measured against that spacer only, so the readable site appended below it
 * doesn't drag the timeline. Raw scroll gives a *target* t; each animation
 * frame we ease the current value toward it, so a flick of the wheel glides
 * instead of snapping - the "damped virtual scroll" from the reference.
 *
 * We don't put t in React state (that would re-render every frame). Instead we
 * expose refs the render loop and DOM chrome read directly, plus an onChange
 * callback throttled to meaningful deltas for the (cheap) text layer.
 */
export interface ScrollProgress {
  /** Eased progress, read every frame by the WebGL loop. */
  current: MutableRefObject<number>
  /** Raw scroll target (un-eased). */
  target: MutableRefObject<number>
}

export function useScrollProgress(
  onChange?: (t: number) => void,
  opts: { ease?: number } = {},
): ScrollProgress {
  const current = useRef(0)
  const target = useRef(0)
  const raf = useRef<number>()
  const lastEmitted = useRef(-1)
  const ease = opts.ease ?? 0.12

  useEffect(() => {
    // Dev only: `?scrub=0.42` pins the timeline at a fixed t so the
    // scroll-scrubbed scene can be screenshotted deterministically (a hidden
    // automation tab pauses requestAnimationFrame, freezing the ease loop).
    if (import.meta.env.DEV) {
      const scrub = new URLSearchParams(window.location.search).get('scrub')
      if (scrub !== null && Number.isFinite(Number(scrub))) {
        const v = clamp01(Number(scrub))
        current.current = v
        target.current = v
        onChange?.(v)
        return
      }
    }

    const computeTarget = () => {
      const max = heroScrollRange()
      target.current = max > 0 ? clamp01(window.scrollY / max) : 0
    }

    const tick = () => {
      current.current += (target.current - current.current) * ease
      if (Math.abs(target.current - current.current) < 0.00015) {
        current.current = target.current
      }
      // Only notify the DOM layer on visible change.
      if (onChange && Math.abs(current.current - lastEmitted.current) > 0.0015) {
        lastEmitted.current = current.current
        onChange(current.current)
      }
      raf.current = requestAnimationFrame(tick)
    }

    computeTarget()
    window.addEventListener('scroll', computeTarget, { passive: true })
    window.addEventListener('resize', computeTarget)
    raf.current = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener('scroll', computeTarget)
      window.removeEventListener('resize', computeTarget)
      if (raf.current) cancelAnimationFrame(raf.current)
    }
  }, [onChange, ease])

  return { current, target }
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)
