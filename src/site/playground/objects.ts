import * as THREE from 'three'
import type { PlaygroundId } from '../data'
import { PALETTE, type Palette } from './materials'
import { box, cylinder, extrude, label, mesh, paint, sphere, tube, type TextureBin } from './build'

/**
 * A desk object: a root that gets dragged and thrown around, and a model that
 * the per-object effect is free to animate independently of it.
 */
export type DeskObject = {
  id: PlaygroundId
  root: THREE.Group
  model: THREE.Group
  home: THREE.Vector3
  /** Footprint used for the separation pass, so objects nudge each other apart. */
  radius: number
  yaw: number
  velocity: THREE.Vector3
  spin: number
  /** Seconds into the play effect, or -1 when at rest. */
  effect: number
  ring: THREE.Mesh
  /** Drives idle motion and the play effect. `progress` is -1 when idle. */
  update?: (time: number, progress: number) => void
  /** Called when the object is clicked, before the effect starts. */
  trigger?: () => void
  /** Returns the object to its resting pose. */
  rest?: () => void
}

/** How long each object's play effect runs, in seconds. */
export const EFFECT_SECONDS: Record<PlaygroundId, number> = {
  apis: 2.2,
  streaming: 0.45,
  healthcare: 2.8,
  aviation: 4.8,
  logistics: 2.8,
  cloud: 2.4,
}

type Ctx = {
  scene: THREE.Scene
  materials: Palette
  textures: TextureBin
  maxAnisotropy: number
}

