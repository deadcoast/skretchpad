import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  // Color utilities
  hexToRgb,
  rgbToHex,
  parseColor,
  getLuminance,
  isDark,
  getContrastRatio,
  lighten,
  darken,
  withAlpha,
  // Format utilities
  formatFileSize,
  formatDuration,
  formatRelativeTime,
  truncate,
  truncatePath,
  // Keyboard utilities
  getModifierKey,
  formatShortcut,
  isModifierPressed,
  // Platform detection
  isMac,
  isWindows,
  isLinux,
  getPlatform,
  // Easing functions
  easeInOutCubic,
  easeOutExpo,
  easeInOutExpo,
  // Animation
  animate,
  spring,
  // DOM utilities
  isInViewport,
  scrollIntoView,
  getElementPosition,
  hasOverflow,
  getScrollbarWidth,
  trapFocus,
  // Async utilities
  sleep,
  withTimeout,
  retry,
  // Clipboard
  copyToClipboard,
  readFromClipboard,
  // Notification
  showNotification,
} from './ui';

// ============================================================================
// COLOR UTILITIES
// ============================================================================

describe('hexToRgb', () => {
  it('converts valid hex with hash', () => {
    expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
  });

  it('converts valid hex without hash', () => {
    expect(hexToRgb('00ff00')).toEqual({ r: 0, g: 255, b: 0 });
  });

  it('returns null for invalid hex', () => {
    expect(hexToRgb('invalid')).toBeNull();
  });

  it('returns null for short hex (3-digit)', () => {
    expect(hexToRgb('#fff')).toBeNull();
  });

  it('handles mixed case', () => {
    expect(hexToRgb('#FFaaCC')).toEqual({ r: 255, g: 170, b: 204 });
  });
});

describe('rgbToHex', () => {
  it('converts standard values', () => {
    expect(rgbToHex(255, 0, 0)).toBe('#ff0000');
  });

  it('pads single-digit hex values', () => {
    expect(rgbToHex(0, 0, 0)).toBe('#000000');
  });

  it('converts white', () => {
    expect(rgbToHex(255, 255, 255)).toBe('#ffffff');
  });
});

describe('parseColor', () => {
  it('parses hex input', () => {
    expect(parseColor('#ff0000')).toEqual({ r: 255, g: 0, b: 0, a: 1 });
  });

  it('parses rgb input', () => {
    expect(parseColor('rgb(100, 200, 50)')).toEqual({ r: 100, g: 200, b: 50, a: 1 });
  });

  it('parses rgba input', () => {
    expect(parseColor('rgba(100, 200, 50, 0.5)')).toEqual({ r: 100, g: 200, b: 50, a: 0.5 });
  });

  it('returns null for invalid input', () => {
    expect(parseColor('not-a-color')).toBeNull();
  });

  it('returns null for invalid hex', () => {
    expect(parseColor('#xyz')).toBeNull();
  });
});

describe('getLuminance', () => {
  it('returns ~0 for black', () => {
    expect(getLuminance('#000000')).toBeCloseTo(0, 2);
  });

  it('returns ~1 for white', () => {
    expect(getLuminance('#ffffff')).toBeCloseTo(1, 2);
  });

  it('returns 0 for invalid color', () => {
    expect(getLuminance('invalid')).toBe(0);
  });

  it('handles rgb colors with low normalized values (<=0.03928 branch)', () => {
    // rgb(1,1,1) has very low normalized values that go through the /12.92 branch
    const lum = getLuminance('rgb(1, 1, 1)');
    expect(lum).toBeGreaterThan(0);
    expect(lum).toBeLessThan(0.01);
  });
});

describe('isDark', () => {
  it('returns true for black', () => {
    expect(isDark('#000000')).toBe(true);
  });

  it('returns false for white', () => {
    expect(isDark('#ffffff')).toBe(false);
  });
});

