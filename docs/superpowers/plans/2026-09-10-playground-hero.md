# Playground Hero + Journey — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the flat hero with an interactive isometric 3D "playground", add a Journey timeline, and restyle the site into the reference visual system — matching `rehan-playground.mmd-rehan.chatgpt.site`.

**Architecture:** Vite + React 18, prerendered. The 3D layer is raw tree-shaken Three.js in a lazily `import()`-ed chunk exposing an imperative engine handle; React owns selection state via a pure reducer and bridges events. Static hero paints on first byte; canvas hydrates after idle.

**Tech Stack:** React 18, TypeScript, Vite 5, Three.js 0.169, vitest + @testing-library/react, CSS (one stylesheet).

**Spec:** `docs/superpowers/specs/2026-09-10-playground-hero-design.md`

## Global Constraints

- Branch `playground-hero`, local commits only — never `git push` until the user greenlights.
- No AI-attribution trailers in commit messages; never `git amend` without being asked.
- `npm run build` (tsc --noEmit + vite + SSR build + prerender) MUST pass at the end of every task.
- Light mode only. No dark-mode blocks.
- 3D chunk budget: ≤ 150 KB gzip, measured at Task 14.
- Nothing under `src/site/playground/` may be imported at module top level on the SSR path — dynamic `import()` only.
- Palette tokens: `--bg:#F6F5F1 --surface:#FFFFFF --ink:#16161D --muted:#6B6B76 --accent:#4B3FE4 --on-accent:#FFFFFF --line:rgba(0,0,0,.09) --radius:14px`.
- Fonts: Manrope (sans) + Instrument Serif (serif-italic accent). Drop DM Sans.
- 6 interactive objects: `apis`(torus/FixCors), `streaming`(TV/NoBoxTV), `healthcare`(first-aid/Winsoft), `aviation`(plane/Amadeus), `logistics`(container/GAC), `cloud`(server/Phoenix).

---

## MILESTONE 1 — Visual system + shell

### Task 1: Palette + type token rewrite

**Files:**
- Modify: `src/site/site.css` (token layer at top + base element styles)
- Modify: `index.html` (font `<link>`, `theme-color`)

- [ ] **Step 1:** In `index.html`, replace the Google Fonts `<link>` href with `family=Manrope:wght@400;500;600;700;800&family=Instrument+Serif:ital@1&display=swap`. Change `<meta name="theme-color">` to `#F6F5F1`.
- [ ] **Step 2:** In `src/site/site.css`, replace the `:root` custom-property block with the Global Constraints palette tokens plus `--font-sans:'Manrope',system-ui,-apple-system,sans-serif` and `--font-serif:'Instrument Serif',Georgia,serif`. Update `body` to `background:var(--bg); color:var(--ink); font-family:var(--font-sans)`.
- [ ] **Step 3:** Add a `.dual-heading` rule: block element, `h2/&>span` line 1 = `font-weight:700; letter-spacing:-0.02em`, `&>em` line 2 = `font-family:var(--font-serif); font-style:italic; font-weight:400`, `line-height:1.05`.
- [ ] **Step 4:** Run `npm run build`. Expected: PASS. Run `npm run dev`, confirm page still renders with the new background/fonts (existing layout, new colors).
- [ ] **Step 5:** Commit: `git add -A && git commit -m "Rewrite site.css token layer to the playground visual system"`

### Task 2: Nav component

**Files:**
- Create: `src/site/Nav.tsx`
- Modify: `src/site/Site.tsx` (replace inline `<header>` with `<Nav/>`)
- Modify: `src/site/site.css` (nav styles)

**Interfaces:**
- Produces: `export function Nav(): JSX.Element` — renders `mr.` brand + name/title lockup, links `#playground` `#work` `#journey` `#about`, and a `Let's talk ↗` mailto button.

- [ ] **Step 1:** Create `src/site/Nav.tsx`: brand `mr` + accent `.`, a `.lockup` with `MUHAMMAD REHAN` / `SOFTWARE ENGINEER`, `<nav>` with the four anchor links, `<a class="cta" href="mailto:hi@mmd-rehan.com">Let's talk ↗</a>`.
- [ ] **Step 2:** In `Site.tsx` replace the existing `<header className="header">…</header>` with `<Nav />` and its import.
- [ ] **Step 3:** In `site.css` add `.site-nav` styles: sticky top, `backdrop-filter: blur(8px)`, bottom `--line` border, flex row, `.cta` = pill with `--line` border. Remove now-dead `.header` rules.
- [ ] **Step 4:** Run `npm run build`. Expected: PASS. Dev-check the nav renders and links resolve to sections.
- [ ] **Step 5:** Commit: `git commit -am "Add Nav component with reference labels"`

### Task 3: Hero layout shell (no scene yet)