function create(
  ctx: Ctx,
  id: PlaygroundId,
  at: [number, number, number],
  radius: number,
  yaw = 0,
): DeskObject {
  const root = new THREE.Group()
  root.userData.id = id
  root.position.set(...at)
  root.rotation.y = yaw
  const model = new THREE.Group()
  root.add(model)
  ctx.scene.add(root)

  // The selection halo lives in world space so it stays flat on the desk while
  // the object above it tumbles.
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(radius + 0.08, radius + 0.11, 64),
    new THREE.MeshBasicMaterial({
      color: PALETTE.blue,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  )
  ring.rotation.x = -Math.PI / 2
  ring.position.y = 0.018
  ctx.scene.add(ring)

  return {
    id,
    root,
    model,
    home: root.position.clone(),
    radius,
    yaw,
    velocity: new THREE.Vector3(),
    spin: 0,
    effect: -1,
    ring,
  }
}

// --- Streaming: the retro TV ---------------------------------------------

function buildTv(ctx: Ctx): DeskObject {
  const g = ctx.materials
  const o = create(ctx, 'streaming', [-3.55, 0, -1.65], 1.23, 0.1)

  box(o.model, [2.45, 1.85, 1.05], [0, 1.22, 0], g.blue, 0.2)
  box(o.model, [2.1, 1.44, 0.1], [-0.08, 1.28, 0.54], g.ink, 0.14)

  const channel = paint(ctx.textures, 640, 400, ctx.maxAnisotropy, () => {})
  const screen = mesh(
    new THREE.PlaneGeometry(1.8, 1.13),
    new THREE.MeshBasicMaterial({ map: channel.texture, toneMapped: false }),
    o.model,
    [-0.15, 1.3, 0.601],
  )
  screen.castShadow = false

  box(o.model, [0.26, 0.13, 0.1], [0.83, 0.6, 0.55], g.white, 0.04)
  for (let i = 0; i < 4; i++) {
    box(o.model, [0.02, 0.2, 0.04], [0.99 + i * 0.035, 1, 0.55], g.ink, 0.002)
  }
  for (const dx of [-0.8, 0.8]) {
    const foot = box(o.model, [0.18, 0.4, 0.35], [dx, 0.23, 0.02], g.ink, 0.04)
    foot.rotation.z = dx < 0 ? -0.23 : 0.23
  }
  tube(o.model, [[-0.45, 2.13, -0.12], [-0.7, 2.58, -0.15], [-0.82, 2.72, -0.16]], 0.025, g.chrome)
  tube(o.model, [[0.2, 2.13, -0.12], [0.5, 2.58, -0.15]], 0.025, g.chrome)
  sphere(o.model, 0.055, [-0.82, 2.72, -0.16], g.blue)
  sphere(o.model, 0.05, [0.5, 2.58, -0.15], g.blue)

  let current = 0
  let lastFrame = -1

  const drawChannel = (time: number) => {
    const c = channel.ctx
    c.fillStyle = '#142545'
    c.fillRect(0, 0, 640, 400)

    if (current === 0) {
      c.fillStyle = '#244aed'
      c.fillRect(0, 0, 640, 400)
      c.strokeStyle = '#6f8fff'
      c.lineWidth = 1
      for (let i = 0; i < 8; i++) {
        c.beginPath()
        c.ellipse(320, 195, 90 + i * 27, 50 + i * 18, time * 0.12, 0, Math.PI * 2)
        c.stroke()
      }
      c.fillStyle = 'white'
      c.font = 'bold 100px Arial'
      c.textAlign = 'center'
      c.fillText('NoBoxTV', 320, 223)
      c.font = '18px monospace'
      c.fillText('A WORLD OF STREAMS', 320, 265)
    } else if (current === 1) {
      c.fillStyle = '#0d182d'
      c.fillRect(0, 0, 640, 400)
      for (let i = 0; i < 45; i++) {
        c.fillStyle = `rgba(210,226,255,${0.35 + 0.5 * Math.abs(Math.sin(i + time))})`
        c.fillRect((i * 157) % 640, (i * 91) % 400, 2.4, 2.4)
      }
      c.strokeStyle = '#7a99ff'
      c.lineWidth = 2
      c.beginPath()
      c.ellipse(320, 195, 150, 37, -0.35, 0, Math.PI * 2)
      c.stroke()
      const glow = c.createRadialGradient(298, 164, 4, 320, 194, 79)
      glow.addColorStop(0, '#c1d7ff')
      glow.addColorStop(1, '#294cca')
      c.fillStyle = glow
      c.beginPath()
      c.arc(320, 195, 72, 0, Math.PI * 2)
      c.fill()
      c.fillStyle = '#dbe5ff'
      c.textAlign = 'center'
      c.font = '17px monospace'
      c.fillText('AFTER HOURS / NIGHT SKY', 320, 342)
    } else {
      const bars = ['#f8f9f5', '#edcd56', '#89d6de', '#a0c883', '#ac9cdf', '#eb9279', '#385fea']
      bars.forEach((colour, i) => {
        c.fillStyle = colour
        c.fillRect((i * 640) / 7, 0, 640 / 7, 275)
      })
      c.fillStyle = '#19252d'
      c.fillRect(0, 275, 640, 125)
      c.fillStyle = '#f8f9f5'
      c.textAlign = 'center'
      c.font = 'bold 36px monospace'
      c.fillText('STAY CURIOUS', 320, 341)
    }

    c.fillStyle = 'rgba(255,255,255,.75)'
    c.textAlign = 'left'
    c.font = '16px monospace'
    c.fillText(`CH 0${current + 1} / DEMO`, 23, 29)
    // Scanlines, so the picture reads as a CRT rather than a poster.
    c.fillStyle = 'rgba(0,0,0,.06)'
    for (let y = 0; y < 400; y += 4) c.fillRect(0, y, 640, 1)
    channel.texture.needsUpdate = true
  }

  drawChannel(0)
  // The picture only needs to move at 12fps to feel alive.
  o.update = (time) => {
    const frame = Math.floor(time * 12)
    if (frame !== lastFrame) {
      lastFrame = frame
      drawChannel(time)
    }
  }
  o.trigger = () => {
    current = (current + 1) % 3
    lastFrame = -1
  }
  o.rest = () => {
    current = 0
    lastFrame = -1
    drawChannel(0)
  }
  return o
}

// --- APIs: the gateway ring ----------------------------------------------

function buildApi(ctx: Ctx): DeskObject {
  const g = ctx.materials
  const o = create(ctx, 'apis', [-0.15, 0, -1.85], 1.18, -0.2)

  cylinder(o.model, 1.05, 0.15, [0, 0.1, 0], g.pale)

  const hub = new THREE.Group()
  hub.position.y = 1.35
  o.model.add(hub)
  mesh(new THREE.TorusGeometry(0.97, 0.155, 20, 72), g.blue, hub)

  const cage = mesh(
    new THREE.TorusGeometry(0.97, 0.31, 12, 48),
    new THREE.MeshBasicMaterial({
      color: PALETTE.blue,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    }),
    hub,
  )
  cage.rotation.y = 0.18

  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2
    sphere(hub, 0.043, [Math.cos(a) * 0.97, Math.sin(a) * 0.97, 0.17], g.white)
  }
  for (const dx of [-0.57, 0.57]) box(o.model, [0.12, 0.4, 0.25], [dx, 0.27, 0], g.chrome, 0.03)

  const packet = sphere(o.model, 0.16, [0, 1.35, 0], g.coral)
  packet.visible = false

  const route = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-1.4, 0.5, 0.7),
    new THREE.Vector3(-0.75, 1.1, 0.8),
    new THREE.Vector3(0, 1.35, 0),
    new THREE.Vector3(0.65, 1.3, -0.7),
    new THREE.Vector3(1.45, 0.55, -0.65),
  ])
  mesh(new THREE.TubeGeometry(route, 50, 0.018, 6, false), g.chrome, o.model)
  box(o.model, [0.42, 0.37, 0.45], [-1.35, 0.37, 0.7], g.blue, 0.05)
  box(o.model, [0.42, 0.37, 0.45], [1.35, 0.37, -0.65], g.white, 0.05)
  label(ctx.textures, ctx.maxAnisotropy, o.model, 'FixCors', 0.85, 0.21, [0, 0.1, 1.05],
    '#193ee8', '#dbe6ff', 'bold 60px Arial')

  o.update = (time, progress) => {
    cage.rotation.z = time * 0.1
    packet.visible = progress >= 0 && progress < 1
    if (packet.visible) packet.position.copy(route.getPoint(Math.min(1, progress)))
    hub.scale.setScalar(progress >= 0 ? 1 + 0.06 * Math.sin(progress * Math.PI) : 1)
  }
  o.trigger = () => {
    packet.visible = true
    packet.position.set(0, 1.35, 0)
  }
  o.rest = () => {
    packet.visible = false
  }
  return o
}

