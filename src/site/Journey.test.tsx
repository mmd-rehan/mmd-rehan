import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Journey } from './Journey'
import { JOURNEY } from './data'

describe('Journey', () => {
  it('lists every role newest-first', () => {
    render(<Journey />)
    const headings = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)
    expect(headings).toEqual(JOURNEY.map((e) => e.company))
  })

  it('marks only the in-progress role as current', () => {
    render(<Journey />)
    expect(screen.getAllByText('Current')).toHaveLength(1)
    const items = document.querySelectorAll('.timeline-list li')
    expect(items[0].classList.contains('is-current')).toBe(true)
    expect(items[1].classList.contains('is-current')).toBe(false)
  })
})
