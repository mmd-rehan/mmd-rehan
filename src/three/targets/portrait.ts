import { mulberry32 } from '../../lib/rng'

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)

/**
 * Portrait target: sample the headshot into a COLOURED point cloud that sits on
 * a real 3D head, not a flat billboard.
 *
 * The source illustration has a clean white background, so the subject is every
 * non-white pixel. We sample those pixels roughly uniformly by area, carry each
 * particle's RGB, and then *project* the 2D sample onto a head model — an
 * ellipsoid for the skull/face/beard and a shallow forward-curved slab for the
 * shoulders — so the cloud has genuine depth and reads as a bust when the group
 * pitches and yaws on scroll (mirroring the reference's "head flips back").
 *
 * Runs at load time in the browser. Falls back to a synthetic head if the image
 * can't be loaded.
 */

// The real photo (not the AI-illustrated one) — real skin/beard detail samples
// far better than a smoothed illustration, which read as "plastic".
const IMAGE_SRC = '/portrait-real.jpg'
const SAMPLE_W = 340 // downscaled sampling resolution (detail vs. speed)

export interface PortraitBuffers {
  positions: Float32Array
  colors: Float32Array
}

export async function samplePortraitTarget(
  count: number,
  seed = 5005,
): Promise<PortraitBuffers> {
  try {
    const img = await loadImage(IMAGE_SRC)
    return sampleFromImage(img, count, seed)
  } catch {
    return fallbackHead(count, seed)
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

interface Sample {
  x: number
  y: number
  r: number
  g: number
  b: number
  w: number
}

function sampleFromImage(
  img: HTMLImageElement,
  count: number,
  seed: number,
): PortraitBuffers {
  const aspect = img.height / img.width
  const w = SAMPLE_W
  const h = Math.round(SAMPLE_W * aspect)

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('no 2d context')
  ctx.drawImage(img, 0, 0, w, h)
  const data = ctx.getImageData(0, 0, w, h).data

  // Collect subject pixels: everything that isn't the near-white background.
  const samples: Sample[] = []
  let minX = w
  let maxX = 0
  let minY = h
  let maxY = 0

  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      const idx = (py * w + px) * 4
      const r = data[idx]
      const g = data[idx + 1]
      const b = data[idx + 2]
      const a = data[idx + 3]
      if (a < 8) continue
      const rn = r / 255
      const gn = g / 255
      const bn = b / 255
      const lum = 0.299 * rn + 0.587 * gn + 0.114 * bn
      const sat = Math.max(rn, gn, bn) - Math.min(rn, gn, bn)
      // Background = bright AND colourless.
      if (lum > 0.9 && sat < 0.05) continue
      // Near-uniform-by-area sampling, mild boost for darker detail (eyes,
      // brows, beard edges, hair strands) so features stay crisp. The lower
      // third (shoulders / collar) is down-weighted so the head dominates and
      // there's less lingering body cloud once it disperses.
      let weight = 0.7 + (1 - lum) * 0.6
      if (py > h * 0.66) weight *= 0.5
      samples.push({ x: px, y: py, r: rn, g: gn, b: bn, w: weight })
      if (px < minX) minX = px
      if (px > maxX) maxX = px
      if (py < minY) minY = py
      if (py > maxY) maxY = py
    }
  }

  if (samples.length === 0) throw new Error('empty silhouette')

  // Weighted CDF for area sampling.
  let totalWeight = 0
  const cdf = new Float32Array(samples.length)
  for (let i = 0; i < samples.length; i++) {
    totalWeight += samples[i].w
    cdf[i] = totalWeight
  }

  const rng = mulberry32(seed)
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)

  // --- Subject geometry in image space ---
  const bboxW = maxX - minX || 1
  const bboxH = maxY - minY || 1
  // The head (skull top -> chin) is roughly the top 68% of the subject bbox;
  // the rest is shoulders. Tuned to this specific framing.
  const headTopY = minY
  const chinY = minY + bboxH * 0.68
  const headMidX = (minX + maxX) / 2
  // Head is narrower than the shoulders; estimate its half-width from the bbox.
  const headHalfW = bboxW * 0.34
  const headHalfH = (chinY - headTopY) / 2
  const headCenterY = (headTopY + chinY) / 2

  // World scale: put the head at ~2.4 units tall, centred on origin.
  const worldPerPx = 2.4 / (headHalfH * 2)
  // Head depth (world units) — a touch shallower than its half-height.
  const RZ = headHalfH * worldPerPx * 0.92

  for (let i = 0; i < count; i++) {
    // Pick a weighted-random subject pixel.
    const target = rng() * totalWeight
    let lo = 0
    let hi = cdf.length - 1
    while (lo < hi) {
      const mid = (lo + hi) >> 1
      if (cdf[mid] < target) lo = mid + 1
      else hi = mid
    }
    const s = samples[lo]
    const jx = s.x + (rng() - 0.5)
    const jy = s.y + (rng() - 0.5)

    // Image space -> centred world X/Y (Y up).
    const wx = (jx - headMidX) * worldPerPx
    const wy = -(jy - headCenterY) * worldPerPx

    let z: number
    if (jy <= chinY) {
      // HEAD: project onto the front hemisphere of an ellipsoid.
      const nx = (jx - headMidX) / headHalfW
      const ny = (jy - headCenterY) / headHalfH
      const k = 1 - nx * nx * 0.9 - ny * ny * 0.55
      const front = k > 0 ? Math.sqrt(k) : 0
      z = front * RZ
      // Hair / skull sides sit a touch further back; the nose/beard bulge
      // forward slightly. Use luminance as a cheap proxy (dark = hair/beard).
      const lum = 0.299 * s.r + 0.587 * s.g + 0.114 * s.b
      if (lum < 0.32) z *= 0.82 // hair/beard/brows recede a little
      z += (rng() - 0.5) * 0.06 * RZ
    } else {
      // SHOULDERS / COLLAR: shallow forward curve, further from the viewer than
      // the face, tapering at the edges.
      const shoulderSpan = (maxX - minX) / 2
      const nx = (jx - headMidX) / shoulderSpan
      z = (0.35 - nx * nx * 0.55) * RZ - RZ * 0.15
      z += (rng() - 0.5) * 0.05 * RZ
    }

    positions[i * 3] = wx
    positions[i * 3 + 1] = wy
    positions[i * 3 + 2] = z

    // Real colour, gently deepened + warmed so it holds on charcoal.
    let cr = s.r
    let cg = s.g
    let cb = s.b
    const l = 0.299 * cr + 0.587 * cg + 0.114 * cb
    const satBoost = 1.18
    cr = clamp01((l + (cr - l) * satBoost) * 1.02)
    cg = clamp01((l + (cg - l) * satBoost) * 0.99)
    cb = clamp01((l + (cb - l) * satBoost) * 0.96)
    colors[i * 3] = cr
    colors[i * 3 + 1] = cg
    colors[i * 3 + 2] = cb
  }

  return { positions, colors }
}

