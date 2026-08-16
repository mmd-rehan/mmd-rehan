import { CHAPTERS, CONTACT, type Chapter } from '../content/chapters'

interface ChapterTextProps {
  activeIndex: number
}

/**
 * Left-column chapter block. All chapters are rendered as real DOM (good for
 * SEO + screen readers); only the active one is visible, the rest fade out.
 * The final chapter reveals the contact actions.
 */
export function ChapterText({ activeIndex }: ChapterTextProps) {
  return (
    <div className="chapters" aria-live="polite">
      {CHAPTERS.map((chapter, i) => (
        <article
          key={chapter.id}
          className={`chapter ${i === activeIndex ? 'chapter--active' : ''}`}
          aria-hidden={i !== activeIndex}
        >
          <p className="chapter__eyebrow">{chapter.eyebrow}</p>
          <h2 className="chapter__headline">{chapter.headline}</h2>
          <p className="chapter__proof">{chapter.proof}</p>
          {chapter.id === 'contact' && <ContactActions />}
        </article>
      ))}
    </div>
  )
}

function ContactActions() {
  return (
    <div className="chapter__actions">
      <a className="btn btn--primary" href={`mailto:${CONTACT.email}`}>
        Email me
      </a>
      <a
        className="btn btn--ghost"
        href={CONTACT.linkedin}
        target="_blank"
        rel="noreferrer"
      >
        LinkedIn
      </a>
    </div>
  )
}

/** Used by the no-WebGL / calm fallback: same content, stacked and static. */
export function ChapterSection({ chapter }: { chapter: Chapter }) {
  return (
    <section className="fallback-section" id={chapter.id}>
      <p className="chapter__eyebrow">{chapter.eyebrow}</p>
      <h2 className="chapter__headline">{chapter.headline}</h2>
      <p className="chapter__proof">{chapter.proof}</p>
      {chapter.id === 'contact' && <ContactActions />}
    </section>
  )
}
