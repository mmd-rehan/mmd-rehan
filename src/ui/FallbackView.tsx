import { CHAPTERS, CONTACT } from '../content/chapters'
import { ChapterSection } from './ChapterText'

interface FallbackViewProps {
  /** Show the portrait image if available (no-WebGL path). */
  showPortrait: boolean
  reason: 'no-webgl' | 'calm'
}

/**
 * Static, fully readable version of the portfolio - used when WebGL is
 * unavailable or the visitor prefers reduced motion / calm mode. Same copy,
 * no scroll-scrubbing, no GPU. The site communicates everything with the
 * fireworks off.
 */
export function FallbackView({ showPortrait, reason }: FallbackViewProps) {
  return (
    <main className="fallback">
      <section className="fallback-hero">
        {showPortrait && (
          <img
            className="fallback-hero__img"
            src="/portrait-real.jpg"
            alt={`${CONTACT.name}, ${CONTACT.title}`}
            width={220}
            height={308}
          />
        )}
        <p className="chapter__eyebrow">
          {CONTACT.title} · {CONTACT.location}
        </p>
        <h1 className="fallback-hero__title">The same hands, every system.</h1>
        <p className="chapter__proof">
          Software engineer, seven years — healthcare, aviation, crypto infrastructure,
          logistics. Frontend to DevOps.
        </p>
        {reason === 'calm' && (
          <p className="fallback-note">Calm mode is on - motion is reduced.</p>
        )}
      </section>

      {CHAPTERS.filter((c) => c.id !== 'intro').map((chapter) => (
        <ChapterSection key={chapter.id} chapter={chapter} />
      ))}
    </main>
  )
}
