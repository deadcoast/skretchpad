// src/lib/stores/theme.ts

import { writable, derived, get } from 'svelte/store';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface ThemeMetadata {
  name: string;
  author: string;
  version: string;
  base: 'dark' | 'light' | 'high-contrast';
}

export interface WindowTheme {
  background: {
    base: string;
    blur: number;
  };
  border: {
    radius: number;
    width: number;
    color: string;
  };
  shadow?: {
    color: string;
    blur: number;
    offset: [number, number];
  };
}

export interface ChromeTheme {
  background: string;
  foreground: string;
  height: number;
  blur?: number;
  active?: {
    background: string;
    border: string;
  };
}

export interface EditorTheme {
  background: string;
  foreground: string;
  cursor: {
    color: string;
    width: number;
    blinkInterval?: number;
  };
  selection: {
    background: string;
    foreground?: string;
  };
  line: {
    active: string;
    number: string;
    numberActive: string;
  };
  gutter: {
    background: string;
    width: number;
  };
}

export interface SyntaxTheme {
  comment: TokenStyle;
  keyword: TokenStyle;
  string: TokenStyle;
  number: TokenStyle;
  operator: TokenStyle;
  function: TokenStyle;
  variable: TokenStyle;
  type: TokenStyle;
  constant: TokenStyle;
  // Language-specific overrides
  python?: Record<string, TokenStyle>;
  rust?: Record<string, TokenStyle>;
  markdown?: Record<string, TokenStyle>;
  [key: string]: TokenStyle | Record<string, TokenStyle> | undefined;
}

export interface TokenStyle {
  color: string;
  background?: string;
  style?: 'normal' | 'italic' | 'bold';
  underline?: boolean;
}

export interface UiTheme {
  statusBar: {
    background: string;
    foreground: string;
    height: number;
  };
  button: {
    background: string;
    hover: string;
    active: string;
  };
  input: {
    background: string;
    border: string;
    focus: string;
  };
  notification?: {
    info: string;
    warning: string;
    error: string;
    success: string;
  };
}

export interface TransitionTheme {
  chromeToggle: number;
  themeSwitch: number;
  hover: number;
  easing: string;
}

