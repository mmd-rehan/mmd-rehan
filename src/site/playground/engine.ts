import * as THREE from 'three'
import type { PlaygroundEntry, PlaygroundId } from '../data'
import { createScene } from './scene'
import { buildObject, buildScenery } from './objects'

export type EngineOptions = {
  catalog: PlaygroundEntry[]
  reducedMotion: boolean
  onSelect(id: PlaygroundId): void
  onDiscover(id: PlaygroundId): void
}

export type EngineHandle = {
  select(id: PlaygroundId): void
  play(id: PlaygroundId): void
  zoom(dir: 1 | -1): void
  recenter(): void
  togglePause(): boolean
  reset(): void
  shuffle(): void
  dispose(): void
}

export function createEngine(container: HTMLElement, opts: EngineOptions): EngineHandle {
  const stage = createScene(container)
  const { scene, camera } = stage

  // Build the interactive objects at their home positions.
  const objects = new Map<PlaygroundId, THREE.Group>()
  for (const entry of opts.catalog) {
    const group = buildObject(entry.id)
    group.position.set(entry.home[0], entry.home[1], entry.home[2])
    group.userData.id = entry.id
    scene.add(group)
    objects.set(entry.id, group)
  }
  scene.add(buildScenery())

  let paused = false
  let disposed = false
  let onScreen = true
  let raf = 0
  const clock = new THREE.Clock()

  const frame = () => {
    if (disposed) return
    raf = requestAnimationFrame(frame)
    const t = clock.getElapsedTime()

    if (!paused && !opts.reducedMotion) {
      // Gentle idle bob so the scene feels alive.
      for (const group of objects.values()) {
        const phase = group.position.x + group.position.z
        group.position.y = (group.userData.baseY ?? 0) + Math.sin(t * 1.1 + phase) * 0.03
      }
    }

    stage.render()
  }

  const loop = () => {
    if (raf || paused || !onScreen || disposed) return
    clock.start()
    raf = requestAnimationFrame(frame)
  }
  const stop = () => {
    if (raf) cancelAnimationFrame(raf)
    raf = 0
  }

  // Record resting heights for the bob.
  for (const group of objects.values()) group.userData.baseY = group.position.y

  const ro = new ResizeObserver(() => {
    stage.resize()
    if (!raf) stage.render()
  })
  ro.observe(container)

  const io = new IntersectionObserver(
    ([entry]) => {
      onScreen = entry.isIntersecting && entry.intersectionRatio > 0.08
      if (onScreen) loop()
      else stop()
    },
    { threshold: [0, 0.08, 0.25] },
  )
  io.observe(container)

  const onVisibility = () => {
    if (document.hidden) stop()
    else loop()
  }
  document.addEventListener('visibilitychange', onVisibility)

  loop()
  stage.render()

  // --- Imperative handle (camera / interaction wiring lands in later tasks) ---
  let current: PlaygroundId | null = null

  const handle: EngineHandle = {
    select(id) {
      if (id === current) return
      current = id
      opts.onDiscover(id)
      opts.onSelect(id)
      if (!raf) stage.render()
    },
    play() {
      if (!raf) stage.render()
    },
    zoom(dir) {
      camera.zoom = THREE.MathUtils.clamp(camera.zoom * (dir === 1 ? 1.15 : 0.87), 0.6, 2)
      camera.updateProjectionMatrix()
      if (!raf) stage.render()
    },
    recenter() {
      camera.zoom = stage.homeZoom
      camera.updateProjectionMatrix()
      if (!raf) stage.render()
    },
    togglePause() {
      paused = !paused
      if (paused) stop()
      else loop()
      return paused
    },
    reset() {
      for (const entry of opts.catalog) {
        const g = objects.get(entry.id)
        if (g) {
          g.position.set(entry.home[0], entry.home[1], entry.home[2])
          g.userData.baseY = entry.home[1]
        }
      }
      handle.recenter()
    },
    shuffle() {
      const cells = shuffled(gridCells(opts.catalog.length))
      let i = 0
      for (const entry of opts.catalog) {
        const g = objects.get(entry.id)
        if (g) {
          const [x, z] = cells[i++]
          g.position.set(x, entry.home[1], z)
          g.userData.baseY = entry.home[1]
        }
      }
      if (!raf) stage.render()
    },
    dispose() {
      disposed = true
      stop()
      ro.disconnect()
      io.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      for (const group of objects.values()) disposeGroup(group)
      stage.dispose()
    },
  }

  return handle
}

function gridCells(n: number): [number, number][] {
  const cols = Math.ceil(Math.sqrt(n))
  const spanX = 7
  const spanZ = 5
  const cells: [number, number][] = []
  for (let i = 0; i < n; i++) {
    const c = i % cols
    const r = Math.floor(i / cols)
    const rows = Math.ceil(n / cols)
    const x = cols > 1 ? -spanX / 2 + (c / (cols - 1)) * spanX : 0
    const z = rows > 1 ? -spanZ / 2 + (r / (rows - 1)) * spanZ : 0
    cells.push([x + (Math.random() - 0.5) * 0.6, z + (Math.random() - 0.5) * 0.6])
  }
  return cells
}

function shuffled<T>(arr: T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function disposeGroup(group: THREE.Object3D) {
  group.traverse((o) => {
    const mesh = o as THREE.Mesh
    if (mesh.geometry) mesh.geometry.dispose()
    const mat = mesh.material
    if (Array.isArray(mat)) mat.forEach((m) => m.dispose())
    else if (mat) (mat as THREE.Material).dispose()
  })
}
