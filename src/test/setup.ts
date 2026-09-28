import '@testing-library/jest-dom/vitest'
import { afterEach, beforeEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// Provide localStorage polyfill if jsdom hasn't initialized it
if (typeof globalThis.localStorage === 'undefined') {
  const store: Record<string, string> = {}
  const ls = {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = String(value) },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { Object.keys(store).forEach(k => delete store[k]) },
    key: (index: number) => Object.keys(store)[index] ?? null,
    get length() { return Object.keys(store).length },
  }
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: ls,
  })
}

// Mock Tauri APIs globally (not available in jsdom)
vi.mock('@tauri-apps/plugin-dialog', () => ({
  open: vi.fn().mockResolvedValue(null),
  save: vi.fn().mockResolvedValue(null),
}))

vi.mock('@tauri-apps/plugin-fs', () => ({
  readTextFile: vi.fn().mockResolvedValue(''),
  writeTextFile: vi.fn().mockResolvedValue(undefined),
  exists: vi.fn().mockResolvedValue(false),
  removeFile: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn().mockResolvedValue(null),
}))

vi.mock('@tauri-apps/plugin-store', () => ({
  load: vi.fn().mockResolvedValue({
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(undefined),
    save: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
    clear: vi.fn().mockResolvedValue(undefined),
    has: vi.fn().mockResolvedValue(false),
    entries: vi.fn().mockResolvedValue([]),
    keys: vi.fn().mockResolvedValue([]),
    values: vi.fn().mockResolvedValue([]),
    length: vi.fn().mockResolvedValue(0),
  }),
}))

// Auto-cleanup after each test
afterEach(() => {
  cleanup()
})

// Reset localStorage between tests
beforeEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

// Mock matchMedia (not available in jsdom)
if (!window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

// Mock CSS.highlights API (not available in jsdom)
interface CSSWithHighlights {
  highlights?: Map<string, unknown>;
  supports?: (prop: string, value: string) => boolean;
}
if (!window.CSS) {
  (window as unknown as { CSS: CSSWithHighlights }).CSS = {};
}
const css = window.CSS as CSSWithHighlights;
if (css && !css.highlights) {
  css.highlights = new Map();
}

// Mock scrollIntoView (not available in jsdom)
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = vi.fn();
}

// Mock requestAnimationFrame (not available in jsdom)
if (!globalThis.requestAnimationFrame) {
  globalThis.requestAnimationFrame = (cb: FrameRequestCallback) => {
    cb(0);
    return 0;
  };
}
