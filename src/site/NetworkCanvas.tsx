import { useEffect, useRef } from 'react'

/** Torus wireframe drawn in the hero. Rings run the long way around, the
 *  sparser cross-lines run through the tube, and a scattering of the points
 *  is dotted in — brighter on the near side than the far one. */
const RINGS = 30
const SEGMENTS = 58
const TUBE = 0.36
const RADIUS = 1.08

type Point = readonly [number, number, number]

function buildPoints(): Point[] {
  const points: Point[] = []
  for (let j = 0; j < RINGS; j++) {
    for (let i = 0; i < SEGMENTS; i++) {
      const u = (i / SEGMENTS) * Math.PI * 2
      const v = (j / RINGS) * Math.PI * 2
      const r = RADIUS + TUBE * Math.cos(v)
      points.push([r * Math.cos(u), r * Math.sin(u), TUBE * Math.sin(v)])
    }
  }
  return points
}

export function NetworkCanvas() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const points = buildPoints()
    const motion = matchMedia('(prefers-reduced-motion: reduce)')
    let width = 0
    let height = 0
    let angle = 0
    let frame = 0
    let visible = true

    /** Spin around Y, tip forward, then roll the whole thing on screen. */
    function project() {
      const scale = Math.min(width * 0.3, height * 0.32)
      const a = angle + 0.58
      const tilt = 0.95
      const spin = -0.43
      return points.map(([x, y, z]) => {
        const xx = x * Math.cos(a) + z * Math.sin(a)
        const zz = -x * Math.sin(a) + z * Math.cos(a)
        const yy = y * Math.cos(tilt) - zz * Math.sin(tilt)
        const depth = y * Math.sin(tilt) + zz * Math.cos(tilt)
        return [
          width * 0.51 + (xx * Math.cos(spin) - yy * Math.sin(spin)) * scale,
          height * 0.45 + (xx * Math.sin(spin) + yy * Math.cos(spin)) * scale,
          depth,
        ] as const
      })
    }

    function draw() {
      if (!ctx) return
      ctx.clearRect(0, 0, width, height)
      const flat = project()

      ctx.lineWidth = 0.7
      ctx.strokeStyle = 'rgba(25,62,232,.30)'
      for (let j = 0; j < RINGS; j++) {
        ctx.beginPath()
        for (let i = 0; i <= SEGMENTS; i++) {
          const p = flat[j * SEGMENTS + (i % SEGMENTS)]
          if (i === 0) ctx.moveTo(p[0], p[1])
          else ctx.lineTo(p[0], p[1])
        }
        ctx.stroke()
      }

      ctx.lineWidth = 0.6
      ctx.strokeStyle = 'rgba(25,62,232,.17)'
      for (let i = 0; i < SEGMENTS; i += 2) {
        ctx.beginPath()
        for (let j = 0; j <= RINGS; j++) {
          const p = flat[(j % RINGS) * SEGMENTS + i]
          if (j === 0) ctx.moveTo(p[0], p[1])
          else ctx.lineTo(p[0], p[1])
        }
        ctx.stroke()
      }

      for (let n = 0; n < flat.length; n += 19) {
        const p = flat[n]
        const near = p[2] > 0
        ctx.beginPath()
        ctx.arc(p[0], p[1], near ? 1.65 : 0.9, 0, Math.PI * 2)
        ctx.fillStyle = near ? '#193ee8' : '#9aaefa'
        ctx.fill()
      }
    }

    function size() {
      if (!canvas || !ctx) return
      const box = canvas.getBoundingClientRect()
      width = box.width
      height = box.height
      const dpr = Math.min(devicePixelRatio || 1, 2)
      canvas.width = width * dpr
      canvas.height = height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      draw()
    }

    function loop() {
      if (visible && !document.hidden) {
        angle += 0.002
        draw()
      }
      frame = requestAnimationFrame(loop)
    }

    function sync() {
      cancelAnimationFrame(frame)
      if (motion.matches) draw()
      else loop()
    }

    const resize = new ResizeObserver(size)
    resize.observe(canvas)
    const seen = new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting
    })
    seen.observe(canvas)
    motion.addEventListener('change', sync)

    size()
    sync()

    return () => {
      cancelAnimationFrame(frame)
      resize.disconnect()
      seen.disconnect()
      motion.removeEventListener('change', sync)
    }
  }, [])

  return <canvas id="network" ref={ref} aria-hidden="true" />
}
