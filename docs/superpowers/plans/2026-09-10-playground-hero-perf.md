# Playground Hero — Perf Results

Measured 2026-09-11 from `npm run build` on branch `playground-hero`.

## Bundle

| Asset | Raw | Gzip | Notes |
|---|---|---|---|
| `index.html` (prerendered) | 5.5 KB | 1.6 KB | real hero + section markup, not an empty root |
| `index-*.css` | 26.6 KB | 6.2 KB | whole-site stylesheet |
| `index-*.js` (entry) | 169.9 KB | **55.1 KB** | React + ReactDOM + site shell + hydration |
| `engine-*.js` (async) | 507.3 KB | **129.5 KB** | Three.js core + scene / objects / controls / animations |

- The 3D engine is a **separate async chunk**, `import()`-ed from `Playground.tsx`
  inside `requestIdleCallback` after mount. It is **not** in the entry graph, so
  first paint and hydration never wait on Three.js.
- **129.5 KB gzip is within the ≤150 KB budget** from the spec, and lighter than
  the reference build's `world` chunk (~150 KB gzip).
- No `manualChunks` config needed — Vite splits it automatically at the dynamic
  import boundary.

## Runtime

- `WebGLRenderer` with `setPixelRatio(min(dpr, 2))`, `antialias` only below 2×
  DPR, one 1024² PCFSoft shadow map.
- RAF loop is gated: stops on `document.hidden` and when an `IntersectionObserver`
  reports the hero < 8% visible. Button actions (`zoom` / `recenter` / `select` /
  `shuffle`) run a bounded ~0.7–1.1 s "kick" loop instead of keeping RAF alive.
- Idle ambient bob + camera easing only; per-object animations are one-shot.
- `prefers-reduced-motion`: no ambient motion, animations resolve to end state.
- No-WebGL: `Playground` renders a static `playground-still.webp` (8.3 KB); the
  category tabs and feature card still work.
- Triangle budget well under 30 k (a handful of primitive meshes, no instancing).

## Follow-ups (not blocking)

- Object home positions are hand-placed; a couple still overlap at some orbit
  angles. Tuning, not structural.
- Deck "MADE TO BE EXPLORED" embossed text from the reference is not modelled yet.
- Could drop the shadow map to 512 on coarse-pointer devices if a real device
  shows jank (emulated mobile held ~60 fps).