**Files:**
- Create: `src/site/Hero.tsx`
- Create: `src/site/FeatureCard.tsx`
- Create: `src/site/ExploreBar.tsx`
- Modify: `src/site/Site.tsx` (swap `<section className="hero">` for `<Hero/>`, `id="playground"`)
- Modify: `src/site/data.ts` (add `PLAYGROUND` catalog)
- Modify: `src/site/site.css` (hero grid + card + explore bar)
- Test: `src/site/playgroundCatalog.test.ts`

**Interfaces:**
- Produces:
  - `data.ts`: `export type PlaygroundEntry = { id: PlaygroundId; category: string; project: string; eyebrow: string; title: string; body: string; cta: string; caption: string; storyHref: string; home: [number, number, number] }` and `export const PLAYGROUND: PlaygroundEntry[]` (6 entries) and `export type PlaygroundId = 'apis'|'streaming'|'healthcare'|'aviation'|'logistics'|'cloud'`.
  - `FeatureCard.tsx`: `export function FeatureCard(props: { entry: PlaygroundEntry; onCta: () => void }): JSX.Element`
  - `ExploreBar.tsx`: `export function ExploreBar(props: { entries: PlaygroundEntry[]; selectedId: PlaygroundId; discovered: ReadonlySet<PlaygroundId>; onPick: (id: PlaygroundId) => void; onShuffle: () => void }): JSX.Element`
  - `Hero.tsx`: `export function Hero(): JSX.Element` — for now renders eyebrow row, name block, tagline, `<FeatureCard>` with `PLAYGROUND[0]`, a `.stage-placeholder` div, hint row, `<ExploreBar>`. Local `useState` for `selectedId`/`discovered` stub.

- [ ] **Step 1: Write the failing test** — `src/site/playgroundCatalog.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { PLAYGROUND } from './data'

describe('PLAYGROUND catalog', () => {
  it('has the six expected ids', () => {
    expect(PLAYGROUND.map((e) => e.id).sort()).toEqual(
      ['apis', 'aviation', 'cloud', 'healthcare', 'logistics', 'streaming'],
    )
  })
  it('gives every entry a unique home position and a valid story href', () => {
    const homes = new Set(PLAYGROUND.map((e) => e.home.join(',')))
    expect(homes.size).toBe(PLAYGROUND.length)
    for (const e of PLAYGROUND) {
      expect(e.storyHref).toMatch(/^(https:\/\/|#)/)
      expect(e.eyebrow && e.title && e.body && e.cta && e.caption).toBeTruthy()
    }
  })
})
```

- [ ] **Step 2:** Run `npx vitest run src/site/playgroundCatalog.test.ts`. Expected: FAIL (`PLAYGROUND` not exported).
- [ ] **Step 3:** Add `PlaygroundId`, `PlaygroundEntry`, `PLAYGROUND` to `data.ts`. Six entries, copy drafted from the reference (apis/FixCors "Send a packet", streaming/NoBoxTV "Change channel", healthcare/Winsoft "Open the file", aviation/Amadeus "Take off", logistics/GAC "Dispatch cargo", cloud/Phoenix "Pulse the servers"). `home` positions spread on a ~6×6 grid, e.g. `[-2,0,1]`, `[0,0,-1.5]`, `[2.2,0,0.5]`, `[-1.5,0,2]`, `[1.8,0,2.2]`, `[3,0,-1]`. `storyHref`: fixcors.com, noboxtv.com, github.com/Prescriptionly/app, `#work`, `#work`, `#work`.
- [ ] **Step 4:** Run the test. Expected: PASS.
- [ ] **Step 5:** Create `FeatureCard.tsx` (eyebrow with a small icon slot, `<h3>` title, `<p>` body, a primary button `▶ {cta}` calling `onCta`, a `The story →` link to `entry.storyHref`).
- [ ] **Step 6:** Create `ExploreBar.tsx` (`EXPLORE MY WORLD` label + `{discovered.size} of 6 discovered`, a row of 6 category buttons each `onClick={() => onPick(id)}` with `aria-pressed`, a `↔ Mix it up` button calling `onShuffle`).
- [ ] **Step 7:** Create `Hero.tsx` per the interface (scene area = `<div className="stage-placeholder" />`). Wire local `useState<PlaygroundId>('apis')` + `useState<Set<PlaygroundId>>`.
- [ ] **Step 8:** In `Site.tsx` replace the hero `<section>` with `<Hero />` (keep `id="playground"` on it) and delete the old `NetworkCanvas` import/usage.
- [ ] **Step 9:** Add hero styles to `site.css`: 2-col grid (copy left, stage right) collapsing to 1 col < 900px; `.feature-card` = `--surface` bg, `--line` border, `--radius`; `.explore-bar` = full-width bar, `--line` top border; `.stage-placeholder` = `min-height:clamp(320px,42vw,520px)` dashed `--line`.
- [ ] **Step 10:** Run `npm run build`. Expected: PASS. Dev-check: hero shows name, tagline, card, placeholder box, explore bar; clicking category buttons swaps the card copy.
- [ ] **Step 11:** Commit: `git commit -am "Hero shell: layout, feature card, explore bar, catalog"`

