import { useEffect, useMemo, useRef, type MutableRefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { mulberry32 } from '../lib/rng'
import { filamentVertexShader, filamentFragmentShader } from './filamentShaders'
import { slicePhasesAt } from '../lib/slicePhases'
import { STRAND_RGB, EMBER_RGB, EMBER_HOT_RGB } from '../theme'

/** Head model the filament roots grow from — matches the fit in head.ts. */
const HEAD_CENTER = new THREE.Vector3(0, 0.15, 0)
const HEAD_RADII = new THREE.Vector3(0.78, 1.05, 0.9)

/** Shared sweep: strongly rightward, barely up — the strands flow across the
 *  frame like the reference rather than spraying upward. */
const SWEEP = new THREE.Vector3(0.94, 0.12, 0.08).normalize()

const TUBULAR_SEG = 26
const RADIAL_SEG = 5

/**
 * Build every filament as a thin tube swept along a Catmull-Rom spline, merged
 * into one geometry. Per-vertex aU / aStrand / aRoot let the shader grow each
 * strand from its root. Roots sit over the front of the head; strands curve out
 * and sweep rightward across the frame like the reference.
 */
function buildFilaments(strandCount: number, seed = 4242): THREE.BufferGeometry {
  const rng = mulberry32(seed)
  const geos: THREE.BufferGeometry[] = []

  const p0 = new THREE.Vector3()
  const p3 = new THREE.Vector3()
  const dir = new THREE.Vector3()
  const perpA = new THREE.Vector3()
  const perpB = new THREE.Vector3()
  const up = new THREE.Vector3(0, 1, 0)

  for (let s = 0; s < strandCount; s++) {
    // Roots spread across the whole front of the head.
    const phi = rng() * Math.PI * 2
    const cy = Math.max(-0.85, Math.min(0.98, -0.75 + rng() * 1.7))
    const sinT = Math.sqrt(Math.max(0, 1 - cy * cy))
    let dx = sinT * Math.cos(phi)
    let dz = sinT * Math.sin(phi)
    dz = Math.abs(dz) * 0.9 + 0.1
    dx = dx * 0.95

    p0.set(
      HEAD_CENTER.x + dx * HEAD_RADII.x,
      HEAD_CENTER.y + cy * HEAD_RADII.y,
      HEAD_CENTER.z + dz * HEAD_RADII.z,
    )

    // Combed flow: dominated by the rightward sweep. A wide horizontal fan, a
    // narrow vertical one, so they spread across the frame without spraying up.
    dir.copy(SWEEP)
    dir.x += (rng() - 0.5) * 0.12
    dir.y += (rng() - 0.5) * 0.5 + (cy - 0.1) * 0.35 // higher roots aim higher
    dir.z += (rng() - 0.5) * 0.3
    dir.normalize()

    const len = 3.6 + rng() * 2.8
    p3.copy(p0).addScaledVector(dir, len)

    perpA.crossVectors(dir, up).normalize()
    perpB.crossVectors(dir, perpA).normalize()
    // One long lazy bow per strand so neighbours arc together, not tangle.
    const bow = (0.4 + rng() * 0.9) * (rng() < 0.5 ? -1 : 1)
    const droop = (rng() - 0.6) * 0.6

    const c1 = new THREE.Vector3()
      .lerpVectors(p0, p3, 0.34)
      .addScaledVector(perpA, bow * 0.55)
      .addScaledVector(perpB, droop * 0.4)
    const c2 = new THREE.Vector3()
      .lerpVectors(p0, p3, 0.7)
      .addScaledVector(perpA, bow)
      .addScaledVector(perpB, droop)

    const curve = new THREE.CatmullRomCurve3(
      [p0.clone(), c1, c2, p3.clone()],
      false,
      'catmullrom',
      0.5,
    )

    const radius = 0.006 + rng() * 0.005
    const tube = new THREE.TubeGeometry(curve, TUBULAR_SEG, radius, RADIAL_SEG, false)

    // Per-vertex attributes. TubeGeometry lays vertices out as
    // (TUBULAR_SEG + 1) rings of (RADIAL_SEG + 1) verts; uv.x runs 0..1 along.
    const count = tube.attributes.position.count
    const uv = tube.attributes.uv as THREE.BufferAttribute
    const aU = new Float32Array(count)
    const aStrand = new Float32Array(count)
    const aRoot = new Float32Array(count * 3)
    const strandId = strandCount > 1 ? s / (strandCount - 1) : 0
    for (let i = 0; i < count; i++) {
      aU[i] = uv.getX(i)
      aStrand[i] = strandId
      aRoot[i * 3] = p0.x
      aRoot[i * 3 + 1] = p0.y
      aRoot[i * 3 + 2] = p0.z
    }
    tube.setAttribute('aU', new THREE.BufferAttribute(aU, 1))
    tube.setAttribute('aStrand', new THREE.BufferAttribute(aStrand, 1))
    tube.setAttribute('aRoot', new THREE.BufferAttribute(aRoot, 3))
    tube.deleteAttribute('normal')
    tube.deleteAttribute('uv')
    geos.push(tube)
  }

  const merged = mergeGeometries(geos, false)
  geos.forEach((g) => g.dispose())
  merged.boundingSphere = new THREE.Sphere(new THREE.Vector3(1.5, 0.5, 0), 9)
  return merged
}

interface FilamentsProps {
  strandCount: number
  progress: MutableRefObject<number>
}

export function Filaments({ strandCount, progress }: FilamentsProps) {
  const matRef = useRef<THREE.ShaderMaterial>(null)

  const geometry = useMemo(() => buildFilaments(strandCount), [strandCount])
  useEffect(() => () => geometry.dispose(), [geometry])

  const uniforms = useMemo(
    () => ({
      uGrow: { value: 0 },
      uTime: { value: 0 },
      uReveal: { value: 0 },
      uWhite: { value: new THREE.Vector3(STRAND_RGB.r, STRAND_RGB.g, STRAND_RGB.b) },
      uEmber: { value: new THREE.Vector3(EMBER_RGB.r, EMBER_RGB.g, EMBER_RGB.b) },
      uHot: {
        value: new THREE.Vector3(EMBER_HOT_RGB.r, EMBER_HOT_RGB.g, EMBER_HOT_RGB.b),
      },
    }),
    [],
  )

  useFrame((_, delta) => {
    const mat = matRef.current
    if (!mat) return
    const t = progress.current
    const { filament } = slicePhasesAt(t)
    mat.uniforms.uTime.value += delta
    mat.uniforms.uGrow.value = filament
    mat.uniforms.uReveal.value =
      Math.min(1, filament * 5) * (1 - Math.max(0, (t - 0.95) / 0.05))
  })

  return (
    <mesh geometry={geometry} frustumCulled={false} renderOrder={3}>
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        vertexShader={filamentVertexShader}
        fragmentShader={filamentFragmentShader}
        transparent
        depthWrite={false}
        depthTest
        blending={THREE.NormalBlending}
      />
    </mesh>
  )
}
