interface ScrollHintProps {
  visible: boolean
}

/** Minimal "scroll to explore" hint, bottom-center, fades after first input. */
export function ScrollHint({ visible }: ScrollHintProps) {
  return (
    <div className={`scroll-hint ${visible ? '' : 'scroll-hint--hidden'}`} aria-hidden="true">
      <span className="scroll-hint__label">Scroll to explore</span>
      <span className="scroll-hint__line" />
    </div>
  )
}
