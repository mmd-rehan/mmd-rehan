import { useEffect, useMemo, useRef, type MutableRefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { mulberry32 } from '../lib/rng'
import { filamentVertexShader, filamentFragmentShader } from './filamentShaders'
import { slicePhasesAt } from '../lib/slicePhases'
import { STRAND_RGB, YELLOW_RGB, AMBER_RGB, HOT_CORE_RGB, COOL_ENERGY_RGB } from '../theme'

/** Head model the strand roots grow from — matches the fit in head.ts.
 *  Local space: +Z is the face, so −Z is the back of the skull. */
const HEAD_CENTER = new THREE.Vector3(0, 0.1, 0)
const HEAD_RADII = new THREE.Vector3(0.82, 1.12, 0.92)

const SEG = 30

/**
 * Build one flat ribbon strip per strand. Positions are placeholders — the
 * vertex shader computes the centre-line (strandPoint) and offsets each edge.
 * Per-vertex: aStrand, aU, aSide, and the head-phase endpoints aRoot / aTipHead,
 * both in HEAD-LOCAL space (the shader transforms them by the head matrix).
 *
 * Roots sit on the BACK of the skull and the fibres grow straight out behind
 * it, so once the head turns away they erupt from the back of his head — the
 * moment the reference is built around.
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
    // A patch on the back of the skull — crown to occiput — so the fibres
    // burst out of one region like the reference, not as a halo round the head.
    const cy = Math.max(-0.55, Math.min(0.9, -0.35 + rng() * 1.3))
    const sinT = Math.sqrt(Math.max(0, 1 - cy * cy))
    // azimuth kept to the rear ±55° so nothing sprouts out of his face
    const az = Math.PI + (rng() - 0.5) * 1.9
    const dx = sinT * Math.sin(az)
    const dz = sinT * Math.cos(az)

    const rx = HEAD_CENTER.x + dx * HEAD_RADII.x
    const ry = HEAD_CENTER.y + cy * HEAD_RADII.y
    const rz = HEAD_CENTER.z + dz * HEAD_RADII.z

    // Grow outward along the scalp normal, fanning wide across the frame
    // rather than straight out of the back (which would just point at the
    // camera once the head has turned, and read as nothing).
    dir.set(dx * 1.7, cy * 0.5 + 0.5, dz * 0.55)
    dir.x += (rng() - 0.5) * 0.9
    dir.y += (rng() - 0.5) * 0.7
    dir.z += (rng() - 0.5) * 0.5
    dir.normalize()
    // Short enough that the growing fibres read as a dense spiky brush bursting
    // out of the skull (the reference's white tuft), not long thin streamers.
    const len = 1.5 + rng() * 1.5
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
  /** The head rig's world matrix — roots ride the head as it turns. */
  headMatrix: MutableRefObject<THREE.Matrix4>
}

const vec = (c: { r: number; g: number; b: number }) => new THREE.Vector3(c.r, c.g, c.b)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

export function Filaments({ strandCount, progress, headMatrix }: FilamentsProps) {
  const matRef = useRef<THREE.ShaderMaterial>(null)

  const geometry = useMemo(() => buildRibbons(strandCount), [strandCount])
  useEffect(() => () => geometry.dispose(), [geometry])

  const uniforms = useMemo(
    () => ({
      uGrow: { value: 0 },
      uT: { value: 0 },
      uTime: { value: 0 },
      uReveal: { value: 0 },
      uWidth: { value: 0.05 },
      uHeadMat: { value: new THREE.Matrix4() },
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
    mat.uniforms.uHeadMat.value.copy(headMatrix.current)
    // Chunky cord throughout — the reference is macramé rope, not hair. A touch
    // thinner once they spread into the wide field so it doesn't turn to soup.
    mat.uniforms.uWidth.value = lerp(0.052, 0.034, Math.min(1, Math.max(0, (t - 0.42) / 0.22)))
    mat.uniforms.uReveal.value =
      Math.min(1, filament * 5) * (1 - Math.max(0, (t - 0.97) / 0.03))
  })

  return (
    // Opaque, depth-written: cords must occlude each other to read as solid
    // rope. Transparent blending is what turned them into haze.
    <mesh geometry={geometry} frustumCulled={false} renderOrder={2}>
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        vertexShader={filamentVertexShader}
        fragmentShader={filamentFragmentShader}
        transparent={false}
        depthWrite
        depthTest
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}
