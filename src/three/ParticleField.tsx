import { useEffect, useMemo, useRef, type MutableRefObject } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { TargetSet } from './targets'
import { particleVertexShader, particleFragmentShader } from './particleShaders'
import { morphStateAt } from '../lib/timeline'
import { slicePhasesAt } from '../lib/slicePhases'
import { mulberry32 } from '../lib/rng'
import {
  EMBER_RGB,
  EMBER_HOT_RGB,
  PARTICLE_LIGHT_RGB,
  STRAND_RGB,
  DOMAIN_GLOW,
} from '../theme'
import type { TargetKey } from '../content/chapters'

/** How strongly each shape lights its outer particles at rest. */
const TIP_GLOW: Record<TargetKey, number> = {
  portrait: 0.1,
  nerves: 0.7,
  signal: 0.5,
  flightArc: 0.62,
  hashGrid: 0.32,
  torus: 0.52,
}

/** How "portrait" a shape is: 1 shows the real photo colour, 0 the ember scheme. */
const PORTRAITNESS: Record<TargetKey, number> = {
  portrait: 1,
  nerves: 0.4,
  signal: 0,
  flightArc: 0,
  hashGrid: 0,
  torus: 0,
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t

const EMBER_FALLBACK = { mid: [1, 0.353, 0.122], hot: [1, 0.706, 0.235] } as const
const glowFor = (key: TargetKey) => DOMAIN_GLOW[key] ?? EMBER_FALLBACK

interface ParticleFieldProps {
  targets: TargetSet
  count: number
  progress: MutableRefObject<number>
  baseSize?: number
}

/**
 * The single particle system. Owns one BufferGeometry whose aFrom/aTo
 * attributes are rewritten each frame to the two shapes being morphed, and a
 * ShaderMaterial whose uniforms carry blend / contour / settle / time. Knows
 * nothing about the DOM. Rotation is owned by the parent group in Scene.
 */
export function ParticleField({
  targets,
  count,
  progress,
  baseSize = 0.036,
}: ParticleFieldProps) {
  const pointsRef = useRef<THREE.Points>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const { gl, size } = useThree()

  const loaded = useRef<{ from: TargetKey | null; to: TargetKey | null }>({
    from: null,
    to: null,
  })

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const from = new Float32Array(count * 3)
    const to = new Float32Array(count * 3)
    const seeds = new Float32Array(count)
    const rng = mulberry32(9090)
    for (let i = 0; i < count; i++) seeds[i] = rng()

    from.set(targets.positions.portrait)
    to.set(targets.positions.portrait)

    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3))
    geo.setAttribute('aFrom', new THREE.BufferAttribute(from, 3))
    geo.setAttribute('aTo', new THREE.BufferAttribute(to, 3))
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))
    geo.setAttribute('aColor', new THREE.BufferAttribute(targets.colors, 3))
    geo.setDrawRange(0, count)
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 8)
    return geo
  }, [count, targets])

  const uniforms = useMemo(
    () => ({
      uBlend: { value: 0 },
      uTime: { value: 0 },
      uSize: { value: baseSize },
      uPixelRatio: { value: Math.min(gl.getPixelRatio(), 2) },
      uScale: { value: size.height * 0.5 },
      uTipGlow: { value: TIP_GLOW.portrait },
      uContour: { value: 0 },
      uPortrait: { value: PORTRAITNESS.portrait },
      uSettle: { value: 0 },
      uColorLight: {
        value: new THREE.Vector3(
          PARTICLE_LIGHT_RGB.r,
          PARTICLE_LIGHT_RGB.g,
          PARTICLE_LIGHT_RGB.b,
        ),
      },
      uStrand: {
        value: new THREE.Vector3(STRAND_RGB.r, STRAND_RGB.g, STRAND_RGB.b),
      },
      uColorEmber: {
        value: new THREE.Vector3(EMBER_RGB.r, EMBER_RGB.g, EMBER_RGB.b),
      },
      uColorHot: {
        value: new THREE.Vector3(EMBER_HOT_RGB.r, EMBER_HOT_RGB.g, EMBER_HOT_RGB.b),
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [baseSize, gl],
  )

  useEffect(() => () => geometry.dispose(), [geometry])

  useFrame((_, delta) => {
    const mat = materialRef.current
    const pts = pointsRef.current
    if (!mat || !pts) return

    const t = progress.current
    const state = morphStateAt(t)
    const phases = slicePhasesAt(t)

    if (loaded.current.from !== state.from || loaded.current.to !== state.to) {
      const aFrom = geometry.getAttribute('aFrom') as THREE.BufferAttribute
      const aTo = geometry.getAttribute('aTo') as THREE.BufferAttribute
      ;(aFrom.array as Float32Array).set(targets.positions[state.from])
      ;(aTo.array as Float32Array).set(targets.positions[state.to])
      aFrom.needsUpdate = true
      aTo.needsUpdate = true
      loaded.current = { from: state.from, to: state.to }
    }

    // Slice 1: the position morph is driven by the dissolve beat (not the raw
    // chapter blend) so the face holds its shape while the head tilts back.
    mat.uniforms.uBlend.value = phases.dissolve
    mat.uniforms.uTime.value += delta
    mat.uniforms.uScale.value = size.height * 0.5
    mat.uniforms.uContour.value = phases.contour
    mat.uniforms.uSettle.value = phases.settle
    mat.uniforms.uTipGlow.value = lerp(TIP_GLOW.portrait, TIP_GLOW.nerves, phases.filament)
    mat.uniforms.uPortrait.value = lerp(
      PORTRAITNESS.portrait,
      PORTRAITNESS.nerves,
      phases.dissolve,
    )

    // Per-domain glow cross-fade (ember throughout for slice 1).
    const gFrom = glowFor(state.from)
    const gTo = glowFor(state.to)
    const cb = state.blend
    const ember = mat.uniforms.uColorEmber.value as THREE.Vector3
    const hot = mat.uniforms.uColorHot.value as THREE.Vector3
    ember.set(
      lerp(gFrom.mid[0], gTo.mid[0], cb),
      lerp(gFrom.mid[1], gTo.mid[1], cb),
      lerp(gFrom.mid[2], gTo.mid[2], cb),
    )
    hot.set(
      lerp(gFrom.hot[0], gTo.hot[0], cb),
      lerp(gFrom.hot[1], gTo.hot[1], cb),
      lerp(gFrom.hot[2], gTo.hot[2], cb),
    )
  })

  return (
    <points ref={pointsRef} geometry={geometry} frustumCulled={false} renderOrder={1}>
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={particleVertexShader}
        fragmentShader={particleFragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.NormalBlending}
      />
    </points>
  )
}
