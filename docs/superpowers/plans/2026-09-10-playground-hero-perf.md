# Playground Hero — Perf Results

Measured 2026-09-11 from `npm run build` on branch `playground-hero`.

> Re-measured after the scene was rebuilt as a faithful port of the reference
> playground (PerspectiveCamera + OrbitControls + RoomEnvironment IBL +
> RoundedBoxGeometry, six detailed objects). Figures below are the current ones.

## Bundle

| Asset | Raw | Gzip | Notes |
|---|---|---|---|
| `index.html` (prerendered) | 5.5 KB | 1.6 KB | real hero + section markup, not an empty root |
| `index-*.css` | 29.1 KB | 6.9 KB | whole-site stylesheet |
| `index-*.js` (entry) | 175.8 KB | **57.0 KB** | React + ReactDOM + site shell + hydration |
| `engine-*.js` (async) | 555.3 KB | **144.4 KB** | Three.js core + OrbitControls + RoomEnvironment + RoundedBoxGeometry + scene / objects / engine |

- The 3D engine is a **separate async chunk**, `import()`-ed from `Playground.tsx`
  inside `requestIdleCallback` after mount. It is **not** in the entry graph, so
  first paint and hydration never wait on Three.js.
- **144.4 KB gzip is within the ≤150 KB budget** from the spec, and comparable
  to the reference build's `world` chunk (576 KB raw).
- No `manualChunks` config needed — Vite splits it automatically at the dynamic
  import boundary.

## Runtime

- `WebGLRenderer` with `setPixelRatio(min(dpr, 1.75))`, `antialias` on, one
  2048² PCFSoft shadow map — matching the reference's settings.
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
