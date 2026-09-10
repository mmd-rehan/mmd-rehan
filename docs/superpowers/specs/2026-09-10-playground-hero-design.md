# Playground Hero + Journey — Design

Date: 2026-09-10
Branch: `playground-hero` (local only — no push until approved)
Status: awaiting review

## Goal

Rebuild the site so it reads like the reference build at
`rehan-playground.mmd-rehan.chatgpt.site` (Rehan's own second, ChatGPT-generated
version of this portfolio). Specifically:

1. Replace the current flat hero (2D wireframe torus) with an **interactive
   isometric 3D "playground"** — low-poly objects on a tilted platform that the
   visitor drags, clicks to "play", and explores by category.
2. Add a **Journey** section: a vertical dated timeline of roles.
3. Adopt the reference's **visual system site-wide** (off-white ground, indigo
   accent, Manrope + Instrument-Serif-italic headings).
4. Keep our existing **Work / About / Testimonials / "Also on GitHub"** content,
   restyled to match.
5. Fix the "Also on GitHub" cards: equal height + a "See more" toggle for the
   long one.

Not in scope: dark mode (reference is light-only), dedicated project "story"
pages, CMS, i18n.

## What the reference hero actually does (observed)

- **Scene**: isometric tilted platform with a faint grid and soft contact
  shadow; the words `MADE TO BE EXPLORED` embossed into the deck. ~6 interactive
  objects plus non-interactive scenery (a small cube, a robot arm, extra
  shipping containers) for depth.
- **Click an object** → that object plays its own short animation (the TV snaps
  on to a colour-bar test pattern reading `STAY TUNED`), its **category tab
  highlights**, the left **feature card swaps** (eyebrow, title, body, CTA
  label — "Send a packet" → "Change channel" → "Pulse the servers" — and a
  "The story →" link), the **`N of 6 discovered`** counter increments on first
  discovery, and the bottom-left micro-caption changes ("A new channel. Same
  curiosity.").
- **Category tab** and the card's **CTA button** trigger the same thing (focus +
  replay).
- **Drag an object** → it moves across the platform.
- **Drag empty space** → orbits the camera. **Scroll / pinch** → zoom.
- **Control cluster** (right edge): `+` / `−` zoom, recenter, `⏸` pause ambient
  motion, `↺` reset layout.
- **"Mix it up"** (bottom-right) → shuffles object positions.
- Bottom hint row: left "Pick something up. See what happens.", centre "Drag
  empty space to orbit · Scroll or pinch to zoom", right "A closer look at the
  work ↓" (jumps to Work).

## The 6 interactive objects

| id          | Object            | Category   | Project / role        | CTA label        | Story URL |
|-------------|-------------------|------------|-----------------------|------------------|-----------|
| `apis`      | torus ring (wire) | APIs       | FixCors               | Send a packet    | https://fixcors.com |
| `streaming` | retro TV          | Streaming  | NoBoxTV               | Change channel   | https://noboxtv.com |
| `healthcare`| first-aid kit     | Healthcare | Winsoft / Prescriptionly | Open the file | https://github.com/Prescriptionly/app |
| `aviation`  | airplane          | Aviation   | Amadeus               | Take off         | (Work anchor) |
| `logistics` | shipping container| Logistics  | Gulf Agency Company   | Dispatch cargo   | (Work anchor) |
| `cloud`     | server rack       | Cloud      | Phoenix Group (K8s)   | Pulse the servers| (Work anchor) |

Exact card copy (eyebrow / title / body / caption) is drafted in
`src/site/data.ts` during Milestone 4 and reviewed then — copy is cheap to
change, so it is not frozen here.

## Architecture

Stack stays: Vite + React 18, prerendered via `src/entry-server.tsx`, one
stylesheet (`src/site/site.css`). The 3D layer is **raw Three.js, tree-shaken,
in a lazily `import()`-ed chunk** — no React-Three-Fiber, no drei. Rationale:
smallest bundle, the static hero paints on first byte, the engine hydrates after
mount.

### New file layout

```
src/site/
  Site.tsx              restructured: <Nav> + <Hero> + existing sections + <Journey>
  site.css              rewritten token layer + section styles
  data.ts               + PLAYGROUND catalog, + JOURNEY entries (keep ROLES / REPOS / TESTIMONIALS)
  Nav.tsx               Playground / Work / Journey / About + "Let's talk"
  Hero.tsx              eyebrow row, name block, tagline, <FeatureCard>, <Playground>, <ExploreBar>, hint row
  FeatureCard.tsx       swappable project card (driven by selected id)
  ExploreBar.tsx        category tabs + "N of 6 discovered" + "Mix it up"
  ControlCluster.tsx    zoom +/- , recenter, pause, reset  (calls the engine handle)
  Journey.tsx           vertical timeline (pure CSS, optional IO reveal)
  playgroundState.ts    PURE reducer: { selectedId, discovered:Set } — select / discoverOnce / reset
  playground/
    Playground.tsx      React wrapper: div ref, dynamic import of engine, fallback, event bridge
    engine.ts           createEngine(container, opts) -> imperative handle + event callbacks
    scene.ts            renderer, orthographic iso camera, lights, platform, grid, contact shadow
    objects.ts          procedural low-poly builders: torusRing() tv() firstAid() plane() container() serverRack() + scenery()
    animations.ts       per-object "play" tween + focus tween
    controls.ts         pointer handling: empty-space orbit, wheel zoom, object drag via raycast-to-ground
    catalog.ts          re-export of the 6 objects with home positions (source: data.ts)
```

