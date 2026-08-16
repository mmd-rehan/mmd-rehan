import { CHAPTERS } from '../content/chapters'

interface RightIndexProps {
  activeIndex: number
  progress: number
}

/**
 * Right-edge vertical index that doubles as a scroll-progress indicator.
 * Each labelled chapter is a tick; the active one is highlighted and a thin
 * fill bar tracks overall progress.
 */
export function RightIndex({ activeIndex, progress }: RightIndexProps) {
  const items = CHAPTERS.filter((c) => c.indexLabel)
  return (
    <div className="index" aria-hidden="true">
      <div className="index__track">
        <div className="index__fill" style={{ height: `${progress * 100}%` }} />
      </div>
      <ul className="index__list">
        {items.map((c) => {
          const realIndex = CHAPTERS.indexOf(c)
          return (
            <li
              key={c.id}
              className={`index__item ${
                realIndex === activeIndex ? 'index__item--active' : ''
              }`}
            >
              {c.indexLabel}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
