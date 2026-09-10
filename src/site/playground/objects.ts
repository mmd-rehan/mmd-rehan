import * as THREE from 'three'
import type { PlaygroundId } from '../data'

const ACCENT = 0x4b3fe4
const ACCENT_DEEP = 0x3a2fc4
const WHITE = 0xf4f2ec
const CHARCOAL = 0x1b1b23
const SCREEN = 0x14141c

const std = (color: number, extra: THREE.MeshStandardMaterialParameters = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.05, ...extra })

/** Mark every mesh in a group so it casts + receives shadow. */
function shade(group: THREE.Group): THREE.Group {
  group.traverse((o) => {
    const m = o as THREE.Mesh
    if (m.isMesh) {
      m.castShadow = true
      m.receiveShadow = true
    }
  })
  return group
}

function apiRing(): THREE.Group {
  const g = new THREE.Group()
  const torus = new THREE.Mesh(
    new THREE.TorusGeometry(0.8, 0.07, 12, 64),
    std(ACCENT, { emissive: ACCENT, emissiveIntensity: 0.15 }),
  )
  torus.rotation.x = Math.PI / 2
  torus.position.y = 0.95
  g.add(torus)

  // Orbiting nodes around the ring.
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2
    const node = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 10, 10),
      std(ACCENT_DEEP),
    )
    node.position.set(Math.cos(a) * 0.8, 0.95, Math.sin(a) * 0.8)
    g.add(node)
  }

  const pedestal = new THREE.Mesh(
    new THREE.CylinderGeometry(0.34, 0.4, 0.5, 24),
    std(WHITE),
  )
  pedestal.position.y = 0.25
  g.add(pedestal)
  return shade(g)
}

function retroTv(): THREE.Group {
  const g = new THREE.Group()
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1, 1), std(ACCENT))
  body.position.y = 0.7
  g.add(body)

  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.92, 0.66),
    new THREE.MeshStandardMaterial({ color: SCREEN, roughness: 0.35, emissive: SCREEN, emissiveIntensity: 0.4 }),
  )
  screen.position.set(0, 0.72, 0.505)
  screen.name = 'screen'
  g.add(screen)

  for (const dx of [-0.3, 0.3]) {
    const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.7, 6), std(CHARCOAL))
    ant.position.set(dx, 1.5, -0.3)
    ant.rotation.z = dx > 0 ? -0.5 : 0.5
    g.add(ant)
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), std(CHARCOAL))
    tip.position.set(dx * 1.9, 1.8, -0.3)
    g.add(tip)
  }
  for (const dx of [-0.5, 0.5]) {
    const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.16, 8), std(CHARCOAL))
    foot.position.set(dx, 0.12, 0.3)
    g.add(foot)
  }
  const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.06, 12), std(WHITE))
  knob.rotation.x = Math.PI / 2
  knob.position.set(0.52, 0.72, 0.5)
  g.add(knob)
  return shade(g)
}

function firstAidKit(): THREE.Group {
  const g = new THREE.Group()
  const box = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 0.85), std(WHITE))
  box.position.y = 0.5
  g.add(box)
  const lid = new THREE.Mesh(new THREE.BoxGeometry(1.24, 0.16, 0.89), std(0xe9e6dd))
  lid.position.y = 0.92
  lid.name = 'lid'
  g.add(lid)
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.04, 8, 20, Math.PI), std(CHARCOAL))
  handle.position.set(0, 1.0, 0)
  handle.rotation.x = Math.PI
  g.add(handle)
  const barV = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.44, 0.02), std(ACCENT))
  barV.position.set(0, 0.5, 0.44)
  const barH = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.16, 0.02), std(ACCENT))
  barH.position.set(0, 0.5, 0.44)
  g.add(barV, barH)
  return shade(g)
}

