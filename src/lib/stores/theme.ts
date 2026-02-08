// src/lib/stores/theme.ts

import { writable, derived, get } from 'svelte/store';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface ThemeMetadata {
  name: string;
  author: string;
  version: string;
  base: 'dark' | 'light';
}

/** Full 16-color ANSI palette + foreground/background/cursor/selection */
export interface ThemePalette {
  background: string;
  foreground: string;
  cursorColor: string;
  selectionBackground: string;
  selectionForeground?: string;
  black: string;
  red: string;
  green: string;
  yellow: string;
  blue: string;
  purple: string;
  cyan: string;
  white: string;
  brightBlack: string;
  brightRed: string;
  brightGreen: string;
  brightYellow: string;
  brightBlue: string;
  brightPurple: string;
  brightCyan: string;
  brightWhite: string;
}

export interface WindowTheme {
  background: { base: string; blur: number };
  border: { radius: number; width: number; color: string };
  shadow?: { color: string; blur: number; offset: [number, number] };
}

export interface ChromeTheme {
  background: string;
  foreground: string;
  height: number;
  blur?: number;
  border?: string;
  menuBackground?: string;
  menuHover?: string;
  menuForeground?: string;
}

export interface EditorTheme {
  background: string;
  foreground: string;
  cursor: { color: string; width: number };
  selection: { background: string; foreground?: string };
  line: { active: string; number: string; numberActive: string };
  gutter: { background: string; border?: string };
  fontFamily?: string;
  fontSize?: number;
  lineHeight?: number;
}

export interface SyntaxTheme {
  comment: string;
  keyword: string;
  string: string;
  number: string;
  operator: string;
  function: string;
  variable: string;
  type: string;
  constant: string;
  tag?: string;
  attribute?: string;
  property?: string;
  punctuation?: string;
  regexp?: string;
  heading?: string;
  link?: string;
  meta?: string;
}

export interface UiTheme {
  statusBar: { background: string; foreground: string; height: number };
  primary: string;
  border: string;
  borderSubtle: string;
  textPrimary: string;
  textSecondary: string;
  textDisabled: string;
  buttonBackground: string;
  buttonHover: string;
  buttonActive: string;
  inputBackground: string;
  inputBorder: string;
  inputFocus: string;
  tooltipBackground: string;
  scrollbarThumb: string;
  scrollbarThumbHover: string;
  error: string;
  warning: string;
  success: string;
  info: string;
  searchMatch: string;
  searchMatchSelected: string;
  selectionMatch: string;
}

export interface TransitionTheme {
  chromeToggle: number;
  themeSwitch: number;
  hover: number;
  easing: string;
}

export interface Theme {
  metadata: ThemeMetadata;
  palette: ThemePalette;
  window: WindowTheme;
  chrome: ChromeTheme;
  editor: EditorTheme;
  syntax: SyntaxTheme;
  ui: UiTheme;
  transitions: TransitionTheme;
}

export interface ThemeState {
  current: Theme | null;
  available: Theme[];
  loading: boolean;
  error: string | null;
}

// ============================================================================
// MILKYTEXT THEME (Default)
// ============================================================================

const MILKYTEXT: Theme = {
  metadata: {
    name: 'MilkyText',
    author: 'heat',
    version: '1.0.0',
    base: 'dark',
  },
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
    shadow: { color: 'rgba(0, 0, 0, 0.6)', blur: 40, offset: [0, 10] },
  },
  chrome: {
    background: '#363941',
    foreground: '#FFFFFF',
    height: 32,
    blur: 10,
    border: 'rgba(255, 255, 255, 0.06)',
    menuBackground: 'rgba(54, 57, 65, 0.98)',
    menuHover: 'rgba(255, 204, 213, 0.12)',
    menuForeground: 'rgba(255, 255, 255, 0.85)',
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
    gutter: { background: 'rgba(0, 0, 0, 0.15)', border: 'rgba(255, 255, 255, 0.06)' },
    fontFamily: "'SF Mono', 'Cascadia Code', 'Fira Code', 'JetBrains Mono', 'Consolas', monospace",
    fontSize: 14,
    lineHeight: 1.6,
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
    tag: '#FF75C6',
    attribute: '#F3F3B0',
    property: '#FFCCD5',
    punctuation: 'rgba(255, 255, 255, 0.5)',
    regexp: '#75FFCF',
    heading: '#FF75C6',
    link: '#75FFCF',
    meta: '#505664',
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
  transitions: {
    chromeToggle: 200,
    themeSwitch: 300,
    hover: 100,
    easing: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
  },
};