// --- Healthcare: the medical case ----------------------------------------

function buildHealth(ctx: Ctx): DeskObject {
  const g = ctx.materials
  const o = create(ctx, 'healthcare', [3.55, 0, 1.65], 1.13, -0.12)

  box(o.model, [1.95, 1.55, 0.87], [0, 0.97, 0], g.white, 0.17)
  box(o.model, [1.95, 0.06, 0.89], [0, 1.18, 0], g.pale, 0.025)
  box(o.model, [0.18, 0.45, 0.24], [-0.38, 1.84, 0], g.blue, 0.055)
  box(o.model, [0.18, 0.45, 0.24], [0.38, 1.84, 0], g.blue, 0.055)
  box(o.model, [0.84, 0.16, 0.24], [0, 2.02, 0], g.blue, 0.06)
  box(o.model, [0.73, 0.23, 0.09], [0, 1, 0.473], g.blue, 0.025)
  box(o.model, [0.23, 0.73, 0.095], [0, 1, 0.475], g.blue, 0.025)
  for (const dx of [-0.61, 0.61]) box(o.model, [0.18, 0.24, 0.05], [dx, 1.25, 0.46], g.chrome, 0.025)

  // The record card that lifts out of the case when the effect plays.
  const card = new THREE.Group()
  card.position.set(0, 1.1, -0.08)
  o.model.add(card)
  box(card, [1.25, 1.47, 0.09], [0, 0, 0], g.pale, 0.055)
  box(card, [0.27, 0.27, 0.012], [-0.32, 0.36, 0.055], g.blue, 0.025)
  for (let i = 0; i < 4; i++) {
    box(card, [0.78 - (i % 2) * 0.15, 0.035, 0.014], [0, 0.09 - i * 0.16, 0.055], g.blue, 0.005)
  }

  const beam = box(
    o.model,
    [2.06, 0.025, 0.98],
    [0, 0.3, 0],
    new THREE.MeshBasicMaterial({ color: 0x4588ff, transparent: true, opacity: 0.52 }),
    0.01,
  )
  beam.visible = false

  o.update = (_time, progress) => {
    const playing = progress >= 0 && progress < 1
    const lift = playing ? Math.sin(progress * Math.PI) : 0
    card.position.y = 1.1 + lift * 1.15
    beam.visible = playing
    beam.position.y = 0.3 + (progress >= 0 ? progress : 0) * 1.7
  }
  o.trigger = () => {
    card.position.y = 2.1
  }
  o.rest = () => {
    card.position.y = 1.1
    beam.visible = false
  }
  return o
}

// --- Aviation: the aircraft ----------------------------------------------

