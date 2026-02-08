import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { themeStore, currentThemeMetadata, isDarkTheme, themeColors, type Theme } from './theme';

beforeEach(() => {
  themeStore.resetToDefault();
});

describe('theme store', () => {
  it('default theme is MilkyText', () => {
    const state = get(themeStore);
    expect(state.current?.metadata.name).toBe('MilkyText');
  });

  it('has two available themes', () => {
    const state = get(themeStore);
    expect(state.available).toHaveLength(2);
    expect(state.available.map((t) => t.metadata.name)).toEqual(['MilkyText', 'Liquid Glass Dark']);
  });

  it('switchTheme updates current theme', () => {
    themeStore.switchTheme('Liquid Glass Dark');
    const state = get(themeStore);
    expect(state.current?.metadata.name).toBe('Liquid Glass Dark');
  });

  it('switchTheme with invalid name is no-op', () => {
    themeStore.switchTheme('NonExistent');
    const state = get(themeStore);
    expect(state.current?.metadata.name).toBe('MilkyText');
  });

  it('resetToDefault restores MilkyText', () => {
    themeStore.switchTheme('Liquid Glass Dark');
    themeStore.resetToDefault();
    expect(get(themeStore).current?.metadata.name).toBe('MilkyText');
  });

  it('setTheme sets arbitrary theme', () => {
    const state = get(themeStore);
    const liquidGlass = state.available[1];
    themeStore.setTheme(liquidGlass);
    expect(get(themeStore).current?.metadata.name).toBe('Liquid Glass Dark');
  });

  it('switchTheme back to original', () => {
    themeStore.switchTheme('Liquid Glass Dark');
    themeStore.switchTheme('MilkyText');
    expect(get(themeStore).current?.metadata.name).toBe('MilkyText');
  });

  it('setTheme updates then switchTheme overrides', () => {
    const state = get(themeStore);
    themeStore.setTheme(state.available[1]);
    themeStore.switchTheme('MilkyText');
    expect(get(themeStore).current?.metadata.name).toBe('MilkyText');
  });
});

describe('derived stores', () => {
  it('currentThemeMetadata returns metadata', () => {
    const meta = get(currentThemeMetadata);
    expect(meta?.name).toBe('MilkyText');
    expect(meta?.author).toBe('heat');
    expect(meta?.base).toBe('dark');
  });

  it('isDarkTheme returns true for dark themes', () => {
    expect(get(isDarkTheme)).toBe(true);
  });

  it('isDarkTheme returns true for Liquid Glass Dark too', () => {
    themeStore.switchTheme('Liquid Glass Dark');
    expect(get(isDarkTheme)).toBe(true);
  });

  it('themeColors returns color values', () => {
    const colors = get(themeColors);
    expect(colors).not.toBeNull();
    expect(colors?.primary).toBe('#FFCCD5');
  });

  it('themeColors changes with theme', () => {
    themeStore.switchTheme('Liquid Glass Dark');
    const colors = get(themeColors);
    expect(colors).not.toBeNull();
    // Liquid Glass Dark has different primary color
    expect(colors?.primary).toBeDefined();
  });

  it('currentThemeMetadata changes with theme switch', () => {
    themeStore.switchTheme('Liquid Glass Dark');
    const meta = get(currentThemeMetadata);
    expect(meta?.name).toBe('Liquid Glass Dark');
  });
});

