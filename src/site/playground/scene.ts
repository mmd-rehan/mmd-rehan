import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { PALETTE, createMaterials, type Palette } from './materials'
import { box, label, mesh, type TextureBin } from './build'

export type Stage = {
  renderer: THREE.WebGLRenderer
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  controls: OrbitControls
  materials: Palette
  textures: TextureBin
  resize(): void
  render(): void
  dispose(): void
}

/** Where the camera starts, and the framing it returns to on reset. */
const HOME = new THREE.Vector3(11, 11.5, 16.3)
/** Half-extent the objects are allowed to roam across the desk top. */
export const DESK_LIMIT = { x: 5.15, z: 2.9 }

export function createScene(container: HTMLElement): Stage {
  const scene = new THREE.Scene()
  const textures: TextureBin = []

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75))
  renderer.setClearColor(PALETTE.paper, 0)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.16
  renderer.outputColorSpace = THREE.SRGBColorSpace
  container.appendChild(renderer.domElement)

  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 150)
  camera.position.copy(HOME)

  const controls = new OrbitControls(camera, renderer.domElement)
  controls.target.set(0, 0.4, 0)
  controls.enableDamping = true
  controls.dampingFactor = 0.08
  controls.enablePan = false
  controls.minDistance = 15
  controls.maxDistance = 37
  controls.minPolarAngle = 0.32
  controls.maxPolarAngle = Math.PI / 2.35
  controls.autoRotateSpeed = 0.55
  controls.rotateSpeed = 0.55
  controls.zoomSpeed = 0.65
  controls.update()
  controls.saveState()

  // A soft studio bounce, so the plastics read as plastic and the chrome
  // actually has something to reflect.
  const room = new RoomEnvironment()
  const pmrem = new THREE.PMREMGenerator(renderer)
  const environment = pmrem.fromScene(room, 0.04)
  scene.environment = environment.texture
  scene.environmentIntensity = 0.75
  room.dispose()
  pmrem.dispose()

  scene.add(new THREE.HemisphereLight(PALETTE.skyLight, PALETTE.groundLight, 2.2))

  const key = new THREE.DirectionalLight(0xffffff, 4.2)
  key.position.set(-5, 15, 8)
  key.castShadow = true
  key.shadow.mapSize.set(2048, 2048)
  key.shadow.camera.left = -11
  key.shadow.camera.right = 11
  key.shadow.camera.top = 11
  key.shadow.camera.bottom = -11
  key.shadow.camera.near = 1
  key.shadow.camera.far = 45
  key.shadow.normalBias = 0.04
  key.shadow.bias = -0.00015
  key.shadow.radius = 4
  scene.add(key)

  const fill = new THREE.DirectionalLight(PALETTE.fillLight, 2.1)
  fill.position.set(7, 8, -9)
  scene.add(fill)

  const materials = createMaterials()
  const maxAnisotropy = renderer.capabilities.getMaxAnisotropy()

  // --- The desk -----------------------------------------------------------
  // Three stacked slabs: the working surface, a pale reveal, and the base.
  const desk = new THREE.Group()
  scene.add(desk)
  box(desk, [13.4, 0.46, 8.6], [0, -0.26, 0], materials.white, 0.28)
  box(desk, [12.95, 0.1, 8.14], [0, -0.51, 0], materials.pale, 0.16)
  box(desk, [11.8, 0.2, 7], [0, -0.65, 0], materials.white, 0.16)

  // The floor only exists to catch the desk's shadow.
  const floor = mesh(
    new THREE.PlaneGeometry(100, 100),
    new THREE.ShadowMaterial({ color: PALETTE.floorShadow, opacity: 0.18 }),
    scene,
    [0, -0.83, 0],
  )
  floor.rotation.x = -Math.PI / 2
  floor.castShadow = false

  // Squashed on Z so the cells read as a drafting grid, not graph paper.
  const grid = new THREE.GridHelper(12, 24, PALETTE.gridMajor, PALETTE.gridMinor)
  grid.position.set(0, -0.018, 0)
  grid.scale.z = 0.64
  const gridMaterial = grid.material as THREE.Material
  gridMaterial.transparent = true
  gridMaterial.opacity = 0.55
  desk.add(grid)

  label(textures, maxAnisotropy, desk, 'mr.', 1.3, 0.35, [-4.9, -0.013, 3.65],
    '#193ee8', '#fbfcfa', 'bold 85px Arial').rotation.x = -Math.PI / 2
  label(textures, maxAnisotropy, desk, 'MADE TO BE EXPLORED', 2.75, 0.29, [3.65, -0.011, 3.65],
    '#7b8690', '#fbfcfa', '500 32px Arial').rotation.x = -Math.PI / 2

  // A chamfered keyline traced onto the surface.
  const outline = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(
      ([
        [-4, 0.012, -2.6],
        [3.7, 0.012, -2.6],
        [4.55, 0.012, -1.75],
        [4.55, 0.012, 2.75],
        [-4, 0.012, 2.75],
      ] as [number, number, number][]).map((p) => new THREE.Vector3(...p)),
    ),
    new THREE.LineBasicMaterial({
      color: PALETTE.deskOutline,
      transparent: true,
      opacity: 0.6,
    }),
  )
  desk.add(outline)

  const resize = () => {
    const w = container.clientWidth
    const h = container.clientHeight
    if (!w || !h) return
    renderer.setSize(w, h)
    camera.aspect = w / h
    // Portrait-ish stages need a wider lens or the desk runs off the edges.
    camera.fov = w / h < 1.13 ? 44 : 34
    camera.updateProjectionMatrix()
  }
  resize()

  const render = () => renderer.render(scene, camera)

  const dispose = () => {
    controls.dispose()
    const geometries = new Set<THREE.BufferGeometry>()
    const mats = new Set<THREE.Material>()
    scene.traverse((o) => {
      const m = o as THREE.Mesh
      if (m.geometry) geometries.add(m.geometry)
      if (m.material) {
        for (const one of Array.isArray(m.material) ? m.material : [m.material]) mats.add(one)
      }
    })
    geometries.forEach((g) => g.dispose())
    mats.forEach((m) => m.dispose())
    textures.forEach((t) => t.dispose())
    environment.dispose()
    renderer.dispose()
    renderer.domElement.remove()
  }

  return { renderer, scene, camera, controls, materials, textures, resize, render, dispose }
}
