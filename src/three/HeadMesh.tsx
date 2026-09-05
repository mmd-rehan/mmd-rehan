import { Component, Suspense, useEffect, useMemo, type MutableRefObject, type ReactNode } from 'react'
import { useFrame, useLoader } from '@react-three/fiber'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import * as THREE from 'three'
import { slicePhasesAt } from '../lib/slicePhases'

/**
 * NOTE (unmounted, kept for follow-up): this renders the photoreal scanned
 * head, but mounting <HeadMeshSlot> anywhere inside the main <Scene> Canvas —
 * even a completely inert test mesh with no relation to this file — blacks
 * out the entire canvas (particles and filaments included), reproducibly,
 * regardless of position/material/geometry. Root cause not yet isolated;
 * likely worth its own Canvas (layered via CSS) rather than sharing this
 * scene's reconciler tree. See the design-doc follow-up before re-enabling.
 */

/** Where the GLB is expected. Absent/broken scan -> component silently renders nothing. */
const HEAD_GLB_URL = '/models/head.glb'

/**
 * The photoreal rest-state head — a phone/photogrammetry scan (rough around
 * the edges; the disintegration hides that). Visible at t=0, fades out as the
 * contour/dissolve beats take over so the particle portrait can take the baton.
 * Wrapped in an ErrorBoundary + Suspense by the exported `HeadMeshSlot`, so a
 * missing or broken scan just means "no mesh" — the particle-only portrait
 * still carries the hero on its own.
 */
function HeadMeshInner({ progress }: { progress: MutableRefObject<number> }) {
  const gltf = useLoader(GLTFLoader, HEAD_GLB_URL)
  const { scene } = gltf

  const prepared = useMemo(() => {
    const root = scene.clone(true)

    // The scan's face normal points away from a camera looking down -z;
    // turn it around so the face is what you see at rest.
    root.rotation.set(0, Math.PI, 0)

    // Auto-fit: scale to a consistent bust height and centre it on the same
    // head model the particles/filaments use (HEAD_CENTER in Filaments.tsx).
    const box = new THREE.Box3().setFromObject(root)
    const size = box.getSize(new THREE.Vector3())
    const targetHeight = 2.7
    const scale = size.y > 0 ? targetHeight / size.y : 1
    root.scale.setScalar(scale)

    // Re-measure post-scale/rotate, then centre horizontally and sit the bust
    // so the face lines up with the particle portrait's head band.
    const box2 = new THREE.Box3().setFromObject(root)
    const size2 = box2.getSize(new THREE.Vector3())
    const center2 = box2.getCenter(new THREE.Vector3())
    root.position.x -= center2.x
    root.position.z -= center2.z
    root.position.y -= center2.y - size2.y * 0.02

    root.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        mesh.castShadow = false
        mesh.receiveShadow = false
        const applyMat = (m: THREE.Material) => {
          const mat = m as THREE.MeshStandardMaterial
          mat.transparent = true
          mat.depthWrite = true
          mat.roughness = 0.85
          mat.metalness = 0.0
          return mat
        }
        mesh.material = Array.isArray(mesh.material)
          ? mesh.material.map(applyMat)
          : applyMat(mesh.material as THREE.Material)
      }
    })

    return root
  }, [scene])

  useEffect(() => {
    return () => {
      prepared.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh
          mesh.geometry.dispose()
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
          mats.forEach((m) => m.dispose())
        }
      })
    }
  }, [prepared])

  useFrame(() => {
    const { meshOpacity } = slicePhasesAt(progress.current)
    prepared.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
        mats.forEach((m) => {
          ;(m as THREE.MeshStandardMaterial).opacity = meshOpacity
        })
        mesh.visible = meshOpacity > 0.01
      }
    })
  })

  return <primitive object={prepared} />
}

interface BoundaryProps {
  children: ReactNode
}
interface BoundaryState {
  failed: boolean
}

/** Swallows a missing/broken GLB so the particle portrait carries the hero alone. */
class HeadMeshBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(error: unknown) {
    console.warn('[HeadMesh] no usable head scan, falling back to particles only:', error)
  }
  render() {
    if (this.state.failed) return null
    return this.props.children
  }
}

export function HeadMeshSlot({ progress }: { progress: MutableRefObject<number> }) {
  return (
    <HeadMeshBoundary>
      <Suspense fallback={null}>
        <HeadMeshInner progress={progress} />
      </Suspense>
    </HeadMeshBoundary>
  )
}
