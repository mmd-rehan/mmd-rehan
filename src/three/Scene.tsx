import { Suspense, useRef, type MutableRefObject, type ReactNode } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'
import { ParticleField } from './ParticleField'
import { Filaments } from './Filaments'
import type { TargetSet } from './targets'
import type { DeviceTier } from '../lib/deviceTier'
import { slicePhasesAt } from '../lib/slicePhases'
import { THEME } from '../theme'

interface SceneProps {
  targets: TargetSet
  tier: DeviceTier
  progress: MutableRefObject<number>
}

const STRANDS_BY_LABEL: Record<DeviceTier['label'], number> = {
  high: 190,
  mid: 120,
  low: 60,
  none: 0,
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/**
 * The head rig: a group holding the particle field + filaments that pitches
 * back and yaws as the portrait flips into the nerves form, mirroring the
 * reference. A tiny idle sway keeps the resting portrait alive.
 */
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

    // Rest: barely-there sway. Tilt: chin lifts hard (−X), yaws, a little roll.
    const restX = Math.sin(idle * 0.35) * 0.022
    const restY = Math.sin(idle * 0.26) * 0.04
    g.rotation.x = lerp(restX, -0.82, tilt)
    g.rotation.y = lerp(restY, 0.3, tilt)
    g.rotation.z = lerp(0, -0.07, tilt)
    // Keep it roughly centred — a small lift as it tilts, no big drift so the
    // crown doesn't clip off the top of the frame.
    g.position.y = lerp(0, 0.12, tilt) - lerp(0, 0.1, settle)
    g.position.z = lerp(0, -0.25, tilt)
  })

  return <group ref={group}>{children}</group>
}

/** Pull the camera back through the flip so the strands have room to sweep. */
function CameraRig({ progress }: { progress: MutableRefObject<number> }) {
  useFrame(({ camera }) => {
    const { filament } = slicePhasesAt(progress.current)
    const z = lerp(4.4, 6.4, filament)
    camera.position.z += (z - camera.position.z) * 0.05
    camera.lookAt(0, 0, 0)
  })
  return null
}

/**
 * The WebGL layer: fixed full-viewport canvas with the head rig (particles +
 * filaments) and post-processing — a restrained UnrealBloom for the ember tips
 * and a vignette to seat the form against the dark edges.
 */
export function Scene({ targets, tier, progress }: SceneProps) {
  const bloomIntensity = tier.label === 'low' ? 0.5 : 0.7
  const strandCount = STRANDS_BY_LABEL[tier.label] || 150

  return (
    <Canvas
      camera={{ position: [0, 0, 4.4], fov: 42, near: 0.1, far: 100 }}
      dpr={[1, tier.dprCap]}
      gl={{
        antialias: tier.label !== 'low',
        alpha: false,
        powerPreference: 'high-performance',
      }}
      style={{ position: 'fixed', inset: 0, zIndex: 0 }}
    >
      <color attach="background" args={[THEME.background]} />
      <fog attach="fog" args={[THEME.background, 6, 13]} />
      <Suspense fallback={null}>
        <HeadRig progress={progress}>
          <ParticleField
            targets={targets}
            count={tier.particleCount}
            progress={progress}
            baseSize={tier.label === 'low' ? 0.044 : 0.036}
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
