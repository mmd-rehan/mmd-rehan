import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { PLAYGROUND, type PlaygroundId } from './data'
import { FeatureCard } from './FeatureCard'
import { ExploreBar } from './ExploreBar'
import { ControlCluster } from './ControlCluster'
import { Playground } from './playground/Playground'
import type { EngineHandle } from './playground/engine'
import {
  initialPlaygroundState,
  playgroundReducer,
} from './playgroundState'

const byId = (id: PlaygroundId) =>
  PLAYGROUND.find((e) => e.id === id) ?? PLAYGROUND[0]

export function Hero() {
  const [state, dispatch] = useReducer(playgroundReducer, initialPlaygroundState)
  const { selectedId, discovered } = state
  const engineRef = useRef<EngineHandle | null>(null)
  const [paused, setPaused] = useState(false)

  const entry = byId(selectedId)

  // User picked a category tab / hit the card CTA — tell the engine, which will
  // focus + play and echo back through onSelect.
  const pick = useCallback((id: PlaygroundId) => {
    if (engineRef.current) engineRef.current.select(id)
    else dispatch({ type: 'select', id })
  }, [])

  const replay = useCallback((id: PlaygroundId) => {
    if (engineRef.current) engineRef.current.play(id)
    dispatch({ type: 'select', id })
  }, [])

  // Engine emitted a selection (object click, or echo of pick()).
  const onEngineSelect = useCallback((id: PlaygroundId) => {
    dispatch({ type: 'select', id })
  }, [])

  const shuffle = useCallback(() => {
    engineRef.current?.shuffle()
  }, [])

  // Keep the engine's camera focus in step with external selection changes.
  useEffect(() => {
    engineRef.current?.select(selectedId)
  }, [selectedId])

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

          <FeatureCard entry={entry} onCta={() => replay(entry.id)} />
        </div>

        <div className="hero__stage">
          <Playground
            onSelect={onEngineSelect}
            onDiscover={() => {}}
            engineRef={engineRef}
          />
          <ControlCluster
            paused={paused}
            onZoomIn={() => engineRef.current?.zoom(1)}
            onZoomOut={() => engineRef.current?.zoom(-1)}
            onRecenter={() => engineRef.current?.recenter()}
            onTogglePause={() =>
              setPaused(engineRef.current?.togglePause() ?? !paused)
            }
            onReset={() => engineRef.current?.reset()}
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
