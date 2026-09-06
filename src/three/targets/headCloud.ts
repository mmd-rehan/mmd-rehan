import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js'
import { mulberry32 } from '../../lib/rng'

/**
 * The portrait, sampled from a real 3D head mesh instead of a flat photo.
 *
 * We load a small head+neck GLB (an Avaturn avatar crop), area-weight its
 * meshes, and scatter `count` points across the actual surface — capturing each
 * point's world position, surface normal, and albedo colour (sampled from the
 * material's texture at the interpolated UV). The result reads as a real head
 * rendered in points, with genuine relief and lighting, not a 2D cut-out.
 *
 * The mesh is loaded, sampled, and discarded — it never enters the render tree
 * (which is what the particle/filament scene needs).
 *
 * Output frame matches the old photo sampler: head ~2.4 units tall, centred on
 * the origin, facing +Z, so the filament roots and chapter copy still line up.
 */

const HEAD_GLB_URL = '/models/head-neck.glb'
const TARGET_HEIGHT = 2.4

export interface HeadBuffers {
  positions: Float32Array
  normals: Float32Array
  colors: Float32Array
}

interface MeshEntry {
  sampler: MeshSurfaceSampler
  area: number
  worldMatrix: THREE.Matrix4
  normalMatrix: THREE.Matrix3
  /** Decoded texture pixels, or null for a flat-colour material. */
  tex: { data: Uint8ClampedArray; w: number; h: number } | null
  flat: THREE.Color
}

export async function sampleHeadCloud(
  count: number,
  seed = 5005,
): Promise<HeadBuffers> {
  const gltf = await new GLTFLoader().loadAsync(HEAD_GLB_URL)
  const root = gltf.scene
  root.updateMatrixWorld(true)

  const entries: MeshEntry[] = []
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh
    if (!mesh.isMesh || !mesh.geometry?.attributes.position) return

    const geom = mesh.geometry
    const sampler = new MeshSurfaceSampler(mesh).build()
    const area = surfaceArea(geom)

    const mat = (Array.isArray(mesh.material) ? mesh.material[0] : mesh.material) as
      | THREE.MeshStandardMaterial
      | undefined
    let tex: MeshEntry['tex'] = null
    const flat = new THREE.Color(0xd8b48f)
    if (mat) {
      if (mat.color) flat.copy(mat.color)
      const image = mat.map?.image as (HTMLImageElement | ImageBitmap | undefined)
      if (image) tex = decodeImage(image)
    }

    entries.push({
      sampler,
      area,
      worldMatrix: mesh.matrixWorld.clone(),
      normalMatrix: new THREE.Matrix3().getNormalMatrix(mesh.matrixWorld),
      tex,
      flat,
    })
  })

  if (entries.length === 0) throw new Error('head GLB has no meshes')

  const totalArea = entries.reduce((s, e) => s + e.area, 0)
  const rng = mulberry32(seed)

  const rawPos = new Float32Array(count * 3)
  const rawNrm = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)

  const p = new THREE.Vector3()
  const n = new THREE.Vector3()
  const uv = new THREE.Vector2()
  const col = new THREE.Color()

  for (let i = 0; i < count; i++) {
    // Pick a mesh proportional to its surface area.
    let pick = rng() * totalArea
    let e = entries[0]
    for (const entry of entries) {
      pick -= entry.area
      if (pick <= 0) {
        e = entry
        break
      }
    }

    e.sampler.sample(p, n, col, uv)
    p.applyMatrix4(e.worldMatrix)
    n.applyMatrix3(e.normalMatrix).normalize()

    rawPos[i * 3] = p.x
    rawPos[i * 3 + 1] = p.y
    rawPos[i * 3 + 2] = p.z
    rawNrm[i * 3] = n.x
    rawNrm[i * 3 + 1] = n.y
    rawNrm[i * 3 + 2] = n.z

    let r: number
    let g: number
    let b: number
    if (e.tex) {
      const tx = Math.min(e.tex.w - 1, Math.max(0, Math.floor(uv.x * e.tex.w)))
      const ty = Math.min(
        e.tex.h - 1,
        Math.max(0, Math.floor((1 - uv.y) * e.tex.h)),
      )
      const o = (ty * e.tex.w + tx) * 4
      r = e.tex.data[o] / 255
      g = e.tex.data[o + 1] / 255
      b = e.tex.data[o + 2] / 255
    } else {
      r = e.flat.r
      g = e.flat.g
      b = e.flat.b
    }
    // sRGB -> linear-ish nudge + gentle saturation so skin/beard hold on charcoal
    const lum = 0.299 * r + 0.587 * g + 0.114 * b
    const sat = 1.12
    colors[i * 3] = clamp01((lum + (r - lum) * sat) * 1.02)
    colors[i * 3 + 1] = clamp01((lum + (g - lum) * sat) * 0.99)
    colors[i * 3 + 2] = clamp01((lum + (b - lum) * sat) * 0.96)
  }

  // Fit into the shared frame: centre on origin, scale to TARGET_HEIGHT tall.
  const box = boundsOf(rawPos)
  const size = new THREE.Vector3().subVectors(box.max, box.min)
  const center = new THREE.Vector3().addVectors(box.min, box.max).multiplyScalar(0.5)
  const scale = size.y > 0 ? TARGET_HEIGHT / size.y : 1

  const positions = new Float32Array(count * 3)
  const normals = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (rawPos[i * 3] - center.x) * scale
    positions[i * 3 + 1] = (rawPos[i * 3 + 1] - center.y) * scale
    positions[i * 3 + 2] = (rawPos[i * 3 + 2] - center.z) * scale
    normals[i * 3] = rawNrm[i * 3]
    normals[i * 3 + 1] = rawNrm[i * 3 + 1]
    normals[i * 3 + 2] = rawNrm[i * 3 + 2]
  }

  return { positions, normals, colors }
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)

