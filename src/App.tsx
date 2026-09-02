import { useCallback, useEffect, useMemo, useState } from 'react'
import { detectDeviceTier, type DeviceTier } from './lib/deviceTier'
import { buildTargets, type TargetSet } from './three/targets'
import { morphStateAt } from './lib/timeline'
import { useScrollProgress } from './hooks/useScrollProgress'
import { Scene } from './three/Scene'
import { Header } from './ui/Header'
import { ChapterText } from './ui/ChapterText'
import { RightIndex } from './ui/RightIndex'
import { ScrollHint } from './ui/ScrollHint'
import { FallbackView } from './ui/FallbackView'
import { Loader } from './ui/Loader'
import { CHAPTERS } from './content/chapters'

/** Total scroll room, in viewport heights, that the timeline is mapped across.
 *  Slice 1: enough to scrub the flip smoothly without an endless page. */
const SCROLL_VH = Math.max(5, CHAPTERS.length * 2.2)

export default function App() {
  const [tier] = useState<DeviceTier>(() => detectDeviceTier())
  const [calm, setCalm] = useState<boolean>(tier.reducedMotion)
  const [targets, setTargets] = useState<TargetSet | null>(null)

  // Immersive mode = we have WebGL AND the user hasn't asked for calm/reduced.
  const immersive = tier.webgl && !calm

  // Cheap DOM-facing state, updated only on meaningful scroll deltas.
  const [activeIndex, setActiveIndex] = useState(0)
  const [progressPct, setProgressPct] = useState(0)
  const [hintVisible, setHintVisible] = useState(true)

  const onScroll = useCallback((t: number) => {
    const state = morphStateAt(t)
    setActiveIndex(state.activeIndex)
    setProgressPct(t)
    if (t > 0.01) setHintVisible(false)
  }, [])

  const { current: progressRef } = useScrollProgress(immersive ? onScroll : undefined)

  // Build particle targets once, only if we'll actually render them.
  useEffect(() => {
    if (!immersive) return
    let alive = true
    buildTargets(tier.particleCount).then((t) => {
      if (alive) setTargets(t)
    })
    return () => {
      alive = false
    }
  }, [immersive, tier.particleCount])

  const scrollRoomStyle = useMemo(
    () => ({ height: `${SCROLL_VH * 100}vh` }),
    [],
  )

  if (!immersive) {
    return (
      <>
        <Header calm={calm} onToggleCalm={() => setCalm((c) => !c)} />
        <FallbackView showPortrait reason={tier.webgl ? 'calm' : 'no-webgl'} />
      </>
    )
  }

  return (
    <>
      <a id="top" />
      {/* Fixed WebGL layer */}
      {targets ? (
        <Scene targets={targets} tier={tier} progress={progressRef} />
      ) : (
        <Loader />
      )}

      {/* Atmospheric vignette so the lit form reads against deeper edges */}
      <div className="vignette" aria-hidden="true" />

      {/* Fixed 2D chrome over the canvas */}
      <Header calm={calm} onToggleCalm={() => setCalm((c) => !c)} />
      <ChapterText activeIndex={activeIndex} />
      <RightIndex activeIndex={activeIndex} progress={progressPct} />
      <ScrollHint visible={hintVisible && !!targets} />

      {/* Invisible tall spacer that provides the scroll room the timeline maps to */}
      <div className="scroll-room" style={scrollRoomStyle} aria-hidden="true" />
    </>
  )
}
