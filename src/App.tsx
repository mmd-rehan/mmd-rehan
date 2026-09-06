import { useCallback, useEffect, useMemo, useState } from 'react'
import { detectDeviceTier, type DeviceTier } from './lib/deviceTier'
import { buildTargets, type TargetSet } from './three/targets'
import { morphStateAt } from './lib/timeline'
import { useScrollProgress } from './hooks/useScrollProgress'
import { HERO_SPACER_ID } from './lib/heroScroll'
import { Scene } from './three/Scene'
import { Header } from './ui/Header'
import { ChapterText } from './ui/ChapterText'
import { RightIndex } from './ui/RightIndex'
import { ScrollHint } from './ui/ScrollHint'
import { FallbackView } from './ui/FallbackView'
import { SiteContent } from './ui/SiteContent'
import { Loader } from './ui/Loader'
import { CHAPTERS } from './content/chapters'

/** Total scroll room, in viewport heights, that the hero timeline is mapped
 *  across — enough to scrub the flip smoothly without an endless page. */
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

  // The vortex finale forms right up to t≈0.9, so only fade the fixed hero
  // layer out at the very end to reveal the readable site behind it (and park
  // the render loop).
  const pastHero = progressPct >= 0.985

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

  const scrollRoomStyle = useMemo(() => ({ height: `${SCROLL_VH * 100}vh` }), [])

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

      {/* Fixed cinematic hero: WebGL layer + its own 2D chrome. Fades and parks
          its render loop once you scroll past it. */}
      <div
        className={`hero-stage ${pastHero ? 'hero-stage--hidden' : ''}`}
        aria-hidden={pastHero || undefined}
      >
        {targets ? (
          <Scene
            targets={targets}
            tier={tier}
            progress={progressRef}
            active={!pastHero}
          />
        ) : (
          <Loader />
        )}
        <div className="vignette" aria-hidden="true" />
        <ChapterText activeIndex={activeIndex} />
        <RightIndex activeIndex={activeIndex} progress={progressPct} />
        <ScrollHint visible={hintVisible && !!targets} />
      </div>

      <Header calm={calm} onToggleCalm={() => setCalm((c) => !c)} />

      {/* Tall spacer that provides the scroll room the hero timeline maps to. */}
      <div
        id={HERO_SPACER_ID}
        className="scroll-room"
        style={scrollRoomStyle}
        aria-hidden="true"
      />

      {/* Readable site — sits behind the hero layer, revealed by its fade. */}
      <SiteContent underHero />
    </>
  )
}
