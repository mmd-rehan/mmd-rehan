import {
  FEATURED_TESTIMONIAL,
  REFERENCES,
  TESTIMONIALS,
  type Testimonial,
} from './data'

const LINKEDIN_RECOMMENDATIONS =
  'https://www.linkedin.com/in/mmd-rehan/details/recommendations/'

/** "Athena Rahmatie" -> "AR". Stands in for a profile photo. */
function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
}

function Voice({ person }: { person: Testimonial }) {
  return (
    <figure className="voice">
      <blockquote>{person.quote}</blockquote>
      <figcaption>
        <span className="monogram" aria-hidden="true">
          {initials(person.name)}
        </span>
        <span className="voice-who">
          <strong>{person.name}</strong>
          <span>{person.role}</span>
          <span className="voice-rel">{person.relationship}</span>
        </span>
      </figcaption>
    </figure>
  )
}

export function Testimonials() {
  return (
    <section id="testimonials" className="section voices">
      <div className="section-heading">
        <div>
          <p className="eyebrow">IN THEIR WORDS</p>
          <h2>
            People I’ve
            <br />
            <em>worked with.</em>
          </h2>
        </div>
        <p>
          Recommendations from colleagues and managers across Amadeus, Winsoft Solutions, and the
          teams in between.
        </p>
      </div>

      <figure className="featured-voice">
        <span className="quote-mark" aria-hidden="true">
          “
        </span>
        <blockquote>{FEATURED_TESTIMONIAL.quote}</blockquote>
        <figcaption>
          <strong>{FEATURED_TESTIMONIAL.name}</strong>
          <span>{FEATURED_TESTIMONIAL.role}</span>
        </figcaption>
      </figure>

      <div className="voice-grid">
        {TESTIMONIALS.map((person) => (
          <Voice key={person.name} person={person} />
        ))}
      </div>

      <a
        className="text-link voices-link"
        href={LINKEDIN_RECOMMENDATIONS}
        target="_blank"
        rel="noopener noreferrer"
      >
        All recommendations on LinkedIn <span aria-hidden="true">↗</span>
      </a>

      <div className="references">
        <div className="references-head">
          <p className="eyebrow">WRITTEN REFERENCES</p>
          <p className="ref-note">
            Summarised from signed recommendation letters. Full letters available on request.
          </p>
        </div>
        <ul className="ref-list">
          {REFERENCES.map((ref) => (
            <li key={ref.name}>
              <div className="ref-who">
                <strong>{ref.name}</strong>
                <span>{ref.title}</span>
                <span className="ref-context">{ref.context}</span>
              </div>
              <p>{ref.summary}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