export interface Theme {
  metadata: ThemeMetadata;
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
// DEFAULT THEMES
// ============================================================================

const LIQUID_GLASS_DARK: Theme = {
  metadata: {
    name: 'Liquid Glass Dark',
    author: 'skretchpad',
    version: '1.0.0',
    base: 'dark',
  },
  window: {
    background: {
      base: 'rgba(18, 18, 18, 0.85)',
      blur: 20,
    },
    border: {
      radius: 12,
      width: 1,
      color: 'rgba(255, 255, 255, 0.1)',
    },
    shadow: {
      color: 'rgba(0, 0, 0, 0.5)',
      blur: 40,
      offset: [0, 10],
    },
  },
  chrome: {
    background: 'rgba(28, 28, 28, 0.95)',
    foreground: 'rgba(228, 228, 228, 0.9)',
    height: 32,
    blur: 10,
    active: {
      background: 'rgba(40, 40, 40, 0.95)',
      border: 'rgba(0, 217, 255, 0.3)',
    },
  },
  editor: {
    background: 'transparent',
    foreground: '#e4e4e4',
    cursor: {
      color: '#00d9ff',
      width: 2,
      blinkInterval: 530,
    },
    selection: {
      background: 'rgba(0, 217, 255, 0.2)',
    },
    line: {
      active: 'rgba(255, 255, 255, 0.05)',
      number: 'rgba(228, 228, 228, 0.4)',
      numberActive: '#00d9ff',
    },
    gutter: {
      background: 'rgba(0, 0, 0, 0.2)',
      width: 50,
    },
  },
  syntax: {
    comment: { color: '#6a737d', style: 'italic' },
    keyword: { color: '#ff79c6', style: 'bold' },
    string: { color: '#50fa7b' },
    number: { color: '#bd93f9' },
    operator: { color: '#ff79c6' },
    function: { color: '#8be9fd' },
    variable: { color: '#f8f8f2' },
    type: { color: '#8be9fd', style: 'italic' },
    constant: { color: '#bd93f9', style: 'bold' },
    python: {
      decorator: { color: '#50fa7b' },
      magicMethod: { color: '#ff79c6', style: 'italic' },
    },
    rust: {
      lifetime: { color: '#ff79c6', style: 'italic' },
      macro: { color: '#50fa7b' },
      attribute: { color: '#f1fa8c' },
    },
    markdown: {
      heading: { color: '#8be9fd', style: 'bold' },
      link: { color: '#50fa7b', underline: true },
      code: { color: '#f1fa8c', background: 'rgba(255, 255, 255, 0.05)' },
    },
  },
  ui: {
    statusBar: {
      background: 'rgba(28, 28, 28, 0.95)',
      foreground: 'rgba(228, 228, 228, 0.7)',
      height: 24,
    },
    button: {
      background: 'rgba(255, 255, 255, 0.1)',
      hover: 'rgba(255, 255, 255, 0.15)',
      active: 'rgba(0, 217, 255, 0.3)',
    },
    input: {
      background: 'rgba(0, 0, 0, 0.3)',
      border: 'rgba(255, 255, 255, 0.2)',
      focus: 'rgba(0, 217, 255, 0.5)',
    },
    notification: {
      info: '#00d9ff',
      warning: '#f1fa8c',
      error: '#ff5555',
      success: '#50fa7b',
    },
  },
  transitions: {
    chromeToggle: 200,
    themeSwitch: 300,
    hover: 100,
    easing: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
  },
};

const LIQUID_GLASS_LIGHT: Theme = {
  metadata: {
    name: 'Liquid Glass Light',
    author: 'skretchpad',
    version: '1.0.0',
    base: 'light',
  },
  window: {
    background: {
      base: 'rgba(248, 248, 248, 0.85)',
      blur: 20,
    },
    border: {
      radius: 12,
      width: 1,
      color: 'rgba(0, 0, 0, 0.1)',
    },
  },
  chrome: {
    background: 'rgba(240, 240, 240, 0.95)',
    foreground: 'rgba(28, 28, 28, 0.9)',
    height: 32,
    blur: 10,
  },
  editor: {
    background: 'transparent',
    foreground: '#1a1a1a',
    cursor: {
      color: '#007acc',
      width: 2,
      blinkInterval: 530,
    },
    selection: {
      background: 'rgba(0, 122, 204, 0.2)',
    },
    line: {
      active: 'rgba(0, 0, 0, 0.05)',
      number: 'rgba(28, 28, 28, 0.4)',
      numberActive: '#007acc',
    },
    gutter: {
      background: 'rgba(0, 0, 0, 0.05)',
      width: 50,
    },
  },
  syntax: {
    comment: { color: '#6a737d', style: 'italic' },
    keyword: { color: '#d73a49', style: 'bold' },
    string: { color: '#22863a' },
    number: { color: '#005cc5' },
    operator: { color: '#d73a49' },
    function: { color: '#6f42c1' },
    variable: { color: '#24292e' },
    type: { color: '#005cc5', style: 'italic' },
    constant: { color: '#005cc5', style: 'bold' },
  },
  ui: {
    statusBar: {
      background: 'rgba(240, 240, 240, 0.95)',
      foreground: 'rgba(28, 28, 28, 0.7)',
      height: 24,
    },
    button: {
      background: 'rgba(0, 0, 0, 0.05)',
      hover: 'rgba(0, 0, 0, 0.1)',
      active: 'rgba(0, 122, 204, 0.2)',
    },
    input: {
      background: 'rgba(255, 255, 255, 0.5)',
      border: 'rgba(0, 0, 0, 0.2)',
      focus: 'rgba(0, 122, 204, 0.5)',
    },
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
    current: LIQUID_GLASS_DARK, // Default theme
    available: [LIQUID_GLASS_DARK, LIQUID_GLASS_LIGHT],
    loading: false,
    error: null,
  });