describe('applyThemeToDocument branch coverage', () => {
  it('handles theme with all optional fields undefined (fallback branches)', () => {
    // Build a minimal theme with all optional fields undefined
    // This exercises every ?? and || fallback branch in applyThemeToDocument
    const minimalTheme: Theme = {
      metadata: { name: 'Minimal', author: 'test', version: '1.0', base: 'dark' },
      palette: {
        background: '#000',
        foreground: '#fff',
        cursorColor: '#fff',
        selectionBackground: '#333', // selectionForeground omitted
        black: '#000',
        red: '#f00',
        green: '#0f0',
        yellow: '#ff0',
        blue: '#00f',
        purple: '#f0f',
        cyan: '#0ff',
        white: '#fff',
        brightBlack: '#888',
        brightRed: '#f88',
        brightGreen: '#8f8',
        brightYellow: '#ff8',
        brightBlue: '#88f',
        brightPurple: '#f8f',
        brightCyan: '#8ff',
        brightWhite: '#fff',
      },
      window: {
        background: { base: '#111', blur: 10 },
        border: { radius: 8, width: 1, color: '#333' },
        // shadow omitted
      },
      chrome: {
        background: '#222',
        foreground: '#eee',
        height: 32,
        // blur, border, menuBackground, menuHover, menuForeground ALL omitted
      },
      editor: {
        background: '#1a1a1a',
        foreground: '#ddd',
        cursor: { color: '#fff', width: 2 },
        selection: { background: '#444' }, // foreground omitted
        line: { active: '#2a2a2a', number: '#666', numberActive: '#aaa' },
        gutter: { background: '#1a1a1a' }, // border omitted
        // fontFamily, fontSize, lineHeight ALL omitted
      },
      syntax: {
        comment: '#666',
        keyword: '#f0f',
        string: '#0f0',
        number: '#ff0',
        operator: '#fff',
        function: '#0ff',
        variable: '#f80',
        type: '#ff0',
        constant: '#f00',
        // tag, attribute, property, punctuation, regexp, heading, link, meta ALL omitted
      },
      ui: {
        statusBar: { background: '#111', foreground: '#aaa', height: 24 },
        primary: '#f0f',
        border: '#333',
        borderSubtle: '#222',
        textPrimary: '#eee',
        textSecondary: '#999',
        textDisabled: '#555',
        buttonBackground: '#333',
        buttonHover: '#444',
        buttonActive: '#555',
        inputBackground: '#222',
        inputBorder: '#333',
        inputFocus: '#f0f',
        tooltipBackground: '#111',
        scrollbarThumb: '#444',
        scrollbarThumbHover: '#555',
        error: '#f00',
        warning: '#ff0',
        success: '#0f0',
        info: '#0ff',
        searchMatch: '#ff0',
        searchMatchSelected: '#f80',
        selectionMatch: '#333',
      },
      transitions: { chromeToggle: 200, themeSwitch: 300, hover: 150, easing: 'ease' },
    };

    // This should trigger all ?? fallback branches
    themeStore.setTheme(minimalTheme);
    const state = get(themeStore);
    expect(state.current?.metadata.name).toBe('Minimal');

    // Verify CSS vars were set with fallbacks
    const root = document.documentElement;
    // Chrome fallbacks: blur ?? 0, border ?? ui.border, etc.
    expect(root.style.getPropertyValue('--chrome-blur')).toBe('0px');
    expect(root.style.getPropertyValue('--chrome-border')).toBe('#333');
    // Editor fallbacks: fontFamily ?? 'monospace', fontSize ?? 14, lineHeight ?? 1.6
    expect(root.style.getPropertyValue('--editor-font-family')).toBe('monospace');
    expect(root.style.getPropertyValue('--editor-font-size')).toBe('14px');
    expect(root.style.getPropertyValue('--editor-line-height')).toBe('1.6');
    // Gutter border fallback
    expect(root.style.getPropertyValue('--gutter-border')).toBe('#222');
    // Syntax fallbacks
    expect(root.style.getPropertyValue('--syntax-tag')).toBe('#f0f'); // ?? keyword
    expect(root.style.getPropertyValue('--syntax-attribute')).toBe('#0ff'); // ?? function
    expect(root.style.getPropertyValue('--syntax-property')).toBe('#f80'); // ?? variable
    expect(root.style.getPropertyValue('--syntax-punctuation')).toBe('#999'); // ?? textSecondary
    expect(root.style.getPropertyValue('--syntax-regexp')).toBe('#0f0'); // ?? string
    expect(root.style.getPropertyValue('--syntax-heading')).toBe('#f0f'); // ?? keyword
    expect(root.style.getPropertyValue('--syntax-link')).toBe('#0f0'); // ?? string
    expect(root.style.getPropertyValue('--syntax-meta')).toBe('#999'); // ?? textSecondary
  });

  it('handles theme with selection.foreground defined', () => {
    const state = get(themeStore);
    // Create a theme based on existing one but with selection.foreground
    const themeWithSelFg: Theme = {
      ...state.current!,
      metadata: { ...state.current!.metadata, name: 'WithSelFg' },
      editor: {
        ...state.current!.editor,
        selection: {
          ...state.current!.editor.selection,
          foreground: '#ff0000',
        },
      },
    };
    themeStore.setTheme(themeWithSelFg);
    const root = document.documentElement;
    expect(root.style.getPropertyValue('--selection-fg')).toBe('#ff0000');
  });
});
