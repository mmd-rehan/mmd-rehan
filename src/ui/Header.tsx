import { CONTACT, NAV_ITEMS, CHAPTERS } from '../content/chapters'
import { heroScrollRange } from '../lib/heroScroll'

interface HeaderProps {
  calm: boolean
  onToggleCalm: () => void
}

type NavItem = (typeof NAV_ITEMS)[number]

/**
 * Nav click. `chapter` items scrub the hero timeline to the middle of that
 * chapter's slice (by scrolling the window into the hero spacer); `section`
 * items scroll to a content anchor in the readable site below the hero.
 */
function handleNav(item: NavItem) {
  if (item.kind === 'section') {
    document
      .getElementById(item.target)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    return
  }
  const chapter = CHAPTERS.find((c) => c.target === item.target)
  if (!chapter) return
  const mid = (chapter.start + Math.min(chapter.end, 1)) / 2
  window.scrollTo({ top: heroScrollRange() * mid, behavior: 'smooth' })
}

/**
 * Fixed top chrome: sparkle logo + wordmark (left), pill nav (center),
 * contact pill + calm-mode toggle (right). Stays visible over the whole page.
 */
export function Header({ calm, onToggleCalm }: HeaderProps) {
  return (
    <header className="header">
      <a className="brand" href="#top" aria-label={`${CONTACT.name}, home`}>
        <span className="brand__spark" aria-hidden="true">
          ✦
        </span>
        <span className="brand__name">{CONTACT.name}</span>
      </a>

      <nav className="nav" aria-label="Sections">
        <ul className="nav__pill">
          {NAV_ITEMS.map((item) => (
            <li key={item.label}>
              <button
                type="button"
                className="nav__link"
                onClick={() => handleNav(item)}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="header__right">
        <a className="pill pill--contact" href={`mailto:${CONTACT.email}`}>
          Contact
        </a>
        <button
          type="button"
          className={`calm-toggle ${calm ? 'calm-toggle--on' : ''}`}
          onClick={onToggleCalm}
          aria-pressed={calm}
          title={calm ? 'Calm mode on - motion reduced' : 'Calm mode off'}
        >
          <span aria-hidden="true">{calm ? '◐' : '●'}</span>
          <span className="visually-hidden">Toggle calm mode</span>
        </button>
      </div>
    </header>
  )
}
