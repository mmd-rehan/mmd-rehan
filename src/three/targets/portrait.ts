import { mulberry32 } from '../../lib/rng'

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)

/**
 * Portrait target: sample the headshot into a COLORED point cloud.
 *
 * The source photo has a clean white background, so the subject is every
 * non-white pixel. We sample those pixels roughly uniformly by area (so the
 * whole face, beard, hair and shirt all get proportional coverage — not just
 * the dark bits), and carry each particle's real RGB color so the cloud reads
 * as a recognizable, full-color likeness rather than grey dust. A gentle
 * left-right bulge fakes facial volume so it has depth when it rotates.
 *
 * Returns both positions and per-particle colors. Runs at load time in the
 * browser. Falls back to a synthetic head if the image can't be loaded.
 */

const IMAGE_SRC = '/portrait.jpg'
const SAMPLE_W = 300 // downscaled sampling resolution (detail vs. speed)

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

  // Collect subject pixels: everything that isn't the near-white, near-neutral
  // background. (A bright-but-blue shirt pixel is kept; a bright grey/white
  // background pixel is dropped.)
  const xs: number[] = []
  const ys: number[] = []
  const rs: number[] = []
  const gs: number[] = []
  const bs: number[] = []
  const weights: number[] = []
  let totalWeight = 0

  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      const idx = (py * w + px) * 4
      const r = data[idx]
      const g = data[idx + 1]
      const b = data[idx + 2]
      const rn = r / 255
      const gn = g / 255
      const bn = b / 255
      const lum = 0.299 * rn + 0.587 * gn + 0.114 * bn
      const sat = Math.max(rn, gn, bn) - Math.min(rn, gn, bn)
      // Background = bright AND colorless.
      if (lum > 0.86 && sat < 0.06) continue
      // Near-uniform-by-area sampling with a mild boost for darker detail
      // (eyes, brows, beard edges) so features stay crisp.
      const weight = 0.75 + (1 - lum) * 0.5
      xs.push(px)
      ys.push(py)
      rs.push(rn)
      gs.push(gn)
      bs.push(bn)
      weights.push(weight)
      totalWeight += weight
    }
  }

  if (xs.length === 0) throw new Error('empty silhouette')

  const cdf = new Float32Array(weights.length)
  let acc = 0
  for (let i = 0; i < weights.length; i++) {
    acc += weights[i]
    cdf[i] = acc
  }

  const rng = mulberry32(seed)
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)

  // Fit the portrait into a ~2.6-tall region, centered.
  const scale = 2.6 / h
  const cx = w / 2
  const cy = h / 2
  const halfW = w / 2
  const halfH = h / 2

  for (let i = 0; i < count; i++) {
    const target = rng() * totalWeight
    let lo = 0
    let hi = cdf.length - 1
    while (lo < hi) {
      const mid = (lo + hi) >> 1
      if (cdf[mid] < target) lo = mid + 1
      else hi = mid
    }
    const jx = xs[lo] + (rng() - 0.5)
    const jy = ys[lo] + (rng() - 0.5)

    const x = (jx - cx) * scale
    const y = -(jy - cy) * scale // flip: image y-down -> world y-up

    // Fake facial volume: center bulges toward the viewer, sides recede.
    const nx = (jx - cx) / halfW // -1..1 across width
    const ny = (jy - cy) / halfH // -1..1 across height
    const bulge = Math.max(0, 1 - nx * nx * 0.85 - ny * ny * 0.35)
    const z = bulge * 0.32 + (rng() - 0.5) * 0.12

    positions[i * 3] = x
    positions[i * 3 + 1] = y
    positions[i * 3 + 2] = z

    // Real color, nudged: a touch more saturation + slightly deeper, so skin
    // and the blue shirt hold their own against the cream background.
    let cr = rs[lo]
    let cg = gs[lo]
    let cb = bs[lo]
    const l = 0.299 * cr + 0.587 * cg + 0.114 * cb
    const satBoost = 1.28
    cr = clamp01((l + (cr - l) * satBoost) * 0.96)
    cg = clamp01((l + (cg - l) * satBoost) * 0.96)
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
    const head = rng() < 0.55
    let skin = true
    if (head) {
      const theta = Math.acos(2 * rng() - 1)
      const phi = rng() * Math.PI * 2
      const rr = 0.55 * Math.cbrt(rng())
      positions[i * 3] = rr * Math.sin(theta) * Math.cos(phi) * 0.85
      positions[i * 3 + 1] = 0.55 + rr * Math.cos(theta)
      positions[i * 3 + 2] = rr * Math.sin(theta) * Math.sin(phi) * 0.7
    } else {
      skin = false
      const sx = (rng() - 0.5) * 1.7
      const sy = -0.2 - rng() * 0.9
      const taper = 1 - Math.abs(sx) * 0.3
      positions[i * 3] = sx
      positions[i * 3 + 1] = sy * taper
      positions[i * 3 + 2] = (rng() - 0.5) * 0.5
    }
    // Warm skin tone for the head, light-blue shirt for the body.
    if (skin) {
      colors[i * 3] = 0.82
      colors[i * 3 + 1] = 0.62
      colors[i * 3 + 2] = 0.5
    } else {
      colors[i * 3] = 0.74
      colors[i * 3 + 1] = 0.82
      colors[i * 3 + 2] = 0.9
    }
  }
  return { positions, colors }
}
