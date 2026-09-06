import { useEffect, useMemo, useRef, type MutableRefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { mulberry32 } from '../lib/rng'
import { filamentVertexShader, filamentFragmentShader } from './filamentShaders'
import { slicePhasesAt } from '../lib/slicePhases'
import { STRAND_RGB, YELLOW_RGB, AMBER_RGB, HOT_CORE_RGB, COOL_ENERGY_RGB } from '../theme'

/** Head model the strand roots grow from — matches the fit in head.ts. */
const HEAD_CENTER = new THREE.Vector3(0, 0.1, 0)
const HEAD_RADII = new THREE.Vector3(0.82, 1.12, 0.92)
const SWEEP = new THREE.Vector3(0.92, 0.16, 0.1).normalize()

const SEG = 30

/**
 * Build one flat ribbon strip per strand. Positions are placeholders — the
 * vertex shader computes the centre-line (strandPoint) and offsets each edge.
 * Per-vertex: aStrand, aU, aSide, and the head-phase endpoints aRoot / aTipHead.
 */
function buildRibbons(strandCount: number, seed = 4242): THREE.BufferGeometry {
  const rng = mulberry32(seed)
  const perStrand = (SEG + 1) * 2
  const total = strandCount * perStrand

  const position = new Float32Array(total * 3)
  const aStrand = new Float32Array(total)
  const aU = new Float32Array(total)
  const aSide = new Float32Array(total)
  const aRoot = new Float32Array(total * 3)
  const aTipHead = new Float32Array(total * 3)
  const index: number[] = []

  const dir = new THREE.Vector3()

  for (let s = 0; s < strandCount; s++) {
    const phi = rng() * Math.PI * 2
    const cy = Math.max(-0.85, Math.min(0.96, -0.7 + rng() * 1.7))
    const sinT = Math.sqrt(Math.max(0, 1 - cy * cy))
    const dx = sinT * Math.cos(phi) * 0.95
    const dz = Math.abs(sinT * Math.sin(phi)) * 0.9 + 0.1

    const rx = HEAD_CENTER.x + dx * HEAD_RADII.x
    const ry = HEAD_CENTER.y + cy * HEAD_RADII.y
    const rz = HEAD_CENTER.z + dz * HEAD_RADII.z

    dir.copy(SWEEP)
    dir.x += (rng() - 0.5) * 0.16
    dir.y += (rng() - 0.5) * 0.5 + (cy - 0.1) * 0.32
    dir.z += (rng() - 0.5) * 0.3
    dir.normalize()
    const len = 3.4 + rng() * 2.6
    const tx = rx + dir.x * len
    const ty = ry + dir.y * len
    const tz = rz + dir.z * len

    const strandId = strandCount > 1 ? s / (strandCount - 1) : 0
    const strandBase = s * (SEG + 1) * 2

    for (let i = 0; i <= SEG; i++) {
      const u = i / SEG
      for (let sd = 0; sd < 2; sd++) {
        const v = strandBase + i * 2 + sd
        aStrand[v] = strandId
        aU[v] = u
        aSide[v] = sd === 0 ? -1 : 1
        aRoot[v * 3] = rx
        aRoot[v * 3 + 1] = ry
        aRoot[v * 3 + 2] = rz
        aTipHead[v * 3] = tx
        aTipHead[v * 3 + 1] = ty
        aTipHead[v * 3 + 2] = tz
      }
      if (i < SEG) {
        const b = strandBase + i * 2
        index.push(b, b + 1, b + 2, b + 1, b + 3, b + 2)
      }
    }
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(position, 3))
  geo.setAttribute('aStrand', new THREE.BufferAttribute(aStrand, 1))
  geo.setAttribute('aU', new THREE.BufferAttribute(aU, 1))
  geo.setAttribute('aSide', new THREE.BufferAttribute(aSide, 1))
  geo.setAttribute('aRoot', new THREE.BufferAttribute(aRoot, 3))
  geo.setAttribute('aTipHead', new THREE.BufferAttribute(aTipHead, 3))
  geo.setIndex(index)
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 14)
  return geo
}

interface FilamentsProps {
  strandCount: number
  progress: MutableRefObject<number>
}

const vec = (c: { r: number; g: number; b: number }) => new THREE.Vector3(c.r, c.g, c.b)

export function Filaments({ strandCount, progress }: FilamentsProps) {
  const matRef = useRef<THREE.ShaderMaterial>(null)

  const geometry = useMemo(() => buildRibbons(strandCount), [strandCount])
  useEffect(() => () => geometry.dispose(), [geometry])

  const uniforms = useMemo(
    () => ({
      uGrow: { value: 0 },
      uT: { value: 0 },
      uTime: { value: 0 },
      uReveal: { value: 0 },
      uWidth: { value: 0.013 },
      uStrand: { value: vec(STRAND_RGB) },
      uYellow: { value: vec(YELLOW_RGB) },
      uAmber: { value: vec(AMBER_RGB) },
      uHot: { value: vec(HOT_CORE_RGB) },
      uCool: { value: vec(COOL_ENERGY_RGB) },
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
    mat.uniforms.uT.value = t
    mat.uniforms.uReveal.value =
      Math.min(1, filament * 4) * (1 - Math.max(0, (t - 0.97) / 0.03))
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
        side={THREE.DoubleSide}
        blending={THREE.NormalBlending}
      />
    </mesh>
  )
}
