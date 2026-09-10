const LINKS = [
  { href: '#playground', label: 'Playground' },
  { href: '#work', label: 'Work' },
  { href: '#journey', label: 'Journey' },
  { href: '#about', label: 'About' },
]

export function Nav() {
  return (
    <header className="site-nav">
      <a className="site-nav__brand" href="#top" aria-label="Muhammad Rehan — home">
        <span className="brand-mark">
          mr<span>.</span>
        </span>
        <span className="site-nav__lockup" aria-hidden="true">
          <span>Muhammad Rehan</span>
          <span>Software Engineer</span>
        </span>
      </a>

      <nav aria-label="Main navigation">
        {LINKS.map((link) => (
          <a key={link.href} href={link.href}>
            {link.label}
          </a>
        ))}
      </nav>

      <a className="site-nav__cta" href="mailto:hi@mmd-rehan.com">
        Let&rsquo;s talk <span aria-hidden="true">↗</span>
      </a>
    </header>
  )
}
