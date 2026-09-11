import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ExploreBar } from './ExploreBar'
import { PLAYGROUND, type PlaygroundId } from './data'

const setup = (discovered: PlaygroundId[] = []) => {
  const onPick = vi.fn()
  const onShuffle = vi.fn()
  render(
    <ExploreBar
      entries={PLAYGROUND}
      selectedId="apis"
      discovered={new Set<PlaygroundId>(discovered)}
      onPick={onPick}
      onShuffle={onShuffle}
    />,
  )
  return { onPick, onShuffle }
}

describe('ExploreBar', () => {
  it('renders one dock button per catalog entry, with the selected one pressed', () => {
    setup()
    for (const entry of PLAYGROUND) {
      expect(screen.getByRole('button', { name: entry.category })).toBeInTheDocument()
    }
    expect(screen.getByRole('button', { name: 'APIs' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Cloud' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('counts only what has actually been discovered', () => {
    setup(['apis', 'cloud'])
    expect(screen.getByText('2 of 6 discovered')).toBeInTheDocument()
  })

  it('reports picks and shuffles', () => {
    const { onPick, onShuffle } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Aviation' }))
    expect(onPick).toHaveBeenCalledWith('aviation')
    fireEvent.click(screen.getByRole('button', { name: /mix it up/i }))
    expect(onShuffle).toHaveBeenCalled()
  })
})
