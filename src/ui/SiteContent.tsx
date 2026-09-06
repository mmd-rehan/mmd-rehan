import { CONTACT } from '../content/chapters'
import { IMPACT, TRAITS, EXPERIENCE, WORK, RECOGNITION } from '../content/profile'

/**
 * The readable site below the cinematic hero. Plain semantic DOM, dark theme,
 * no WebGL. Rendered in both the immersive and the fallback paths — this is the
 * actual content and it has to stand on its own with the animation off.
 *
 * `underHero` pulls it up beneath the fixed hero layer (immersive path only);
 * the fallback renders it in normal flow.
 */
export function SiteContent({ underHero = false }: { underHero?: boolean }) {
  return (
    <div className={`site ${underHero ? 'site--under-hero' : ''}`} id="site">
      <AboutSection />
      <ExperienceSection />
      <WorkSection />
      <RecognitionSection />
      <ContactSection />
      <SiteFooter />
    </div>
  )
}

function AboutSection() {
  return (
    <section id="about" className="section" aria-label="About">
      <div className="section__inner">
        <p className="section__kicker">About</p>
        <h2 className="section__title">
          A software engineer who ships the whole signal path.
        </h2>
        <div className="prose">
          <p>
            Seven years building production software across healthcare, aviation,
            crypto infrastructure and logistics — frontend, backend, mobile, and
            the DevOps underneath. Based in Dubai, working across multicultural
            teams in one of the world&rsquo;s busiest hubs.
          </p>
          <p>
            The through-line is systems where correctness matters and the work
            has to outlast the sprint that produced it.
          </p>
        </div>

        <ul className="cardgrid">
          {IMPACT.map((item) => (
            <li key={item.label} className="card">
              <h3 className="card__title">{item.label}</h3>
              <p className="card__body">{item.body}</p>
            </li>
          ))}
        </ul>

        <div className="traits">
          <p className="section__kicker">How I work</p>
          <dl className="traits__list">
            {TRAITS.map((trait) => (
              <div key={trait.label} className="traits__row">
                <dt>{trait.label}</dt>
                <dd>{trait.body}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  )
}

function ExperienceSection() {
  return (
    <section id="experience" className="section" aria-label="Experience">
      <div className="section__inner">
        <p className="section__kicker">Experience</p>
        <h2 className="section__title">Where the hours went.</h2>
        <ol className="timeline">
          {EXPERIENCE.map((entry) => (
            <li key={entry.company + entry.period} className="entry">
              <div className="entry__head">
                <h3 className="entry__company">{entry.company}</h3>
                <span className="entry__period">{entry.period}</span>
              </div>
              <p className="entry__role">
                {entry.role} · {entry.location}
              </p>
              <p className="entry__summary">{entry.summary}</p>
              <ul className="entry__highlights">
                {entry.highlights.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

function WorkSection() {
  return (
    <section id="work" className="section" aria-label="Selected work">
      <div className="section__inner">
        <p className="section__kicker">Selected work</p>
        <h2 className="section__title">Things I&rsquo;ve built and run.</h2>
        <ul className="worklist">
          {WORK.map((w) => (
            <li key={w.name} className="work">
              <WorkCard item={w} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function WorkCard({ item }: { item: (typeof WORK)[number] }) {
  const body = (
    <>
      <div className="work__head">
        <h3 className="work__name">{item.name}</h3>
        <span className="work__tag">{item.tag}</span>
      </div>
      <p className="work__summary">{item.summary}</p>
      {item.url ? (
        <span className="work__link">{item.url.replace(/^https?:\/\//, '')} ↗</span>
      ) : (
        item.slot && <span className="work__slot">Case study in progress</span>
      )}
    </>
  )

  if (item.url) {
    return (
      <a
        className="work__card work__card--link"
        href={item.url}
        target="_blank"
        rel="noreferrer"
      >
        {body}
      </a>
    )
  }
  return <div className="work__card">{body}</div>
}

function RecognitionSection() {
  return (
    <section id="recognition" className="section" aria-label="Recognition">
      <div className="section__inner">
        <p className="section__kicker">Recognition</p>
        <h2 className="section__title">Certifications &amp; competitions.</h2>
        <ul className="reclist">
          {RECOGNITION.map((r) => (
            <li key={r.title} className="rec">
              <span className="rec__year">{r.year}</span>
              <span className="rec__body">
                <span className="rec__title">{r.title}</span>
                <span className="rec__issuer">{r.issuer}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function ContactSection() {
  const telHref = `tel:${CONTACT.phone.replace(/[^\d+]/g, '')}`
  return (
    <section id="contact" className="section section--contact" aria-label="Contact">
      <div className="section__inner">
        <p className="section__kicker">Contact</p>
        <h2 className="section__title">
          Building something where correctness matters?
        </h2>
        <div className="contact__actions">
          <a className="btn btn--primary" href={`mailto:${CONTACT.email}`}>
            {CONTACT.email}
          </a>
          <a className="btn btn--ghost" href={telHref}>
            {CONTACT.phone}
          </a>
        </div>
        <div className="contact__links">
          <a href={CONTACT.linkedin} target="_blank" rel="noreferrer">
            LinkedIn ↗
          </a>
          <a href={CONTACT.medium} target="_blank" rel="noreferrer">
            Medium ↗
          </a>
        </div>
        <p className="contact__loc">{CONTACT.location}</p>
      </div>
    </section>
  )
}

function SiteFooter() {
  return (
    <footer className="site-footer">
      <span className="brand__spark" aria-hidden="true">
        ✦
      </span>
      <span>
        {CONTACT.name} — {CONTACT.title}, {CONTACT.location}
      </span>
      <span className="site-footer__year">© {new Date().getFullYear()}</span>
    </footer>
  )
}
