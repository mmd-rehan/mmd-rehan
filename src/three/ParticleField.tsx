import { useEffect, useMemo, useRef, type MutableRefObject } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { TargetSet } from './targets'
import { particleVertexShader, particleFragmentShader } from './particleShaders'
import { morphStateAt } from '../lib/timeline'
import { mulberry32 } from '../lib/rng'
import { EMBER_RGB, EMBER_HOT_RGB, PARTICLE_DARK_RGB, DOMAIN_GLOW } from '../theme'
import type { TargetKey } from '../content/chapters'

/**
 * How strongly each shape lights its outer particles at rest. The nerves form
 * is all glowing tips; the portrait only gets a faint rim so the face stays
 * legible; structural shapes sit in between.
 */
const TIP_GLOW: Record<TargetKey, number> = {
  portrait: 0.16,
  nerves: 1.0,
  signal: 0.5,
  flightArc: 0.62,
  hashGrid: 0.32,
  torus: 0.52,
}

/** How "portrait" a shape is: 1 shows the real photo color, 0 the ember scheme. */
const PORTRAITNESS: Record<TargetKey, number> = {
  portrait: 1,
  nerves: 0,
  signal: 0,
  flightArc: 0,
  hashGrid: 0,
  torus: 0,
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const smoothstep = (e0: number, e1: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)))
  return t * t * (3 - 2 * t)
}

const EMBER_FALLBACK = { mid: [1, 0.353, 0.122], hot: [1, 0.761, 0.294] } as const
const glowFor = (key: TargetKey) => DOMAIN_GLOW[key] ?? EMBER_FALLBACK

interface ParticleFieldProps {
  targets: TargetSet
  count: number
  /** Ref holding the eased scroll progress, read every frame. */
  progress: MutableRefObject<number>
  baseSize?: number
}

/**
 * The single particle system. Owns one BufferGeometry whose aFrom/aTo
 * attributes are rewritten each frame to the two shapes being morphed, and a
 * ShaderMaterial whose uniforms carry blend/energy/time. Knows nothing about
 * the DOM or chapter text — it only consumes a progress ref.
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

  // Track which shapes are currently loaded into the from/to attributes so we
  // only copy buffers when the pair actually changes (not every frame).
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

    // Seed initial state with the portrait so first paint is the assembled face.
    from.set(targets.positions.portrait)
    to.set(targets.positions.portrait)

    // `position` is required by three but unused by our shader (we compute
    // gl_Position from aFrom/aTo). Give it its own zeroed buffer so nothing
    // aliases the morph attributes we rewrite each frame.
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3))
    geo.setAttribute('aFrom', new THREE.BufferAttribute(from, 3))
    geo.setAttribute('aTo', new THREE.BufferAttribute(to, 3))
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))
    // Per-particle photo color (static; the portrait's real RGB).
    geo.setAttribute('aColor', new THREE.BufferAttribute(targets.colors, 3))
    geo.setDrawRange(0, count)
    // Generous bounding sphere so points never get frustum-culled mid-explosion.
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 8)
    return geo
  }, [count, targets])

  const uniforms = useMemo(
    () => ({
      uBlend: { value: 0 },
      uEnergy: { value: 0 },
      uTime: { value: 0 },
      uSize: { value: baseSize },
      uPixelRatio: { value: Math.min(gl.getPixelRatio(), 2) },
      uScale: { value: size.height * 0.5 },
      uTipGlow: { value: TIP_GLOW.portrait },
      uLift: { value: 0 },
      uPortrait: { value: PORTRAITNESS.portrait },
      uColorDark: {
        value: new THREE.Vector3(
          PARTICLE_DARK_RGB.r,
          PARTICLE_DARK_RGB.g,
          PARTICLE_DARK_RGB.b,
        ),
      },
      uColorEmber: {
        value: new THREE.Vector3(EMBER_RGB.r, EMBER_RGB.g, EMBER_RGB.b),
      },
      uColorHot: {
        value: new THREE.Vector3(EMBER_HOT_RGB.r, EMBER_HOT_RGB.g, EMBER_HOT_RGB.b),
      },
    }),
    [baseSize, gl],
  )

  useEffect(() => () => geometry.dispose(), [geometry])

  useFrame((_, delta) => {
    const mat = materialRef.current
    const pts = pointsRef.current
    if (!mat || !pts) return

    const t = progress.current
    const state = morphStateAt(t)

    // Swap attribute contents only when the (from,to) pair changes.
    if (loaded.current.from !== state.from || loaded.current.to !== state.to) {
      const aFrom = geometry.getAttribute('aFrom') as THREE.BufferAttribute
      const aTo = geometry.getAttribute('aTo') as THREE.BufferAttribute
      ;(aFrom.array as Float32Array).set(targets.positions[state.from])
      ;(aTo.array as Float32Array).set(targets.positions[state.to])
      aFrom.needsUpdate = true
      aTo.needsUpdate = true
      loaded.current = { from: state.from, to: state.to }
    }

    mat.uniforms.uBlend.value = state.blend
    mat.uniforms.uEnergy.value = state.energy
    mat.uniforms.uTime.value += delta
    // Keep the perspective size scale in sync with the live canvas height.
    mat.uniforms.uScale.value = size.height * 0.5
    // Tip glow + portrait-ness follow whichever shape we're settling toward.
    mat.uniforms.uTipGlow.value = lerp(
      TIP_GLOW[state.from],
      TIP_GLOW[state.to],
      state.blend,
    )
    mat.uniforms.uPortrait.value = lerp(
      PORTRAITNESS[state.from],
      PORTRAITNESS[state.to],
      state.blend,
    )

    // Per-domain glow: cross-fade the ember/hot hues from the departing shape's
    // palette to the arriving one, so each disappear/reappear moment changes
    // color (health emerald -> aviation blue -> crypto gold -> logistics cyan)
    // instead of every transition burning the same orange.
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

    // Airplane takeoff. Only when the plane form is the one on screen (the
    // aviation chapter, i.e. morphing FROM flightArc). Ramp: taxi (settled) ->
    // rotate + climb through the first half of the morph -> back to 0 so the
    // plane has left the frame before it disperses into the next shape.
    let lift = 0
    if (state.from === 'flightArc') {
      // Local progress across the whole aviation slice (settle + morph).
      const climb = state.blend // 0 while parked, ramps as it morphs out
      lift = Math.sin(smoothstep(0.0, 0.55, climb) * Math.PI) // 0 -> 1 -> 0
    }
    mat.uniforms.uLift.value = lift

    // Slow, scroll-linked rotation so the form has life and shows its volume.
    pts.rotation.y = Math.sin(t * Math.PI * 2) * 0.35 + t * 0.6
    pts.rotation.x = Math.sin(t * Math.PI) * 0.12
  })

  return (
    <points ref={pointsRef} geometry={geometry} frustumCulled={false}>
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
