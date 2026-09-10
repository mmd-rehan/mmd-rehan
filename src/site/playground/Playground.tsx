import { useEffect, useRef } from 'react'
import { PLAYGROUND, type PlaygroundId } from '../data'
import type { EngineHandle } from './engine'

type Props = {
  selectedId: PlaygroundId
  onSelect: (id: PlaygroundId) => void
  onDiscover: (id: PlaygroundId) => void
  engineRef: React.MutableRefObject<EngineHandle | null>
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

export function Playground({ selectedId, onSelect, onDiscover, engineRef }: Props) {
  const hostRef = useRef<HTMLDivElement>(null)
  // Keep the latest callbacks without re-running the mount effect.
  const cbRef = useRef({ onSelect, onDiscover })
  cbRef.current = { onSelect, onDiscover }

  useEffect(() => {
    if (typeof window === 'undefined') return
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
  }, [engineRef])

  // Reflect external selection (category tab / reducer) into the engine.
  useEffect(() => {
    engineRef.current?.select(selectedId)
  }, [selectedId, engineRef])

  return <div className="playground-canvas" ref={hostRef} aria-hidden="true" />
}