function buildAviation(ctx: Ctx): DeskObject {
  const g = ctx.materials
  const o = create(ctx, 'aviation', [0.05, 0, 1.82], 1.27, -0.35)

  cylinder(o.model, 0.55, 0.1, [0, 0.07, 0], g.pale)
  cylinder(o.model, 0.055, 0.68, [0, 0.42, 0], g.chrome)

  // The aircraft sits on its own node so it can fly a lap and come home.
  const plane = new THREE.Group()
  plane.position.y = 0.92
  o.model.add(plane)

  const fuselage = mesh(new THREE.CapsuleGeometry(0.23, 2.1, 10, 20), g.white, plane)
  fuselage.rotation.z = -Math.PI / 2
  const nose = sphere(plane, 0.225, [1.05, 0, 0], g.blue)
  nose.scale.x = 1.1

  extrude(plane, [[0.45, 0], [-0.53, 1.5], [-0.99, 1.5], [-0.42, 0], [-0.99, -1.5], [-0.53, -1.5]],
    g.blue, true).position.y = -0.02
  extrude(plane, [[-0.85, 0], [-1.23, 0.57], [-1.43, 0.57], [-1.25, 0], [-1.43, -0.57], [-1.23, -0.57]],
    g.blue, true).position.y = 0.06
  extrude(plane, [[-0.7, 0.1], [-1.22, 0.78], [-1.48, 0.78], [-1.25, 0.1]], g.blue, false)

  for (const dz of [-0.74, 0.74]) {
    const pod = mesh(new THREE.CapsuleGeometry(0.115, 0.33, 6, 12), g.white, plane, [-0.25, -0.19, dz])
    pod.rotation.z = -Math.PI / 2
    const intake = cylinder(plane, 0.077, 0.013, [-0.02, -0.19, dz], g.ink)
    intake.rotation.z = Math.PI / 2
  }
  for (let i = 0; i < 7; i++) {
    for (const dz of [-0.216, 0.216]) {
      box(plane, [0.09, 0.085, 0.018], [0.66 - i * 0.19, 0.055, dz], g.ink, 0.025)
    }
  }

  o.update = (_time, progress) => {
    if (progress >= 0 && progress < 1) {
      const a = progress * Math.PI * 2
      plane.position.set(
        Math.sin(a) * 2,
        0.92 + Math.sin(progress * Math.PI) * 2.2,
        (Math.cos(a) - 1) * 1.1,
      )
      plane.rotation.set(Math.sin(a) * 0.1, -a, Math.sin(a) * 0.18)
    } else {
      plane.position.set(0, 0.92, 0)
      plane.rotation.set(0, 0, 0)
    }
  }
  o.trigger = () => {
    plane.rotation.y += Math.PI / 4
  }
  o.rest = () => {
    plane.position.set(0, 0.92, 0)
    plane.rotation.set(0, 0, 0)
  }
  return o
}

// --- Logistics: the container stack --------------------------------------

function buildLogistics(ctx: Ctx): DeskObject {
  const g = ctx.materials
  const o = create(ctx, 'logistics', [-3.25, 0, 1.85], 1.25, -0.08)

  const pallet = box(o.model, [2.48, 0.12, 1.95], [0, 0.1, 0], g.pale, 0.065)
  pallet.receiveShadow = true

  const container = (
    at: [number, number, number],
    material: THREE.Material,
    text: string,
  ): THREE.Group => {
    const crate = new THREE.Group()
    crate.position.set(...at)
    o.model.add(crate)
    box(crate, [2.08, 0.8, 0.91], [0, 0, 0], material, 0.04)
    for (let i = 0; i < 12; i++) {
      for (const dz of [-0.465, 0.465]) {
        box(crate, [0.055, 0.69, 0.026], [-0.91 + i * 0.165, 0, dz], material, 0.004)
      }
    }
    for (const dz of [-0.3, 0.3]) {
      box(crate, [0.04, 0.63, 0.03], [1.054, 0, dz], g.chrome, 0.004).rotation.y = Math.PI / 2
    }
    const onBlue = material === g.blue
    label(ctx.textures, ctx.maxAnisotropy, crate, text, 1.15, 0.24, [0, 0, 0.488],
      onBlue ? '#ffffff' : '#193ee8', onBlue ? '#193ee8' : '#dbe6ff', 'bold 40px Arial')
    return crate
  }

  container([0, 0.56, -0.48], g.blue, 'GLOBAL')
  container([0, 0.56, 0.48], g.pale, 'LOGISTICS')
  const top = container([0, 1.4, -0.48], g.white, 'GAC')

  o.update = (_time, progress) => {
    const lift = progress >= 0 && progress < 1 ? Math.sin(progress * Math.PI) : 0
    top.position.set(lift * 0.58, 1.4 + lift * 0.9, -0.48 + lift * 0.95)
    top.rotation.y = lift * 0.18
  }
  o.trigger = () => {
    top.position.z = top.position.z < 0 ? 0.48 : -0.48
  }
  o.rest = () => {
    top.position.set(0, 1.4, -0.48)
    top.rotation.y = 0
  }
  return o
}