### Task 4: Restyle existing sections + dual headings

**Files:**
- Modify: `src/site/Site.tsx` (section headers → `.dual-heading`, add `id`s)
- Modify: `src/site/site.css` (section rhythm, chips, cards, testimonials)

- [ ] **Step 1:** Give each section an `id` matching the nav (`work`, `journey` placeholder anchor, `about`). Convert each section's heading to the `.dual-heading` pattern (line 1 sans / line 2 serif-italic) using copy close to the reference ("Different industries. / *The same curiosity.*" for journey intro later; "Built from curiosity. / *Made to be useful.*" for work).
- [ ] **Step 2:** Update `site.css`: consistent section vertical padding (`clamp(64px,10vw,120px)`), `1200px` max container, restyle `.project`, `.tags span` (chips), `.testimonials`, `.repos` to the token palette.
- [ ] **Step 3:** Run `npm run build`. Expected: PASS. Dev-check the whole page reads in the new system, no leftover old colors.
- [ ] **Step 4:** Commit: `git commit -am "Restyle existing sections into the playground visual system"`

---

## MILESTONE 2 — Engine: static scene

### Task 5: Engine scaffold + scene (renderer, camera, lights, platform)

**Files:**
- Create: `src/site/playground/engine.ts`
- Create: `src/site/playground/scene.ts`
- Create: `src/site/playground/Playground.tsx`
- Modify: `src/site/Hero.tsx` (swap placeholder for `<Playground>`)
- Modify: `src/site/site.css` (`.playground-stage` canvas sizing)
- Modify: `package.json` (move `three` + `@types/three` to `dependencies`)

**Interfaces:**
- Produces:
  - `scene.ts`: `export function createScene(container: HTMLElement): { renderer; scene; camera; resize(): void; render(): void; dispose(): void }` (Three types).
  - `engine.ts`: `export type EngineOptions = { catalog: PlaygroundEntry[]; reducedMotion: boolean; onSelect(id: PlaygroundId): void; onDiscover(id: PlaygroundId): void }`; `export type EngineHandle = { select(id): void; play(id): void; zoom(dir: 1 | -1): void; recenter(): void; togglePause(): boolean; reset(): void; shuffle(): void; dispose(): void }`; `export function createEngine(container: HTMLElement, opts: EngineOptions): EngineHandle`.
  - `Playground.tsx`: `export function Playground(props: { selectedId: PlaygroundId; onSelect(id): void; onDiscover(id): void; engineRef: React.MutableRefObject<EngineHandle | null> }): JSX.Element`.

- [ ] **Step 1:** `package.json`: move `three` and `@types/three` from `devDependencies` to `dependencies`. Run `npm install`.
- [ ] **Step 2:** Create `scene.ts`: `WebGLRenderer({antialias: devicePixelRatio<2, powerPreference:'high-performance', alpha:true})`, `setPixelRatio(Math.min(devicePixelRatio,2))`; `OrthographicCamera` framed isometric (position `(6,7,6)`, `lookAt(0,0.5,0)`, frustum sized to container aspect); `HemisphereLight(0xffffff,0xdedede,0.9)` + `DirectionalLight` at `(5,8,4)` with `castShadow`, `shadow.mapSize 1024`; ground `PlaneGeometry(40,40)` rotated flat with `ShadowMaterial({opacity:0.12})`; a `GridHelper(24, 24, line, line)` lifted `y=0.001`; a rounded platform `BoxGeometry` (or extruded shape) in `--surface` white. Append `renderer.domElement`. `resize()` reads `container.clientWidth/Height`.
- [ ] **Step 3:** Create `engine.ts`: call `createScene`, start a RAF loop calling `render()`, add a `ResizeObserver` → `resize()`. Pause the loop when `document.hidden` (`visibilitychange`) and via an `IntersectionObserver` on `container` (< 0.1 → pause). Implement `dispose()` (cancel RAF, disconnect observers, `renderer.dispose()`, `forceContextLoss()`, remove canvas). Stub `select/play/zoom/recenter/togglePause/reset/shuffle` as no-ops that still satisfy the type.
- [ ] **Step 4:** Create `Playground.tsx`: renders `<div className="playground-stage" ref={hostRef} />`. In a `useEffect` (guard `typeof window !== 'undefined'`), `requestIdleCallback` → `const { createEngine } = await import('./engine')` → `props.engineRef.current = createEngine(host, {...})`. Cleanup: `engineRef.current?.dispose()`. During SSR / before hydration it renders just the empty div (fallback still comes in Task 14).
- [ ] **Step 5:** In `Hero.tsx` replace `.stage-placeholder` with `<Playground selectedId={selectedId} engineRef={engineRef} onSelect={...} onDiscover={...} />` and a `useRef<EngineHandle|null>(null)`.
- [ ] **Step 6:** `site.css`: `.playground-stage{position:relative;width:100%;height:clamp(340px,44vw,560px)} .playground-stage canvas{display:block;width:100%!important;height:100%!important}`.
- [ ] **Step 7:** Run `npm run build`. Expected: PASS (SSR must not crash — verify the dynamic import kept `three` out of the server bundle; if `npm run build` SSR step fails on `three`, ensure no static import path reaches it).
- [ ] **Step 8:** `npm run dev`: confirm an empty platform renders, resizes with the window, and the canvas disappears cleanly on route/unmount (React strict-mode double-mount must not leak — dispose then re-create).
- [ ] **Step 9:** Commit: `git commit -am "Playground engine scaffold: renderer, iso camera, lit platform"`

