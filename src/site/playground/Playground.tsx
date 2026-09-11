import { useEffect, useRef, useState } from 'react'
import type { PlaygroundId } from '../data'
import type { EngineHandle } from './engine'
import { supportsWebGL } from './supportsWebGL'

type Props = {
  onSelect: (id: PlaygroundId) => void
  onDiscover: (id: PlaygroundId) => void
  onStatus: (message: string) => void
  onReady: (ready: boolean) => void
  tooltipFor: (id: PlaygroundId) => string
  engineRef: React.MutableRefObject<EngineHandle | null>
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

export function Playground({
  onSelect,
  onDiscover,
  onStatus,
  onReady,
  tooltipFor,
  engineRef,
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null)
  // Keep the latest callbacks without re-running the mount effect.
  const cbRef = useRef({ onSelect, onDiscover, onStatus, onReady, tooltipFor })
  cbRef.current = { onSelect, onDiscover, onStatus, onReady, tooltipFor }

  // Assume capable during SSR / first paint; re-check on the client.
  const [webgl, setWebgl] = useState(true)
  const [booted, setBooted] = useState(false)

  useEffect(() => {
    setWebgl(supportsWebGL())
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || !webgl) return
    if (!hostRef.current) return

    let cancelled = false
    let handle: EngineHandle | null = null

    const boot = async () => {
      const { createEngine } = await import('./engine')
      if (cancelled || !hostRef.current) return
      handle = createEngine(hostRef.current, {
        reducedMotion: Boolean(prefersReducedMotion()),
        onSelect: (id) => cbRef.current.onSelect(id),
        onDiscover: (id) => cbRef.current.onDiscover(id),
        onStatus: (message) => cbRef.current.onStatus(message),
        tooltipFor: (id) => cbRef.current.tooltipFor(id),
      })
      engineRef.current = handle
      setBooted(true)
      cbRef.current.onReady(true)
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
      cbRef.current.onReady(false)
    }
  }, [engineRef, webgl])

  if (!webgl) {
    return (
      <img
        className="playground-still"
        src="/playground-still.webp"
        alt="An isometric scene of six low-poly objects — a retro TV, an API ring, a first-aid kit, an aeroplane, a shipping container, and a server rack — on a desk, one for each field Rehan has built software in."
      />
    )
  }

  return (
    <>
      <div
        className="scene-host"
        ref={hostRef}
        aria-label="Six interactive 3D objects on an engineering desk. Use the object buttons below for keyboard access."
      />
      {!booted && (
        <div className="scene-loading">
          <span className="loading-orbit" aria-hidden="true" />
          <span>Setting the desk&hellip;</span>
        </div>
      )}
    </>
  )
}
