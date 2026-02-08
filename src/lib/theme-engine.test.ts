import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ThemeEngine } from './theme-engine';
import { mockInvokeHandler, clearInvokeHandlers } from '../test/mocks/tauri-core';
import { emitTestEvent, clearListeners } from '../test/mocks/tauri-event';

beforeEach(() => {
  clearInvokeHandlers();
  clearListeners();
  // Clean up any leftover style elements
  const existing = document.getElementById('theme-variables');
  if (existing) existing.remove();
});

describe('ThemeEngine', () => {
  it('creates style element on construction', () => {
    new ThemeEngine();
    const styleEl = document.getElementById('theme-variables');
    expect(styleEl).not.toBeNull();
    expect(styleEl?.tagName).toBe('STYLE');
  });

  it('getCurrentTheme returns default theme', () => {
    const engine = new ThemeEngine();
    expect(engine.getCurrentTheme()).toBe('liquid-glass-dark');
  });

  it('applyTheme sets CSS variables', async () => {
    mockInvokeHandler('load_theme', ':root { --bg: #000; }');
    const engine = new ThemeEngine();

    await engine.applyTheme('my-theme');

    const styleEl = document.getElementById('theme-variables');
    expect(styleEl?.textContent).toBe(':root { --bg: #000; }');
    expect(engine.getCurrentTheme()).toBe('my-theme');
  });

  it('applyTheme persists theme to localStorage', async () => {
    mockInvokeHandler('load_theme', ':root {}');
    const spy = vi.spyOn(Storage.prototype, 'setItem');
    const engine = new ThemeEngine();

    await engine.applyTheme('my-theme');

    expect(spy).toHaveBeenCalledWith('theme', 'my-theme');
    spy.mockRestore();
  });

  it('applyTheme adds and removes transition class', async () => {
    vi.useFakeTimers();
    mockInvokeHandler('load_theme', ':root {}');
    const engine = new ThemeEngine();

    // Mock getComputedStyle to return transition duration
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      getPropertyValue: () => '300',
    } as unknown as CSSStyleDeclaration);

    const applyPromise = engine.applyTheme('my-theme');
    await applyPromise;

    // Class should be added during transition
    expect(document.body.classList.contains('theme-transitioning')).toBe(true);

    // After timeout, class should be removed
    vi.advanceTimersByTime(300);
    expect(document.body.classList.contains('theme-transitioning')).toBe(false);

    vi.useRealTimers();
  });

  it('applyTheme throws on error', async () => {
    mockInvokeHandler('load_theme', () => {
      throw new Error('Theme not found');
    });
    const engine = new ThemeEngine();

    await expect(engine.applyTheme('nonexistent')).rejects.toThrow('Theme not found');
  });

  it('listThemes calls invoke', async () => {
    mockInvokeHandler('list_themes', ['dark', 'light']);
    const engine = new ThemeEngine();

    const themes = await engine.listThemes();
    expect(themes).toEqual(['dark', 'light']);
  });

  it('responds to theme:reload event', async () => {
    mockInvokeHandler('load_theme', ':root { --reloaded: true; }');
    const engine = new ThemeEngine();

    // Emit the hot-reload event
    emitTestEvent('theme:reload', { theme: 'reloaded-theme' });

    // Wait for async applyTheme to complete
    await vi.waitFor(() => {
      expect(engine.getCurrentTheme()).toBe('reloaded-theme');
    });

    const styleEl = document.getElementById('theme-variables');
    expect(styleEl?.textContent).toBe(':root { --reloaded: true; }');
  });
});