### Task 6: Procedural objects + scenery

**Files:**
- Create: `src/site/playground/objects.ts`
- Modify: `src/site/playground/engine.ts` (build objects from catalog, place at `home`)

**Interfaces:**
- Produces: `objects.ts`: `export function buildObject(id: PlaygroundId): THREE.Group` (one builder per id: `torusRing`, `retroTv`, `firstAidKit`, `plane`, `container`, `serverRack`), and `export function buildScenery(): THREE.Group` (cube, robot arm, extra containers — non-interactive, `userData.scenery = true`).

- [ ] **Step 1:** Create `objects.ts`. Each builder composes `Mesh`es from primitives with `MeshStandardMaterial`:
  - `torusRing`: `TorusGeometry(0.8,0.06,10,48)` wireframe/points in `--accent` on a small white pedestal.
  - `retroTv`: rounded `BoxGeometry` body (`--accent`), inset dark screen plane, two antenna `CylinderGeometry`, small feet.
  - `firstAidKit`: white `BoxGeometry` + lid, an `+` cross of two thin accent boxes on top, a handle torus.
  - `plane`: fuselage `CapsuleGeometry`/cylinder, two wing boxes, tail — accent + white.
  - `container`: corrugated `BoxGeometry` (accent) with white end caps; stack 2.
  - `serverRack`: charcoal `BoxGeometry` cabinet with 4 inset unit slices + tiny emissive LED dots.
  Each returns a `Group` with `castShadow/receiveShadow` set on children, `userData.id = id`, scaled to ~1 unit.
- [ ] **Step 2:** In `engine.ts`, after the scene is built, loop `opts.catalog`, `const g = buildObject(e.id); g.position.set(...e.home); scene.add(g)`; keep a `Map<PlaygroundId, THREE.Group>`. Add `buildScenery()` to the scene.
- [ ] **Step 3:** Run `npm run build`. Expected: PASS.
- [ ] **Step 4:** `npm run dev`: all six objects sit on the platform, cast shadows, read recognizably in the palette. Screenshot desktop for the review.
- [ ] **Step 5:** Commit: `git commit -am "Procedural low-poly objects and scenery"`

---

## MILESTONE 3 — Camera + drag + controls

### Task 7: Pointer controls (orbit, wheel zoom, object drag)

**Files:**
- Create: `src/site/playground/controls.ts`
- Modify: `src/site/playground/engine.ts` (wire controls, implement `zoom/recenter/select` camera parts)

**Interfaces:**
- Produces: `controls.ts`: `export function attachControls(opts: { dom: HTMLElement; camera: THREE.OrthographicCamera; objects: Map<PlaygroundId, THREE.Group>; onObjectClick(id: PlaygroundId): void; onObjectDrag(id: PlaygroundId, point: THREE.Vector3): void; reducedMotion: boolean }): { setEnabled(b: boolean): void; recenter(): void; zoom(dir: 1 | -1): void; update(): void; dispose(): void }`.

- [ ] **Step 1:** Create `controls.ts`. Track `pointerdown` → raycast against object groups. Hit + minimal movement on `pointerup` ⇒ `onObjectClick(id)`. Hit + drag ⇒ raycast to the ground plane each move, `onObjectDrag(id, point)`. Miss + drag ⇒ orbit: adjust a spherical azimuth (clamp ±0.5 rad) / elevation (clamp) around target, reposition camera in `update()`. `wheel` ⇒ `zoom` (lerp `camera.zoom`, clamp 0.6–2.0, `updateProjectionMatrix`). `recenter()` eases azimuth/elevation/zoom back to defaults. Touch: same via pointer events; `touch-action: none` on the dom.
- [ ] **Step 2:** In `engine.ts` call `attachControls`; `onObjectClick` → `opts.onSelect(id)` + `opts.onDiscover(id)`; `onObjectDrag` → set the group's `position.x/z` to the point. Call `controls.update()` in the loop. Implement `zoom`/`recenter` by delegating. `select(id)` for now eases the orbit target toward the object's position.
- [ ] **Step 3:** In `Hero.tsx`, add a `<ControlCluster>` (next task) placeholder is not needed — just verify via wheel/drag.
- [ ] **Step 4:** Run `npm run build`. Expected: PASS.
- [ ] **Step 5:** `npm run dev`: drag empty space orbits within clamps; wheel zooms; dragging the TV moves it on the deck; clicking it logs a select. Mobile viewport: one-finger drag works, page doesn't scroll while dragging the stage.
- [ ] **Step 6:** Commit: `git commit -am "Playground pointer controls: orbit, zoom, object drag"`

