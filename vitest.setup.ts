import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// `globals` is off, so Testing Library's automatic cleanup never registers.
// Without this, renders pile up in the DOM and queries match across tests.
afterEach(cleanup)
