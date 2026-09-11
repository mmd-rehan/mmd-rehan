import { JOURNEY } from './data'

export function Journey() {
  return (
    <section id="journey" className="section journey">
      <div className="journey__grid">
        <div className="journey__intro">
          <p className="eyebrow">THE JOURNEY</p>
          <h2 className="dual-heading">
            <span>Different industries.</span>
            <em>The same curiosity.</em>
          </h2>
          <p>
            From patient records to airline journeys and global logistics, I&rsquo;ve spent
            7+ years turning complex requirements into software people can use.
          </p>
          <p className="journey__kicker">FULL STACK · PRODUCT THINKING · SYSTEMS</p>
        </div>

        <ol className="timeline-list">
          {JOURNEY.map((entry) => (
            <li key={entry.company} className={entry.current ? 'is-current' : undefined}>
              <span className="timeline-list__period">
                {entry.start} &ndash; {entry.end}
              </span>
              <div className="timeline-list__title">
                <h3>{entry.company}</h3>
                {entry.current && <span className="timeline-list__now">Current</span>}
              </div>
              <p className="timeline-list__role">{entry.role}</p>
              <p className="timeline-list__blurb">{entry.blurb}</p>
              <span className="chip">{entry.industry}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
