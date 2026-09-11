import type { PlaygroundEntry, PlaygroundId } from './data'
import { Container, HeartPulse, Network, Plane, Server, Shuffle, Tv , type IconProps } from './Icons'

const ICON: Record<PlaygroundId, (props: IconProps) => JSX.Element> = {
  apis: Network,
  streaming: Tv,
  healthcare: HeartPulse,
  aviation: Plane,
  logistics: Container,
  cloud: Server,
}

type Props = {
  entries: PlaygroundEntry[]
  selectedId: PlaygroundId
  discovered: ReadonlySet<PlaygroundId>
  onPick: (id: PlaygroundId) => void
  onShuffle: () => void
}

/** The dock under the desk — one button per object, plus a shuffle. */
export function ExploreBar({ entries, selectedId, discovered, onPick, onShuffle }: Props) {
  return (
    <section className="desk-console" aria-label="Choose a 3D object">
      <div className="console-label">
        <span className="eyebrow">EXPLORE MY WORLD</span>
        <span>
          {discovered.size} of {entries.length} discovered
        </span>
      </div>

      <div className="object-dock">
        {entries.map((entry) => {
          const Icon = ICON[entry.id]
          const selected = entry.id === selectedId
          return (
            <button
              key={entry.id}
              type="button"
              className={selected ? 'dock-item selected' : 'dock-item'}
              aria-pressed={selected}
              onClick={() => onPick(entry.id)}
            >
              <Icon />
              <span>{entry.category}</span>
            </button>
          )
        })}
      </div>

      <button className="shuffle-button" type="button" onClick={onShuffle}>
        <Shuffle />
        <span>Mix it up</span>
      </button>
    </section>
  )
}