// ============================================================================
// LIQUID GLASS DARK (Legacy)
// ============================================================================

const LIQUID_GLASS_DARK: Theme = {
  metadata: {
    name: 'Liquid Glass Dark',
    author: 'skretchpad',
    version: '1.0.0',
    base: 'dark',
  },
  palette: {
    background: 'rgba(18, 18, 18, 0.85)',
    foreground: '#e4e4e4',
    cursorColor: '#00d9ff',
    selectionBackground: 'rgba(0, 217, 255, 0.2)',
    black: '#1c1c1c',
    red: '#ff5555',
    green: '#50fa7b',
    yellow: '#f1fa8c',
    blue: '#bd93f9',
    purple: '#ff79c6',
    cyan: '#8be9fd',
    white: '#f8f8f2',
    brightBlack: '#6272a4',
    brightRed: '#ff6e6e',
    brightGreen: '#69ff94',
    brightYellow: '#ffffa5',
    brightBlue: '#d6acff',
    brightPurple: '#ff92df',
    brightCyan: '#a4ffff',
    brightWhite: '#ffffff',
  },
  window: {
    background: { base: 'rgba(18, 18, 18, 0.85)', blur: 20 },
    border: { radius: 12, width: 1, color: 'rgba(255, 255, 255, 0.1)' },
    shadow: { color: 'rgba(0, 0, 0, 0.5)', blur: 40, offset: [0, 10] },
  },
  chrome: {
    background: 'rgba(28, 28, 28, 0.95)',
    foreground: 'rgba(228, 228, 228, 0.9)',
    height: 32,
    blur: 10,
    border: 'rgba(255, 255, 255, 0.1)',
    menuBackground: 'rgba(36, 36, 36, 0.98)',
    menuHover: 'rgba(0, 217, 255, 0.15)',
    menuForeground: 'rgba(228, 228, 228, 0.9)',
  },
  editor: {
    background: 'transparent',
    foreground: '#e4e4e4',
    cursor: { color: '#00d9ff', width: 2 },
    selection: { background: 'rgba(0, 217, 255, 0.2)' },
    line: {
      active: 'rgba(255, 255, 255, 0.05)',
      number: 'rgba(228, 228, 228, 0.4)',
      numberActive: '#00d9ff',
    },
    gutter: { background: 'rgba(0, 0, 0, 0.2)', border: 'rgba(255, 255, 255, 0.1)' },
    fontFamily: "'SF Mono', 'Cascadia Code', 'Fira Code', 'JetBrains Mono', 'Consolas', monospace",
    fontSize: 14,
    lineHeight: 1.6,
  },
  syntax: {
    comment: '#6a737d',
    keyword: '#ff79c6',
    string: '#50fa7b',
    number: '#bd93f9',
    operator: '#ff79c6',
    function: '#8be9fd',
    variable: '#f8f8f2',
    type: '#8be9fd',
    constant: '#bd93f9',
    tag: '#ff79c6',
    attribute: '#50fa7b',
    property: '#f8f8f2',
    punctuation: '#6272a4',
    regexp: '#f1fa8c',
    heading: '#8be9fd',
    link: '#50fa7b',
    meta: '#6272a4',
  },
  ui: {
    statusBar: { background: 'rgba(28, 28, 28, 0.95)', foreground: 'rgba(228, 228, 228, 0.7)', height: 24 },
    primary: '#00d9ff',
    border: 'rgba(255, 255, 255, 0.1)',
    borderSubtle: 'rgba(255, 255, 255, 0.06)',
    textPrimary: '#e4e4e4',
    textSecondary: 'rgba(228, 228, 228, 0.6)',
    textDisabled: 'rgba(228, 228, 228, 0.3)',
    buttonBackground: 'rgba(255, 255, 255, 0.1)',
    buttonHover: 'rgba(255, 255, 255, 0.15)',
    buttonActive: 'rgba(0, 217, 255, 0.3)',
    inputBackground: 'rgba(0, 0, 0, 0.3)',
    inputBorder: 'rgba(255, 255, 255, 0.2)',
    inputFocus: 'rgba(0, 217, 255, 0.5)',
    tooltipBackground: 'rgba(28, 28, 28, 0.95)',
    scrollbarThumb: 'rgba(255, 255, 255, 0.12)',
    scrollbarThumbHover: 'rgba(255, 255, 255, 0.25)',
    error: '#ff5555',
    warning: '#f1fa8c',
    success: '#50fa7b',
    info: '#00d9ff',
    searchMatch: 'rgba(255, 193, 7, 0.3)',
    searchMatchSelected: 'rgba(255, 193, 7, 0.5)',
    selectionMatch: 'rgba(0, 217, 255, 0.1)',
  },
  transitions: {
    chromeToggle: 200,
    themeSwitch: 300,
    hover: 100,
    easing: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
  },
};