### Task 8: Control cluster UI + pause/reset/shuffle

**Files:**
- Create: `src/site/ControlCluster.tsx`
- Modify: `src/site/Hero.tsx` (mount it, wire to `engineRef`)
- Modify: `src/site/playground/engine.ts` (`togglePause`, `reset`, `shuffle`)
- Modify: `src/site/site.css` (control cluster)

**Interfaces:**
- Produces: `ControlCluster.tsx`: `export function ControlCluster(props: { onZoomIn(): void; onZoomOut(): void; onRecenter(): void; onTogglePause(): void; paused: boolean; onReset(): void }): JSX.Element`.

- [ ] **Step 1:** Create `ControlCluster.tsx`: a vertical rounded bar of icon buttons — `+`, `−`, recenter (crosshair), pause/play (`⏸`/`▶`), reset (`↺`). Each is a real `<button>` with `aria-label`. `paused` toggles the pause icon.
- [ ] **Step 2:** In `engine.ts`: `togglePause()` flips a `paused` flag the loop checks (skips `controls.update` ambient + object tweens still run), returns new value. `reset()` = move every group back to `catalog[i].home`, `controls.recenter()`. `shuffle()` = assign each group a random free cell on a jittered grid, ease to it.
- [ ] **Step 3:** In `Hero.tsx` mount `<ControlCluster>` inside `.playground-stage`; wire handlers to `engineRef.current`. Track `paused` in `useState`, set from `togglePause()` return.
- [ ] **Step 4:** `site.css`: `.control-cluster{position:absolute;right:12px;top:50%;transform:translateY(-50%);display:flex;flex-direction:column;...}` with `--surface` bg, `--line` border, `--radius`.
- [ ] **Step 5:** Run `npm run build`. Expected: PASS.
- [ ] **Step 6:** `npm run dev`: every button works — zoom in/out, recenter, pause stops ambient motion, reset returns objects home, "Mix it up" in the explore bar shuffles.
- [ ] **Step 7:** Commit: `git commit -am "Control cluster: zoom, recenter, pause, reset, shuffle"`

---

## MILESTONE 4 — Play animations + selection wiring

### Task 9: Selection reducer (pure, TDD)

**Files:**
- Create: `src/site/playgroundState.ts`
- Test: `src/site/playgroundState.test.ts`

**Interfaces:**
- Produces: `export type PlaygroundState = { selectedId: PlaygroundId; discovered: ReadonlySet<PlaygroundId> }`; `export const initialPlaygroundState: PlaygroundState`; `export type PlaygroundAction = { type: 'select'; id: PlaygroundId } | { type: 'reset' }`; `export function playgroundReducer(s: PlaygroundState, a: PlaygroundAction): PlaygroundState`.

- [ ] **Step 1: Write the failing test** — `playgroundState.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { playgroundReducer, initialPlaygroundState } from './playgroundState'

describe('playgroundReducer', () => {
  it('selects and records discovery', () => {
    const s = playgroundReducer(initialPlaygroundState, { type: 'select', id: 'streaming' })
    expect(s.selectedId).toBe('streaming')
    expect(s.discovered.has('streaming')).toBe(true)
  })
  it('keeps discovered set growing, never shrinking on reselect', () => {
    let s = playgroundReducer(initialPlaygroundState, { type: 'select', id: 'streaming' })
    s = playgroundReducer(s, { type: 'select', id: 'cloud' })
    s = playgroundReducer(s, { type: 'select', id: 'streaming' })
    expect([...s.discovered].sort()).toEqual(['cloud', 'streaming'])
  })
  it('reset clears selection back to apis but preserves discovered', () => {
    let s = playgroundReducer(initialPlaygroundState, { type: 'select', id: 'cloud' })
    s = playgroundReducer(s, { type: 'reset' })
    expect(s.selectedId).toBe('apis')
    expect(s.discovered.has('cloud')).toBe(true)
  })
})
```

- [ ] **Step 2:** Run `npx vitest run src/site/playgroundState.test.ts`. Expected: FAIL.
- [ ] **Step 3:** Implement `playgroundState.ts`. `initialPlaygroundState = { selectedId: 'apis', discovered: new Set() }`. `select` → new Set with id added, `selectedId: id`. `reset` → `selectedId: 'apis'`, keep `discovered`.
- [ ] **Step 4:** Run the test. Expected: PASS.
- [ ] **Step 5:** Commit: `git commit -am "Pure playground selection reducer"`

### Task 10: Wire reducer through Hero + two-way engine sync