function surfaceArea(geom: THREE.BufferGeometry): number {
  const pos = geom.attributes.position
  const idx = geom.index
  const a = new THREE.Vector3()
  const b = new THREE.Vector3()
  const c = new THREE.Vector3()
  const ab = new THREE.Vector3()
  const ac = new THREE.Vector3()
  let total = 0
  const triCount = idx ? idx.count / 3 : pos.count / 3
  for (let t = 0; t < triCount; t++) {
    const i0 = idx ? idx.getX(t * 3) : t * 3
    const i1 = idx ? idx.getX(t * 3 + 1) : t * 3 + 1
    const i2 = idx ? idx.getX(t * 3 + 2) : t * 3 + 2
    a.fromBufferAttribute(pos, i0)
    b.fromBufferAttribute(pos, i1)
    c.fromBufferAttribute(pos, i2)
    ab.subVectors(b, a)
    ac.subVectors(c, a)
    total += ab.cross(ac).length() * 0.5
  }
  return total
}

function boundsOf(pos: Float32Array): THREE.Box3 {
  const box = new THREE.Box3()
  const v = new THREE.Vector3()
  for (let i = 0; i < pos.length; i += 3) {
    v.set(pos[i], pos[i + 1], pos[i + 2])
    box.expandByPoint(v)
  }
  return box
}

function decodeImage(
  image: HTMLImageElement | ImageBitmap,
): { data: Uint8ClampedArray; w: number; h: number } | null {
  try {
    const w = (image as ImageBitmap).width || (image as HTMLImageElement).naturalWidth
    const h = (image as ImageBitmap).height || (image as HTMLImageElement).naturalHeight
    if (!w || !h) return null
    const canvas = document.createElement('canvas')
    // cap size for speed; texture detail beyond this doesn't matter per-point
    const maxDim = 1024
    const s = Math.min(1, maxDim / Math.max(w, h))
    canvas.width = Math.max(1, Math.round(w * s))
    canvas.height = Math.max(1, Math.round(h * s))
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return null
    ctx.drawImage(image as CanvasImageSource, 0, 0, canvas.width, canvas.height)
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)
    return { data, w: canvas.width, h: canvas.height }
  } catch {
    return null
  }
}
