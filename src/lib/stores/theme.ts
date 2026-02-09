// src/lib/stores/theme.ts

import { writable, derived, get } from 'svelte/store';
import { invoke } from '@tauri-apps/api/core';

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

export interface ThemeInfo {
  name: string;
  author: string;
  version: string;
  base: string;
  file: string;
}

export interface ThemeState {
  current: Theme | null;
  available: ThemeInfo[];
  loading: boolean;
  error: string | null;
}

// ============================================================================
// BACKEND THEME LOADING
// ============================================================================

/** Load a theme from the Rust backend by TOML file stem (e.g. "milkytext") */
async function loadThemeFromBackend(fileName: string): Promise<Theme> {
  const data = await invoke<Theme>('load_theme_data', { themeName: fileName });
  return data;
}

/** List available themes from the backend */
async function listThemesFromBackend(): Promise<ThemeInfo[]> {
  return await invoke<ThemeInfo[]>('list_themes');
}

// ============================================================================
// THEME STORE
// ============================================================================

/** Cache of loaded themes keyed by file stem */
const themeCache = new Map<string, Theme>();

function createThemeStore() {
  const { subscribe, update } = writable<ThemeState>({
    current: null,
    available: [],
    loading: true,
    error: null,
  });

  /** Extract file stem from ThemeInfo.file (e.g. "milkytext.toml" -> "milkytext") */
  function fileStem(file: string): string {
    return file.replace(/\.toml$/, '');
  }

  /** Load a theme by file stem, using cache if available */
  async function loadTheme(stem: string): Promise<Theme> {
    const cached = themeCache.get(stem);
    if (cached) return cached;

    const theme = await loadThemeFromBackend(stem);
    themeCache.set(stem, theme);
    return theme;
  }

  return {
    subscribe,

    /** Initialize the theme store by listing available themes and loading the default */
    init: async () => {
      try {
        update((s) => ({ ...s, loading: true, error: null }));

        const available = (await listThemesFromBackend()) ?? [];
        update((s) => ({ ...s, available }));

        // Try to load saved preference, fall back to milkytext, then first available
        const savedStem =
          typeof localStorage !== 'undefined' ? localStorage.getItem('theme') : null;

        // Determine which theme to load
        let stemToLoad: string | null = null;
        if (savedStem && available.some((t) => fileStem(t.file) === savedStem)) {
          stemToLoad = savedStem;
        } else {
          // Prefer milkytext as default, fall back to first available
          const milkytext = available.find((t) => fileStem(t.file) === 'milkytext');
          stemToLoad = milkytext
            ? 'milkytext'
            : available.length > 0
              ? fileStem(available[0].file)
              : null;
        }

        if (stemToLoad) {
          const theme = await loadTheme(stemToLoad);
          update((s) => ({ ...s, current: theme, loading: false }));
          applyThemeToDocument(theme);
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('theme', stemToLoad);
          }
        } else {
          update((s) => ({ ...s, loading: false, error: 'No themes available' }));
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('Failed to initialize themes:', msg);
        update((s) => ({ ...s, loading: false, error: msg }));
      }
    },

    setTheme: (theme: Theme) => {
      update((state) => ({ ...state, current: theme, error: null }));
      applyThemeToDocument(theme);
    },

    /** Switch theme by display name (matches ThemeInfo.name or metadata.name) */
    switchTheme: async (themeName: string) => {
      const state = get({ subscribe });

      // Find the matching ThemeInfo
      const info = state.available?.find((t) => t.name === themeName);
      if (!info) {
        console.warn(`Theme not found: ${themeName}`);
        return;
      }

      const stem = fileStem(info.file);

      try {
        update((s) => ({ ...s, loading: true }));
        const theme = await loadTheme(stem);
        update((s) => ({ ...s, current: theme, loading: false }));
        applyThemeToDocument(theme);
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('theme', stem);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`Failed to load theme '${themeName}':`, msg);
        update((s) => ({ ...s, loading: false, error: msg }));
      }
    },

    resetToDefault: async () => {
      const state = get({ subscribe });
      if (state.available?.length > 0) {
        const stem = fileStem(state.available[0].file);
        try {
          const theme = await loadTheme(stem);
          update((s) => ({ ...s, current: theme, error: null }));
          applyThemeToDocument(theme);
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('theme', stem);
          }
        } catch (err) {
          console.error('Failed to reset to default theme:', err);
        }
      }
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
  // Kick off async initialization — theme will load from backend
  themeStore.init().catch((err) => {
    console.error('Theme initialization failed:', err);
  });
}
