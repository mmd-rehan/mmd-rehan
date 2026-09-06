import { useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { loadHead, type HeadAsset } from './head'
import { headVertexShader, headFragmentShader } from './headMeshShaders'
import { DISSOLVE_MAX } from './dissolve'
import { slicePhasesAt } from '../lib/slicePhases'
import { EMBER_RGB, EMBER_HOT_RGB, STRAND_RGB } from '../theme'

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
          uTime: { value: 0 },
          uEmber: { value: new THREE.Vector3(EMBER_RGB.r, EMBER_RGB.g, EMBER_RGB.b) },
          uEmberHot: {
            value: new THREE.Vector3(EMBER_HOT_RGB.r, EMBER_HOT_RGB.g, EMBER_HOT_RGB.b),
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
    const { dissolve, contour } = slicePhasesAt(progress.current)
    for (const m of mats) {
      m.uniforms.uDissolve.value = dissolve * DISSOLVE_MAX
      m.uniforms.uContour.value = contour
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
