import { useEffect, useRef, type MutableRefObject } from 'react'

/**
 * Maps window scroll position to a lerped progress value t ∈ [0, 1].
 *
 * The page has several viewport-heights of scroll room (the tall spacer in
 * App). Raw scroll gives a *target* t; each animation frame we ease the current
 * value toward it, so a flick of the wheel glides instead of snapping - the
 * "damped virtual scroll" from the reference.
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
    const computeTarget = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
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
