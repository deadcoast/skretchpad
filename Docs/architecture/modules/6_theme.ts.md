# theme.ts Architecture

> **Source File**: [`src/lib/stores/theme.ts`](../../../src/lib/stores/theme.ts)
> **Status**: ✅ Implemented
> **Module Type**: Svelte Store - Theme Management
> **Lines of Code**: 747

---

## Table of Contents

- [Overview](#overview)
- [Type System](#type-system)
- [Built-in Themes](#built-in-themes)
- [Store API](#store-api)
- [Theme Application](#theme-application)
- [CSS Variables](#css-variables)
- [Derived Stores](#derived-stores)
- [Related Documentation](#related-documentation)

---

## Overview

`theme.ts` provides comprehensive theme management for Skretchpad using a structured type system and CSS custom properties. It includes two built-in themes (Liquid Glass Dark/Light) and supports loading custom themes from the backend.

### Key Features

- **Structured Theme System**: 7 type interfaces defining all theme aspects
- **Built-in Themes**: 2 complete themes (Dark and Light variations)
- **Dynamic Loading**: Load themes from backend via Tauri commands
- **CSS Variables**: Automatic application to `:root` custom properties
- **Hot Reload**: Listen for theme changes from backend
- **Theme Generation**: Generate themes from base colors (planned)

---

## Type System

### Main Theme Interface

```typescript
export interface Theme {
  metadata: ThemeMetadata;
  window: WindowTheme;
  chrome: ChromeTheme;
  editor: EditorTheme;
  syntax: SyntaxTheme;
  ui: UiTheme;
  transitions: TransitionTheme;
}
```

**Source**: Lines 124-132

### ThemeMetadata

```typescript
export interface ThemeMetadata {
  name: string;
  author: string;
  version: string;
  base: 'dark' | 'light' | 'high-contrast';
}
```

**Source**: Lines 11-16

Defines theme identity and base color scheme.

### WindowTheme

```typescript
export interface WindowTheme {
  background: {
    base: string;        // RGBA color
    blur: number;        // Backdrop blur in px
  };
  border: {
    radius: number;      // Border radius in px
    width: number;       // Border width in px
    color: string;       // Border color
  };
  shadow?: {
    color: string;       // Shadow color
    blur: number;        // Blur radius
    offset: [number, number];  // [x, y] offset
  };
}
```

**Source**: Lines 18-33

Controls window-level styling (glass effect, borders, shadows).

### ChromeTheme

```typescript
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
```

**Source**: Lines 35-44

Title bar styling and dimensions.

### EditorTheme

```typescript
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
    active: string;           // Active line background
    number: string;           // Line number color
    numberActive: string;     // Active line number color
  };
  gutter: {
    background: string;
    width: number;
  };
}
```

**Source**: Lines 46-67

Editor visual styling (cursor, selection, line numbers, gutter).

### SyntaxTheme

```typescript
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
```

**Source**: Lines 69-84

Syntax highlighting colors with language-specific overrides.

### TokenStyle

```typescript
export interface TokenStyle {
  color: string;
  background?: string;
  style?: 'normal' | 'italic' | 'bold';
  underline?: boolean;
}
```

**Source**: Lines 86-91

Individual token styling options.

### UiTheme

```typescript
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
```

**Source**: Lines 93-115

UI component styling (status bar, buttons, inputs, notifications).

### TransitionTheme

```typescript
export interface TransitionTheme {
  chromeToggle: number;    // ms
  themeSwitch: number;     // ms
  hover: number;           // ms
  easing: string;          // CSS easing function
}
```

**Source**: Lines 117-122

Animation timing and easing functions.

---

## Built-in Themes

### LIQUID_GLASS_DARK

```typescript
const LIQUID_GLASS_DARK: Theme = {
  metadata: {
    name: 'Liquid Glass Dark',
    author: 'skretchpad',
    version: '1.0.0',
    base: 'dark',
  },
  // ... complete theme definition
};
```

**Source**: Lines 145-253

**Color Palette**:
- **Primary/Accent**: `#00d9ff` (Cyan)
- **Background**: `rgba(18, 18, 18, 0.85)` (Semi-transparent dark gray)
- **Chrome**: `rgba(28, 28, 28, 0.95)`
- **Foreground**: `#e4e4e4`
- **Syntax**: Dracula-inspired colors
  - Comments: `#6a737d` (italic)
  - Keywords: `#ff79c6` (bold pink)
  - Strings: `#50fa7b` (green)
  - Functions: `#8be9fd` (cyan)
  - Numbers: `#bd93f9` (purple)

**Visual Effects**:
- **Backdrop Blur**: 20px
- **Border Radius**: 12px
- **Gutter Width**: 50px

### LIQUID_GLASS_LIGHT

```typescript
const LIQUID_GLASS_LIGHT: Theme = {
  metadata: {
    name: 'Liquid Glass Light',
    author: 'skretchpad',
    version: '1.0.0',
    base: 'light',
  },
  // ... complete theme definition
};
```

**Source**: Lines 255-334

**Color Palette**:
- **Primary/Accent**: `#007acc` (Blue)
- **Background**: `rgba(248, 248, 248, 0.85)` (Semi-transparent light gray)
- **Chrome**: `rgba(240, 240, 240, 0.95)`
- **Foreground**: `#1a1a1a`
- **Syntax**: GitHub-inspired colors
  - Comments: `#6a737d` (italic)
  - Keywords: `#d73a49` (bold red)
  - Strings: `#22863a` (green)
  - Functions: `#6f42c1` (purple)
  - Numbers: `#005cc5` (blue)

---

## Store API

### State Structure

```typescript
export interface ThemeState {
  current: Theme | null;
  available: Theme[];
  loading: boolean;
  error: string | null;
}
```

**Source**: Lines 134-139

### Core Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `setTheme(theme)` | `(theme: Theme) => void` | Sets current theme and applies to DOM |
| `loadTheme(name)` | `(name: string) => Promise<Theme>` | Loads theme from backend by name |
| `loadAvailableThemes()` | `() => Promise<void>` | Loads all themes from backend |
| `switchTheme(name)` | `(name: string) => Promise<void>` | Switches to theme by name |
| `generateTheme(color, name)` | `(color: string, name: string) => Promise<Theme>` | Generates theme from base color |
| `resetToDefault()` | `() => void` | Resets to LIQUID_GLASS_DARK |

### Usage Examples

#### Set Theme

```typescript
import { themeStore } from '$lib/stores/theme';

// Set built-in theme
themeStore.setTheme(LIQUID_GLASS_LIGHT);

// Load from backend
await themeStore.loadTheme('dracula');

// Switch by name
await themeStore.switchTheme('monokai');
```

**Source**: Lines 354-444

#### Generate Theme

```typescript
// Generate theme from base color
const theme = await themeStore.generateTheme('#ff6b6b', 'Coral Reef');
```

**Source**: Lines 449-466

#### Reset

```typescript
// Reset to default dark theme
themeStore.resetToDefault();
```

**Source**: Lines 471-478

---

## Theme Application

### applyThemeToDocument

```typescript
function applyThemeToDocument(theme: Theme): void {
  const root = document.documentElement;

  // Set CSS custom properties
  root.style.setProperty('--window-bg', theme.window.background.base);
  root.style.setProperty('--cursor-color', theme.editor.cursor.color);
  // ... 50+ CSS variables set

  // Add theme class to body
  document.body.className = `theme-${theme.metadata.base}`;
}
```

**Source**: Lines 488-571

**Process**:
1. Get `:root` element
2. Set 50+ CSS custom properties from theme object
3. Add `.theme-dark`, `.theme-light`, or `.theme-high-contrast` class to `<body>`

---

## CSS Variables

### Complete Variable List

| Variable | Theme Path | Example Value |
|----------|------------|---------------|
| **Window** |||
| `--window-bg` | `window.background.base` | `rgba(18, 18, 18, 0.85)` |
| `--window-blur` | `window.background.blur` | `20px` |
| `--window-border-radius` | `window.border.radius` | `12px` |
| `--window-border-width` | `window.border.width` | `1px` |
| `--window-border-color` | `window.border.color` | `rgba(255, 255, 255, 0.1)` |
| `--window-shadow-color` | `window.shadow.color` | `rgba(0, 0, 0, 0.5)` |
| `--window-shadow-blur` | `window.shadow.blur` | `40px` |
| **Chrome** |||
| `--chrome-bg` | `chrome.background` | `rgba(28, 28, 28, 0.95)` |
| `--chrome-fg` | `chrome.foreground` | `rgba(228, 228, 228, 0.9)` |
| `--chrome-height` | `chrome.height` | `32px` |
| `--chrome-blur` | `chrome.blur` | `10px` |
| **Editor** |||
| `--editor-bg` | `editor.background` | `transparent` |
| `--editor-fg` | `editor.foreground` | `#e4e4e4` |
| `--cursor-color` | `editor.cursor.color` | `#00d9ff` |
| `--cursor-width` | `editor.cursor.width` | `2px` |
| `--selection-bg` | `editor.selection.background` | `rgba(0, 217, 255, 0.2)` |
| `--line-active` | `editor.line.active` | `rgba(255, 255, 255, 0.05)` |
| `--line-number` | `editor.line.number` | `rgba(228, 228, 228, 0.4)` |
| `--line-number-active` | `editor.line.numberActive` | `#00d9ff` |
| `--gutter-bg` | `editor.gutter.background` | `rgba(0, 0, 0, 0.2)` |
| `--gutter-width` | `editor.gutter.width` | `50px` |
| **Syntax** |||
| `--syntax-comment` | `syntax.comment.color` | `#6a737d` |
| `--syntax-keyword` | `syntax.keyword.color` | `#ff79c6` |
| `--syntax-string` | `syntax.string.color` | `#50fa7b` |
| `--syntax-number` | `syntax.number.color` | `#bd93f9` |
| `--syntax-operator` | `syntax.operator.color` | `#ff79c6` |
| `--syntax-function` | `syntax.function.color` | `#8be9fd` |
| `--syntax-variable` | `syntax.variable.color` | `#f8f8f2` |
| `--syntax-type` | `syntax.type.color` | `#8be9fd` |
| `--syntax-constant` | `syntax.constant.color` | `#bd93f9` |
| **UI** |||
| `--status-bar-bg` | `ui.statusBar.background` | `rgba(28, 28, 28, 0.95)` |
| `--status-bar-fg` | `ui.statusBar.foreground` | `rgba(228, 228, 228, 0.7)` |
| `--status-bar-height` | `ui.statusBar.height` | `24px` |
| `--button-bg` | `ui.button.background` | `rgba(255, 255, 255, 0.1)` |
| `--button-hover` | `ui.button.hover` | `rgba(255, 255, 255, 0.15)` |
| `--button-active` | `ui.button.active` | `rgba(0, 217, 255, 0.3)` |
| `--input-bg` | `ui.input.background` | `rgba(0, 0, 0, 0.3)` |
| `--input-border` | `ui.input.border` | `rgba(255, 255, 255, 0.2)` |
| `--input-focus` | `ui.input.focus` | `rgba(0, 217, 255, 0.5)` |
| `--color-info` | `ui.notification.info` | `#00d9ff` |
| `--color-warning` | `ui.notification.warning` | `#f1fa8c` |
| `--color-error` | `ui.notification.error` | `#ff5555` |
| `--color-success` | `ui.notification.success` | `#50fa7b` |
| **Transitions** |||
| `--transition-chrome` | `transitions.chromeToggle` | `200ms` |
| `--transition-theme` | `transitions.themeSwitch` | `300ms` |
| `--transition-hover` | `transitions.hover` | `100ms` |
| `--transition-easing` | `transitions.easing` | `cubic-bezier(0.4, 0.0, 0.2, 1)` |

**Usage in CSS**:

```css
.my-element {
  background: var(--window-bg);
  color: var(--editor-fg);
  border: var(--window-border-width) solid var(--window-border-color);
  transition: background var(--transition-hover) var(--transition-easing);
}
```

---

## Derived Stores

### currentThemeMetadata

```typescript
export const currentThemeMetadata = derived(
  themeStore,
  ($theme) => $theme.current?.metadata || null
);
```

**Source**: Lines 686-689

Returns current theme's metadata or `null`.

### isDarkTheme

```typescript
export const isDarkTheme = derived(
  themeStore,
  ($theme) => $theme.current?.metadata.base === 'dark'
);
```

**Source**: Lines 694-697

Returns `true` if current theme is dark-based.

### themeColors

```typescript
export const themeColors = derived(themeStore, ($theme) => {
  if (!$theme.current) return null;
  return {
    primary: $theme.current.editor.cursor.color,
    background: $theme.current.editor.background,
    foreground: $theme.current.editor.foreground,
    border: $theme.current.window.border.color,
  };
});
```

**Source**: Lines 702-711

Quick access to most commonly used colors.

---

## Event Listeners

### Backend Theme Events

```typescript
// Hot-reload theme when changed
listen<Theme>('theme:changed', (event) => {
  themeStore.setTheme(event.payload);
});

// Reload specific theme by name
listen<string>('theme:reload', async (event) => {
  await themeStore.loadTheme(event.payload);
});
```

**Source**: Lines 718-730

---

## Related Documentation

### Components Using This Store

- **[App.svelte](./0_App.svelte.md)** - Applies initial glass theme
- **[Editor.svelte](./2_Editor.svelte.md)** - Uses editor theme settings
- **[editor.ts](./12_editor.ts.md)** - Editor store subscribes to theme changes

### Backend Commands

- **`load_theme(themeName)`** - Load theme file from disk
- **`list_themes()`** - Get available theme names
- **`generate_theme_from_color(baseColor, name)`** - Generate theme from color

### Backend Implementation

- **[theme_engine.rs](./theme_engine.rs.md)** - Backend theme loading and generation

### Project Documentation

- **[STATUS.md](../../STATUS.md)** - Development progress
- **[Technical Details](../3_technical-details.md)** - Theme system architecture

---

## Implementation Notes

### Theme Parsing

The `parseThemeFromCSS()` function (lines 577-677) converts CSS variables back to a Theme object. Currently simplified - production version would:
- Parse all CSS variables robustly
- Handle malformed CSS gracefully
- Validate theme completeness
- Merge with defaults for missing values

### Initialization

On module load:
1. Loads available themes from backend
2. Applies default theme (LIQUID_GLASS_DARK) to DOM
3. Sets up event listeners for hot-reload

**Source**: Lines 737-746

### Memory Considerations

- Each theme object is ~2-3KB
- `available` array grows as themes are loaded
- CSS custom properties are efficient - browser optimized

---

**Documentation Version**: 2.0.0
**Module Version**: 0.1.0
**Accuracy**: Verified against source code 2025-10-28
