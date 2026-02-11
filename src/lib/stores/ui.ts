// src/lib/utils/ui.ts

/**
 * UI utility functions for skretchpad
 */

// ============================================================================
// ANIMATION UTILITIES
// ============================================================================

/**
 * Ease-in-out cubic animation curve
 */
export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
}

/**
 * Ease-out exponential animation curve
 */
export function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

/**
 * Ease-in-out exponential animation curve
 */
export function easeInOutExpo(t: number): number {
  if (t === 0) return 0;
  if (t === 1) return 1;
  if (t < 0.5) return Math.pow(2, 20 * t - 10) / 2;
  return (2 - Math.pow(2, -20 * t + 10)) / 2;
}

/**
 * Animate a value over time
 */
export function animate(
  from: number,
  to: number,
  duration: number,
  onUpdate: (value: number) => void,
  easing: (t: number) => number = easeInOutCubic
): () => void {
  const startTime = performance.now();
  let rafId: number;

  const step = (currentTime: number) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easing(progress);
    const value = from + (to - from) * easedProgress;

    onUpdate(value);

    if (progress < 1) {
      rafId = requestAnimationFrame(step);
    }
  };

  rafId = requestAnimationFrame(step);

  // Return cancel function
  return () => cancelAnimationFrame(rafId);
}

/**
 * Spring animation
 */
export function spring(
  from: number,
  to: number,
  stiffness = 0.15,
  damping = 0.8,
  onUpdate: (value: number) => void
): () => void {
  let value = from;
  let velocity = 0;
  let rafId: number;

  const step = () => {
    const distance = to - value;
    const acceleration = distance * stiffness;
    velocity += acceleration;
    velocity *= damping;
    value += velocity;

    onUpdate(value);

    if (Math.abs(velocity) > 0.001 || Math.abs(distance) > 0.001) {
      rafId = requestAnimationFrame(step);
    } else {
      onUpdate(to);
    }
  };

  rafId = requestAnimationFrame(step);

  return () => cancelAnimationFrame(rafId);
}

// ============================================================================
// DOM UTILITIES
// ============================================================================

/**
 * Check if element is in viewport
 */
export function isInViewport(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

/**
 * Scroll element into view smoothly
 */
export function scrollIntoView(
  element: HTMLElement,
  options: ScrollIntoViewOptions = { behavior: 'smooth', block: 'center' }
): void {
  element.scrollIntoView(options);
}

/**
 * Get element position relative to viewport
 */
export function getElementPosition(element: HTMLElement): {
  top: number;
  left: number;
  width: number;
  height: number;
} {
  const rect = element.getBoundingClientRect();
  return {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
  };
}

/**
 * Check if element has overflow
 */
export function hasOverflow(element: HTMLElement): {
  x: boolean;
  y: boolean;
} {
  return {
    x: element.scrollWidth > element.clientWidth,
    y: element.scrollHeight > element.clientHeight,
  };
}

/**
 * Get scrollbar width
 */
export function getScrollbarWidth(): number {
  const outer = document.createElement('div');
  outer.style.visibility = 'hidden';
  outer.style.overflow = 'scroll';
  document.body.appendChild(outer);

  const inner = document.createElement('div');
  outer.appendChild(inner);

  const scrollbarWidth = outer.offsetWidth - inner.offsetWidth;

  outer.parentNode?.removeChild(outer);

  return scrollbarWidth;
}

/**
 * Trap focus within element
 */
export function trapFocus(element: HTMLElement): () => void {
  const focusableElements = element.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );

  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      if (document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable.focus();
      }
    } else {
      if (document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable.focus();
      }
    }
  };

  element.addEventListener('keydown', handleKeyDown);

  // Focus first element
  firstFocusable?.focus();

  // Return cleanup function
  return () => {
    element.removeEventListener('keydown', handleKeyDown);
  };
}

// ============================================================================
// COLOR UTILITIES
// ============================================================================

/**
 * Convert hex color to RGB
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Convert RGB to hex
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((x) => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      })
      .join('')
  );
}

/**
 * Parse CSS color to RGBA
 */
export function parseColor(color: string): {
  r: number;
  g: number;
  b: number;
  a: number;
} | null {
  // Handle hex colors
  if (color.startsWith('#')) {
    const rgb = hexToRgb(color);
    return rgb ? { ...rgb, a: 1 } : null;
  }

  // Handle rgb/rgba
  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1]),
      g: parseInt(rgbMatch[2]),
      b: parseInt(rgbMatch[3]),
      a: rgbMatch[4] ? parseFloat(rgbMatch[4]) : 1,
    };
  }

  return null;
}

/**
 * Get luminance of a color
 */