  return {
    subscribe,

    /**
     * Set the current theme
     */
    setTheme: (theme: Theme) => {
      update((state) => ({
        ...state,
        current: theme,
        error: null,
      }));

      // Apply theme to document
      applyThemeToDocument(theme);
    },

    /**
     * Load a theme by name from the backend
     */
    loadTheme: async (themeName: string) => {
      update((state) => ({ ...state, loading: true, error: null }));

      try {
        const themeData = await invoke<string>('load_theme', {
          themeName,
        });

        // Parse theme data (assuming it returns CSS variables)
        const theme = await parseThemeFromCSS(themeData, themeName);

        update((state) => ({
          ...state,
          current: theme,
          loading: false,
        }));

        applyThemeToDocument(theme);

        return theme;
      } catch (error) {
        console.error('Failed to load theme:', error);
        update((state) => ({
          ...state,
          loading: false,
          error: `Failed to load theme: ${error}`,
        }));
        throw error;
      }
    },

    /**
     * Load all available themes
     */
    loadAvailableThemes: async () => {
      try {
        const themeNames = await invoke<string[]>('list_themes');

        const themes: Theme[] = [];
        for (const name of themeNames) {
          try {
            const theme = await invoke<string>('load_theme', {
              themeName: name,
            });
            const parsed = await parseThemeFromCSS(theme, name);
            themes.push(parsed);
          } catch (error) {
            console.error(`Failed to load theme ${name}:`, error);
          }
        }

        update((state) => ({
          ...state,
          available: [...state.available, ...themes],
        }));
      } catch (error) {
        console.error('Failed to load available themes:', error);
      }
    },

    /**
     * Switch theme by name
     */
    switchTheme: async (themeName: string) => {
      const state = get({ subscribe });
      const theme = state.available.find(
        (t) => t.metadata.name === themeName
      );

      if (theme) {
        update((s) => ({ ...s, current: theme }));
        applyThemeToDocument(theme);
      } else {
        // Try loading from backend
        await themeStore.loadTheme(themeName);
      }
    },

    /**
     * Generate theme from base color
     */
    generateTheme: async (baseColor: string, name: string) => {
      try {
        const theme = await invoke<Theme>('generate_theme_from_color', {
          baseColor,
          name,
        });

        update((state) => ({
          ...state,
          available: [...state.available, theme],
        }));

        return theme;
      } catch (error) {
        console.error('Failed to generate theme:', error);
        throw error;
      }
    },

    /**
     * Reset to default theme
     */
    resetToDefault: () => {
      update((state) => ({
        ...state,
        current: LIQUID_GLASS_DARK,
        error: null,
      }));
      applyThemeToDocument(LIQUID_GLASS_DARK);
    },
  };
}

export const themeStore = createThemeStore();

// ============================================================================
// THEME APPLICATION
// ============================================================================

