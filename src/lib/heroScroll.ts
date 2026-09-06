/**
 * The cinematic hero timeline (t ∈ [0,1]) is scrubbed by scrolling through one
 * tall spacer at the top of the page. Everything below that spacer is the
 * normal readable site and must NOT move the timeline — so scroll progress is
 * measured against the spacer's span, not the whole document.
 *
 * Both the scroll hook (which drives the WebGL) and the header's "jump to
 * chapter" buttons import this, so they agree on exactly where t = 1 lands.
 */
export const HERO_SPACER_ID = 'hero-scroll-room'

/** Pixels of vertical scroll that map to the full hero timeline (t: 0 → 1). */
export function heroScrollRange(): number {
  if (typeof document === 'undefined') return 1
  const el = document.getElementById(HERO_SPACER_ID)
  if (!el) {
    return Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
  }
  const top = el.getBoundingClientRect().top + window.scrollY
  return Math.max(1, top + el.offsetHeight - window.innerHeight)
}
