import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock requestAnimationFrame / cancelAnimationFrame
window.requestAnimationFrame = vi.fn((cb) => {
  return setTimeout(cb, 0) as unknown as number;
});
window.cancelAnimationFrame = vi.fn((id) => {
  clearTimeout(id);
});

// Mock navigator.clipboard
Object.defineProperty(navigator, 'clipboard', {
  writable: true,
  value: {
    writeText: vi.fn().mockResolvedValue(undefined),
    readText: vi.fn().mockResolvedValue(''),
  },
});

// Set platform for consistent test results
Object.defineProperty(navigator, 'platform', {
  writable: true,
  value: 'Win32',
});

// Mock performance.now for animation tests
if (!window.performance) {
  Object.defineProperty(window, 'performance', {
    writable: true,
    value: {},
  });
}

if (typeof window.performance.now !== 'function') {
  Object.defineProperty(window.performance, 'now', {
    writable: true,
    value: vi.fn(() => Date.now()),
  });
}