// --- Cloud: the server rack ----------------------------------------------

function buildCloud(ctx: Ctx): DeskObject {
  const g = ctx.materials
  const o = create(ctx, 'cloud', [3.45, 0, -1.78], 1.06, -0.12)

  box(o.model, [1.65, 2.32, 1.28], [0, 1.22, 0], g.ink, 0.12)
  box(o.model, [1.76, 0.17, 1.38], [0, 0.13, 0], g.pale, 0.05)

  const leds: THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>[] = []
  for (let i = 0; i < 4; i++) {
    const y = 0.52 + i * 0.5
    box(o.model, [1.42, 0.43, 0.15], [0, y, 0.65], g.white, 0.045)
    box(o.model, [0.92, 0.27, 0.025], [-0.11, y, 0.742], g.ink, 0.023)
    for (let j = 0; j < 5; j++) {
      box(o.model, [0.035, 0.14, 0.025], [-0.39 + j * 0.14, y, 0.76], g.chrome, 0.008)
    }
    const led = new THREE.Mesh(
      new THREE.SphereGeometry(0.044, 12, 10),
      new THREE.MeshStandardMaterial({
        color: PALETTE.ledOff,
        emissive: PALETTE.blue,
        emissiveIntensity: 0.7,
      }),
    )
    led.position.set(0.58, y, 0.76)
    o.model.add(led)
    leds.push(led)
  }
  for (let i = 0; i < 7; i++) {
    box(o.model, [0.014, 0.03, 0.78], [0.831, 0.7 + i * 0.16, 0], g.chrome, 0.004)
  }
  label(ctx.textures, ctx.maxAnisotropy, o.model, 'SYSTEMS', 1.1, 0.2, [0, 2.46, 0],
    '#193ee8', '#dbe6ff', 'bold 42px Arial').rotation.x = -Math.PI / 2

  const pulse = mesh(
    new THREE.TorusGeometry(0.4, 0.013, 8, 40),
    new THREE.MeshBasicMaterial({ color: PALETTE.blue, transparent: true, opacity: 0.6 }),
    o.model,
    [0, 2.8, 0],
  )
  pulse.rotation.x = -Math.PI / 2
  pulse.visible = false
  const pulseMaterial = pulse.material as THREE.MeshBasicMaterial

  o.update = (time, progress) => {
    leds.forEach((led, i) => {
      led.material.emissiveIntensity =
        progress >= 0
          ? 0.5 + 3 * Math.max(0, Math.sin(progress * 14 - i * 0.8)) ** 4
          : 0.45 + 0.15 * Math.sin(time * 0.9 + i)
    })
    pulse.visible = progress >= 0 && progress < 1
    if (pulse.visible) {
      pulse.scale.setScalar(1 + progress * 2)
      pulse.position.y = 2.55 + progress * 1.1
      pulseMaterial.opacity = 0.7 * (1 - progress)
    }
  }
  o.trigger = () => {
    for (const led of leds) led.material.emissiveIntensity = 2.5
  }
  o.rest = () => {
    pulse.visible = false
  }
  return o
}

const BUILDERS: Record<PlaygroundId, (ctx: Ctx) => DeskObject> = {
  streaming: buildTv,
  apis: buildApi,
  healthcare: buildHealth,
  aviation: buildAviation,
  logistics: buildLogistics,
  cloud: buildCloud,
}

/** Build all six objects, in the order they sit on the desk. */
export function buildObjects(ctx: Ctx): DeskObject[] {
  return (Object.keys(BUILDERS) as PlaygroundId[]).map((id) => BUILDERS[id](ctx))
}
