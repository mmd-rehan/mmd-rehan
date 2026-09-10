import * as THREE from 'three'
import type { PlaygroundId } from '../data'
import type { Stage } from './scene'

type Options = {
  stage: Stage
  objects: Map<PlaygroundId, THREE.Group>
  onObjectClick(id: PlaygroundId): void
  onObjectDrag(id: PlaygroundId, point: THREE.Vector3): void
  reducedMotion: boolean
}

export type Controls = {
  setEnabled(on: boolean): void
  recenter(): void
  zoom(dir: 1 | -1): void
  focus(id: PlaygroundId): void
  /** Advance eased camera state — call once per frame. */
  update(): void
  dispose(): void
}

const AZ_MIN = Math.PI / 4 - 0.55
const AZ_MAX = Math.PI / 4 + 0.55
const POLAR_MIN = 0.5
const POLAR_MAX = 1.15
const ZOOM_MIN = 0.65
const ZOOM_MAX = 2
const CLICK_SLOP = 5 // px
const CLICK_TIME = 350 // ms

export function attachControls(opts: Options): Controls {
  const { stage, objects } = opts
  const dom = stage.renderer.domElement
  const groups = [...objects.values()]

  let enabled = true

  // Eased targets vs. live values.
  let az = stage.homeAzimuth
  let polar = stage.homePolar
  let azTo = az
  let polarTo = polar
  let zoomTo = stage.camera.zoom
  let targetTo = stage.target.clone()

  const raycaster = new THREE.Raycaster()
  const ndc = new THREE.Vector2()
  const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)

  const setNdc = (e: PointerEvent | WheelEvent) => {
    const r = dom.getBoundingClientRect()
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
  }

  const pickObject = (): { id: PlaygroundId; group: THREE.Group } | null => {
    raycaster.setFromCamera(ndc, stage.camera)
    const hits = raycaster.intersectObjects(groups, true)
    if (!hits.length) return null
    let o: THREE.Object3D | null = hits[0].object
    while (o && !o.userData.id) o = o.parent
    if (!o) return null
    return { id: o.userData.id as PlaygroundId, group: o as THREE.Group }
  }

  const groundPoint = (): THREE.Vector3 | null => {
    raycaster.setFromCamera(ndc, stage.camera)
    const p = new THREE.Vector3()
    return raycaster.ray.intersectPlane(groundPlane, p) ? p : null
  }

  type Drag =
    | { kind: 'none' }
    | { kind: 'orbit'; lastX: number; lastY: number }
    | { kind: 'object'; id: PlaygroundId; offset: THREE.Vector3 }

  let drag: Drag = { kind: 'none' }
  let downX = 0
  let downY = 0
  let downAt = 0
  let downHitId: PlaygroundId | null = null

  const onPointerDown = (e: PointerEvent) => {
    if (!enabled || e.button !== 0) return
    dom.setPointerCapture(e.pointerId)
    setNdc(e)
    downX = e.clientX
    downY = e.clientY
    downAt = performance.now()

    const hit = pickObject()
    downHitId = hit?.id ?? null
    if (hit) {
      const gp = groundPoint()
      const offset = gp ? hit.group.position.clone().sub(gp).setY(0) : new THREE.Vector3()
      drag = { kind: 'object', id: hit.id, offset }
    } else {
      drag = { kind: 'orbit', lastX: e.clientX, lastY: e.clientY }
    }
  }

  const onPointerMove = (e: PointerEvent) => {
    if (drag.kind === 'none') return
    setNdc(e)

    if (drag.kind === 'orbit') {
      const dx = e.clientX - drag.lastX
      const dy = e.clientY - drag.lastY
      drag.lastX = e.clientX
      drag.lastY = e.clientY
      azTo = THREE.MathUtils.clamp(azTo - dx * 0.005, AZ_MIN, AZ_MAX)
      polarTo = THREE.MathUtils.clamp(polarTo - dy * 0.004, POLAR_MIN, POLAR_MAX)
      return
    }

    // object drag
    const gp = groundPoint()
    if (!gp) return
    const p = gp.add(drag.offset)
    p.x = THREE.MathUtils.clamp(p.x, -4.6, 4.6)
    p.z = THREE.MathUtils.clamp(p.z, -3, 3)
    opts.onObjectDrag(drag.id, p)
  }

  const endDrag = (e: PointerEvent) => {
    if (dom.hasPointerCapture(e.pointerId)) dom.releasePointerCapture(e.pointerId)
    const moved = Math.hypot(e.clientX - downX, e.clientY - downY)
    const quick = performance.now() - downAt < CLICK_TIME
    if (downHitId && moved < CLICK_SLOP && quick) {
      opts.onObjectClick(downHitId)
    }
    drag = { kind: 'none' }
    downHitId = null
  }

  const onWheel = (e: WheelEvent) => {
    if (!enabled) return
    e.preventDefault()
    const factor = e.deltaY < 0 ? 1.12 : 0.89
    zoomTo = THREE.MathUtils.clamp(zoomTo * factor, ZOOM_MIN, ZOOM_MAX)
  }

  dom.addEventListener('pointerdown', onPointerDown)
  dom.addEventListener('pointermove', onPointerMove)
  dom.addEventListener('pointerup', endDrag)
  dom.addEventListener('pointercancel', endDrag)
  dom.addEventListener('wheel', onWheel, { passive: false })

  const update = () => {
    const k = 0.16
    az += (azTo - az) * k
    polar += (polarTo - polar) * k
    stage.camera.zoom += (zoomTo - stage.camera.zoom) * k
    stage.target.lerp(targetTo, k)
    stage.camera.updateProjectionMatrix()
    stage.setOrbit(az, polar)
  }

  return {
    setEnabled(on) {
      enabled = on
    },
    recenter() {
      azTo = stage.homeAzimuth
      polarTo = stage.homePolar
      zoomTo = stage.homeZoom
      targetTo = new THREE.Vector3(0, 0.6, 0)
    },
    zoom(dir) {
      zoomTo = THREE.MathUtils.clamp(zoomTo * (dir === 1 ? 1.18 : 0.85), ZOOM_MIN, ZOOM_MAX)
    },
    focus(id) {
      const g = objects.get(id)
      if (!g) return
      targetTo = new THREE.Vector3(g.position.x * 0.5, 0.7, g.position.z * 0.5)
      zoomTo = THREE.MathUtils.clamp(Math.max(zoomTo, 1.15), ZOOM_MIN, ZOOM_MAX)
    },
    update,
    dispose() {
      dom.removeEventListener('pointerdown', onPointerDown)
      dom.removeEventListener('pointermove', onPointerMove)
      dom.removeEventListener('pointerup', endDrag)
      dom.removeEventListener('pointercancel', endDrag)
      dom.removeEventListener('wheel', onWheel)
    },
  }
}
