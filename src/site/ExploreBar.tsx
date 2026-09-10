import type { PlaygroundEntry, PlaygroundId } from './data'

type Props = {
  entries: PlaygroundEntry[]
  selectedId: PlaygroundId
  discovered: ReadonlySet<PlaygroundId>
  onPick: (id: PlaygroundId) => void
  onShuffle: () => void
}

export function ExploreBar({ entries, selectedId, discovered, onPick, onShuffle }: Props) {
  return (
    <div className="explore-bar">
      <div className="explore-bar__label">
        <span>EXPLORE MY WORLD</span>
        <span className="explore-bar__count">
          {discovered.size} of {entries.length} discovered
        </span>
      </div>

      <div className="explore-bar__tabs" role="tablist" aria-label="Playground categories">
        {entries.map((entry) => (
          <button
            key={entry.id}
            type="button"
            role="tab"
            aria-selected={entry.id === selectedId}
            className={
              'explore-bar__tab' + (entry.id === selectedId ? ' is-active' : '')
            }
            onClick={() => onPick(entry.id)}
          >
            {entry.category}
          </button>
        ))}
      </div>

      <button type="button" className="explore-bar__shuffle" onClick={onShuffle}>
        <span aria-hidden="true">↔</span> Mix it up
      </button>
    </div>
  )
}
