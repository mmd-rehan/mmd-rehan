import type { PlaygroundEntry, PlaygroundId } from './data'
import { ArrowRight, ArrowUpRight, Container, HeartPulse, Network, Plane, Play, Server, Tv , type IconProps } from './Icons'

const SYMBOL: Record<PlaygroundId, (props: IconProps) => JSX.Element> = {
  apis: () => <Network size={17} strokeWidth={1.8} />,
  streaming: () => <Tv size={17} strokeWidth={1.8} />,
  healthcare: () => <HeartPulse size={17} strokeWidth={1.8} />,
  aviation: () => <Plane size={17} strokeWidth={1.8} />,
  logistics: () => <Container size={17} strokeWidth={1.8} />,
  cloud: () => <Server size={17} strokeWidth={1.8} />,
}

type Props = {
  entry: PlaygroundEntry
  ready: boolean
  onCta: () => void
}

/** The card under the headline, describing whichever object is selected. */
export function FeatureCard({ entry, ready, onCta }: Props) {
  const external = entry.storyHref.startsWith('http')
  const Symbol = SYMBOL[entry.id]
  return (
    <article className="object-card" aria-live="polite">
      <div className="object-card-top">
        <span className="object-symbol" aria-hidden="true">
          <Symbol />
        </span>
        <span className="eyebrow">{entry.eyebrow}</span>
        <a
          className="plain-icon"
          href={entry.storyHref}
          aria-label={`Read about ${entry.project}`}
          {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        >
          <ArrowUpRight />
        </a>
      </div>
      <h2>{entry.title}</h2>
      <p>{entry.body}</p>
      <div className="object-actions">
        <button className="primary-button" type="button" disabled={!ready} onClick={onCta}>
          <Play size={13} />
          {entry.cta}
        </button>
        <a
          className="story-button"
          href={entry.storyHref}
          {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        >
          The story <ArrowRight />
        </a>
      </div>
    </article>
  )
}