describe('getContrastRatio', () => {
  it('returns ~21 for black vs white', () => {
    const ratio = getContrastRatio('#000000', '#ffffff');
    expect(ratio).toBeCloseTo(21, 0);
  });

  it('returns 1 for identical colors', () => {
    expect(getContrastRatio('#808080', '#808080')).toBeCloseTo(1, 1);
  });

  it('order of arguments does not matter', () => {
    const r1 = getContrastRatio('#000000', '#ffffff');
    const r2 = getContrastRatio('#ffffff', '#000000');
    expect(r1).toBeCloseTo(r2, 2);
  });
});

describe('lighten', () => {
  it('lightens a dark color', () => {
    const result = lighten('#000000', 0.5);
    expect(result).toContain('rgba(');
    expect(result).toContain('128');
  });

  it('returns original for invalid color', () => {
    expect(lighten('invalid', 0.5)).toBe('invalid');
  });
});

describe('darken', () => {
  it('darkens a light color', () => {
    const result = darken('#ffffff', 0.5);
    expect(result).toContain('rgba(');
    expect(result).toContain('128');
  });

  it('returns original for invalid color', () => {
    expect(darken('invalid', 0.5)).toBe('invalid');
  });
});

describe('withAlpha', () => {
  it('adds alpha to a color', () => {
    const result = withAlpha('#ff0000', 0.5);
    expect(result).toBe('rgba(255, 0, 0, 0.5)');
  });

  it('returns original for invalid color', () => {
    expect(withAlpha('invalid', 0.5)).toBe('invalid');
  });
});

// ============================================================================
// FORMAT UTILITIES
// ============================================================================

describe('formatFileSize', () => {
  it('formats 0 bytes', () => {
    expect(formatFileSize(0)).toBe('0 B');
  });

  it('formats bytes', () => {
    expect(formatFileSize(500)).toBe('500 B');
  });

  it('formats kilobytes', () => {
    expect(formatFileSize(1024)).toBe('1 KB');
  });

  it('formats megabytes', () => {
    expect(formatFileSize(1.5 * 1024 * 1024)).toBe('1.5 MB');
  });

  it('formats gigabytes', () => {
    expect(formatFileSize(2 * 1024 * 1024 * 1024)).toBe('2 GB');
  });
});

describe('formatDuration', () => {
  it('formats seconds only', () => {
    expect(formatDuration(5000)).toBe('5s');
  });

  it('formats minutes and seconds', () => {
    expect(formatDuration(65000)).toBe('1m 5s');
  });

  it('formats hours', () => {
    expect(formatDuration(3661000)).toBe('1h 1m 1s');
  });

  it('formats zero', () => {
    expect(formatDuration(0)).toBe('0s');
  });
});

describe('formatRelativeTime', () => {
  it('returns "just now" for current time', () => {
    expect(formatRelativeTime(Date.now())).toBe('just now');
  });

  it('returns seconds ago', () => {
    expect(formatRelativeTime(Date.now() - 5000)).toBe('5 seconds ago');
  });

  it('returns singular second', () => {
    expect(formatRelativeTime(Date.now() - 1000)).toBe('1 second ago');
  });

  it('returns minutes ago', () => {
    expect(formatRelativeTime(Date.now() - 120000)).toBe('2 minutes ago');
  });

  it('returns singular minute', () => {
    expect(formatRelativeTime(Date.now() - 60000)).toBe('1 minute ago');
  });

  it('returns hours ago', () => {
    expect(formatRelativeTime(Date.now() - 7200000)).toBe('2 hours ago');
  });

  it('returns singular hour', () => {
    expect(formatRelativeTime(Date.now() - 3600000)).toBe('1 hour ago');
  });

  it('returns days ago', () => {
    expect(formatRelativeTime(Date.now() - 2 * 86400000)).toBe('2 days ago');
  });

  it('returns singular day', () => {
    expect(formatRelativeTime(Date.now() - 86400000)).toBe('1 day ago');
  });

  it('returns weeks ago', () => {
    expect(formatRelativeTime(Date.now() - 14 * 86400000)).toBe('2 weeks ago');
  });

  it('returns months ago', () => {
    expect(formatRelativeTime(Date.now() - 60 * 86400000)).toBe('2 months ago');
  });

  it('returns years ago', () => {
    expect(formatRelativeTime(Date.now() - 400 * 86400000)).toBe('1 year ago');
  });
});