function applyThemeToDocument(theme: Theme): void {
  const root = document.documentElement;

  // Window
  root.style.setProperty('--window-bg', theme.window.background.base);
  root.style.setProperty('--window-blur', `${theme.window.background.blur}px`);
  root.style.setProperty('--window-border-radius', `${theme.window.border.radius}px`);
  root.style.setProperty('--window-border-width', `${theme.window.border.width}px`);
  root.style.setProperty('--window-border-color', theme.window.border.color);

  if (theme.window.shadow) {
    root.style.setProperty('--window-shadow-color', theme.window.shadow.color);
    root.style.setProperty('--window-shadow-blur', `${theme.window.shadow.blur}px`);
    root.style.setProperty(
      '--window-shadow-offset',
      `${theme.window.shadow.offset[0]}px ${theme.window.shadow.offset[1]}px`
    );
  }

  // Chrome
  root.style.setProperty('--chrome-bg', theme.chrome.background);
  root.style.setProperty('--chrome-fg', theme.chrome.foreground);
  root.style.setProperty('--chrome-height', `${theme.chrome.height}px`);
  if (theme.chrome.blur) {
    root.style.setProperty('--chrome-blur', `${theme.chrome.blur}px`);
  }

  // Editor
  root.style.setProperty('--editor-bg', theme.editor.background);
  root.style.setProperty('--editor-fg', theme.editor.foreground);
  root.style.setProperty('--cursor-color', theme.editor.cursor.color);
  root.style.setProperty('--cursor-width', `${theme.editor.cursor.width}px`);
  root.style.setProperty('--selection-bg', theme.editor.selection.background);
  if (theme.editor.selection.foreground) {
    root.style.setProperty('--selection-fg', theme.editor.selection.foreground);
  }
  root.style.setProperty('--line-active', theme.editor.line.active);
  root.style.setProperty('--line-number', theme.editor.line.number);
  root.style.setProperty('--line-number-active', theme.editor.line.numberActive);
  root.style.setProperty('--gutter-bg', theme.editor.gutter.background);
  root.style.setProperty('--gutter-width', `${theme.editor.gutter.width}px`);

  // Syntax
  root.style.setProperty('--syntax-comment', theme.syntax.comment.color);
  root.style.setProperty('--syntax-keyword', theme.syntax.keyword.color);
  root.style.setProperty('--syntax-string', theme.syntax.string.color);
  root.style.setProperty('--syntax-number', theme.syntax.number.color);
  root.style.setProperty('--syntax-operator', theme.syntax.operator.color);
  root.style.setProperty('--syntax-function', theme.syntax.function.color);
  root.style.setProperty('--syntax-variable', theme.syntax.variable.color);
  root.style.setProperty('--syntax-type', theme.syntax.type.color);
  root.style.setProperty('--syntax-constant', theme.syntax.constant.color);

  // UI
  root.style.setProperty('--status-bar-bg', theme.ui.statusBar.background);
  root.style.setProperty('--status-bar-fg', theme.ui.statusBar.foreground);
  root.style.setProperty('--status-bar-height', `${theme.ui.statusBar.height}px`);
  root.style.setProperty('--button-bg', theme.ui.button.background);
  root.style.setProperty('--button-hover', theme.ui.button.hover);
  root.style.setProperty('--button-active', theme.ui.button.active);
  root.style.setProperty('--input-bg', theme.ui.input.background);
  root.style.setProperty('--input-border', theme.ui.input.border);
  root.style.setProperty('--input-focus', theme.ui.input.focus);

  if (theme.ui.notification) {
    root.style.setProperty('--color-info', theme.ui.notification.info);
    root.style.setProperty('--color-warning', theme.ui.notification.warning);
    root.style.setProperty('--color-error', theme.ui.notification.error);
    root.style.setProperty('--color-success', theme.ui.notification.success);
  }

  // Transitions
  root.style.setProperty('--transition-chrome', `${theme.transitions.chromeToggle}ms`);
  root.style.setProperty('--transition-theme', `${theme.transitions.themeSwitch}ms`);
  root.style.setProperty('--transition-hover', `${theme.transitions.hover}ms`);
  root.style.setProperty('--transition-easing', theme.transitions.easing);

  // Add theme class to body
  document.body.className = document.body.className
    .split(' ')
    .filter((c) => !c.startsWith('theme-'))
    .concat(`theme-${theme.metadata.base}`)
    .join(' ');
}

// ============================================================================
// THEME PARSING
// ============================================================================