export function getLuminance(color: string): number {
  const parsed = parseColor(color);
  if (!parsed) return 0;

  const { r, g, b } = parsed;
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const normalized = c / 255;
    return normalized <= 0.03928 ? normalized / 12.92 : Math.pow((normalized + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Check if color is dark
 */
export function isDark(color: string): boolean {
  return getLuminance(color) < 0.5;
}

/**
 * Get contrast ratio between two colors
 */
export function getContrastRatio(color1: string, color2: string): number {
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Lighten a color
 */
export function lighten(color: string, amount: number): string {
  const parsed = parseColor(color);
  if (!parsed) return color;

  const { r, g, b, a } = parsed;
  const nr = Math.min(255, Math.round(r + (255 - r) * amount));
  const ng = Math.min(255, Math.round(g + (255 - g) * amount));
  const nb = Math.min(255, Math.round(b + (255 - b) * amount));

  return `rgba(${nr}, ${ng}, ${nb}, ${a})`;
}

/**
 * Darken a color
 */
export function darken(color: string, amount: number): string {
  const parsed = parseColor(color);
  if (!parsed) return color;

  const { r, g, b, a } = parsed;
  const nr = Math.max(0, Math.round(r * (1 - amount)));
  const ng = Math.max(0, Math.round(g * (1 - amount)));
  const nb = Math.max(0, Math.round(b * (1 - amount)));

  return `rgba(${nr}, ${ng}, ${nb}, ${a})`;
}

/**
 * Add alpha to color
 */
export function withAlpha(color: string, alpha: number): string {
  const parsed = parseColor(color);
  if (!parsed) return color;

  const { r, g, b } = parsed;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ============================================================================
// FORMAT UTILITIES
// ============================================================================

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Format date relative to now
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (years > 0) return `${years} year${years > 1 ? 's' : ''} ago`;
  if (months > 0) return `${months} month${months > 1 ? 's' : ''} ago`;
  if (weeks > 0) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  if (seconds > 0) return `${seconds} second${seconds > 1 ? 's' : ''} ago`;

  return 'just now';
}

/**
 * Format duration (milliseconds to readable string)
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Truncate string with ellipsis
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}

/**
 * Truncate path to fit in given width (shows start and end)
 */
export function truncatePath(path: string, maxLength: number): string {
  if (path.length <= maxLength) return path;

  const parts = path.split('/');
  if (parts.length <= 2) return truncate(path, maxLength);

  const fileName = parts[parts.length - 1];
  const firstPart = parts[0];

  if (firstPart.length + fileName.length + 4 >= maxLength) {
    return `${firstPart}/.../${truncate(fileName, maxLength - firstPart.length - 5)}`;
  }

  return `${firstPart}/.../${fileName}`;
}

// ============================================================================
// CLIPBOARD UTILITIES
// ============================================================================

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

/**
 * Read text from clipboard
 */
export async function readFromClipboard(): Promise<string | null> {
  try {
    return await navigator.clipboard.readText();
  } catch (error) {
    console.error('Failed to read from clipboard:', error);
    return null;
  }
}

// ============================================================================
// KEYBOARD UTILITIES
// ============================================================================

/**
 * Check if modifier key is pressed
 */
export function isModifierPressed(event: KeyboardEvent): boolean {
  return event.ctrlKey || event.metaKey || event.altKey || event.shiftKey;
}

/**
 * Get modifier key string (Ctrl/Cmd depending on platform)
 */
export function getModifierKey(): string {
  return navigator.platform.toLowerCase().includes('mac') ? '⌘' : 'Ctrl';
}

/**
 * Format keyboard shortcut for display
 */
export function formatShortcut(shortcut: string): string {
  const isMac = navigator.platform.toLowerCase().includes('mac');

  return shortcut
    .replace(/Ctrl/g, isMac ? '⌘' : 'Ctrl')
    .replace(/Alt/g, isMac ? '⌥' : 'Alt')
    .replace(/Shift/g, isMac ? '⇧' : 'Shift')
    .replace(/Enter/g, '↵')
    .replace(/Backspace/g, '⌫')
    .replace(/Delete/g, '⌦')
    .replace(/Escape/g, 'Esc')
    .replace(/ArrowUp/g, '↑')
    .replace(/ArrowDown/g, '↓')
    .replace(/ArrowLeft/g, '←')
    .replace(/ArrowRight/g, '→');
}

// ============================================================================
// NOTIFICATION UTILITIES
// ============================================================================

export interface NotificationOptions {
  type?: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
  action?: {
    label: string;
    callback: () => void;
  };
}

/**
 * Show notification via the notification store
 */
export function showNotification(message: string, options: NotificationOptions = {}): void {
  // Dynamic import to avoid circular dependencies
  import('./notifications').then(({ notifications }) => {
    notifications.add(message, {
      type: options.type,
      duration: options.duration,
      action: options.action,
    });
  });
}

// ============================================================================
// PLATFORM DETECTION
// ============================================================================

/**
 * Check if running on macOS
 */
export function isMac(): boolean {
  return navigator.platform.toLowerCase().includes('mac');
}

/**
 * Check if running on Windows
 */
export function isWindows(): boolean {
  return navigator.platform.toLowerCase().includes('win');
}

/**
 * Check if running on Linux
 */
export function isLinux(): boolean {
  return navigator.platform.toLowerCase().includes('linux');
}

/**
 * Get platform name
 */
export function getPlatform(): 'mac' | 'windows' | 'linux' | 'unknown' {
  const platform = navigator.platform.toLowerCase();

  if (platform.includes('mac')) return 'mac';
  if (platform.includes('win')) return 'windows';
  if (platform.includes('linux')) return 'linux';

  return 'unknown';
}

// ============================================================================
// ASYNC UTILITIES
// ============================================================================

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry async operation with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    initialDelay?: number;
    maxDelay?: number;
    factor?: number;
  } = {}
): Promise<T> {
  const { maxAttempts = 3, initialDelay = 1000, maxDelay = 10000, factor = 2 } = options;

  let lastError: Error | null = null;
  let delay = initialDelay;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxAttempts - 1) {
        await sleep(Math.min(delay, maxDelay));
        delay *= factor;
      }
    }
  }

  throw lastError ?? new Error('Retry failed without capturing an error');
}

/**
 * Race with timeout
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutError?: Error
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(
      () => reject(timeoutError || new Error('Operation timed out')),
      timeoutMs
    );
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
  }
}