describe('truncate', () => {
  it('returns short string unchanged', () => {
    expect(truncate('hello', 10)).toBe('hello');
  });

  it('truncates long string with ellipsis', () => {
    expect(truncate('hello world foo bar', 10)).toBe('hello w...');
  });

  it('returns string at exact maxLength unchanged', () => {
    expect(truncate('hello', 5)).toBe('hello');
  });
});

describe('truncatePath', () => {
  it('returns short path unchanged', () => {
    expect(truncatePath('src/file.ts', 50)).toBe('src/file.ts');
  });

  it('truncates long path with first/.../filename', () => {
    const path = 'src/very/deeply/nested/directory/structure/file.ts';
    const result = truncatePath(path, 25);
    expect(result).toContain('src');
    expect(result).toContain('...');
    expect(result).toContain('file.ts');
  });

  it('handles path with only 2 parts', () => {
    const result = truncatePath('verylongdirectoryname/file.ts', 10);
    expect(result).toContain('...');
  });

  it('handles path where first + file exceed max', () => {
    const path = 'longdir/a/b/c/verylongfilename.ts';
    const result = truncatePath(path, 20);
    expect(result).toContain('longdir');
    expect(result).toContain('...');
  });
});

// ============================================================================
// KEYBOARD UTILITIES
// ============================================================================

describe('getModifierKey', () => {
  it('returns Ctrl on Win32', () => {
    expect(getModifierKey()).toBe('Ctrl');
  });
});

describe('formatShortcut', () => {
  it('keeps Ctrl on Windows', () => {
    expect(formatShortcut('Ctrl+S')).toBe('Ctrl+S');
  });

  it('replaces Enter with symbol', () => {
    expect(formatShortcut('Enter')).toBe('↵');
  });

  it('replaces Escape with Esc', () => {
    expect(formatShortcut('Escape')).toBe('Esc');
  });

  it('replaces arrow keys with symbols', () => {
    expect(formatShortcut('ArrowUp')).toBe('↑');
    expect(formatShortcut('ArrowDown')).toBe('↓');
    expect(formatShortcut('ArrowLeft')).toBe('←');
    expect(formatShortcut('ArrowRight')).toBe('→');
  });

  it('replaces Backspace and Delete', () => {
    expect(formatShortcut('Backspace')).toBe('⌫');
    expect(formatShortcut('Delete')).toBe('⌦');
  });

  it('keeps Alt and Shift on Windows', () => {
    expect(formatShortcut('Alt+Shift+F')).toBe('Alt+Shift+F');
  });
});

describe('isModifierPressed', () => {
  it('returns true when ctrlKey is pressed', () => {
    expect(
      isModifierPressed({
        ctrlKey: true,
        metaKey: false,
        altKey: false,
        shiftKey: false,
      } as KeyboardEvent)
    ).toBe(true);
  });

  it('returns true when metaKey is pressed', () => {
    expect(
      isModifierPressed({
        ctrlKey: false,
        metaKey: true,
        altKey: false,
        shiftKey: false,
      } as KeyboardEvent)
    ).toBe(true);
  });

  it('returns true when altKey is pressed', () => {
    expect(
      isModifierPressed({
        ctrlKey: false,
        metaKey: false,
        altKey: true,
        shiftKey: false,
      } as KeyboardEvent)
    ).toBe(true);
  });

  it('returns true when shiftKey is pressed', () => {
    expect(
      isModifierPressed({
        ctrlKey: false,
        metaKey: false,
        altKey: false,
        shiftKey: true,
      } as KeyboardEvent)
    ).toBe(true);
  });

  it('returns false when no modifier is pressed', () => {
    expect(
      isModifierPressed({
        ctrlKey: false,
        metaKey: false,
        altKey: false,
        shiftKey: false,
      } as KeyboardEvent)
    ).toBe(false);
  });
});