// ============================================================================
// THEME STORE
// ============================================================================

function createThemeStore() {
  const { subscribe, update } = writable<ThemeState>({
    current: MILKYTEXT,
    available: [MILKYTEXT, LIQUID_GLASS_DARK],
    loading: false,
    error: null,
  });

  return {
    subscribe,

    setTheme: (theme: Theme) => {
      update((state) => ({ ...state, current: theme, error: null }));
      applyThemeToDocument(theme);
    },

    switchTheme: (themeName: string) => {
      const state = get({ subscribe });
      const theme = state.available.find((t) => t.metadata.name === themeName);
      if (theme) {
        update((s) => ({ ...s, current: theme }));
        applyThemeToDocument(theme);
      }
    },

    resetToDefault: () => {
      update((state) => ({ ...state, current: MILKYTEXT, error: null }));
      applyThemeToDocument(MILKYTEXT);
    },
  };
}

export const themeStore = createThemeStore();

// ============================================================================
// THEME APPLICATION -- Sets ALL CSS variables used by the app
// ============================================================================

function applyThemeToDocument(theme: Theme): void {
  const root = document.documentElement;
  const s = (prop: string, val: string) => root.style.setProperty(prop, val);

  // ---- Palette (raw colors for programmatic access) ----
  s('--palette-bg', theme.palette.background);
  s('--palette-fg', theme.palette.foreground);
  s('--palette-cursor', theme.palette.cursorColor);
  s('--palette-selection', theme.palette.selectionBackground);
  s('--palette-black', theme.palette.black);
  s('--palette-red', theme.palette.red);
  s('--palette-green', theme.palette.green);
  s('--palette-yellow', theme.palette.yellow);
  s('--palette-blue', theme.palette.blue);
  s('--palette-purple', theme.palette.purple);
  s('--palette-cyan', theme.palette.cyan);
  s('--palette-white', theme.palette.white);
  s('--palette-bright-black', theme.palette.brightBlack);
  s('--palette-bright-red', theme.palette.brightRed);
  s('--palette-bright-green', theme.palette.brightGreen);
  s('--palette-bright-yellow', theme.palette.brightYellow);
  s('--palette-bright-blue', theme.palette.brightBlue);
  s('--palette-bright-purple', theme.palette.brightPurple);
  s('--palette-bright-cyan', theme.palette.brightCyan);
  s('--palette-bright-white', theme.palette.brightWhite);

  // ---- Window ----
  s('--window-bg', theme.window.background.base);
  s('--window-blur', `${theme.window.background.blur}px`);
  s('--window-border-radius', `${theme.window.border.radius}px`);
  s('--window-border-width', `${theme.window.border.width}px`);
  s('--window-border-color', theme.window.border.color);

  // ---- Chrome ----
  s('--chrome-bg', theme.chrome.background);
  s('--chrome-fg', theme.chrome.foreground);
  s('--chrome-height', `${theme.chrome.height}px`);
  s('--chrome-blur', `${theme.chrome.blur ?? 0}px`);
  s('--chrome-border', theme.chrome.border ?? theme.ui.border);
  s('--chrome-menu-bg', theme.chrome.menuBackground ?? theme.chrome.background);
  s('--chrome-menu-hover', theme.chrome.menuHover ?? theme.ui.buttonHover);
  s('--chrome-menu-fg', theme.chrome.menuForeground ?? theme.chrome.foreground);

  // ---- Editor ----
  s('--editor-bg', theme.editor.background);
  s('--editor-fg', theme.editor.foreground);
  s('--cursor-color', theme.editor.cursor.color);
  s('--cursor-width', `${theme.editor.cursor.width}px`);
  s('--selection-bg', theme.editor.selection.background);
  if (theme.editor.selection.foreground) {
    s('--selection-fg', theme.editor.selection.foreground);
  }
  s('--line-active', theme.editor.line.active);
  s('--line-number', theme.editor.line.number);
  s('--line-number-active', theme.editor.line.numberActive);
  s('--gutter-bg', theme.editor.gutter.background);
  s('--gutter-border', theme.editor.gutter.border ?? theme.ui.borderSubtle);
  s('--editor-font-family', theme.editor.fontFamily ?? 'monospace');
  s('--editor-font-size', `${theme.editor.fontSize ?? 14}px`);
  s('--editor-line-height', `${theme.editor.lineHeight ?? 1.6}`);

  // ---- Syntax (for CodeMirror HighlightStyle) ----
  s('--syntax-comment', theme.syntax.comment);
  s('--syntax-keyword', theme.syntax.keyword);
  s('--syntax-string', theme.syntax.string);
  s('--syntax-number', theme.syntax.number);
  s('--syntax-operator', theme.syntax.operator);
  s('--syntax-function', theme.syntax.function);
  s('--syntax-variable', theme.syntax.variable);
  s('--syntax-type', theme.syntax.type);
  s('--syntax-constant', theme.syntax.constant);
  s('--syntax-tag', theme.syntax.tag ?? theme.syntax.keyword);
  s('--syntax-attribute', theme.syntax.attribute ?? theme.syntax.function);
  s('--syntax-property', theme.syntax.property ?? theme.syntax.variable);
  s('--syntax-punctuation', theme.syntax.punctuation ?? theme.ui.textSecondary);
  s('--syntax-regexp', theme.syntax.regexp ?? theme.syntax.string);
  s('--syntax-heading', theme.syntax.heading ?? theme.syntax.keyword);
  s('--syntax-link', theme.syntax.link ?? theme.syntax.string);
  s('--syntax-meta', theme.syntax.meta ?? theme.ui.textSecondary);

  // ---- UI (used by all components) ----
  s('--color-primary', theme.ui.primary);
  s('--border-color', theme.ui.border);
  s('--border-subtle', theme.ui.borderSubtle);
  s('--text-primary', theme.ui.textPrimary);
  s('--text-secondary', theme.ui.textSecondary);
  s('--text-disabled', theme.ui.textDisabled);
  s('--button-bg', theme.ui.buttonBackground);
  s('--button-hover', theme.ui.buttonHover);
  s('--button-active', theme.ui.buttonActive);
  s('--button-border', theme.ui.inputBorder);
  s('--input-bg', theme.ui.inputBackground);
  s('--input-border', theme.ui.inputBorder);
  s('--input-focus', theme.ui.inputFocus);
  s('--tooltip-bg', theme.ui.tooltipBackground);
  s('--scrollbar-thumb', theme.ui.scrollbarThumb);
  s('--scrollbar-thumb-hover', theme.ui.scrollbarThumbHover);
  s('--color-error', theme.ui.error);
  s('--color-warning', theme.ui.warning);
  s('--color-success', theme.ui.success);
  s('--color-info', theme.ui.info);
  s('--search-match', theme.ui.searchMatch);
  s('--search-match-selected', theme.ui.searchMatchSelected);
  s('--selection-match', theme.ui.selectionMatch);
  s('--font-mono', theme.editor.fontFamily ?? 'monospace');

  // ---- Status Bar ----
  s('--status-bar-bg', theme.ui.statusBar.background);
  s('--status-bar-fg', theme.ui.statusBar.foreground);
  s('--status-bar-height', `${theme.ui.statusBar.height}px`);

  // ---- Transitions ----
  s('--transition-chrome', `${theme.transitions.chromeToggle}ms`);
  s('--transition-theme', `${theme.transitions.themeSwitch}ms`);
  s('--transition-hover', `${theme.transitions.hover}ms`);
  s('--transition-fast', '100ms');
  s('--transition-medium', '200ms');
  s('--transition-slow', '300ms');
  s('--transition-easing', theme.transitions.easing);

  // ---- Body class for base theme ----
  document.body.className = document.body.className
    .split(' ')
    .filter((c) => !c.startsWith('theme-'))
    .concat(`theme-${theme.metadata.base}`)
    .join(' ')
    .trim();
}

// ============================================================================
// DERIVED STORES
// ============================================================================

export const currentThemeMetadata = derived(
  themeStore,
  ($theme) => $theme.current?.metadata || null
);

export const isDarkTheme = derived(
  themeStore,
  ($theme) => $theme.current?.metadata.base === 'dark'
);

export const themeColors = derived(themeStore, ($theme) => {
  if (!$theme.current) return null;
  return {
    primary: $theme.current.ui.primary,
    background: $theme.current.editor.background,
    foreground: $theme.current.editor.foreground,
    border: $theme.current.ui.border,
  };
});

// ============================================================================
// INITIALIZATION
// ============================================================================

if (typeof window !== 'undefined') {
  const state = get(themeStore);
  if (state.current) {
    applyThemeToDocument(state.current);
  }
}
