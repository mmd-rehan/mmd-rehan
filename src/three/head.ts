import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js'
import { mulberry32 } from '../lib/rng'

/**
 * Single source of truth for the head asset. Loads the GLB once (module cache),
 * fits it into a shared local frame (centred on origin, TARGET_HEIGHT tall,
 * facing +Z), and exposes it two ways that live in the *same* frame:
 *
 *   parts       — fitted BufferGeometry + baseColour texture per source mesh,
 *                 for rendering the photoreal head with the dissolve shader.
 *   sampleCloud — area-weighted point cloud over the same surface (position,
 *                 normal, albedo), for the particle field the mesh dissolves
 *                 into.
 *
 * Because both come out of the same fit transform, `dissolveField(localPos)` in
 * the two shaders refers to the same physical point.
 */

const HEAD_GLB_URL = '/models/head-neck.glb'
const TARGET_HEIGHT = 2.7

export interface HeadMeshPart {
  geometry: THREE.BufferGeometry
  map: THREE.Texture | null
  isHair: boolean
}

export interface HeadBuffers {
  positions: Float32Array
  normals: Float32Array
  colors: Float32Array
}

export interface HeadAsset {
  parts: HeadMeshPart[]
  sampleCloud: (count: number, seed?: number) => HeadBuffers
}

let cache: Promise<HeadAsset> | null = null

export function loadHead(): Promise<HeadAsset> {
  if (!cache) cache = build()
  return cache
}

interface Src {
  fitted: THREE.BufferGeometry
  map: THREE.Texture | null
  tex: DecodedTexture | null
  flat: THREE.Color
  isHair: boolean
  area: number
}

async function build(): Promise<HeadAsset> {
  const gltf = await new GLTFLoader().loadAsync(HEAD_GLB_URL)
  const root = gltf.scene
  root.updateMatrixWorld(true)

  // 1. Collect meshes, bake node transforms into geometry, strip skinning attrs.
  const raw: { geom: THREE.BufferGeometry; mat?: THREE.MeshStandardMaterial; isHair: boolean }[] = []
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh
    if (!mesh.isMesh || !mesh.geometry?.attributes.position) return
    const g = mesh.geometry.clone()
    g.applyMatrix4(mesh.matrixWorld)
    for (const attr of Object.keys(g.attributes)) {
      if (attr !== 'position' && attr !== 'normal' && attr !== 'uv') g.deleteAttribute(attr)
    }
    const mat = (Array.isArray(mesh.material) ? mesh.material[0] : mesh.material) as
      | THREE.MeshStandardMaterial
      | undefined
    raw.push({ geom: g, mat, isHair: /hair/i.test(mesh.name) })
  })
  if (raw.length === 0) throw new Error('head GLB has no meshes')

  // 2. Fit transform from the union bounding box.
  const union = new THREE.Box3()
  for (const r of raw) {
    r.geom.computeBoundingBox()
    union.union(r.geom.boundingBox as THREE.Box3)
  }
  const size = union.getSize(new THREE.Vector3())
  const center = union.getCenter(new THREE.Vector3())
  const scale = size.y > 0 ? TARGET_HEIGHT / size.y : 1
  const fit = new THREE.Matrix4()
    .makeScale(scale, scale, scale)
    .multiply(new THREE.Matrix4().makeTranslation(-center.x, -center.y, -center.z))

  // 3. Fitted geometry + decoded texture per source.
  const srcs: Src[] = raw.map((r) => {
    const fitted = r.geom.clone()
    fitted.applyMatrix4(fit)
    const map = r.mat?.map ?? null
    const flat = new THREE.Color(0xd8b48f)
    if (r.mat?.color) flat.copy(r.mat.color)
    return {
      fitted,
      map,
      tex: map?.image ? decodeImage(map.image as HTMLImageElement | ImageBitmap) : null,
      flat,
      isHair: r.isHair,
      area: surfaceArea(fitted),
    }
  })

  const parts: HeadMeshPart[] = srcs.map((s) => ({
    geometry: s.fitted,
    map: s.map,
    isHair: s.isHair,
  }))

  // 4. Point-cloud sampler over the fitted surface.
  const samplers = srcs.map((s) => ({
    sampler: new MeshSurfaceSampler(new THREE.Mesh(s.fitted)).build(),
    area: s.area,
    tex: s.tex,
    flat: s.flat,
  }))
  const totalArea = samplers.reduce((sum, s) => sum + s.area, 0)

  const sampleCloud = (count: number, seed = 5005): HeadBuffers => {
    const rng = mulberry32(seed)
    const positions = new Float32Array(count * 3)
    const normals = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const p = new THREE.Vector3()
    const n = new THREE.Vector3()
    const uv = new THREE.Vector2()
    const col = new THREE.Color()

    for (let i = 0; i < count; i++) {
      let pick = rng() * totalArea
      let s = samplers[0]
      for (const cand of samplers) {
        pick -= cand.area
        if (pick <= 0) {
          s = cand
          break
        }
      }
      s.sampler.sample(p, n, col, uv)

      positions[i * 3] = p.x
      positions[i * 3 + 1] = p.y
      positions[i * 3 + 2] = p.z
      normals[i * 3] = n.x
      normals[i * 3 + 1] = n.y
      normals[i * 3 + 2] = n.z

      let r: number
      let g: number
      let b: number
      if (s.tex) {
        const tx = clampInt(Math.floor(uv.x * s.tex.w), s.tex.w)
        const ty = clampInt(Math.floor((1 - uv.y) * s.tex.h), s.tex.h)
        const o = (ty * s.tex.w + tx) * 4
        r = s.tex.data[o] / 255
        g = s.tex.data[o + 1] / 255
        b = s.tex.data[o + 2] / 255
      } else {
        r = s.flat.r
        g = s.flat.g
        b = s.flat.b
      }
      const lum = 0.299 * r + 0.587 * g + 0.114 * b
      const sat = 1.12
      colors[i * 3] = clamp01((lum + (r - lum) * sat) * 1.02)
      colors[i * 3 + 1] = clamp01((lum + (g - lum) * sat) * 0.99)
      colors[i * 3 + 2] = clamp01((lum + (b - lum) * sat) * 0.96)
    }
    return { positions, normals, colors }
  }

  return { parts, sampleCloud }
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)
const clampInt = (v: number, n: number) => (v < 0 ? 0 : v >= n ? n - 1 : v)

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

interface DecodedTexture {
  data: Uint8ClampedArray
  w: number
  h: number
}

function decodeImage(image: HTMLImageElement | ImageBitmap): DecodedTexture | null {
  try {
    const w = (image as ImageBitmap).width || (image as HTMLImageElement).naturalWidth
    const h = (image as ImageBitmap).height || (image as HTMLImageElement).naturalHeight
    if (!w || !h) return null
    const canvas = document.createElement('canvas')
    const maxDim = 1024
    const s = Math.min(1, maxDim / Math.max(w, h))
    canvas.width = Math.max(1, Math.round(w * s))
    canvas.height = Math.max(1, Math.round(h * s))
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return null
    ctx.drawImage(image as CanvasImageSource, 0, 0, canvas.width, canvas.height)
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height)
    return { data: img.data, w: canvas.width, h: canvas.height }
  } catch {
    return null
  }
}
