import * as THREE from 'three'
import type { PlaygroundId } from '../data'
import { createScene, DESK_LIMIT } from './scene'
import { buildObjects, EFFECT_SECONDS, type DeskObject } from './objects'

export type EngineOptions = {
  reducedMotion: boolean
  onSelect(id: PlaygroundId): void
  onDiscover(id: PlaygroundId): void
  onStatus?(message: string): void
  tooltipFor?(id: PlaygroundId): string
}

export type EngineHandle = {
  select(id: PlaygroundId): void
  play(id: PlaygroundId): void
  zoom(dir: 1 | -1): void
  /** Toggles the slow auto-orbit. Returns the new state. */
  toggleOrbit(): boolean
  togglePause(): boolean
  reset(): void
  shuffle(): void
  dispose(): void
}

/** What each object says when you play it. */
const STATUS: Record<PlaygroundId, string> = {
  apis: 'Packet delivered. Connections made easier.',
  streaming: 'A new channel. Same curiosity.',
  healthcare: 'Demo record scanned. Keeping care connected.',
  aviation: 'Cleared for takeoff. See you back at the desk.',
  logistics: 'Cargo on the move. One connected journey.',
  cloud: 'Systems in sync. A little pulse behind the uptime.',
}

const clamp = THREE.MathUtils.clamp