// ============================================================================
// PLATFORM DETECTION
// ============================================================================

describe('platform detection', () => {
  it('isWindows returns true on Win32', () => {
    expect(isWindows()).toBe(true);
  });

  it('isMac returns false on Win32', () => {
    expect(isMac()).toBe(false);
  });

  it('isLinux returns false on Win32', () => {
    expect(isLinux()).toBe(false);
  });

  it('getPlatform returns windows on Win32', () => {
    expect(getPlatform()).toBe('windows');
  });
});

// ============================================================================
// EASING FUNCTIONS
// ============================================================================

describe('easeInOutCubic', () => {
  it('returns 0 at t=0', () => {
    expect(easeInOutCubic(0)).toBe(0);
  });

  it('returns 1 at t=1', () => {
    expect(easeInOutCubic(1)).toBe(1);
  });

  it('returns 0.5 at t=0.5', () => {
    expect(easeInOutCubic(0.5)).toBe(0.5);
  });

  it('returns value < 0.5 for t < 0.5', () => {
    expect(easeInOutCubic(0.25)).toBeLessThan(0.5);
  });

  it('returns value > 0.5 for t > 0.5', () => {
    expect(easeInOutCubic(0.75)).toBeGreaterThan(0.5);
  });
});

describe('easeOutExpo', () => {
  it('returns 1 at t=1', () => {
    expect(easeOutExpo(1)).toBe(1);
  });

  it('returns close to 0 at t=0', () => {
    expect(easeOutExpo(0)).toBeCloseTo(0, 1);
  });

  it('returns value between 0 and 1 for t=0.5', () => {
    const val = easeOutExpo(0.5);
    expect(val).toBeGreaterThan(0);
    expect(val).toBeLessThan(1);
  });
});

describe('easeInOutExpo', () => {
  it('returns 0 at t=0', () => {
    expect(easeInOutExpo(0)).toBe(0);
  });

  it('returns 1 at t=1', () => {
    expect(easeInOutExpo(1)).toBe(1);
  });

  it('returns ~0.5 at t=0.5', () => {
    expect(easeInOutExpo(0.5)).toBeCloseTo(0.5, 1);
  });

  it('returns value < 0.5 for t < 0.5 (first branch)', () => {
    expect(easeInOutExpo(0.25)).toBeLessThan(0.5);
  });

  it('returns value > 0.5 for t > 0.5 (second branch)', () => {
    expect(easeInOutExpo(0.75)).toBeGreaterThan(0.5);
  });
});

// ============================================================================
// ANIMATION UTILITIES
// ============================================================================