function plane(): THREE.Group {
  const g = new THREE.Group()
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 1.3, 6, 12), std(WHITE))
  body.rotation.z = Math.PI / 2
  body.position.y = 0.9
  g.add(body)
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.4, 12), std(ACCENT))
  nose.rotation.z = -Math.PI / 2
  nose.position.set(0.95, 0.9, 0)
  g.add(nose)
  const wing = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 1.9), std(ACCENT))
  wing.position.y = 0.9
  g.add(wing)
  const tailWing = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.04, 0.8), std(ACCENT))
  tailWing.position.set(-0.8, 0.9, 0)
  g.add(tailWing)
  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.4, 0.04), std(ACCENT))
  fin.position.set(-0.8, 1.1, 0)
  g.add(fin)
  const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.7, 6), std(CHARCOAL))
  strut.position.set(0, 0.5, 0)
  g.add(strut)
  return shade(g)
}

function container(): THREE.Group {
  const g = new THREE.Group()
  const make = (y: number, color: number) => {
    const c = new THREE.Group()
    const shell = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.7, 0.75), std(color))
    c.add(shell)
    for (let i = -3; i <= 3; i++) {
      const rib = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.72, 0.77), std(color, { roughness: 0.75 }))
      rib.position.x = i * 0.2
      c.add(rib)
    }
    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.72, 0.77), std(WHITE))
    cap.position.x = 0.82
    c.add(cap)
    c.position.y = y
    return c
  }
  g.add(make(0.36, ACCENT))
  g.add(make(1.08, ACCENT_DEEP))
  return shade(g)
}

function serverRack(): THREE.Group {
  const g = new THREE.Group()
  const cab = new THREE.Mesh(new THREE.BoxGeometry(1, 1.7, 0.9), std(CHARCOAL, { roughness: 0.5 }))
  cab.position.y = 0.95
  g.add(cab)
  for (let i = 0; i < 5; i++) {
    const unit = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.22, 0.05), std(0x2c2c38))
    unit.position.set(0, 0.4 + i * 0.3, 0.46)
    g.add(unit)
    const led = new THREE.Mesh(
      new THREE.SphereGeometry(0.03, 8, 8),
      new THREE.MeshStandardMaterial({ color: ACCENT, emissive: ACCENT, emissiveIntensity: 1.2 }),
    )
    led.position.set(0.34, 0.4 + i * 0.3, 0.49)
    led.name = `led-${i}`
    g.add(led)
  }
  return shade(g)
}

const BUILDERS: Record<PlaygroundId, () => THREE.Group> = {
  apis: apiRing,
  streaming: retroTv,
  healthcare: firstAidKit,
  aviation: plane,
  logistics: container,
  cloud: serverRack,
}

export function buildObject(id: PlaygroundId): THREE.Group {
  const g = BUILDERS[id]()
  g.userData.id = id
  return g
}

export function buildScenery(): THREE.Group {
  const g = new THREE.Group()
  g.userData.scenery = true

  const cube = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), std(ACCENT))
  cube.position.set(0.3, 0.25, -1.9)
  cube.castShadow = true
  cube.receiveShadow = true
  g.add(cube)

  // Low stack of flat crates in a back corner.
  for (let i = 0; i < 3; i++) {
    const crate = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.35, 0.9), std(0xe4e1d8))
    crate.position.set(-3.6 + i * 0.12, 0.17 + i * 0.36, -2.2 + i * 0.1)
    crate.castShadow = true
    crate.receiveShadow = true
    g.add(crate)
  }

  // A little articulated arm.
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.2, 16), std(CHARCOAL))
  base.position.set(3.4, 0.1, -1.6)
  const seg1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.7, 0.1), std(ACCENT))
  seg1.position.set(3.4, 0.5, -1.6)
  seg1.rotation.z = 0.4
  const seg2 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.55, 0.1), std(ACCENT_DEEP))
  seg2.position.set(3.15, 0.9, -1.6)
  seg2.rotation.z = -0.7
  ;[base, seg1, seg2].forEach((m) => {
    m.castShadow = true
    m.receiveShadow = true
    g.add(m)
  })

  return g
}
