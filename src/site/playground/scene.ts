import * as THREE from 'three'

export type Stage = {
  renderer: THREE.WebGLRenderer
  scene: THREE.Scene
  camera: THREE.OrthographicCamera
  /** Ground plane at y = 0 — raycast target for placing dragged objects. */
  ground: THREE.Mesh
  /** Point the camera orbits and looks at. */
  target: THREE.Vector3
  /** Default framing, so controls can ease back to it. */
  readonly homeAzimuth: number
  readonly homePolar: number
  readonly homeZoom: number
  /** Reposition the camera on its orbit sphere. */
  setOrbit(azimuth: number, polar: number): void
  resize(): void
  render(): void
  dispose(): void
}

const BG = 0xf6f5f1
const SURFACE = 0xffffff
const ACCENT = 0x4b3fe4

/** Distance of the camera from the target — only the direction matters for an
 *  orthographic camera; zoom controls the actual scale. */
const RADIUS = 18
const HOME_AZIMUTH = Math.PI / 4
const HOME_POLAR = Math.PI / 4 // 45° above the horizon → isometric-ish
const FRUSTUM = 7.4 // world units visible vertically at zoom 1

export function createScene(container: HTMLElement): Stage {
  const renderer = new THREE.WebGLRenderer({
    antialias: window.devicePixelRatio < 2,
    powerPreference: 'high-performance',
    alpha: true,
  })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.toneMapping = THREE.NoToneMapping
  container.appendChild(renderer.domElement)

  const scene = new THREE.Scene()

  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100)
  const target = new THREE.Vector3(0, 0.6, 0)

  const setOrbit = (azimuth: number, polar: number) => {
    const sinP = Math.sin(polar)
    camera.position.set(
      target.x + RADIUS * sinP * Math.sin(azimuth),
      target.y + RADIUS * Math.cos(polar),
      target.z + RADIUS * sinP * Math.cos(azimuth),
    )
    camera.lookAt(target)
  }
  setOrbit(HOME_AZIMUTH, HOME_POLAR)

  // Lighting — soft fill + one shadow-casting key.
  const hemi = new THREE.HemisphereLight(0xffffff, 0xd8d6cf, 1.05)
  scene.add(hemi)

  const key = new THREE.DirectionalLight(0xffffff, 1.5)
  key.position.set(6, 10, 4)
  key.castShadow = true
  key.shadow.mapSize.set(1024, 1024)
  key.shadow.camera.near = 1
  key.shadow.camera.far = 40
  key.shadow.camera.left = -12
  key.shadow.camera.right = 12
  key.shadow.camera.top = 12
  key.shadow.camera.bottom = -12
  key.shadow.bias = -0.0004
  scene.add(key)

  // The platform the objects sit on.
  const platformGeo = new THREE.BoxGeometry(11, 0.5, 8)
  const platformMat = new THREE.MeshStandardMaterial({
    color: SURFACE,
    roughness: 0.9,
    metalness: 0,
  })
  const platform = new THREE.Mesh(platformGeo, platformMat)
  platform.position.y = -0.25
  platform.receiveShadow = true
  platform.castShadow = true
  scene.add(platform)

  // Grid inlaid on the platform top.
  const grid = new THREE.GridHelper(10.4, 26, 0xcbccd6, 0xe4e4ea)
  grid.position.y = 0.011
  ;(grid.material as THREE.Material).transparent = true
  ;(grid.material as THREE.Material).opacity = 0.5
  scene.add(grid)

  // Contact-shadow catcher just above the platform so object shadows read.
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(11, 8),
    new THREE.ShadowMaterial({ opacity: 0.16 }),
  )
  ground.rotation.x = -Math.PI / 2
  ground.position.y = 0.012
  ground.receiveShadow = true
  scene.add(ground)

  // A faint accent edge line around the deck.
  const rim = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(11.02, 0.52, 8.02)),
    new THREE.LineBasicMaterial({ color: ACCENT, transparent: true, opacity: 0.25 }),
  )
  rim.position.y = -0.25
  scene.add(rim)

  scene.background = null
  void BG

  const resize = () => {
    const w = Math.max(1, container.clientWidth)
    const h = Math.max(1, container.clientHeight)
    renderer.setSize(w, h, false)
    const aspect = w / h
    camera.top = FRUSTUM
    camera.bottom = -FRUSTUM
    camera.left = -FRUSTUM * aspect
    camera.right = FRUSTUM * aspect
    camera.updateProjectionMatrix()
  }
  resize()

  const render = () => renderer.render(scene, camera)

  const dispose = () => {
    renderer.dispose()
    renderer.forceContextLoss()
    platformGeo.dispose()
    platformMat.dispose()
    grid.geometry.dispose()
    ;(grid.material as THREE.Material).dispose()
    ground.geometry.dispose()
    ;(ground.material as THREE.Material).dispose()
    rim.geometry.dispose()
    ;(rim.material as THREE.Material).dispose()
    renderer.domElement.remove()
  }

  return {
    renderer,
    scene,
    camera,
    ground,
    target,
    homeAzimuth: HOME_AZIMUTH,
    homePolar: HOME_POLAR,
    homeZoom: 1,
    setOrbit,
    resize,
    render,
    dispose,
  }
}
