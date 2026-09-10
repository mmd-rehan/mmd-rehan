import type { PlaygroundEntry } from './data'

type Props = {
  entry: PlaygroundEntry
  onCta: () => void
}

export function FeatureCard({ entry, onCta }: Props) {
  const external = entry.storyHref.startsWith('http')
  return (
    <article className="feature-card" aria-live="polite">
      <p className="feature-card__eyebrow">
        <span className="feature-card__dot" aria-hidden="true" />
        {entry.eyebrow}
      </p>
      <h2 className="feature-card__title">{entry.title}</h2>
      <p className="feature-card__body">{entry.body}</p>
      <div className="feature-card__actions">
        <button type="button" className="btn btn--primary" onClick={onCta}>
          <span aria-hidden="true">▶</span> {entry.cta}
        </button>
        <a
          className="feature-card__story"
          href={entry.storyHref}
          {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        >
          The story <span aria-hidden="true">→</span>
        </a>
      </div>
    </article>
  )
}
