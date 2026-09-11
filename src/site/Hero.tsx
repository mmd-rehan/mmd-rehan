import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { PLAYGROUND, type PlaygroundId } from './data'
import { FeatureCard } from './FeatureCard'
import { ExploreBar } from './ExploreBar'
import { ControlCluster } from './ControlCluster'
import { Playground } from './playground/Playground'
import type { EngineHandle } from './playground/engine'
import { ArrowDown, Hand, Move } from './Icons'
import { initialPlaygroundState, playgroundReducer } from './playgroundState'

const byId = (id: PlaygroundId) => PLAYGROUND.find((e) => e.id === id) ?? PLAYGROUND[0]

const OPENING_LINE = 'Pick something up. See what happens.'

export function Hero() {
  const [state, dispatch] = useReducer(playgroundReducer, initialPlaygroundState)
  const { selectedId, discovered } = state
  const engineRef = useRef<EngineHandle | null>(null)
  const [ready, setReady] = useState(false)
  const [paused, setPaused] = useState(false)
  const [orbiting, setOrbiting] = useState(false)
  const [status, setStatus] = useState(OPENING_LINE)

  const entry = byId(selectedId)
  const entries = useMemo(() => PLAYGROUND, [])

  // Picking a category selects the object; picking the one already selected
  // replays it, which is also what the card's CTA does.
  const pick = useCallback(
    (id: PlaygroundId) => {
      dispatch({ type: 'select', id })
      engineRef.current?.select(id)
      if (id === selectedId) engineRef.current?.play(id)
    },
    [selectedId],
  )

  const replay = useCallback((id: PlaygroundId) => {
    engineRef.current?.play(id)
    dispatch({ type: 'select', id })
  }, [])

  const onEngineSelect = useCallback((id: PlaygroundId) => {
    dispatch({ type: 'select', id })
  }, [])

  const onDiscover = useCallback((id: PlaygroundId) => {
    dispatch({ type: 'discover', id })
  }, [])

  useEffect(() => {
    engineRef.current?.select(selectedId)
  }, [selectedId])

  const tooltipFor = useCallback((id: PlaygroundId) => byId(id).project, [])

  return (
    <section className="playground" id="playground" aria-label="Interactive 3D portfolio">
      <div className="intro">
        <p className="eyebrow">
          DUBAI, UAE <span className="tiny-divider" /> BUILDING BEYOND THE SCREEN
        </p>
        <h1>
          <span>Muhammad</span> <span>Rehan<span className="name-dot">.</span></span>
        </h1>
        <p className="intro-line">
          Serious software.
          <br />
          <em>A little room to play.</em>
        </p>
        <p className="intro-description">I build the systems behind everyday experiences.</p>
      </div>

      <div className="scene-area">
        <Playground
          onSelect={onEngineSelect}
          onDiscover={onDiscover}
          onStatus={setStatus}
          onReady={setReady}
          tooltipFor={tooltipFor}
          engineRef={engineRef}
        />

        <div className="scene-corner">
          <span className="scene-index">THE PLAYGROUND</span>
          <span>SIX OBJECTS. ONE CURIOUS ENGINEER.</span>
        </div>

        <ControlCluster
          ready={ready}
          paused={paused}
          orbiting={orbiting}
          onZoomIn={() => engineRef.current?.zoom(1)}
          onZoomOut={() => engineRef.current?.zoom(-1)}
          onToggleOrbit={() => setOrbiting(engineRef.current?.toggleOrbit() ?? false)}
          onTogglePause={() => {
            const next = engineRef.current?.togglePause() ?? !paused
            setPaused(next)
            if (next) setOrbiting(false)
          }}
          onReset={() => {
            engineRef.current?.reset()
            setOrbiting(false)
          }}
        />

        <p className="play-tip">
          <Hand />
          <span>Drag objects. Click to play.</span>
        </p>
      </div>

      <FeatureCard entry={entry} ready={ready} onCta={() => replay(entry.id)} />


      <ExploreBar
        entries={entries}
        selectedId={selectedId}
        discovered={discovered}
        onPick={pick}
        onShuffle={() => engineRef.current?.shuffle()}
      />

      <div className="play-status">
        <p role="status" aria-live="polite">
          {status}
        </p>
        <span>
          <Move /> Drag empty space to orbit <span className="tiny-divider" /> Scroll or pinch to
          zoom
        </span>
        <a href="#work">
          A closer look at the work <ArrowDown />
        </a>
      </div>
    </section>
  )
}
