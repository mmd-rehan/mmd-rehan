import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { RepoCard } from './RepoCard'

const longRepo = {
  name: 'ADMS Server for ZKTeco',
  href: 'https://github.com/mmd-rehan/ADMS-server-ZKTeco',
  blurb:
    'An ADMS server for ZKTeco SpeedFace terminals, so attendance hardware can push records straight into your own system instead of the vendor software, over many words of explanation that run well past three lines of card body copy.',
  tags: ['PHP', 'Attendance hardware', 'Self-hosted'],
  meta: '27 stars · 16 forks',
}

const shortRepo = {
  name: 'Textile POS',
  href: 'https://github.com/mmd-rehan/textile-pos',
  blurb: 'Short blurb.',
  tags: ['TypeScript'],
}

describe('RepoCard', () => {
  it('offers a See more toggle for a long blurb and expands on click', () => {
    render(<RepoCard repo={longRepo} />)
    const btn = screen.getByRole('button', { name: /see more/i })
    expect(btn).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(btn)
    expect(screen.getByRole('button', { name: /see less/i })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
  })

  it('does not render a toggle for a short blurb', () => {
    render(<RepoCard repo={shortRepo} />)
    expect(screen.queryByRole('button', { name: /see more/i })).toBeNull()
  })
})