**Files:**
- Modify: `src/site/Hero.tsx` (use `useReducer`, bridge to engine)
- Modify: `src/site/playground/engine.ts` (guard select loop)

- [ ] **Step 1:** In `Hero.tsx` replace the stub `useState` with `useReducer(playgroundReducer, initialPlaygroundState)`. Pass `state.selectedId` to `<FeatureCard entry={byId(selectedId)}>`, `<ExploreBar selectedId={} discovered={}>`.
- [ ] **Step 2:** `onSelect` from the engine → `dispatch({type:'select', id})`. `ExploreBar onPick` and `FeatureCard onCta` → `engineRef.current?.select(id)` (or `.play(id)` for CTA when already selected).
- [ ] **Step 3:** `useEffect([state.selectedId])` → `if (engineRef.current) engineRef.current.select(state.selectedId)` — but engine's `select` must NOT re-emit `onSelect` when the id already matches its internal current (guard in `engine.ts`).
- [ ] **Step 4:** `onDiscover` currently also dispatches select; make `onDiscover` a no-op distinct callback used only for analytics-free counting — discovery is already implied by `select`. (Keep the callback in the type for clarity but have it do nothing in Hero.)
- [ ] **Step 5:** Run `npm run build` + `npx vitest run`. Expected: PASS.
- [ ] **Step 6:** `npm run dev`: clicking an object updates the card + counter + active tab; clicking a tab moves the camera to that object; no infinite loop.
- [ ] **Step 7:** Commit: `git commit -am "Wire selection reducer through hero and engine"`

### Task 11: Per-object play animations + focus + captions

**Files:**
- Create: `src/site/playground/animations.ts`
- Modify: `src/site/playground/engine.ts` (`play`, `select` calls `play`)
- Modify: `src/site/Hero.tsx` (bottom micro-caption from `entry.caption`)
- Modify: `src/site/data.ts` (`caption` per entry)

**Interfaces:**
- Produces: `animations.ts`: `export function playAnimation(id: PlaygroundId, group: THREE.Group, opts: { reducedMotion: boolean }): void` — starts a short self-contained tween (uses a tiny internal `requestAnimationFrame` ticker or a shared clock the engine passes; keep it dependency-free).

- [ ] **Step 1:** Create `animations.ts`. Each id gets one signature move (~700ms, eased):
  - `streaming`: screen material swaps to a colour-bar canvas texture + tiny flicker on emissiveIntensity.
  - `apis`: torus spins 1 turn + a pulse of scale.
  - `cloud`: LED dots blink in sequence, rack nudges.
  - `aviation`: plane arcs up and loops once, returns home.
  - `healthcare`: lid opens (rotation) and closes.
  - `logistics`: top container lifts, slides, restacks.
  `reducedMotion` ⇒ jump straight to the end/at-rest state (screen just turns on, no flicker/motion).
- [ ] **Step 2:** In `engine.ts` implement `play(id)` → `playAnimation(id, group, {reducedMotion})`. `select(id)` → ease camera focus toward the object AND `play(id)`.
- [ ] **Step 3:** Add `caption` strings to `data.ts` entries ("A new channel. Same curiosity.", etc.). In `Hero.tsx` render `entry.caption` in the bottom hint row's left slot; keep centre "Drag empty space to orbit · Scroll or pinch to zoom" and right "A closer look at the work ↓" (anchors to `#work`).
- [ ] **Step 4:** Run `npm run build` + `npx vitest run`. Expected: PASS.
- [ ] **Step 5:** `npm run dev`: click each object → its animation plays once; re-clicking the CTA replays; reduced-motion (DevTools emulate) shows calm end states. Capture a short screen recording for the review.
- [ ] **Step 6:** Commit: `git commit -am "Per-object play animations, camera focus, captions"`

---

## MILESTONE 5 — Journey timeline

### Task 12: Journey data + component

**Files:**
- Modify: `src/site/data.ts` (`JOURNEY`)
- Create: `src/site/Journey.tsx`
- Modify: `src/site/Site.tsx` (insert `<Journey/>` with `id="journey"` after the hero)
- Modify: `src/site/site.css` (timeline)
- Test: `src/site/journey.test.ts`

**Interfaces:**
- Produces: `data.ts`: `export type JourneyEntry = { start: string; end: string; company: string; role: string; blurb: string; industry: string }`; `export const JOURNEY: JourneyEntry[]` (GAC, Phoenix, Amadeus, Winsoft, Freelance — newest first). `Journey.tsx`: `export function Journey(): JSX.Element`.

- [ ] **Step 1: Write the failing test** — `journey.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { JOURNEY } from './data'

describe('JOURNEY', () => {
  it('is newest-first and fully populated', () => {
    expect(JOURNEY.length).toBeGreaterThanOrEqual(4)
    const years = JOURNEY.map((e) => parseInt(e.start.match(/\d{4}/)![0], 10))
    expect(years).toEqual([...years].sort((a, b) => b - a))
    for (const e of JOURNEY) {
      expect(e.company && e.role && e.blurb && e.industry).toBeTruthy()
    }
  })
})
```

