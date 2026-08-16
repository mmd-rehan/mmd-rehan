import { CONTACT, NAV_ITEMS, CHAPTERS } from '../content/chapters'

interface HeaderProps {
  calm: boolean
  onToggleCalm: () => void
}

/** Smooth-scroll the window so global progress lands mid-way through a chapter. */
function scrollToChapter(chapterId: string) {
  const chapter = CHAPTERS.find((c) => c.id === chapterId)
  if (!chapter) return
  const mid = (chapter.start + Math.min(chapter.end, 1)) / 2
  const max = document.documentElement.scrollHeight - window.innerHeight
  window.scrollTo({ top: max * mid, behavior: 'smooth' })
}

/**
 * Fixed top chrome: sparkle logo + wordmark (left), pill nav (center),
 * contact pill + calm-mode toggle (right). Mirrors the reference header.
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
                onClick={() => scrollToChapter(item.chapterId)}
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
