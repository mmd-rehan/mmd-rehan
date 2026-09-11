import { Minus, Pause, Play, Plus, Rotate3d, RotateCcw } from './Icons'

type Props = {
  paused: boolean
  orbiting: boolean
  ready: boolean
  onZoomIn: () => void
  onZoomOut: () => void
  onToggleOrbit: () => void
  onTogglePause: () => void
  onReset: () => void
}

/** The vertical rail of view controls floating over the right of the desk. */
export function ControlCluster({
  paused,
  orbiting,
  ready,
  onZoomIn,
  onZoomOut,
  onToggleOrbit,
  onTogglePause,
  onReset,
}: Props) {
  return (
    <div className="scene-toolbar" role="group" aria-label="3D view controls">
      <button className="tool-button" type="button" disabled={!ready} onClick={onZoomIn} aria-label="Zoom in">
        <Plus />
      </button>
      <button className="tool-button" type="button" disabled={!ready} onClick={onZoomOut} aria-label="Zoom out">
        <Minus />
      </button>
      <span className="toolbar-rule" />
      <button
        className="tool-button"
        type="button"
        disabled={!ready}
        onClick={onToggleOrbit}
        aria-pressed={orbiting}
        aria-label="Orbit the desk"
      >
        <Rotate3d />
      </button>
      <button
        className="tool-button"
        type="button"
        disabled={!ready}
        onClick={onTogglePause}
        aria-pressed={paused}
        aria-label={paused ? 'Resume motion' : 'Pause motion'}
      >
        {paused ? <Play /> : <Pause />}
      </button>
      <button className="tool-button" type="button" disabled={!ready} onClick={onReset} aria-label="Reset desk">
        <RotateCcw />
      </button>
    </div>
  )
}