- [ ] **Step 2:** Run `npx vitest run src/site/journey.test.ts`. Expected: FAIL.
- [ ] **Step 3:** Add `JOURNEY` to `data.ts` from `ROLES` + a 2018–2019 Freelance entry (industry "Retail systems").
- [ ] **Step 4:** Run the test. Expected: PASS.
- [ ] **Step 5:** Create `Journey.tsx`: a 2-col section — left intro (`.dual-heading` "Different industries. / *The same curiosity.*" + lead paragraph + `FULL STACK · PRODUCT THINKING · SYSTEMS` kicker), right an `<ol className="timeline">` of `<li>`: `.period` (`{start} – {end}`), `<h3>` company, `.role`, `<p>` blurb, `.chip` industry.
- [ ] **Step 6:** `site.css` `.timeline`: `position:relative`, `::before` vertical `--line` rule at left, each `li` `padding-left:32px` with a `::before` node dot (accent ring on `--bg`). Collapse to single column < 900px (rule moves to far left). Respect `prefers-reduced-motion` if adding a fade.
- [ ] **Step 7:** In `Site.tsx` insert `<Journey />` right after `<Hero />`. Update the Journey nav anchor.
- [ ] **Step 8:** Run `npm run build` + `npx vitest run`. Expected: PASS. Dev-check the timeline.
- [ ] **Step 9:** Commit: `git commit -am "Add Journey timeline section"`

---

## MILESTONE 6 — "Also on GitHub" fix

### Task 13: Equal-height repo cards + see-more

**Files:**
- Modify: `src/site/Site.tsx` (repos block → new `RepoCard` component)
- Create: `src/site/RepoCard.tsx`
- Modify: `src/site/site.css` (`.repos` grid, clamp, toggle button)
- Test: `src/site/RepoCard.test.tsx`

**Interfaces:**
- Produces: `RepoCard.tsx`: `export function RepoCard(props: { repo: Repo }): JSX.Element` (uses existing `Repo` type from `data.ts`).

- [ ] **Step 1: Write the failing test** — `RepoCard.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { RepoCard } from './RepoCard'

const longRepo = {
  name: 'ADMS Server for ZKTeco',
  href: 'https://github.com/mmd-rehan/ADMS-server-ZKTeco',
  blurb: 'A'.repeat(400),
  tags: ['PHP'],
  meta: '27 stars · 16 forks',
}

describe('RepoCard', () => {
  it('offers a See more toggle for a long blurb and expands on click', () => {
    render(<RepoCard repo={longRepo} />)
    const btn = screen.getByRole('button', { name: /see more/i })
    expect(btn).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(btn)
    expect(screen.getByRole('button', { name: /see less/i })).toHaveAttribute('aria-expanded', 'true')
  })
})
```

- [ ] **Step 2:** Add `@testing-library/react` + `@testing-library/jest-dom` to `devDependencies`, `npm install`. Add `import '@testing-library/jest-dom/vitest'` to a `vitest.setup.ts` and reference it in `vitest.config.ts` (`test.environment: 'jsdom'`, `setupFiles`). Install `jsdom`.
- [ ] **Step 3:** Run `npx vitest run src/site/RepoCard.test.tsx`. Expected: FAIL.
- [ ] **Step 4:** Create `RepoCard.tsx`: `useState(false)` expanded; blurb `<p className={expanded ? '' : 'clamp-3'}>`; a `<button aria-expanded={expanded}>` toggling, label "See more"/"See less", shown always when `repo.blurb.length > 180` (approx) — simplest: always render the button but hide via CSS when not needed; for the test, render it whenever blurb length > 180. `meta` line rendered in a footer `<div className="repo-meta">` (empty string if absent, so height still aligns).
- [ ] **Step 5:** Run the test. Expected: PASS.
- [ ] **Step 6:** `Site.tsx`: map `REPOS` to `<RepoCard>`. `site.css`: `.repos{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px}` each card `display:flex;flex-direction:column`; `.repo-meta{margin-top:auto}`; `.clamp-3{display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}`.
- [ ] **Step 7:** Run `npm run build` + `npx vitest run`. Expected: PASS. Dev-check all three cards are equal height, ADMS shows "See more".
- [ ] **Step 8:** Commit: `git commit -am "Equal-height repo cards with see-more toggle"`

---

## MILESTONE 7 — Fallback + cleanup + perf

### Task 14: WebGL/reduced-motion fallback + baked still

**Files:**
- Create: `src/site/playground/supportsWebGL.ts`
- Create: `scripts/bake-still.mjs`
- Create: `public/playground-still.webp` (generated)
- Modify: `src/site/playground/Playground.tsx` (fallback branch)
- Modify: `src/site/site.css` (`.playground-still`)

**Interfaces:**
- Produces: `supportsWebGL.ts`: `export function supportsWebGL(): boolean`.

