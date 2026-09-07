import { useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { loadHead, type HeadAsset } from './head'
import { headVertexShader, headFragmentShader } from './headMeshShaders'
import { DISSOLVE_MAX } from './dissolve'
import { slicePhasesAt } from '../lib/slicePhases'
import { AMBER_RGB, YELLOW_RGB, COOL_ENERGY_RGB, STRAND_RGB } from '../theme'

/**
 * The photoreal rest-state head. Renders the fitted GLB geometry with the
 * dissolve shader; a sweep front (uDissolve) eats it away into the particle
 * field as the flip happens. Loaded via the shared `loadHead()` cache so the
 * mesh and the particle cloud sit in exactly the same frame.
 *
 * Deliberately does NOT clone the GLTF scene or dispose GLB resources — the
 * previous mesh attempt did both and lost the WebGL context under StrictMode.
 * Here we build our own geometry (baked + fitted in head.ts) and our own
 * materials, and only dispose those.
 */
export function HeadMesh({ progress }: { progress: MutableRefObject<number> }) {
  const [asset, setAsset] = useState<HeadAsset | null>(null)
  const matsRef = useRef<THREE.ShaderMaterial[]>([])

  useEffect(() => {
    let alive = true
    loadHead()
      .then((a) => alive && setAsset(a))
      .catch((err) => console.warn('[HeadMesh] head load failed:', err))
    return () => {
      alive = false
    }
  }, [])

  const parts = useMemo(() => {
    if (!asset) return null
    const mats: THREE.ShaderMaterial[] = []
    const built = asset.parts.map((part) => {
      const map = part.map
      if (map) {
        // We do our own sRGB->linear in the shader; stop Three double-decoding.
        map.colorSpace = THREE.NoColorSpace
        map.needsUpdate = true
      }
      const material = new THREE.ShaderMaterial({
        vertexShader: headVertexShader,
        fragmentShader: headFragmentShader,
        uniforms: {
          uMap: { value: map },
          uHasMap: { value: map ? 1 : 0 },
          uFlat: { value: new THREE.Vector3(0.72, 0.55, 0.44) },
          uDissolve: { value: 0 },
          uContour: { value: 0 },
          uTurn: { value: 0 },
          uTime: { value: 0 },
          uAmber: { value: new THREE.Vector3(AMBER_RGB.r, AMBER_RGB.g, AMBER_RGB.b) },
          uYellow: { value: new THREE.Vector3(YELLOW_RGB.r, YELLOW_RGB.g, YELLOW_RGB.b) },
          uCool: {
            value: new THREE.Vector3(
              COOL_ENERGY_RGB.r,
              COOL_ENERGY_RGB.g,
              COOL_ENERGY_RGB.b,
            ),
          },
          uStrand: { value: new THREE.Vector3(STRAND_RGB.r, STRAND_RGB.g, STRAND_RGB.b) },
        },
      })
      mats.push(material)
      return { geometry: part.geometry, material }
    })
    matsRef.current = mats
    return built
  }, [asset])

  useEffect(() => {
    const mats = matsRef.current
    return () => mats.forEach((m) => m.dispose())
  }, [parts])

  useFrame((_, delta) => {
    const mats = matsRef.current
    if (mats.length === 0) return
    const { dissolve, contour, turn } = slicePhasesAt(progress.current)
    for (const m of mats) {
      m.uniforms.uDissolve.value = dissolve * DISSOLVE_MAX
      m.uniforms.uContour.value = contour
      m.uniforms.uTurn.value = turn
      m.uniforms.uTime.value += delta
    }
  })

  if (!parts) return null
  return (
    <group>
      {parts.map((p, i) => (
        <mesh
          key={i}
          geometry={p.geometry}
          material={p.material}
          frustumCulled={false}
          renderOrder={0}
        />
      ))}
    </group>
  )
}
