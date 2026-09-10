import { Hero } from './Hero'
import { Nav } from './Nav'
import { Project } from './Project'
import { Testimonials } from './Testimonials'
import { REPOS, ROLES, TOOLKIT } from './data'

const CorsArt = (
  <div className="project-art cors-art">
    <div className="code-window">
      <div className="window-bar">
        <span>request.ts</span>
        <span>TypeScript</span>
      </div>
      <pre>
        <span className="code-purple">const</span> response = <span className="code-purple">await</span> fetch(
        {'\n  '}
        <span className="code-green">proxyUrl</span>, {'{'}
        {'\n    headers: {\n      '}
        <span className="code-green">'Authorization'</span>: token
        {'\n    }\n  }\n);'}
      </pre>
      <div className="response">
        <span>200 OK</span> Request connected.
      </div>
    </div>
    <span className="art-caption">A CLEARER PATH FOR YOUR REQUESTS</span>
  </div>
)

const TvArt = (
  <div className="project-art tv-art">
    <div className="tv-word">
      NoBox<span>TV</span>
      <i>Television. In your browser.</i>
    </div>
    <div className="signal-lines" aria-hidden="true" />
    <span className="art-caption">OPEN STREAMS. ONE PLACE TO WATCH.</span>
  </div>
)

export default function Site() {
  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>

      <Nav />
      <a id="top" />


      <main id="main">
        <Hero />

        <section id="work" className="section work">
          <div className="section-heading">
            <div>
              <p className="eyebrow">INDEPENDENT WORK</p>
              <h2>
                Problems worth
                <br />
                <em>building for.</em>
              </h2>
            </div>
            <p>
              My own products are where I take an idea all the way from the first commit to the
              systems behind it.
            </p>
          </div>
          <div className="projects">
            <Project
              art={CorsArt}
              title="FixCors"
              href="https://fixcors.com"
              blurb="A developer utility for getting past CORS integration friction, with controlled API proxying."
              tags={['Developer tools', 'API infrastructure', 'Founder']}
              detail="I designed and built FixCors as an independent micro-SaaS. The engineering work covers request handling, access controls, rate limits, and the operational demands of a proxy service."
            />
            <Project
              art={TvArt}
              title="NoBoxTV"
              href="https://noboxtv.com"
              blurb="Free browser-based television built around public IPTV streams and a controlled playback architecture."
              tags={['NestJS', 'HLS / MediaMTX', 'Independent product']}
              detail="I separated playback authorization from media delivery. A NestJS and MySQL control plane selects sources and issues signed URLs; Nginx and MediaMTX handle the HLS streams. The architecture keeps source handling behind a controlled playback interface."
            />
          </div>

          <div className="repos">
            <p className="eyebrow repos-label">ALSO ON GITHUB</p>
            <div className="repo-grid">
              {REPOS.map((repo) => (
                <article className="repo" key={repo.name}>
                  <div className="repo-head">
                    <h3>{repo.name}</h3>
                    <a
                      href={repo.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${repo.name} on GitHub`}
                    >
                      ↗
                    </a>
                  </div>
                  <p>{repo.blurb}</p>
                  {repo.meta && <p className="repo-meta">{repo.meta}</p>}
                  <div className="tags">
                    {repo.tags.map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="experience" className="section experience">
          <div className="section-heading">
            <div>
              <p className="eyebrow">THE PROFESSIONAL CHAPTERS</p>
              <h2>
                Different industries.
                <br />
                <em>Same ownership.</em>
              </h2>
            </div>
            <p>
              I move between the interface, the API, and the deployment pipeline to solve the
              problem in front of me.
            </p>
          </div>
          <div className="timeline">
            {ROLES.map((role) => (
              <details key={role.company} open={role.open}>
                <summary>
                  <span className="years">{role.years}</span>
                  <span className="job">
                    <strong>{role.company}</strong>
                    <span>{role.title}</span>
                  </span>
                  <span className="industry">{role.industry}</span>
                  <span className="expand">+</span>
                </summary>
                <div className="job-body">
                  <p>{role.body}</p>
                  {role.outcomes && (
                    <div className="outcomes">
                      {role.outcomes.map((o) => (
                        <div key={o.label}>
                          <strong>{o.figure}</strong>
                          <span>{o.label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {role.sourceNote && <p className="source-note">{role.sourceNote}</p>}
                  <div className="tags">
                    {role.tags.map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                </div>
              </details>
            ))}
          </div>
        </section>

        <section id="about" className="section about">
          <div className="about-intro">
            <p className="eyebrow">A BIT ABOUT ME</p>
            <h2>
              Curiosity is
              <br />
              the <em>constant.</em>
            </h2>
            <p>
              I’m Muhammad Rehan, a software engineer based in Dubai. I started with computer
              science at COMSATS and kept following interesting problems, from robotics projects to
              systems used in healthcare, travel, and logistics.
            </p>
            <p>
              I enjoy the whole process: understanding what people need, making the interface feel
              right, and making sure the system underneath holds up. Outside my day job, I build
              products, contribute to open source, and write about what I learn.
            </p>
            <a
              className="text-link"
              href="https://medium.com/@mrrehan"
              target="_blank"
              rel="noopener noreferrer"
            >
              Read my writing <span aria-hidden="true">↗</span>
            </a>
          </div>
          <div className="about-side">
            <div className="toolkit">
              <p className="eyebrow">MY WORKING TOOLKIT</p>
              <dl>
                {TOOLKIT.map((entry) => (
                  <div key={entry.group}>
                    <dt>{entry.group}</dt>
                    <dd>
                      {entry.items.map((line, n) => (
                        <span key={line}>
                          {n > 0 && <br />}
                          {line}
                        </span>
                      ))}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="recognition">
              <p className="eyebrow">ALONG THE WAY</p>
              <p>
                <strong>2nd runner-up</strong>
                <br />
                HCLTech Hack2Hire 2.0 · 2025
              </p>
              <p>
                <strong>Kanz AI Hackathon participant</strong>
                <br />
                Part of the Guinness World Records event for the largest online AI lesson.
              </p>
              <p>
                <strong>BSc Computer Science</strong>
                <br />
                COMSATS · 2018
              </p>
            </div>
          </div>
        </section>

        <Testimonials />

        <section id="contact" className="section contact">
          <p className="eyebrow">NEXT CONVERSATION</p>
          <h2>
            Have something
            <br />
            <em>worth building?</em>
          </h2>
          <a className="email" href="mailto:hi@mmd-rehan.com">
            hi@mmd-rehan.com <span aria-hidden="true">↗</span>
          </a>
          <div className="contact-bottom">
            <p>
              For engineering opportunities, collaborations,
              <br />
              or a conversation about your next product.
            </p>
            <div>
              <a href="https://www.linkedin.com/in/mmd-rehan" target="_blank" rel="noopener noreferrer">
                LinkedIn ↗
              </a>
              <a href="https://github.com/mmd-rehan" target="_blank" rel="noopener noreferrer">
                GitHub ↗
              </a>
              <a href="https://medium.com/@mrrehan" target="_blank" rel="noopener noreferrer">
                Medium ↗
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <a className="brand" href="#">
          mr<span>.</span>
        </a>
        <p>© {new Date().getFullYear()} Muhammad Rehan</p>
        <a href="#">Back to top ↑</a>
      </footer>
    </>
  )
}
