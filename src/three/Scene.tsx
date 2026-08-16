import { Suspense, type MutableRefObject } from 'react'
import { Canvas } from '@react-three/fiber'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { ParticleField } from './ParticleField'
import type { TargetSet } from './targets'
import type { DeviceTier } from '../lib/deviceTier'
import { THEME } from '../theme'

interface SceneProps {
  targets: TargetSet
  tier: DeviceTier
  progress: MutableRefObject<number>
}

/**
 * The WebGL layer: a fixed full-viewport canvas with the particle field and
 * UnrealBloom post-processing (the ember glow). Bloom is toned down on low-tier
 * devices to protect the frame rate.
 */
export function Scene({ targets, tier, progress }: SceneProps) {
  const bloomIntensity = tier.label === 'low' ? 0.9 : 1.15

  return (
    <Canvas
      camera={{ position: [0, 0, 4.2], fov: 42, near: 0.1, far: 100 }}
      dpr={[1, tier.dprCap]}
      gl={{ antialias: tier.label !== 'low', alpha: false, powerPreference: 'high-performance' }}
      style={{ position: 'fixed', inset: 0, zIndex: 0 }}
    >
      <color attach="background" args={[THEME.background]} />
      <Suspense fallback={null}>
        <ParticleField
          targets={targets}
          count={tier.particleCount}
          progress={progress}
          baseSize={tier.label === 'low' ? 0.046 : 0.038}
        />
        <EffectComposer>
          <Bloom
            intensity={bloomIntensity}
            luminanceThreshold={0.9}
            luminanceSmoothing={0.15}
            mipmapBlur
          />
        </EffectComposer>
      </Suspense>
    </Canvas>
  )
}
