import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'

/** Textures created for canvas decals, kept so the engine can dispose them. */
export type TextureBin = THREE.Texture[]

/** Add a shadow-casting mesh at a local position. */
export function mesh(
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  parent: THREE.Object3D,
  at: [number, number, number] = [0, 0, 0],
): THREE.Mesh {
  const m = new THREE.Mesh(geometry, material)
  m.position.set(at[0], at[1], at[2])
  m.castShadow = true
  m.receiveShadow = true
  parent.add(m)
  return m
}

/**
 * A rounded box — the workhorse of the whole desk. The corner radius is capped
 * at half the smallest side so thin panels stay flat instead of turning into
 * capsules.
 */
export function box(
  parent: THREE.Object3D,
  size: [number, number, number],
  at: [number, number, number],
  material: THREE.Material,
  radius = 0.08,
): THREE.Mesh {
  const r = Math.min(radius, ...size.map((s) => s / 2))
  return mesh(new RoundedBoxGeometry(size[0], size[1], size[2], 3, r), material, parent, at)
}

export function sphere(
  parent: THREE.Object3D,
  radius: number,
  at: [number, number, number],
  material: THREE.Material,
): THREE.Mesh {
  return mesh(new THREE.SphereGeometry(radius, 20, 14), material, parent, at)
}

export function cylinder(
  parent: THREE.Object3D,
  radius: number,
  height: number,
  at: [number, number, number],
  material: THREE.Material,
): THREE.Mesh {
  return mesh(new THREE.CylinderGeometry(radius, radius, height, 40), material, parent, at)
}

/** A swept tube through a series of points — antennae, cables, hoses. */
export function tube(
  parent: THREE.Object3D,
  points: [number, number, number][],
  radius: number,
  material: THREE.Material,
): THREE.Mesh {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)))
  return mesh(new THREE.TubeGeometry(curve, 40, radius, 8, false), material, parent)
}

/** An extruded, bevelled 2D outline — wings, tail fins. */
export function extrude(
  parent: THREE.Object3D,
  outline: [number, number][],
  material: THREE.Material,
  flat: boolean,
): THREE.Mesh {
  const shape = new THREE.Shape()
  outline.forEach((p, i) => (i === 0 ? shape.moveTo(p[0], p[1]) : shape.lineTo(p[0], p[1])))
  shape.closePath()
  const m = mesh(
    new THREE.ExtrudeGeometry(shape, {
      depth: 0.055,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.025,
      bevelThickness: 0.025,
    }),
    material,
    parent,
  )
  if (flat) m.rotation.x = -Math.PI / 2
  return m
}

export type Painted = {
  texture: THREE.CanvasTexture
  ctx: CanvasRenderingContext2D
}

/** A canvas-backed texture. Used for TV channels and printed labels. */
export function paint(
  bin: TextureBin,
  width: number,
  height: number,
  maxAnisotropy: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
): Painted {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D is not available')
  draw(ctx, width, height)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = Math.min(8, maxAnisotropy)
  bin.push(texture)
  return { texture, ctx }
}

/** A flat printed label — desk markings, crate stencils, screen nameplates. */
export function label(
  bin: TextureBin,
  maxAnisotropy: number,
  parent: THREE.Object3D,
  text: string,
  width: number,
  height: number,
  at: [number, number, number],
  color = '#19252d',
  background = '#f8f9f5',
  font = '600 58px Arial',
): THREE.Mesh {
  const { texture } = paint(bin, 512, 128, maxAnisotropy, (ctx, w, h) => {
    ctx.fillStyle = background
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = color
    ctx.font = font
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, w / 2, h / 2)
  })
  return mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide }),
    parent,
    at,
  )
}
