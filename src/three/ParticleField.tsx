import { useEffect, useMemo, useRef, type MutableRefObject } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { TargetSet } from './targets'
import { particleVertexShader, particleFragmentShader } from './particleShaders'
import { slicePhasesAt } from '../lib/slicePhases'
import { DISSOLVE_MAX } from './dissolve'
import { mulberry32 } from '../lib/rng'
import { EMBER_RGB, EMBER_HOT_RGB, PARTICLE_LIGHT_RGB, STRAND_RGB } from '../theme'

const lerp = (a: number, b: number, t: number) => a + (b - a) * t

interface ParticleFieldProps {
  targets: TargetSet
  count: number
  progress: MutableRefObject<number>
  baseSize?: number
}

/**
 * The debris field. One BufferGeometry seeded from the head surface (position +
 * normal + albedo per point); the shader keeps every point invisible behind the
 * solid mesh until the dissolve front reaches it, then detaches it. Knows
 * nothing about the DOM; rotation is owned by the parent HeadRig.
 */
export function ParticleField({
  targets,
  count,
  progress,
  baseSize = 0.03,
}: ParticleFieldProps) {
  const pointsRef = useRef<THREE.Points>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const { gl, size } = useThree()

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const seeds = new Float32Array(count)
    const rng = mulberry32(9090)
    for (let i = 0; i < count; i++) seeds[i] = rng()

    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3))
    geo.setAttribute('aFrom', new THREE.BufferAttribute(targets.positions.portrait, 3))
    geo.setAttribute('aTo', new THREE.BufferAttribute(targets.positions.nerves, 3))
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))
    geo.setAttribute('aColor', new THREE.BufferAttribute(targets.colors, 3))
    geo.setAttribute('aNormal', new THREE.BufferAttribute(targets.normals, 3))
    geo.setDrawRange(0, count)
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 12)
    return geo
  }, [count, targets])

  const uniforms = useMemo(
    () => ({
      uDissolve: { value: 0 },
      uTime: { value: 0 },
      uSize: { value: baseSize },
      uPixelRatio: { value: Math.min(gl.getPixelRatio(), 2) },
      uScale: { value: size.height * 0.5 },
      uSettle: { value: 0 },
      uTipGlow: { value: 0.6 },
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
    if (!mat) return
    const phases = slicePhasesAt(progress.current)
    mat.uniforms.uDissolve.value = phases.dissolve * DISSOLVE_MAX
    mat.uniforms.uTime.value += delta
    mat.uniforms.uScale.value = size.height * 0.5
    mat.uniforms.uSettle.value = phases.settle
    mat.uniforms.uTipGlow.value = lerp(0.2, 0.8, phases.filament)
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
