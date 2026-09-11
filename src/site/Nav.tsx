import { useEffect, useState } from 'react'
import { ArrowUpRight } from './Icons'

const LINKS = [
  { href: '#playground', id: 'playground', label: 'Playground' },
  { href: '#work', id: 'work', label: 'Work' },
  { href: '#journey', id: 'journey', label: 'Journey' },
  { href: '#about', id: 'about', label: 'About' },
]

/** Underlines whichever section is currently under the sticky nav. */
function useActiveSection(): string {
  const [active, setActive] = useState('playground')

  useEffect(() => {
    const sections = LINKS.map((l) => document.getElementById(l.id)).filter(
      (el): el is HTMLElement => Boolean(el),
    )
    if (!sections.length) return

    // Whichever section's top has most recently passed under the nav wins, so
    // the state stays right even after a jump to an anchor far down the page.
    const pickActive = () => {
      const line = 120
      let current = sections[0]
      for (const el of sections) {
        if (el.getBoundingClientRect().top <= line) current = el
      }
      setActive(current.id)
    }

    let queued = 0
    const onScroll = () => {
      if (queued) return
      queued = requestAnimationFrame(() => {
        queued = 0
        pickActive()
      })
    }

    pickActive()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      if (queued) cancelAnimationFrame(queued)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  return active
}

export function Nav() {
  const active = useActiveSection()

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
          <a
            key={link.href}
            href={link.href}
            className={link.id === active ? 'nav-active' : undefined}
            aria-current={link.id === active ? 'page' : undefined}
          >
            {link.label}
          </a>
        ))}
      </nav>

      <a className="site-nav__cta" href="mailto:hi@mmd-rehan.com">
        Let&rsquo;s talk <ArrowUpRight size={15} />
      </a>
    </header>
  )
}
