/** Lightweight loader shown while the particle targets are being built. */
export function Loader() {
  return (
    <div className="loader" role="status" aria-live="polite">
      <span className="loader__spark" aria-hidden="true">
        ✦
      </span>
      <span className="loader__label">Assembling…</span>
    </div>
  )
}