describe('animate', () => {
  let rafCallbacks: ((time: number) => void)[];
  let rafId: number;

  beforeEach(() => {
    rafCallbacks = [];
    rafId = 0;
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      rafCallbacks.push(cb);
      return ++rafId;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
    vi.spyOn(performance, 'now').mockReturnValue(0);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('calls onUpdate with starting value', () => {
    const onUpdate = vi.fn();
    animate(0, 100, 1000, onUpdate);

    // Simulate first frame at t=0
    (performance.now as unknown as ReturnType<typeof vi.fn>).mockReturnValue(0);
    rafCallbacks[0](0);

    expect(onUpdate).toHaveBeenCalled();
    expect(onUpdate.mock.calls[0][0]).toBeCloseTo(0, 0);
  });

  it('calls onUpdate with ending value when complete', () => {
    const onUpdate = vi.fn();
    animate(0, 100, 1000, onUpdate);

    // Simulate frame at t=1000 (complete)
    (performance.now as unknown as ReturnType<typeof vi.fn>).mockReturnValue(0);
    rafCallbacks[0](1000);

    expect(onUpdate).toHaveBeenCalledWith(100);
  });

  it('returns cancel function', () => {
    const onUpdate = vi.fn();
    const cancel = animate(0, 100, 1000, onUpdate);
    expect(typeof cancel).toBe('function');
    cancel();
    expect(window.cancelAnimationFrame).toHaveBeenCalled();
  });

  it('continues animation when progress < 1', () => {
    const onUpdate = vi.fn();
    animate(0, 100, 1000, onUpdate);
    const callsBefore = rafCallbacks.length;

    // Simulate frame at t=500 (halfway)
    (performance.now as unknown as ReturnType<typeof vi.fn>).mockReturnValue(0);
    rafCallbacks[callsBefore - 1](500);

    // Should request another frame (one more callback added)
    expect(rafCallbacks.length).toBe(callsBefore + 1);
  });
});

describe('spring', () => {
  let rafCallbacks: (() => void)[];
  let rafId: number;

  beforeEach(() => {
    rafCallbacks = [];
    rafId = 0;
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      rafCallbacks.push(cb as () => void);
      return ++rafId;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('calls onUpdate', () => {
    const onUpdate = vi.fn();
    spring(0, 100, 0.15, 0.8, onUpdate);

    // Run first step
    rafCallbacks[0]();
    expect(onUpdate).toHaveBeenCalled();
  });

  it('returns cancel function', () => {
    const onUpdate = vi.fn();
    const cancel = spring(0, 100, 0.15, 0.8, onUpdate);
    expect(typeof cancel).toBe('function');
    cancel();
    expect(window.cancelAnimationFrame).toHaveBeenCalled();
  });

  it('converges to target value', () => {
    const onUpdate = vi.fn();
    spring(0, 100, 0.5, 0.5, onUpdate);

    // Run many steps to converge
    for (let i = 0; i < 50 && rafCallbacks.length > i; i++) {
      rafCallbacks[i]();
    }

    // Last call should be close to target
    const lastCall = onUpdate.mock.calls[onUpdate.mock.calls.length - 1][0];
    expect(lastCall).toBeCloseTo(100, 0);
  });
});

// ============================================================================
// DOM UTILITIES
// ============================================================================

describe('isInViewport', () => {
  it('returns true when element is in viewport', () => {
    const element = document.createElement('div');
    vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
      top: 10,
      left: 10,
      bottom: 100,
      right: 100,
      width: 90,
      height: 90,
      x: 10,
      y: 10,
      toJSON: () => {},
    });
    expect(isInViewport(element)).toBe(true);
  });

  it('returns false when element is above viewport', () => {
    const element = document.createElement('div');
    vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
      top: -100,
      left: 10,
      bottom: -10,
      right: 100,
      width: 90,
      height: 90,
      x: 10,
      y: -100,
      toJSON: () => {},
    });
    expect(isInViewport(element)).toBe(false);
  });
});

describe('scrollIntoView', () => {
  it('calls scrollIntoView on element', () => {
    const element = document.createElement('div');
    element.scrollIntoView = vi.fn();
    scrollIntoView(element);
    expect(element.scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'center',
    });
  });

  it('accepts custom options', () => {
    const element = document.createElement('div');
    element.scrollIntoView = vi.fn();
    scrollIntoView(element, { behavior: 'instant', block: 'start' });
    expect(element.scrollIntoView).toHaveBeenCalledWith({
      behavior: 'instant',
      block: 'start',
    });
  });
});

describe('getElementPosition', () => {
  it('returns element position', () => {
    const element = document.createElement('div');
    vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
      top: 20,
      left: 30,
      width: 100,
      height: 50,
      bottom: 70,
      right: 130,
      x: 30,
      y: 20,
      toJSON: () => {},
    });
    expect(getElementPosition(element)).toEqual({
      top: 20,
      left: 30,
      width: 100,
      height: 50,
    });
  });
});

