import type { PlaygroundId } from './data'

export type PlaygroundState = {
  selectedId: PlaygroundId
  discovered: ReadonlySet<PlaygroundId>
}

export type PlaygroundAction =
  | { type: 'select'; id: PlaygroundId }
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
    case 'select': {
      if (action.id === state.selectedId && state.discovered.has(action.id)) {
        return state
      }
      const discovered = state.discovered.has(action.id)
        ? state.discovered
        : new Set(state.discovered).add(action.id)
      return { selectedId: action.id, discovered }
    }
    case 'reset':
      return { selectedId: 'apis', discovered: state.discovered }
    default:
      return state
  }
}