- [ ] **Step 1:** Create `supportsWebGL.ts` (`try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')) } catch { return false }`).
- [ ] **Step 2:** In `Playground.tsx`: if `!supportsWebGL()` → render `<img className="playground-still" src="/playground-still.webp" alt="Isometric scene of six objects representing Rehan's work" />` and skip the engine import. The category tabs/card still work (they're in `Hero`, not `Playground`).
- [ ] **Step 3:** Create `scripts/bake-still.mjs`: launch the dev/preview build, use the existing Chrome automation or `playwright` if available — OR simplest: a manual note. If no headless tool is available, capture the still by hand from `npm run dev` and save it. (Document which was done.)
- [ ] **Step 4:** Run `npm run build`. Expected: PASS. Dev-check with WebGL disabled (DevTools) → still image shows, tabs still swap the card.
- [ ] **Step 5:** Commit: `git commit -am "WebGL fallback still for the playground"`

### Task 15: Delete dead cinematic code + prune deps

**Files:**
- Delete: `src/App.tsx`, `src/three/`, `src/ui/`, `src/hooks/`, `src/content/`, `src/lib/timeline.ts`, `src/lib/timeline.test.ts`, `src/lib/slicePhases.ts`, `src/lib/slicePhases.test.ts`, `src/lib/heroScroll.ts`
- Modify: `package.json` (remove `@react-three/fiber`, `@react-three/postprocessing`, `postprocessing`, `node-three-gltf`)
- Modify: any stale imports

- [ ] **Step 1:** `grep -rn "three/\|@react-three\|content/chapters\|content/profile\|lib/timeline\|lib/slicePhases\|lib/heroScroll\|from './App'\|three/Scene" src/` — confirm only the files being deleted reference each other.
- [ ] **Step 2:** Delete the files/dirs above. Keep `src/lib/rng.ts` and `src/lib/deviceTier.ts` only if the engine imports them; otherwise delete too.
- [ ] **Step 3:** `package.json`: remove the four deps. `npm install`.
- [ ] **Step 4:** Run `npm run build` + `npx vitest run`. Expected: PASS (fewer tests — the deleted `lib` tests are gone).
- [ ] **Step 5:** Commit: `git commit -am "Delete dead cinematic hero code and prune R3F deps"`

### Task 16: Perf pass + chunk measurement

**Files:**
- Modify: `vite.config.ts` (manualChunks if needed)
- Create: `docs/superpowers/plans/2026-09-10-playground-hero-perf.md` (results note)

- [ ] **Step 1:** `npm run build` and record the gzipped size of the chunk containing `three` (from Vite's build output). Confirm it is a separate async chunk (not in the entry). If it's in the entry, add `build.rollupOptions.output.manualChunks` to split `three` / `src/site/playground`.
- [ ] **Step 2:** Verify with `npm run preview` + DevTools Network (throttled "Fast 4G"): entry JS + CSS transfer, time to hero interactive, and that the 3D chunk loads *after* first paint.
- [ ] **Step 3:** On a mobile viewport (DevTools device emulation, 4× CPU throttle): scene stays ≥ ~30 fps while orbiting; loop parks when scrolled away.
- [ ] **Step 4:** Write the numbers into the perf note (entry size, 3D chunk gz size vs. the 150 KB budget, mobile fps). If over budget, note options (drop shadow map, `three` submodule imports, or reconsider engine) — this is the user's Q2 decision checkpoint.
- [ ] **Step 5:** Commit: `git commit -am "Perf pass: split the 3D chunk, record budget numbers"`

---

## Self-Review

**Spec coverage:**
- Interactive isometric playground — Tasks 5–11 ✓
- 6 objects + scenery — Task 6 ✓
- Click→animation+category+card+counter+caption — Tasks 9–11 ✓
- Drag objects / orbit / zoom — Task 7 ✓
- Control cluster (zoom/recenter/pause/reset) — Task 8 ✓
- "Mix it up" shuffle — Task 8 ✓
- Journey timeline — Task 12 ✓
- Visual system site-wide — Tasks 1, 4 ✓
- Nav relabel — Task 2 ✓
- "Also on GitHub" fix — Task 13 ✓
- Fallback (no-WebGL / reduced-motion) — Tasks 11, 14 ✓
- Delete dead code + prune deps — Task 15 ✓
- Chunk budget checkpoint — Task 16 ✓
- Lazy load / SSR safety — Task 5 ✓

**Placeholder scan:** Task 14 Step 3 (baking the still) depends on tooling availability — flagged inline with a fallback (manual capture), not left as "TBD".

**Type consistency:** `EngineHandle` / `EngineOptions` defined in Task 5, consumed in 7/8/10/11. `PlaygroundEntry` / `PlaygroundId` defined Task 3, used throughout. `playgroundReducer` signature fixed in Task 9, wired in Task 10. `Repo` type reused from existing `data.ts` in Task 13.