Deleted in Milestone 7 (dead since the 2026-09-07 "portfolio layout" commit —
`main.tsx` already renders `Site`, not `App`): `src/App.tsx`, `src/three/`,
`src/ui/`, `src/hooks/`, `src/content/`, and `src/lib/` (timeline, slicePhases,
heroScroll; `deviceTier`/`rng` kept only if the engine reuses them), plus the
`@react-three/fiber`, `@react-three/postprocessing`, `postprocessing`, and
`node-three-gltf` deps. `three` + `@types/three` move to `dependencies`.

### The React ↔ engine seam

`Playground.tsx` renders `<div ref>` and, in a mount effect (client only,
`requestIdleCallback`), does `const { createEngine } = await import('./engine')`
then `engineRef.current = createEngine(el, { catalog, reducedMotion, onSelect,
onDiscover })`.

Engine handle (imperative, called by React):

```
select(id)      focus camera on object + play its animation
play(id)        replay animation only
zoom(delta)     step zoom
recenter()      camera back to home framing
togglePause()   ambient motion on/off  -> returns new state
reset()         objects + camera back to home layout
shuffle()       randomise object positions
dispose()       stop RAF, drop GL context, remove listeners
```

Engine → React callbacks: `onSelect(id)` (user clicked an object),
`onDiscover(id)` (first time only).

**Single source of truth for selection = React** (`playgroundState.ts`
reducer). Flow when a category tab is clicked: React → `engine.select(id)` →
engine focuses + plays → engine emits `onSelect(id)` → reducer sets
`selectedId` + `discoverOnce` → `<FeatureCard>` / `<ExploreBar>` re-render.
Flow when an object is clicked: engine emits `onSelect` → same reducer path;
React then calls `engine.select` only if the ids differ (guard the loop).

### Rendering & performance

- `WebGLRenderer({ antialias: dpr < 2, powerPreference: 'high-performance' })`,
  `setPixelRatio(Math.min(devicePixelRatio, 2))`.
- **OrthographicCamera** for the crisp isometric look; zoom = lerp the frustum
  size. Fixed azimuth/elevation; empty-space drag rotates within a clamped
  range.
- Lights: `HemisphereLight` + one `DirectionalLight` with a 1024 PCFSoft shadow.
  Ground: large plane with `ShadowMaterial` for contact shadow + a subtle grid
  (shader or texture). Deck text = extruded/`ShapeGeometry` or a baked texture.
- Materials: `MeshStandardMaterial`, low roughness variance. Palette: warm white
  `#F1EFE9` bodies, indigo `#4B3FE4` accents, charcoal `#1B1B23` server. Torus =
  wireframe / points.
- Triangle budget < 30k total. No instancing needed.
- **Loop gating**: `requestAnimationFrame`; stop when `document.hidden`, when an
  `IntersectionObserver` reports the hero < 10% visible, or on manual pause.
- Ambient idle = gentle platform bob + slow auto-orbit; **disabled under
  `prefers-reduced-motion`**, which also makes "play" animations resolve
  instantly.
- **Chunk budget: ≤ 150 KB gzip** for the lazy 3D chunk. Measured at Milestone 7
  — this is the checkpoint for the "raw three vs. something lighter" call.
- SSR safety: nothing under `playground/` may be imported at module top level on
  the server path — dynamic `import()` only, and `Playground.tsx` renders the
  fallback markup during SSR.

### Fallback (no WebGL · reduced-motion keeps the scene · optional small-screen)

- No WebGL (or a decode error): show a **static baked still** of the scene
  (`public/playground-still.webp`, captured from our own built scene via a small
  script in Milestone 7) behind the same copy. Category tabs + card still work;
  they just don't move a camera.
- `prefers-reduced-motion`: the real scene renders, but no auto-orbit, no bob,
  animations snap to end state.
