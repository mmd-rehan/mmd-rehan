type Props = {
  onZoomIn: () => void
  onZoomOut: () => void
  onRecenter: () => void
  onTogglePause: () => void
  paused: boolean
  onReset: () => void
}

export function ControlCluster({
  onZoomIn,
  onZoomOut,
  onRecenter,
  onTogglePause,
  paused,
  onReset,
}: Props) {
  return (
    <div className="control-cluster" role="group" aria-label="Scene controls">
      <button type="button" onClick={onZoomIn} aria-label="Zoom in">
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <path d="M8 3v10M3 8h10" />
        </svg>
      </button>
      <button type="button" onClick={onZoomOut} aria-label="Zoom out">
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <path d="M3 8h10" />
        </svg>
      </button>
      <button type="button" onClick={onRecenter} aria-label="Recenter view">
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <path d="M8 2v3M8 11v3M2 8h3M11 8h3" />
          <circle cx="8" cy="8" r="2.4" />
        </svg>
      </button>
      <button
        type="button"
        onClick={onTogglePause}
        aria-pressed={paused}
        aria-label={paused ? 'Resume motion' : 'Pause motion'}
      >
        {paused ? (
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path d="M5 3l8 5-8 5z" fill="currentColor" stroke="none" />
          </svg>
        ) : (
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path d="M5.5 3v10M10.5 3v10" />
          </svg>
        )}
      </button>
      <button type="button" onClick={onReset} aria-label="Reset the scene">
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <path d="M3.5 8a4.5 4.5 0 1 0 1.4-3.3M4 3v2.6h2.6" />
        </svg>
      </button>
    </div>
  )
}
