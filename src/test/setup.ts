import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'
import { mockMatchMedia } from './match-media'

beforeEach(() => {
  // Every test starts with no media preference; a test can override it.
  mockMatchMedia()
  // The router restores scroll on navigation; jsdom does not implement it.
  vi.stubGlobal('scrollTo', vi.fn())
})

afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.unstubAllGlobals()
})
