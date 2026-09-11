import type { PlaygroundId } from './data'

export type PlaygroundState = {
  selectedId: PlaygroundId
  /** Objects the visitor has actually played, not merely highlighted. */
  discovered: ReadonlySet<PlaygroundId>
}

export type PlaygroundAction =
  | { type: 'select'; id: PlaygroundId }
  | { type: 'discover'; id: PlaygroundId }
  | { type: 'reset' }

export const initialPlaygroundState: PlaygroundState = {
  selectedId: 'apis',
  discovered: new Set<PlaygroundId>(),
}

export function playgroundReducer(
  state: PlaygroundState,
  action: PlaygroundAction,
): PlaygroundState {
  switch (action.type) {
    case 'select':
      if (action.id === state.selectedId) return state
      return { ...state, selectedId: action.id }
    case 'discover': {
      if (state.discovered.has(action.id)) return state
      return { ...state, discovered: new Set(state.discovered).add(action.id) }
    }
    case 'reset':
      return { selectedId: 'apis', discovered: state.discovered }
    default:
      return state
  }
}