describe('hasOverflow', () => {
  it('detects no overflow', () => {
    const element = document.createElement('div');
    Object.defineProperty(element, 'scrollWidth', { value: 100 });
    Object.defineProperty(element, 'clientWidth', { value: 100 });
    Object.defineProperty(element, 'scrollHeight', { value: 100 });
    Object.defineProperty(element, 'clientHeight', { value: 100 });
    expect(hasOverflow(element)).toEqual({ x: false, y: false });
  });

  it('detects horizontal overflow', () => {
    const element = document.createElement('div');
    Object.defineProperty(element, 'scrollWidth', { value: 200 });
    Object.defineProperty(element, 'clientWidth', { value: 100 });
    Object.defineProperty(element, 'scrollHeight', { value: 100 });
    Object.defineProperty(element, 'clientHeight', { value: 100 });
    expect(hasOverflow(element)).toEqual({ x: true, y: false });
  });

  it('detects vertical overflow', () => {
    const element = document.createElement('div');
    Object.defineProperty(element, 'scrollWidth', { value: 100 });
    Object.defineProperty(element, 'clientWidth', { value: 100 });
    Object.defineProperty(element, 'scrollHeight', { value: 200 });
    Object.defineProperty(element, 'clientHeight', { value: 100 });
    expect(hasOverflow(element)).toEqual({ x: false, y: true });
  });
});

describe('getScrollbarWidth', () => {
  it('returns a number', () => {
    const width = getScrollbarWidth();
    expect(typeof width).toBe('number');
  });
});

describe('trapFocus', () => {
  it('returns cleanup function', () => {
    const container = document.createElement('div');
    const button1 = document.createElement('button');
    const button2 = document.createElement('button');
    container.appendChild(button1);
    container.appendChild(button2);
    document.body.appendChild(container);

    const cleanup = trapFocus(container);
    expect(typeof cleanup).toBe('function');
    cleanup();
    document.body.removeChild(container);
  });

  it('focuses first focusable element', () => {
    const container = document.createElement('div');
    const button = document.createElement('button');
    button.textContent = 'Click me';
    container.appendChild(button);
    document.body.appendChild(container);

    const focusSpy = vi.spyOn(button, 'focus');
    const cleanup = trapFocus(container);
    expect(focusSpy).toHaveBeenCalled();
    cleanup();
    document.body.removeChild(container);
  });

  it('wraps focus from last to first on Tab', () => {
    const container = document.createElement('div');
    const button1 = document.createElement('button');
    const button2 = document.createElement('button');
    container.appendChild(button1);
    container.appendChild(button2);
    document.body.appendChild(container);

    const cleanup = trapFocus(container);

    // Simulate being on last element
    button2.focus();
    Object.defineProperty(document, 'activeElement', {
      value: button2,
      configurable: true,
    });

    const focusSpy = vi.spyOn(button1, 'focus');
    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
    Object.defineProperty(event, 'shiftKey', { value: false });
    const preventSpy = vi.spyOn(event, 'preventDefault');
    container.dispatchEvent(event);

    expect(preventSpy).toHaveBeenCalled();
    expect(focusSpy).toHaveBeenCalled();

    cleanup();
    document.body.removeChild(container);
    Object.defineProperty(document, 'activeElement', {
      value: document.body,
      configurable: true,
    });
  });

  it('wraps focus from first to last on Shift+Tab', () => {
    const container = document.createElement('div');
    const button1 = document.createElement('button');
    const button2 = document.createElement('button');
    container.appendChild(button1);
    container.appendChild(button2);
    document.body.appendChild(container);

    const cleanup = trapFocus(container);

    // Simulate being on first element
    button1.focus();
    Object.defineProperty(document, 'activeElement', {
      value: button1,
      configurable: true,
    });

    const focusSpy = vi.spyOn(button2, 'focus');
    const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true });
    const preventSpy = vi.spyOn(event, 'preventDefault');
    container.dispatchEvent(event);

    expect(preventSpy).toHaveBeenCalled();
    expect(focusSpy).toHaveBeenCalled();

    cleanup();
    document.body.removeChild(container);
    Object.defineProperty(document, 'activeElement', {
      value: document.body,
      configurable: true,
    });
  });

  it('does nothing for non-Tab keys', () => {
    const container = document.createElement('div');
    const button = document.createElement('button');
    container.appendChild(button);
    document.body.appendChild(container);

    const cleanup = trapFocus(container);
    const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
    const preventSpy = vi.spyOn(event, 'preventDefault');
    container.dispatchEvent(event);
    expect(preventSpy).not.toHaveBeenCalled();

    cleanup();
    document.body.removeChild(container);
  });
});

