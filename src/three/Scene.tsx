import {
  Suspense,
  useEffect,
  useRef,
  type MutableRefObject,
  type ReactNode,
} from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'
import { ParticleField } from './ParticleField'
import { Filaments } from './Filaments'
import { HeadMesh } from './HeadMesh'
import { CoreGlow } from './CoreGlow'
import type { TargetSet } from './targets'
import type { DeviceTier } from '../lib/deviceTier'
import { slicePhasesAt } from '../lib/slicePhases'
import { WARM_BG_RGB, COOL_BG_RGB } from '../theme'

interface SceneProps {
  targets: TargetSet
  tier: DeviceTier
  progress: MutableRefObject<number>
  /** When false (scrolled past the hero) the render loop is parked to save GPU. */
  active?: boolean
}

/** Cords are thick and opaque now — far fewer read as far more. */
const STRANDS_BY_LABEL: Record<DeviceTier['label'], number> = {
  high: 260,
  mid: 160,
  low: 80,
  none: 0,
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t

function HeadRig({
  progress,
  headMatrix,
  children,
}: {
  progress: MutableRefObject<number>
  /** The rig's world matrix, published each frame so the strands can root
   *  themselves to the back of the head while it turns. */
  headMatrix: MutableRefObject<THREE.Matrix4>
  children: ReactNode
}) {
  const group = useRef<THREE.Group>(null)
  const clock = useRef(0)

  useFrame((_, delta) => {
    const g = group.current
    if (!g) return
    clock.current += delta
    const { tilt, turn, settle } = slicePhasesAt(progress.current)
    const idle = clock.current

    const restX = Math.sin(idle * 0.35) * 0.022
    const restY = Math.sin(idle * 0.26) * 0.04

    // Pitch back (chin up), then rotate away so the face turns from the camera
    // and you end up looking at the back of his head — the fibres erupt there.
    g.rotation.x = lerp(restX, -0.72, tilt) + lerp(0, 0.38, turn)
    g.rotation.y = lerp(restY, 0.22, tilt) + lerp(0, 2.55, turn)
    g.rotation.z = lerp(0, -0.06, tilt) + lerp(0, 0.14, turn)
    g.position.y = lerp(0, 0.16, tilt) - lerp(0, 0.1, settle)
    g.position.z = lerp(0, -0.2, tilt)

    g.updateMatrixWorld()
    headMatrix.current.copy(g.matrixWorld)
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

const WARM = new THREE.Color(WARM_BG_RGB.r, WARM_BG_RGB.g, WARM_BG_RGB.b)
const COOL = new THREE.Color(COOL_BG_RGB.r, COOL_BG_RGB.g, COOL_BG_RGB.b)

/** The environment tint: warm blush/stone at rest, easing to cool gray-green as
 *  the abstract form develops. Drives scene.background + fog together. */
function Backdrop({ progress }: { progress: MutableRefObject<number> }) {
  const { scene } = useThree()
  const col = useRef(new THREE.Color().copy(WARM))

  useEffect(() => {
    scene.background = col.current
    scene.fog = new THREE.Fog(col.current, 7, 15)
    return () => {
      scene.background = null
      scene.fog = null
    }
  }, [scene])

  useFrame(() => {
    const { develop } = slicePhasesAt(progress.current)
    col.current.copy(WARM).lerp(COOL, develop)
    if (scene.fog) (scene.fog as THREE.Fog).color.copy(col.current)
  })
  return null
}

export function Scene({ targets, tier, progress, active = true }: SceneProps) {
  const bloomIntensity = tier.label === 'low' ? 0.35 : 0.5
  const strandCount = STRANDS_BY_LABEL[tier.label] || 150
  const headMatrix = useRef(new THREE.Matrix4())

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
        toneMapping: THREE.NoToneMapping,
      }}
      style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', zIndex: 0 }}
    >
      <Backdrop progress={progress} />
      {/* No scene lights: every material is an unlit ShaderMaterial. The head's
          key + rim are in headMeshShaders / particleShaders. */}
      <Suspense fallback={null}>
        <HeadRig progress={progress} headMatrix={headMatrix}>
          <HeadMesh progress={progress} />
          <ParticleField
            targets={targets}
            count={tier.particleCount}
            progress={progress}
            baseSize={tier.label === 'low' ? 0.04 : 0.03}
          />
        </HeadRig>
        {/* Strands live in the identity frame so the cable / sphere / vortex
            are composed there; their head-phase roots are transformed by
            headMatrix so they stay attached to the turning head. */}
        <Filaments
          strandCount={strandCount}
          progress={progress}
          headMatrix={headMatrix}
        />
        <CoreGlow progress={progress} />
        <CameraRig progress={progress} />
        <EffectComposer>
          <Bloom
            intensity={bloomIntensity}
            luminanceThreshold={0.95}
            luminanceSmoothing={0.3}
            mipmapBlur
            radius={0.6}
          />
          <Vignette eskil={false} offset={0.42} darkness={0.28} />
        </EffectComposer>
      </Suspense>
    </Canvas>
  )
}
