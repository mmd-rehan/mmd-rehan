import { useEffect, useRef, useState } from 'react'
import { PLAYGROUND, type PlaygroundId } from '../data'
import type { EngineHandle } from './engine'
import { supportsWebGL } from './supportsWebGL'

type Props = {
  onSelect: (id: PlaygroundId) => void
  onDiscover: (id: PlaygroundId) => void
  engineRef: React.MutableRefObject<EngineHandle | null>
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

export function Playground({ onSelect, onDiscover, engineRef }: Props) {
  const hostRef = useRef<HTMLDivElement>(null)
  // Keep the latest callbacks without re-running the mount effect.
  const cbRef = useRef({ onSelect, onDiscover })
  cbRef.current = { onSelect, onDiscover }

  // Assume capable during SSR / first paint; re-check on the client.
  const [webgl, setWebgl] = useState(true)
  useEffect(() => {
    setWebgl(supportsWebGL())
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || !webgl) return
    const host = hostRef.current
    if (!host) return

    let cancelled = false
    let handle: EngineHandle | null = null

    const boot = async () => {
      const { createEngine } = await import('./engine')
      if (cancelled || !hostRef.current) return
      handle = createEngine(hostRef.current, {
        catalog: PLAYGROUND,
        reducedMotion: Boolean(prefersReducedMotion()),
        onSelect: (id) => cbRef.current.onSelect(id),
        onDiscover: (id) => cbRef.current.onDiscover(id),
      })
      engineRef.current = handle
    }

    const ric = (window as Window).requestIdleCallback
    const cic = (window as Window).cancelIdleCallback
    const idle: number = ric
      ? ric(() => void boot(), { timeout: 1200 })
      : window.setTimeout(() => void boot(), 200)

    return () => {
      cancelled = true
      if (cic) cic(idle)
      else clearTimeout(idle)
      handle?.dispose()
      engineRef.current = null
    }
  }, [engineRef, webgl])

  if (!webgl) {
    return (
      <img
        className="playground-still"
        src="/playground-still.webp"
        alt="An isometric scene of six low-poly objects — a retro TV, an API ring, a first-aid kit, an aeroplane, a shipping container, and a server rack — on a tilted platform, one for each field Rehan has built software in."
      />
    )
  }

  return <div className="playground-canvas" ref={hostRef} aria-hidden="true" />
}