// ============================================================================
// NOTIFICATION UTILITIES
// ============================================================================

describe('showNotification', () => {
  it('logs notification', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    showNotification('test message');
    expect(consoleSpy).toHaveBeenCalledWith('[info] test message');
    consoleSpy.mockRestore();
  });

  it('logs notification with custom type', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    showNotification('error!', { type: 'error' });
    expect(consoleSpy).toHaveBeenCalledWith('[error] error!');
    consoleSpy.mockRestore();
  });
});

// ============================================================================
// ASYNC UTILITIES
// ============================================================================

describe('sleep', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('resolves after ms', async () => {
    const fn = vi.fn();
    sleep(100).then(fn);
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    await vi.runAllTimersAsync();
    expect(fn).toHaveBeenCalled();
  });
});

describe('withTimeout', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('resolves if promise completes before timeout', async () => {
    const promise = new Promise<string>((resolve) => setTimeout(() => resolve('done'), 50));
    const resultPromise = withTimeout(promise, 200);
    vi.advanceTimersByTime(50);
    await expect(resultPromise).resolves.toBe('done');
  });

  it('rejects on timeout', async () => {
    const promise = new Promise<string>((resolve) => setTimeout(() => resolve('done'), 500));
    const resultPromise = withTimeout(promise, 100);
    vi.advanceTimersByTime(100);
    await expect(resultPromise).rejects.toThrow('Operation timed out');
  });

  it('uses custom error when provided', async () => {
    const promise = new Promise<string>((resolve) => setTimeout(() => resolve('done'), 500));
    const customError = new Error('Custom timeout');
    const resultPromise = withTimeout(promise, 100, customError);
    vi.advanceTimersByTime(100);
    await expect(resultPromise).rejects.toThrow('Custom timeout');
  });
});

describe('retry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('succeeds on first try', async () => {
    const fn = vi.fn().mockResolvedValue('ok');
    const result = await retry(fn, { maxAttempts: 3 });
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledOnce();
  });

  it('retries on failure and eventually succeeds', async () => {
    const fn = vi.fn().mockRejectedValueOnce(new Error('fail')).mockResolvedValue('ok');

    const resultPromise = retry(fn, { maxAttempts: 3, initialDelay: 100 });
    await vi.advanceTimersByTimeAsync(100);
    const result = await resultPromise;
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('gives up after maxAttempts', async () => {
    vi.useRealTimers();
    const fn = vi.fn().mockRejectedValue(new Error('always fails'));

    await expect(retry(fn, { maxAttempts: 3, initialDelay: 10, maxDelay: 20 })).rejects.toThrow(
      'always fails'
    );
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('respects maxDelay cap', async () => {
    vi.useRealTimers();
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValue('ok');

    const result = await retry(fn, {
      maxAttempts: 3,
      initialDelay: 10,
      maxDelay: 15,
      factor: 10,
    });
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(3);
  });
});

// ============================================================================
// CLIPBOARD UTILITIES
// ============================================================================

describe('copyToClipboard', () => {
  it('returns true on success', async () => {
    const result = await copyToClipboard('test');
    expect(result).toBe(true);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('test');
  });

  it('returns false on failure', async () => {
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValueOnce(new Error('fail'));
    const result = await copyToClipboard('test');
    expect(result).toBe(false);
  });
});

describe('readFromClipboard', () => {
  it('returns clipboard text', async () => {
    vi.spyOn(navigator.clipboard, 'readText').mockResolvedValueOnce('hello');
    const result = await readFromClipboard();
    expect(result).toBe('hello');
  });

  it('returns null on failure', async () => {
    vi.spyOn(navigator.clipboard, 'readText').mockRejectedValueOnce(new Error('fail'));
    const result = await readFromClipboard();
    expect(result).toBeNull();
  });
});