- Mobile: the interactive scene runs (reference proves it's feasible); DPR
  capped, shadow map dropped to 512, ambient orbit off by default.

### Journey timeline

`JOURNEY` in `data.ts`: `{ start, end, company, role, blurb, industry }`,
derived from existing `ROLES` + the 2018–2019 freelance entry. Markup: `<ol>`
with a CSS vertical rule (`::before` on the list), each `<li>` carries a node
dot, `.period`, `<h3>` company, `.role`, `<p>` blurb, `.chip` industry. Left
column = section intro: sans headline + Instrument-Serif-italic second line +
lead paragraph + `FULL STACK · PRODUCT THINKING · SYSTEMS` kicker. Pure CSS;
optional `IntersectionObserver` per-node fade (reduced-motion aware).

### "Also on GitHub" fix

- Card list becomes a grid with equal row heights (`grid-auto-rows: 1fr`) or
  flex with `align-items: stretch`; inside each card a column with the `meta`
  line ("27 stars · 16 forks") pinned to the bottom (`margin-top: auto`) so all
  cards align regardless of blurb length.
- Long blurb (ADMS) clamps to 3 lines (`-webkit-line-clamp`) with a real
  `<button aria-expanded>` "See more" / "See less" toggling an `expanded` state
  (per-card React state).

### Visual system (`site.css` rewrite)

Tokens (light only):

```
--bg:#F6F5F1  --surface:#FFFFFF  --ink:#16161D  --muted:#6B6B76
--accent:#4B3FE4  --on-accent:#FFFFFF  --line:rgba(0,0,0,.09)  --radius:14px
--font-sans:'Manrope',system-ui,sans-serif
--font-serif:'Instrument Serif',Georgia,serif   /* italic accent line */
```

- Add Instrument Serif to the font `<link>` in `index.html`; drop DM Sans.
- `.dual-heading`: `<h2>` sans-bold line 1, `<em>` serif-italic line 2, tight
  leading — used by every section header and the Journey intro.
- Container max ~1200px, generous vertical rhythm.
- `theme-color` in `index.html` updated to `#F6F5F1`.

## Milestones (each = one local commit on `playground-hero`, build green)

1. **Visual system + shell** — `site.css` token rewrite, Instrument Serif,
   `Nav.tsx`, `Hero.tsx` layout with a static placeholder box where the scene
   goes, restyle existing sections. `npm run build` green.
2. **Engine — static scene** — raw three, ortho iso camera, platform + grid +
   lights + contact shadow + deck text, 6 procedural objects + scenery, palette.
   Mounts, renders, disposes cleanly, lazy-loaded. No interaction.
3. **Engine — camera + drag + controls** — empty-space orbit, wheel zoom, object
   drag (raycast to ground), `ControlCluster` (zoom / recenter / pause / reset),
   visibility + offscreen loop gating.
4. **Engine — play animations + selection wiring** — per-object animation,
   `playgroundState` reducer, `FeatureCard`, `ExploreBar` (tabs + discovered
   counter + "Mix it up"), bottom captions, object ↔ category ↔ card sync, CTA
   replay.
5. **Journey timeline** — data + `Journey.tsx` + styles + optional reveal.
6. **"Also on GitHub" fix** — equal-height cards + see-more toggle.
7. **Fallback + cleanup + perf** — baked still + no-WebGL/reduced-motion paths,
   delete the dead cinematic code + prune deps, measure the 3D chunk (Q2
   checkpoint), README touch.

## Testing

- New unit tests (vitest):
  - `playgroundState.test.ts` — reducer: select sets id; discover only fires
    once per id; reset clears selection, keeps discovered (matches reference).
  - `catalog.test.ts` — 6 entries, unique ids + categories + home positions,
    every story URL well-formed.
  - `journey.test.ts` — entries chronological, date ranges parse, industry
    non-empty.
  - `RepoCard.test.tsx` (RTL) — long blurb renders "See more"; click toggles
    `aria-expanded` and reveals the rest.
- The WebGL engine itself is not unit-tested — verified by `npm run build` +
  manual browser smoke (desktop + mobile viewport) each milestone.
- Existing `lib/timeline` + `lib/slicePhases` tests are deleted with their
  source in Milestone 7.
- Gate every milestone on `npm run build` (tsc --noEmit + vite + SSR +
  prerender) staying green.

## Risks & mitigations

- **Procedural models look crude vs. reference.** Iterate in M2; if a specific
  object won't read as itself, swap that one to a CC0 `.glb` (adds a loader only
  for that object). Revisit at the M2 review.
- **three.js core weight (~150 KB gz even tree-shaken).** Lazy chunk keeps it
  off the critical path; hero is fully usable (copy + card + tabs) before it
  lands. Hard measurement at M7 — if over budget, that's the point to reconsider
  the engine choice.
- **Orthographic screen→world drag math.** Standard raycaster-to-ground-plane;
  covered by manual testing, not a novel problem.
- **SSR importing three.** Enforced by keeping all `playground/` behind dynamic
  `import()` and a `typeof window` guard.
- **Selection event loop (engine ↔ React).** Guard: React only calls
  `engine.select` when the target id differs from current `selectedId`.
