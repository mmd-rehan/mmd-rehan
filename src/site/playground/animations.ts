import * as THREE from 'three'
import type { PlaygroundId } from '../data'

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2)

/** One tween may run per object at a time; a new call cancels the old. */
const running = new Map<THREE.Group, number>()

type Step = (k: number, group: THREE.Group) => void

function run(group: THREE.Group, duration: number, step: Step, onDone?: () => void) {
  const prev = running.get(group)
  if (prev) cancelAnimationFrame(prev)
  group.userData.animating = true
  const start = performance.now()
  const tick = () => {
    const k = Math.min(1, (performance.now() - start) / duration)
    step(k, group)
    if (k < 1) {
      running.set(group, requestAnimationFrame(tick))
    } else {
      running.delete(group)
      group.userData.animating = false
      onDone?.()
    }
  }
  running.set(group, requestAnimationFrame(tick))
}

const findByName = (group: THREE.Group, name: string) =>
  group.getObjectByName(name) as THREE.Mesh | undefined

let colorBarTexture: THREE.CanvasTexture | null = null
function colorBars(): THREE.CanvasTexture {
  if (colorBarTexture) return colorBarTexture
  const c = document.createElement('canvas')
  c.width = 128
  c.height = 96
  const ctx = c.getContext('2d')!
  const bars = ['#c9c9c9', '#d6d64a', '#4ad6d6', '#4ad64a', '#d64ad6', '#d64a4a', '#4a4ad6']
  bars.forEach((col, i) => {
    ctx.fillStyle = col
    ctx.fillRect((i * c.width) / bars.length, 0, c.width / bars.length + 1, c.height * 0.78)
  })
  ctx.fillStyle = '#111'
  ctx.fillRect(0, c.height * 0.78, c.width, c.height * 0.22)
  ctx.fillStyle = '#eee'
  ctx.font = 'bold 13px monospace'
  ctx.fillText('STAY TUNED', 10, c.height - 7)
  colorBarTexture = new THREE.CanvasTexture(c)
  return colorBarTexture
}

const ANIMATIONS: Record<PlaygroundId, (group: THREE.Group, reduced: boolean) => void> = {
  streaming(group, reduced) {
    const screen = findByName(group, 'screen')
    if (screen) {
      const mat = screen.material as THREE.MeshStandardMaterial
      mat.map = colorBars()
      mat.color.set(0xffffff)
      mat.emissive.set(0xffffff)
      mat.emissiveIntensity = reduced ? 0.9 : 0.6
      mat.needsUpdate = true
    }
    if (reduced) return
    run(group, 700, (k) => {
      const s = 1 + Math.sin(k * Math.PI) * 0.06
      group.scale.setScalar(s)
      if (screen) {
        const mat = screen.material as THREE.MeshStandardMaterial
        mat.emissiveIntensity = 0.5 + Math.abs(Math.sin(k * 30)) * 0.5 * (1 - k)
      }
    }, () => group.scale.setScalar(1))
  },

  apis(group, reduced) {
    if (reduced) return
    const startRot = group.rotation.y
    run(group, 850, (k) => {
      group.rotation.y = startRot + easeInOut(k) * Math.PI * 2
      const s = 1 + Math.sin(k * Math.PI) * 0.08
      group.scale.setScalar(s)
    }, () => {
      group.rotation.y = startRot
      group.scale.setScalar(1)
    })
  },

  cloud(group, reduced) {
    const leds = [0, 1, 2, 3, 4]
      .map((i) => findByName(group, `led-${i}`))
      .filter(Boolean) as THREE.Mesh[]
    if (reduced) {
      leds.forEach((l) => ((l.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.4))
      return
    }
    run(group, 900, (k) => {
      leds.forEach((led, i) => {
        const local = (k * 5 - i)
        const pulse = local > 0 && local < 1 ? Math.sin(local * Math.PI) : 0.15
        ;(led.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.4 + pulse * 2
      })
      group.position.y = (group.userData.baseY ?? 0) + Math.sin(k * Math.PI) * 0.05
    }, () => {
      leds.forEach((l) => ((l.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.0))
      group.position.y = group.userData.baseY ?? 0
    })
  },

  aviation(group, reduced) {
    if (reduced) return
    const baseY = group.userData.baseY ?? 0
    const baseRotX = group.rotation.x
    run(group, 1000, (k) => {
      const e = easeInOut(k)
      group.position.y = baseY + Math.sin(e * Math.PI) * 1.4
      group.rotation.x = baseRotX + Math.sin(e * Math.PI * 2) * 0.5
      group.rotation.y += 0.04
    }, () => {
      group.position.y = baseY
      group.rotation.x = baseRotX
    })
  },

  healthcare(group, reduced) {
    const lid = findByName(group, 'lid')
    if (!lid) return
    const closed = lid.rotation.x
    if (reduced) return
    run(group, 900, (k) => {
      const open = Math.sin(k * Math.PI)
      lid.rotation.x = closed - open * 0.9
      lid.position.z = open * 0.1
    }, () => {
      lid.rotation.x = closed
      lid.position.z = 0
    })
  },

  logistics(group, reduced) {
    // The second child group is the top container (see objects.ts).
    const top = group.children[1] as THREE.Object3D | undefined
    if (!top) return
    const baseY = top.position.y
    const baseX = top.position.x
    if (reduced) return
    run(group, 950, (k) => {
      const lift = Math.sin(Math.min(k, 0.5) * Math.PI)
      const slide = k > 0.5 ? Math.sin((k - 0.5) * Math.PI) : 0
      top.position.y = baseY + lift * 0.8
      top.position.x = baseX + slide * 0.5
      top.rotation.y = slide * 0.3
    }, () => {
      top.position.set(baseX, baseY, top.position.z)
      top.rotation.y = 0
    })
  },
}

export function playAnimation(
  id: PlaygroundId,
  group: THREE.Group,
  opts: { reducedMotion: boolean },
): void {
  ANIMATIONS[id]?.(group, opts.reducedMotion)
}

export function disposeAnimationCache() {
  colorBarTexture?.dispose()
  colorBarTexture = null
  for (const raf of running.values()) cancelAnimationFrame(raf)
  running.clear()
}