async function parseThemeFromCSS(css: string, name: string): Promise<Theme> {
  // Parse CSS variables back into Theme object
  // This is a simplified parser - in production, this would be more robust

  const vars = new Map<string, string>();

  // Extract CSS variables from :root { ... }
  const rootMatch = css.match(/:root\s*{([^}]+)}/);
  if (rootMatch) {
    const rules = rootMatch[1].split(';');
    for (const rule of rules) {
      const [key, value] = rule.split(':').map((s) => s.trim());
      if (key && value) {
        vars.set(key, value);
      }
    }
  }

  // Build theme object from variables
  // This is a stub - full implementation would parse all variables
  const theme: Theme = {
    metadata: {
      name,
      author: 'Custom',
      version: '1.0.0',
      base: 'dark',
    },
    window: {
      background: {
        base: vars.get('--window-bg') || 'rgba(18, 18, 18, 0.85)',
        blur: parseInt(vars.get('--window-blur') || '20'),
      },
      border: {
        radius: parseInt(vars.get('--window-border-radius') || '12'),
        width: parseInt(vars.get('--window-border-width') || '1'),
        color: vars.get('--window-border-color') || 'rgba(255, 255, 255, 0.1)',
      },
    },
    chrome: {
      background: vars.get('--chrome-bg') || 'rgba(28, 28, 28, 0.95)',
      foreground: vars.get('--chrome-fg') || 'rgba(228, 228, 228, 0.9)',
      height: parseInt(vars.get('--chrome-height') || '32'),
    },
    editor: {
      background: vars.get('--editor-bg') || 'transparent',
      foreground: vars.get('--editor-fg') || '#e4e4e4',
      cursor: {
        color: vars.get('--cursor-color') || '#00d9ff',
        width: parseInt(vars.get('--cursor-width') || '2'),
      },
      selection: {
        background: vars.get('--selection-bg') || 'rgba(0, 217, 255, 0.2)',
      },
      line: {
        active: vars.get('--line-active') || 'rgba(255, 255, 255, 0.05)',
        number: vars.get('--line-number') || 'rgba(228, 228, 228, 0.4)',
        numberActive: vars.get('--line-number-active') || '#00d9ff',
      },
      gutter: {
        background: vars.get('--gutter-bg') || 'rgba(0, 0, 0, 0.2)',
        width: parseInt(vars.get('--gutter-width') || '50'),
      },
    },
    syntax: {
      comment: { color: vars.get('--syntax-comment') || '#6a737d' },
      keyword: { color: vars.get('--syntax-keyword') || '#ff79c6' },
      string: { color: vars.get('--syntax-string') || '#50fa7b' },
      number: { color: vars.get('--syntax-number') || '#bd93f9' },
      operator: { color: vars.get('--syntax-operator') || '#ff79c6' },
      function: { color: vars.get('--syntax-function') || '#8be9fd' },
      variable: { color: vars.get('--syntax-variable') || '#f8f8f2' },
      type: { color: vars.get('--syntax-type') || '#8be9fd' },
      constant: { color: vars.get('--syntax-constant') || '#bd93f9' },
    },
    ui: {
      statusBar: {
        background: vars.get('--status-bar-bg') || 'rgba(28, 28, 28, 0.95)',
        foreground: vars.get('--status-bar-fg') || 'rgba(228, 228, 228, 0.7)',
        height: parseInt(vars.get('--status-bar-height') || '24'),
      },
      button: {
        background: vars.get('--button-bg') || 'rgba(255, 255, 255, 0.1)',
        hover: vars.get('--button-hover') || 'rgba(255, 255, 255, 0.15)',
        active: vars.get('--button-active') || 'rgba(0, 217, 255, 0.3)',
      },
      input: {
        background: vars.get('--input-bg') || 'rgba(0, 0, 0, 0.3)',
        border: vars.get('--input-border') || 'rgba(255, 255, 255, 0.2)',
        focus: vars.get('--input-focus') || 'rgba(0, 217, 255, 0.5)',
      },
    },
    transitions: {
      chromeToggle: parseInt(vars.get('--transition-chrome') || '200'),
      themeSwitch: parseInt(vars.get('--transition-theme') || '300'),
      hover: parseInt(vars.get('--transition-hover') || '100'),
      easing: vars.get('--transition-easing') || 'cubic-bezier(0.4, 0.0, 0.2, 1)',
    },
  };

  return theme;
}

// ============================================================================
// DERIVED STORES
// ============================================================================

/**
 * Current theme metadata
 */
export const currentThemeMetadata = derived(
  themeStore,
  ($theme) => $theme.current?.metadata || null
);

/**
 * Is dark theme
 */
export const isDarkTheme = derived(
  themeStore,
  ($theme) => $theme.current?.metadata.base === 'dark'
);

/**
 * Theme colors for quick access
 */
export const themeColors = derived(themeStore, ($theme) => {
  if (!$theme.current) return null;

  return {
    primary: $theme.current.editor.cursor.color,
    background: $theme.current.editor.background,
    foreground: $theme.current.editor.foreground,
    border: $theme.current.window.border.color,
  };
});

// ============================================================================
// EVENT LISTENERS
// ============================================================================

// Listen for theme changes from backend
if (typeof window !== 'undefined') {
  listen<Theme>('theme:changed', (event) => {
    themeStore.setTheme(event.payload);
  }).catch(console.error);

  // Listen for hot-reload events
  listen<string>('theme:reload', async (event) => {
    try {
      await themeStore.loadTheme(event.payload);
    } catch (error) {
      console.error('Failed to reload theme:', error);
    }
  }).catch(console.error);
}

// ============================================================================
// INITIALIZATION
// ============================================================================

// Load available themes on startup
if (typeof window !== 'undefined') {
  themeStore.loadAvailableThemes().catch(console.error);

  // Apply initial theme
  const state = get(themeStore);
  if (state.current) {
    applyThemeToDocument(state.current);
  }
}
