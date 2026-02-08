import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { mockInvokeHandler, clearInvokeHandlers } from '../../test/mocks/tauri-core';
import {
  themeStore,
  currentThemeMetadata,
  isDarkTheme,
  themeColors,
  type Theme,
  type ThemeInfo,
} from './theme';

// ============================================================================
// TEST FIXTURES
// ============================================================================

const MOCK_MILKY: Theme = {
  metadata: { name: 'MilkyText', author: 'heat', version: '1.0.0', base: 'dark' },
  palette: {
    background: '#030304',
    foreground: '#FFFFFF',
    cursorColor: '#FFCCD5',
    selectionBackground: 'rgba(255, 255, 255, 0.15)',
    black: '#363941',
    red: '#FF758F',
    green: '#E6FF75',
    yellow: '#FBD58E',
    blue: '#8875FF',
    purple: '#FF75C6',
    cyan: '#75FFCF',
    white: '#FFCCD5',
    brightBlack: '#505664',
    brightRed: '#FF8FA3',
    brightGreen: '#F3F3B0',
    brightYellow: '#FDDEBC',
    brightBlue: '#C4AEF5',
    brightPurple: '#FFAED8',
    brightCyan: '#BAF3DD',
    brightWhite: '#FFE6EA',
  },
  window: {
    background: { base: '#030304', blur: 20 },
    border: { radius: 12, width: 1, color: 'rgba(255, 255, 255, 0.08)' },
  },
  chrome: {
    background: '#363941',
    foreground: '#FFFFFF',
    height: 32,
    blur: 10,
  },
  editor: {
    background: 'transparent',
    foreground: '#FFFFFF',
    cursor: { color: '#FFCCD5', width: 2 },
    selection: { background: 'rgba(255, 255, 255, 0.15)' },
    line: {
      active: 'rgba(255, 255, 255, 0.04)',
      number: 'rgba(255, 255, 255, 0.25)',
      numberActive: '#FFCCD5',
    },
    gutter: { background: 'rgba(0, 0, 0, 0.15)' },
  },
  syntax: {
    comment: '#8875FF',
    keyword: '#FF75C6',
    string: '#75FFCF',
    number: '#BAF3DD',
    operator: '#FF758F',
    function: '#F3F3B0',
    variable: '#FFCCD5',
    type: '#C4AEF5',
    constant: '#FFAED8',
  },
  ui: {
    statusBar: { background: '#363941', foreground: '#FFFFFF', height: 24 },
    primary: '#FFCCD5',
    border: 'rgba(255, 255, 255, 0.1)',
    borderSubtle: 'rgba(255, 255, 255, 0.06)',
    textPrimary: '#FFFFFF',
    textSecondary: 'rgba(255, 255, 255, 0.55)',
    textDisabled: 'rgba(255, 255, 255, 0.25)',
    buttonBackground: 'rgba(255, 255, 255, 0.08)',
    buttonHover: 'rgba(255, 255, 255, 0.12)',
    buttonActive: 'rgba(255, 204, 213, 0.2)',
    inputBackground: 'rgba(0, 0, 0, 0.25)',
    inputBorder: 'rgba(255, 255, 255, 0.12)',
    inputFocus: 'rgba(255, 204, 213, 0.4)',
    tooltipBackground: 'rgba(54, 57, 65, 0.97)',
    scrollbarThumb: 'rgba(255, 255, 255, 0.12)',
    scrollbarThumbHover: 'rgba(255, 255, 255, 0.25)',
    error: '#FF758F',
    warning: '#FBD58E',
    success: '#75FFCF',
    info: '#8875FF',
    searchMatch: 'rgba(251, 213, 142, 0.3)',
    searchMatchSelected: 'rgba(251, 213, 142, 0.5)',
    selectionMatch: 'rgba(255, 204, 213, 0.12)',
  },
  transitions: { chromeToggle: 200, themeSwitch: 300, hover: 100, easing: 'ease' },
};

const MOCK_GLASS: Theme = {
  ...MOCK_MILKY,
  metadata: { name: 'Liquid Glass Dark', author: 'heat', version: '1.0.0', base: 'dark' },
  ui: { ...MOCK_MILKY.ui, primary: '#00d9ff' },
};

const MOCK_THEME_LIST: ThemeInfo[] = [
  { name: 'MilkyText', author: 'heat', version: '1.0.0', base: 'dark', file: 'milkytext.toml' },
  {
    name: 'Liquid Glass Dark',
    author: 'heat',
    version: '1.0.0',
    base: 'dark',
    file: 'glass-dark.toml',
  },
];

// ============================================================================
// SETUP
// ============================================================================

