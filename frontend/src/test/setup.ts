import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Auto-unmount and clean the DOM between tests.
afterEach(() => {
  cleanup();
});

// jsdom does not implement matchMedia; useDarkMode reads it. Default to light;
// individual tests override window.matchMedia when they need a specific value.
if (!window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

// Radix UI primitives (Dialog, Popover) use pointer-capture + scroll APIs that
// jsdom lacks. Polyfill them so component tests can open/close overlays.
const proto = Element.prototype as unknown as Record<string, unknown>;
proto.hasPointerCapture ??= vi.fn();
proto.setPointerCapture ??= vi.fn();
proto.releasePointerCapture ??= vi.fn();
proto.scrollIntoView ??= vi.fn();