export function createEngine(container: HTMLElement, opts: EngineOptions): EngineHandle {
  const stage = createScene(container)
  const { scene, camera, controls, renderer } = stage
  const canvas = renderer.domElement

  const objects = buildObjects({
    scene,
    materials: stage.materials,
    textures: stage.textures,
    maxAnisotropy: renderer.capabilities.getMaxAnisotropy(),
  })
  const byId = new Map<PlaygroundId, DeskObject>(objects.map((o) => [o.id, o]))
  const roots = objects.map((o) => o.root)

  const raycaster = new THREE.Raycaster()
  const pointer = new THREE.Vector2()
  // The plane a dragged object slides along — lifted so it tracks under the
  // cursor rather than sinking into the desk.
  const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.6)
  const hit = new THREE.Vector3()
  const grabOffset = new THREE.Vector3()
  const lastDragPoint = new THREE.Vector3()
  const pressAt = new THREE.Vector2()

  let selected: PlaygroundId = 'apis'
  let hovered: PlaygroundId | null = null
  let dragging: DeskObject | null = null
  let dragPointer: number | null = null
  let moved = false
  let lastDragTime = 0
  let disposed = false
  let paused = false
  let onScreen = true
  let visible = true
  let elapsed = 0
  let previous = performance.now()
  let raf = 0

  const tooltip = document.createElement('div')
  tooltip.className = 'scene-tooltip'
  tooltip.style.display = 'none'
  container.appendChild(tooltip)

  const abort = new AbortController()
  const { signal } = abort

  const status = (message: string) => opts.onStatus?.(message)

  const castFromEvent = (e: PointerEvent): DOMRect => {
    const rect = canvas.getBoundingClientRect()
    pointer.set(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1,
    )
    raycaster.setFromCamera(pointer, camera)
    return rect
  }

  const pick = (): DeskObject | null => {
    for (const intersection of raycaster.intersectObjects(roots, true)) {
      let node: THREE.Object3D | null = intersection.object
      while (node) {
        const id = node.userData.id as PlaygroundId | undefined
        if (id) return byId.get(id) ?? null
        node = node.parent
      }
    }
    return null
  }

  /** Fire an object's effect — the thing that makes it worth clicking. */
  const play = (id: PlaygroundId) => {
    const o = byId.get(id)
    if (!o) return
    // While paused the object still reacts, it just does not run a timeline.
    o.effect = paused ? EFFECT_SECONDS[id] : 0
    if (!paused) o.velocity.y = 0.7
    o.trigger?.()
    if (paused) o.update?.(elapsed, -1)
    status(STATUS[id])
    opts.onDiscover(id)
  }

  const onPointerDown = (e: PointerEvent) => {
    if (e.button !== 0 || dragging) return
    castFromEvent(e)
    const target = pick()
    if (!target) return
    e.stopImmediatePropagation()
    controls.enabled = false
    canvas.setPointerCapture(e.pointerId)
    dragging = target
    dragPointer = e.pointerId
    moved = false
    pressAt.set(e.clientX, e.clientY)
    lastDragTime = performance.now()
    dragPlane.constant = -Math.max(0.6, target.root.position.y)
    if (raycaster.ray.intersectPlane(dragPlane, hit)) {
      grabOffset.copy(target.root.position).sub(hit)
      lastDragPoint.copy(target.root.position)
    }
    target.velocity.set(0, 0, 0)
    target.effect = -1
    selected = target.id
    opts.onSelect(target.id)
    canvas.style.cursor = 'grabbing'
    tooltip.style.display = 'none'
  }

  const onPointerMove = (e: PointerEvent) => {
    const rect = castFromEvent(e)

    if (dragging && e.pointerId === dragPointer) {
      e.stopImmediatePropagation()
      if (pressAt.distanceTo(new THREE.Vector2(e.clientX, e.clientY)) > 5) moved = true
      if (moved && raycaster.ray.intersectPlane(dragPlane, hit)) {
        const now = performance.now()
        const dt = clamp((now - lastDragTime) / 1000, 0.008, 0.08)
        dragging.root.position.set(
          clamp(hit.x + grabOffset.x, -DESK_LIMIT.x, DESK_LIMIT.x),
          0.45,
          clamp(hit.z + grabOffset.z, -DESK_LIMIT.z, DESK_LIMIT.z),
        )
        // Carry the throw velocity so letting go feels like letting go.
        dragging.velocity
          .copy(dragging.root.position)
          .sub(lastDragPoint)
          .divideScalar(dt)
          .clampLength(0, 10)
        dragging.velocity.y = 0
        lastDragPoint.copy(dragging.root.position)
        lastDragTime = now
      }
      return
    }

    const over = pick()
    hovered = over?.id ?? null
    canvas.style.cursor = 'grab'
    if (over && e.pointerType !== 'touch') {
      tooltip.textContent = opts.tooltipFor?.(over.id) ?? over.id
      tooltip.style.display = 'block'
      tooltip.style.left = `${clamp(e.clientX - rect.left + 14, 8, rect.width - 220)}px`
      tooltip.style.top = `${Math.max(8, e.clientY - rect.top - 42)}px`
    } else {
      tooltip.style.display = 'none'
    }
  }

  const onPointerUp = (e: PointerEvent, cancelled = false) => {
    if (!dragging || e.pointerId !== dragPointer) return
    e.stopImmediatePropagation()
    const released = dragging
    // A press that never moved is a click, so it plays.
    if (!cancelled && !moved) play(released.id)
    if (cancelled || performance.now() - lastDragTime > 100) released.velocity.set(0, 0, 0)
    if (moved && !cancelled) status('Make yourself at home. The desk is yours to rearrange.')
    dragging = null
    dragPointer = null
    controls.enabled = true
    canvas.style.cursor = 'grab'
    if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId)
  }

  canvas.addEventListener('pointerdown', onPointerDown, { capture: true, signal })
  canvas.addEventListener('pointermove', onPointerMove, { capture: true, signal })
  canvas.addEventListener('pointerup', (e) => onPointerUp(e), { capture: true, signal })
  canvas.addEventListener('pointercancel', (e) => onPointerUp(e, true), { capture: true, signal })
  canvas.addEventListener('lostpointercapture', (e) => onPointerUp(e, true), { capture: true, signal })
  canvas.addEventListener('pointerleave', () => {
    hovered = null
    tooltip.style.display = 'none'
  }, { signal })
  controls.addEventListener('start', () => {
    tooltip.style.display = 'none'
  })

  /** Gravity, floor bounce, drag, and desk-edge rebound. */
  const settle = (dt: number) => {
    for (const o of objects) {
      if (o === dragging) continue
      if (paused) {
        o.velocity.set(0, 0, 0)
        o.root.position.y = 0
        continue
      }
      o.velocity.y -= 10 * dt
      o.root.position.addScaledVector(o.velocity, dt)
      if (o.root.position.y < 0) {
        o.root.position.y = 0
        o.velocity.y = Math.abs(o.velocity.y) > 0.28 ? -o.velocity.y * 0.28 : 0
      }
      o.velocity.x *= Math.exp(-4 * dt)
      o.velocity.z *= Math.exp(-4 * dt)
      for (const axis of ['x', 'z'] as const) {
        const limit = DESK_LIMIT[axis]
        if (Math.abs(o.root.position[axis]) > limit) {
          o.root.position[axis] = clamp(o.root.position[axis], -limit, limit)
          o.velocity[axis] *= -0.4
        }
      }
      o.root.rotation.y += o.spin * dt
      o.spin *= Math.exp(-3 * dt)
    }

    if (paused) return
    // Push overlapping objects apart so the desk never knots up.
    for (let i = 0; i < objects.length; i++) {
      for (let j = i + 1; j < objects.length; j++) {
        const a = objects[i]
        const b = objects[j]
        if (Math.abs(a.root.position.y - b.root.position.y) > 1.4) continue
        const dx = b.root.position.x - a.root.position.x
        const dz = b.root.position.z - a.root.position.z
        const gap = Math.hypot(dx, dz)
        const want = (a.radius + b.radius) * 0.79
        if (gap >= want || gap <= 0.001) continue
        const nx = dx / gap
        const nz = dz / gap
        const push = want - gap
        const moveA = a !== dragging
        const moveB = b !== dragging
        const share = moveA && moveB ? 0.5 : 1
        if (moveA) {
          a.root.position.x -= nx * push * share
          a.root.position.z -= nz * push * share
          a.velocity.x -= nx * push * 2
          a.velocity.z -= nz * push * 2
        }
        if (moveB) {
          b.root.position.x += nx * push * share
          b.root.position.z += nz * push * share
          b.velocity.x += nx * push * 2
          b.velocity.z += nz * push * 2
        }
      }
    }
  }

  const frame = (now: number) => {
    if (disposed) return
    raf = requestAnimationFrame(frame)
    const dt = clamp((now - previous) / 1000, 0, 0.035)
    previous = now
    if (!onScreen || !visible) return

    if (!paused) elapsed += dt
    controls.update()
    settle(dt)

    for (const o of objects) {
      if (!paused) {
        if (o.effect >= 0) {
          o.effect += dt
          if (o.effect > EFFECT_SECONDS[o.id]) o.effect = -1
        }
        o.update?.(elapsed, o.effect < 0 ? -1 : o.effect / EFFECT_SECONDS[o.id])
      }
      const want = o.id === selected ? 0.48 : o.id === hovered ? 0.23 : 0
      const ringMaterial = o.ring.material as THREE.MeshBasicMaterial
      ringMaterial.opacity = THREE.MathUtils.lerp(ringMaterial.opacity, want, 0.12)
      o.ring.position.set(o.root.position.x, 0.015, o.root.position.z)
    }

    stage.render()
  }

  const resizeObserver = new ResizeObserver(() => stage.resize())
  resizeObserver.observe(container)

  const intersectionObserver = new IntersectionObserver(
    (entries) => {
      onScreen = entries[0]?.isIntersecting ?? true
    },
    { rootMargin: '100px' },
  )
  intersectionObserver.observe(container)

  document.addEventListener('visibilitychange', () => {
    visible = !document.hidden
  }, { signal })

  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault()
    visible = false
  }, { signal })

  if (opts.reducedMotion) {
    paused = true
    for (const o of objects) o.update?.(0, -1)
  }

  stage.render()
  raf = requestAnimationFrame(frame)

  return {
    select(id) {
      selected = id
      opts.onSelect(id)
    },
    play,
    zoom(dir) {
      // dir 1 = closer. OrbitControls works in distance, so invert.
      const offset = camera.position.clone().sub(controls.target)
      const factor = dir > 0 ? 0.82 : 1 / 0.82
      offset.setLength(
        clamp(offset.length() * factor, controls.minDistance, controls.maxDistance),
      )
      camera.position.copy(controls.target).add(offset)
      controls.update()
    },
    toggleOrbit() {
      controls.autoRotate = !controls.autoRotate && !paused
      return controls.autoRotate
    },
    togglePause() {
      paused = !paused
      if (paused) {
        controls.autoRotate = false
        for (const o of objects) {
          o.effect = -1
          o.update?.(elapsed, -1)
        }
      }
      return paused
    },
    reset() {
      dragging = null
      dragPointer = null
      controls.enabled = true
      controls.autoRotate = false
      controls.reset()
      for (const o of objects) {
        o.root.position.copy(o.home)
        o.root.rotation.set(0, o.yaw, 0)
        o.velocity.set(0, 0, 0)
        o.spin = 0
        o.effect = -1
        o.model.position.set(0, 0, 0)
        o.model.rotation.set(0, 0, 0)
        o.rest?.()
        o.update?.(0, -1)
      }
      status('Back to the way it was. Pick something up.')
    },
    shuffle() {
      if (paused) {
        // Nothing can fly while paused, so rotate the objects through each
        // other's home positions instead.
        const homes = objects.map((o) => o.home.clone())
        objects.forEach((o, i) => o.root.position.copy(homes[(i + 1) % homes.length]))
        return
      }
      for (const o of objects) {
        o.velocity.set((Math.random() - 0.5) * 6, 3 + Math.random() * 2, (Math.random() - 0.5) * 5)
        o.spin = (Math.random() - 0.5) * 3
      }
      status('Everything up in the air. It always lands somewhere.')
    },
    dispose() {
      disposed = true
      cancelAnimationFrame(raf)
      abort.abort()
      resizeObserver.disconnect()
      intersectionObserver.disconnect()
      tooltip.remove()
      stage.dispose()
    },
  }
}