function setupMocks() {
  clearInvokeHandlers();
  mockInvokeHandler('list_themes', () => MOCK_THEME_LIST);
  mockInvokeHandler('load_theme_data', (args?: Record<string, unknown>) => {
    const name = args?.themeName as string;
    if (name === 'milkytext') return MOCK_MILKY;
    if (name === 'glass-dark') return MOCK_GLASS;
    throw new Error(`Unknown theme: ${name}`);
  });
}

beforeEach(async () => {
  setupMocks();
  localStorage.clear();
  // Re-initialize the store with mocked backend
  await themeStore.init();
});

// ============================================================================
// TESTS
// ============================================================================

describe('theme store', () => {
  it('initializes with first available theme', () => {
    const state = get(themeStore);
    expect(state.current?.metadata.name).toBe('MilkyText');
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('lists available themes from backend', () => {
    const state = get(themeStore);
    expect(state.available).toHaveLength(2);
    expect(state.available.map((t) => t.name)).toEqual(['MilkyText', 'Liquid Glass Dark']);
  });

  it('switchTheme updates current theme', async () => {
    await themeStore.switchTheme('Liquid Glass Dark');
    const state = get(themeStore);
    expect(state.current?.metadata.name).toBe('Liquid Glass Dark');
  });

  it('switchTheme with invalid name is no-op', async () => {
    await themeStore.switchTheme('NonExistent');
    const state = get(themeStore);
    expect(state.current?.metadata.name).toBe('MilkyText');
  });

  it('resetToDefault restores first theme', async () => {
    await themeStore.switchTheme('Liquid Glass Dark');
    await themeStore.resetToDefault();
    expect(get(themeStore).current?.metadata.name).toBe('MilkyText');
  });

  it('setTheme sets arbitrary theme', () => {
    themeStore.setTheme(MOCK_GLASS);
    expect(get(themeStore).current?.metadata.name).toBe('Liquid Glass Dark');
  });

  it('switchTheme back to original', async () => {
    await themeStore.switchTheme('Liquid Glass Dark');
    await themeStore.switchTheme('MilkyText');
    expect(get(themeStore).current?.metadata.name).toBe('MilkyText');
  });

  it('setTheme then switchTheme overrides', async () => {
    themeStore.setTheme(MOCK_GLASS);
    await themeStore.switchTheme('MilkyText');
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

  it('isDarkTheme returns true for Liquid Glass Dark too', async () => {
    await themeStore.switchTheme('Liquid Glass Dark');
    expect(get(isDarkTheme)).toBe(true);
  });

  it('themeColors returns color values', () => {
    const colors = get(themeColors);
    expect(colors).not.toBeNull();
    expect(colors?.primary).toBe('#FFCCD5');
  });

  it('themeColors changes with theme', async () => {
    await themeStore.switchTheme('Liquid Glass Dark');
    const colors = get(themeColors);
    expect(colors).not.toBeNull();
    expect(colors?.primary).toBeDefined();
  });

  it('currentThemeMetadata changes with theme switch', async () => {
    await themeStore.switchTheme('Liquid Glass Dark');
    const meta = get(currentThemeMetadata);
    expect(meta?.name).toBe('Liquid Glass Dark');
  });
});

describe('applyThemeToDocument branch coverage', () => {
  it('handles theme with all optional fields undefined (fallback branches)', () => {
    const minimalTheme: Theme = {
      metadata: { name: 'Minimal', author: 'test', version: '1.0', base: 'dark' },
      palette: {
        background: '#000',
        foreground: '#fff',
        cursorColor: '#fff',
        selectionBackground: '#333',
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
      },
      chrome: {
        background: '#222',
        foreground: '#eee',
        height: 32,
      },
      editor: {
        background: '#1a1a1a',
        foreground: '#ddd',
        cursor: { color: '#fff', width: 2 },
        selection: { background: '#444' },
        line: { active: '#2a2a2a', number: '#666', numberActive: '#aaa' },
        gutter: { background: '#1a1a1a' },
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

    themeStore.setTheme(minimalTheme);
    const state = get(themeStore);
    expect(state.current?.metadata.name).toBe('Minimal');

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
    const themeWithSelFg: Theme = {
      ...MOCK_MILKY,
      metadata: { ...MOCK_MILKY.metadata, name: 'WithSelFg' },
      editor: {
        ...MOCK_MILKY.editor,
        selection: {
          ...MOCK_MILKY.editor.selection,
          foreground: '#ff0000',
        },
      },
    };
    themeStore.setTheme(themeWithSelFg);
    const root = document.documentElement;
    expect(root.style.getPropertyValue('--selection-fg')).toBe('#ff0000');
  });
});
