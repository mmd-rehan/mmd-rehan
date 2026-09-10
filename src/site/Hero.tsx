import { useCallback, useMemo, useRef, useState } from 'react'
import { PLAYGROUND, type PlaygroundId } from './data'
import { FeatureCard } from './FeatureCard'
import { ExploreBar } from './ExploreBar'
import { Playground } from './playground/Playground'
import type { EngineHandle } from './playground/engine'

const byId = (id: PlaygroundId) =>
  PLAYGROUND.find((e) => e.id === id) ?? PLAYGROUND[0]

export function Hero() {
  // Stub state for the shell — replaced with the pure reducer + engine wiring
  // in a later task.
  const [selectedId, setSelectedId] = useState<PlaygroundId>('apis')
  const [discovered, setDiscovered] = useState<ReadonlySet<PlaygroundId>>(
    () => new Set<PlaygroundId>(['apis']),
  )
  const engineRef = useRef<EngineHandle | null>(null)

  const entry = byId(selectedId)

  const pick = useCallback((id: PlaygroundId) => {
    setSelectedId(id)
    setDiscovered((prev) => {
      if (prev.has(id)) return prev
      const next = new Set(prev)
      next.add(id)
      return next
    })
  }, [])

  const shuffle = useCallback(() => {
    engineRef.current?.shuffle()
  }, [])

  const entries = useMemo(() => PLAYGROUND, [])

  return (
    <section className="hero" id="playground">
      <div className="hero__eyebrow">
        <span>
          DUBAI, UAE <span className="hero__sep">|</span> BUILDING BEYOND THE SCREEN
        </span>
        <span className="hero__eyebrow-right">
          THE PLAYGROUND
          <span>SIX OBJECTS. ONE CURIOUS ENGINEER.</span>
        </span>
      </div>

      <div className="hero__grid">
        <div className="hero__copy">
          <h1 className="hero__name">
            Muhammad Rehan<span className="hero__stop">.</span>
          </h1>
          <p className="dual-heading hero__tagline">
            <span>Serious software.</span>
            <em>A little room to play.</em>
          </p>
          <p className="hero__lead">I build the systems behind everyday experiences.</p>

          <FeatureCard entry={entry} onCta={() => pick(entry.id)} />
        </div>

        <div className="hero__stage">
          <Playground
            selectedId={selectedId}
            onSelect={pick}
            onDiscover={() => {}}
            engineRef={engineRef}
          />
          <p className="hero__hint">
            <span aria-hidden="true">✋</span> Drag objects. Click to play.
          </p>
        </div>
      </div>

      <div className="hero__footline">
        <span className="hero__caption">{entry.caption}</span>
        <span className="hero__footline-mid">
          Drag empty space to orbit · Scroll or pinch to zoom
        </span>
        <a className="hero__footline-end" href="#work">
          A closer look at the work <span aria-hidden="true">↓</span>
        </a>
      </div>

      <ExploreBar
        entries={entries}
        selectedId={selectedId}
        discovered={discovered}
        onPick={pick}
        onShuffle={shuffle}
      />
    </section>
  )
}
