import {
  Suspense,
  useEffect,
  useRef,
  type MutableRefObject,
  type ReactNode,
} from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'
import { ParticleField } from './ParticleField'
import { Filaments } from './Filaments'
import { HeadMesh } from './HeadMesh'
import type { TargetSet } from './targets'
import type { DeviceTier } from '../lib/deviceTier'
import { slicePhasesAt } from '../lib/slicePhases'
import { THEME } from '../theme'

interface SceneProps {
  targets: TargetSet
  tier: DeviceTier
  progress: MutableRefObject<number>
  /** When false (scrolled past the hero) the render loop is parked to save GPU. */
  active?: boolean
}

const STRANDS_BY_LABEL: Record<DeviceTier['label'], number> = {
  high: 190,
  mid: 120,
  low: 60,
  none: 0,
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t

function HeadRig({
  progress,
  children,
}: {
  progress: MutableRefObject<number>
  children: ReactNode
}) {
  const group = useRef<THREE.Group>(null)
  const clock = useRef(0)

  useFrame((_, delta) => {
    const g = group.current
    if (!g) return
    clock.current += delta
    const { tilt, settle } = slicePhasesAt(progress.current)
    const idle = clock.current

    const restX = Math.sin(idle * 0.35) * 0.022
    const restY = Math.sin(idle * 0.26) * 0.04
    g.rotation.x = lerp(restX, -0.98, tilt)
    g.rotation.y = lerp(restY, 0.26, tilt)
    g.rotation.z = lerp(0, -0.06, tilt)
    g.position.y = lerp(0, 0.16, tilt) - lerp(0, 0.1, settle)
    g.position.z = lerp(0, -0.2, tilt)
  })

  return <group ref={group}>{children}</group>
}

function CameraRig({ progress }: { progress: MutableRefObject<number> }) {
  useFrame(({ camera }) => {
    const { filament } = slicePhasesAt(progress.current)
    const z = lerp(4.4, 6.4, filament)
    camera.position.z += (z - camera.position.z) * 0.05
    camera.lookAt(0, 0, 0)
  })
  return null
}

export function Scene({ targets, tier, progress, active = true }: SceneProps) {
  const bloomIntensity = tier.label === 'low' ? 0.5 : 0.7
  const strandCount = STRANDS_BY_LABEL[tier.label] || 150

  // R3F sizes the canvas from a ResizeObserver on its container. Mounted inside
  // the fixed .hero-stage the initial observation can be missed, leaving the
  // canvas at its 300×150 default until something triggers a resize. Nudge it
  // once after first paint so the first size is always correct.
  useEffect(() => {
    const raf = requestAnimationFrame(() => window.dispatchEvent(new Event('resize')))
    const t = setTimeout(() => window.dispatchEvent(new Event('resize')), 120)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(t)
    }
  }, [])

  return (
    <Canvas
      frameloop={active ? 'always' : 'never'}
      camera={{ position: [0, 0, 4.4], fov: 42, near: 0.1, far: 100 }}
      dpr={[1, tier.dprCap]}
      gl={{
        antialias: tier.label !== 'low',
        alpha: false,
        powerPreference: 'high-performance',
      }}
      style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', zIndex: 0 }}
    >
      <color attach="background" args={[THEME.background]} />
      <fog attach="fog" args={[THEME.background, 6, 13]} />
      {/* No scene lights: every material is an unlit ShaderMaterial. The head's
          key + ember rim are in headMeshShaders / particleShaders. */}
      <Suspense fallback={null}>
        <HeadRig progress={progress}>
          <HeadMesh progress={progress} />
          <ParticleField
            targets={targets}
            count={tier.particleCount}
            progress={progress}
            baseSize={tier.label === 'low' ? 0.04 : 0.03}
          />
          <Filaments strandCount={strandCount} progress={progress} />
        </HeadRig>
        <CameraRig progress={progress} />
        <EffectComposer>
          <Bloom
            intensity={bloomIntensity}
            luminanceThreshold={0.9}
            luminanceSmoothing={0.25}
            mipmapBlur
            radius={0.5}
          />
          <Vignette eskil={false} offset={0.3} darkness={0.72} />
        </EffectComposer>
      </Suspense>
    </Canvas>
  )
}