/** Synthetic head-and-shoulders, used only if the photo fails to load. */
function fallbackHead(count: number, seed: number): PortraitBuffers {
  const rng = mulberry32(seed)
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const head = rng() < 0.6
    let skin = true
    if (head) {
      const theta = Math.acos(2 * rng() - 1)
      const phi = rng() * Math.PI * 2
      const rr = 0.9 * Math.cbrt(rng())
      positions[i * 3] = rr * Math.sin(theta) * Math.cos(phi) * 0.82
      positions[i * 3 + 1] = 0.35 + rr * Math.cos(theta) * 1.1
      positions[i * 3 + 2] = rr * Math.sin(theta) * Math.sin(phi) * 0.85
    } else {
      skin = false
      const sx = (rng() - 0.5) * 2.6
      const sy = -1.3 - rng() * 0.8
      const taper = 1 - Math.abs(sx) * 0.28
      positions[i * 3] = sx
      positions[i * 3 + 1] = sy * taper
      positions[i * 3 + 2] = (rng() - 0.5) * 0.5 - 0.2
    }
    if (skin) {
      colors[i * 3] = 0.85
      colors[i * 3 + 1] = 0.64
      colors[i * 3 + 2] = 0.52
    } else {
      colors[i * 3] = 0.6
      colors[i * 3 + 1] = 0.72
      colors[i * 3 + 2] = 0.85
    }
  }
  return { positions, colors }
}
