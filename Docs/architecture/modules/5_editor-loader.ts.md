# editor-loader.ts Architecture

> **Source File**: [`src/lib/editor-loader.ts`](../../../src/lib/editor-loader.ts)
> **Status**: ✅ Implemented
> **Module Type**: CodeMirror 6 Initialization & Management
> **Lines of Code**: 876

---

## Table of Contents

- [Overview](#overview)
- [Type Definitions](#type-definitions)
- [Compartment System](#compartment-system)
- [Language Registry](#language-registry)
- [Theme Integration](#theme-integration)
- [Plugin Hooks System](#plugin-hooks-system)
- [Editor Creation](#editor-creation)
- [Diff Editor](#diff-editor)
- [Editor Management API](#editor-management-api)
- [State Persistence](#state-persistence)
- [Utility Functions](#utility-functions)
- [Custom Extensions](#custom-extensions)
- [Related Documentation](#related-documentation)

---

## Overview

`editor-loader.ts` is the central CodeMirror 6 initialization and management module. It provides a high-level API for creating editors, managing languages, themes, keybindings, and plugin hooks. The module uses CodeMirror's compartment system for hot-swapping configurations without recreating the editor.

### Key Features

- **Dynamic Language Loading**: Lazy-loads 12 language packages on demand
- **Hot-Swappable Configurations**: Change theme, language, keybindings without editor recreation
- **Plugin Hook System**: Register hooks for content changes, selection, focus
- **Diff Editor**: Side-by-side comparison with synchronized scrolling
- **State Persistence**: Save/restore editor state (content, selection, scroll)
- **Custom Extensions**: Line length indicator, trailing whitespace, read-only regions
- **Theme Integration**: Maps CSS variables to CodeMirror theme
- **Utility Functions**: 15+ helper functions for common operations

---

## Type Definitions

### EditorOptions

```typescript
export interface EditorOptions {
  theme?: Theme;                          // Theme object from theme store
  keybindings?: Keybindings;              // Keybindings from keybinding store
  readOnly?: boolean;                     // Read-only mode
  onChange?: (update: ViewUpdate) => void; // Content change callback
  onCursorMove?: (update: ViewUpdate) => void; // Cursor move callback
  onSelection?: (update: ViewUpdate) => void;  // Selection change callback
  extensions?: Extension[];               // Additional CodeMirror extensions
}
```

**Source**: Lines 26-34

### DiffEditorOptions

```typescript
export interface DiffEditorOptions {
  original: string;    // Original content (left pane)
  modified: string;    // Modified content (right pane)
  readOnly?: boolean;  // Read-only mode for original
  theme?: Theme;       // Theme object
}
```

**Source**: Lines 36-41

### LanguageInfo

```typescript
export interface LanguageInfo {
  name: string;              // Language name (e.g., "javascript")
  extensions: string[];      // File extensions (e.g., ["js", "jsx"])
  support?: LanguageSupport; // Loaded CodeMirror language support
  loaded: boolean;           // Whether language has been loaded
}
```

**Source**: Lines 43-48

---

## Compartment System

CodeMirror 6's compartment system allows dynamic reconfiguration without recreating the editor. Skretchpad uses 5 compartments:

```typescript
const languageCompartment = new Compartment();    // Language/syntax
const themeCompartment = new Compartment();       // Editor theme
const keybindingCompartment = new Compartment();  // Keybindings
const readOnlyCompartment = new Compartment();    // Read-only state
const pluginHooksCompartment = new Compartment(); // Plugin hooks
```

**Source**: Lines 55-59

**Usage**:
```typescript
// Change language without recreating editor
view.dispatch({
  effects: languageCompartment.reconfigure(newLanguageSupport)
});
```

---

## Language Registry

### LanguageRegistry Class

```typescript
class LanguageRegistry {
  private languages: Map<string, LanguageInfo>;
  private extensionMap: Map<string, string>; // ext → language name

  detectLanguage(filename: string): string | null
  loadLanguage(languageName: string): Promise<LanguageSupport | null>
  getLanguageInfo(languageName: string): LanguageInfo | null
  getAllLanguages(): LanguageInfo[]
}
```

**Source**: Lines 65-209

### Supported Languages

| Language | Extensions | Package |
|----------|------------|---------|
| JavaScript | js, jsx, mjs, cjs | `@codemirror/lang-javascript` |
| TypeScript | ts, tsx, mts, cts | `@codemirror/lang-javascript` |
| Python | py, pyw, pyi | `@codemirror/lang-python` |
| Rust | rs | `@codemirror/lang-rust` |
| JSON | json, jsonc | `@codemirror/lang-json` |
| Markdown | md, markdown | `@codemirror/lang-markdown` |
| HTML | html, htm | `@codemirror/lang-html` |
| CSS | css | `@codemirror/lang-css` |
| YAML | yaml, yml | `@codemirror/lang-yaml` |
| TOML | toml | `@codemirror/lang-toml` |
| XML | xml, svg | `@codemirror/lang-xml` |
| SQL | sql | `@codemirror/lang-sql` |

**Source**: Lines 79-91

### detectLanguage

```typescript
export function detectLanguage(filename: string): string | null
```

**Source**: Lines 107-111, 572-574

Detects language from file extension.

**Example**:
```typescript
const lang = detectLanguage('script.py');  // "python"
const lang2 = detectLanguage('App.tsx');   // "typescript"
```

### loadLanguage

```typescript
async loadLanguage(languageName: string): Promise<LanguageSupport | null>
```

**Source**: Lines 113-200

Dynamically imports language package and caches result.

**Process**:
1. Check if already loaded (return cached)
2. Dynamic import language package
3. Create LanguageSupport instance
4. Cache in `languages` Map
5. Return support

**Example**:
```typescript
const support = await languageRegistry.loadLanguage('python');
if (support) {
  view.dispatch({
    effects: languageCompartment.reconfigure(support)
  });
}
```

---

## Theme Integration

### createThemeExtension

```typescript
function createThemeExtension(theme?: Theme): Extension
```

**Source**: Lines 218-294

Converts Theme object to CodeMirror theme using CSS variables.

**CSS Variable Mapping**:
```typescript
{
  '&': {
    backgroundColor: 'var(--editor-bg)',
    color: 'var(--editor-fg)',
  },
  '.cm-cursor': {
    borderLeftColor: 'var(--cursor-color)',
    borderLeftWidth: 'var(--cursor-width, 2px)',
  },
  '.cm-activeLine': {
    backgroundColor: 'var(--line-active)',
  },
  '.cm-gutters': {
    backgroundColor: 'var(--gutter-bg)',
    color: 'var(--line-number)',
  },
  // ... 20+ more selectors
}
```

**Dark Mode Detection**: Uses `theme.metadata.base === 'dark'`

---

## Plugin Hooks System

### PluginHooksManager Class

```typescript
class PluginHooksManager {
  register(hookName: string, handler: (view: EditorView, data: any) => void): () => void
  trigger(hookName: string, view: EditorView, data: any): void
  createExtension(): Extension
  clear(): void
}
```

**Source**: Lines 305-371

### Available Hooks

| Hook Name | Triggered When | Data Payload |
|-----------|----------------|--------------|
| `content_change` | Document changes | `{ changes, newDoc }` |
| `selection_change` | Selection changes | `{ selection }` |
| `focus_change` | Focus changes | `{ focused }` |

**Source**: Lines 346-365

### Usage Example

```typescript
const unregister = registerPluginHook('content_change', (view, data) => {
  console.log('Content changed:', data.newDoc);
});

// Later, cleanup
unregister();
```

---

## Editor Creation

### createEditor

```typescript
export async function createEditor(
  parent: HTMLElement,
  options: EditorOptions = {}
): Promise<EditorView>
```

**Source**: Lines 380-462

Creates a fully-configured CodeMirror 6 editor instance.

**Extensions Included**:
- **Core**: history, drawSelection, highlightActiveLine
- **Input**: indentOnInput, bracketMatching, closeBrackets
- **Features**: autocompletion, highlightSelectionMatches
- **UI**: foldGutter, lineWrapping
- **Syntax**: syntaxHighlighting with defaultHighlightStyle
- **Keymaps**: default, search, history, fold, completion, lint

**Example**:
```typescript
const editor = await createEditor(container, {
  theme: currentTheme,
  readOnly: false,
  onChange: (update) => {
    if (update.docChanged) {
      saveContent(update.state.doc.toString());
    }
  }
});
```

---

## Diff Editor

### createDiffEditor

```typescript
export async function createDiffEditor(
  parent: HTMLElement,
  options: DiffEditorOptions
): Promise<{ original: EditorView; modified: EditorView }>
```

**Source**: Lines 468-547

Creates side-by-side diff editor with synchronized scrolling.

**Layout**:
```
┌────────────────────────────────────────┐
│  Original (left)  │  Modified (right)  │
│  Read-only        │  Editable          │
│                   │                    │
│  Synced scroll ←→ Synced scroll       │
└────────────────────────────────────────┘
```

**Example**:
```typescript
const { original, modified } = await createDiffEditor(container, {
  original: 'Old content\nLine 2',
  modified: 'New content\nLine 2',
  theme: currentTheme
});

// Get modified content
const newContent = getEditorContent(modified);
```

---

## Editor Management API

### Language Management

#### setLanguage

```typescript
export async function setLanguage(
  view: EditorView,
  languageName: string
): Promise<boolean>
```

**Source**: Lines 553-570

Changes editor language.

**Example**:
```typescript
await setLanguage(editor, 'python');
```

### Theme Management

#### updateTheme

```typescript
export function updateTheme(view: EditorView, theme: Theme): void
```

**Source**: Lines 584-588

Hot-swaps editor theme.

**Example**:
```typescript
updateTheme(editor, LIQUID_GLASS_LIGHT);
```

### Keybinding Management

#### registerKeybindings

```typescript
export function registerKeybindings(
  view: EditorView,
  keybindings: Keybindings
): void
```

**Source**: Lines 594-612

Registers custom keybindings.

### Read-Only Mode

#### setReadOnly

```typescript
export function setReadOnly(view: EditorView, readOnly: boolean): void
```

**Source**: Lines 618-622

Toggles read-only mode.

---

## State Persistence

### EditorStateSnapshot

```typescript
interface EditorStateSnapshot {
  doc: string;           // Document content
  selection: {           // Cursor/selection position
    anchor: number;
    head: number;
  };
  scrollTop: number;     // Vertical scroll
  scrollLeft: number;    // Horizontal scroll
}
```

**Source**: Lines 649-657

### saveEditorState

```typescript
export function saveEditorState(view: EditorView): EditorStateSnapshot
```

**Source**: Lines 659-669

Saves complete editor state.

### restoreEditorState

```typescript
export function restoreEditorState(
  view: EditorView,
  snapshot: EditorStateSnapshot
): void
```

**Source**: Lines 671-691

Restores editor state from snapshot.

**Example**:
```typescript
// Save state before switching files
const snapshot = saveEditorState(editor);
stateCache.set(filePath, snapshot);

// Restore later
const saved = stateCache.get(filePath);
if (saved) {
  restoreEditorState(editor, saved);
}
```

---

## Utility Functions

### Content Operations

| Function | Signature | Description |
|----------|-----------|-------------|
| `getEditorContent` | `(view) => string` | Get full document content |
| `setEditorContent` | `(view, content: string) => void` | Replace all content |
| `insertText` | `(view, text: string) => void` | Insert at cursor |
| `replaceSelection` | `(view, text: string) => void` | Replace selected text |
| `getSelection` | `(view) => string` | Get selected text |

**Source**: Lines 697-751

### Navigation

| Function | Signature | Description |
|----------|-----------|-------------|
| `getCursorPosition` | `(view) => { line, column }` | Get cursor position |
| `gotoLine` | `(view, lineNumber) => void` | Jump to line |
| `focus` | `(view) => void` | Focus editor |
| `blur` | `(view) => void` | Blur editor |

**Source**: Lines 711-768

### Cleanup

#### destroyEditor

```typescript
export function destroyEditor(view: EditorView): void
```

**Source**: Lines 774-780

Cleans up plugin hooks and destroys editor.

---

## Custom Extensions

### lineLengthIndicator

```typescript
export function lineLengthIndicator(maxLength: number = 80): Extension
```

**Source**: Lines 789-813

Underlines text exceeding maximum line length.

**Example**:
```typescript
const editor = await createEditor(container, {
  extensions: [lineLengthIndicator(120)]
});
```

### highlightTrailingWhitespace

```typescript
export function highlightTrailingWhitespace(): Extension
```

**Source**: Lines 818-844

Highlights trailing whitespace with red background.

### readOnlyRanges

```typescript
export function readOnlyRanges(ranges: Array<{ from: number; to: number }>): Extension
```

**Source**: Lines 849-860

Makes specific ranges read-only.

**Example**:
```typescript
// Make first 10 characters read-only
const editor = await createEditor(container, {
  extensions: [
    readOnlyRanges([{ from: 0, to: 10 }])
  ]
});
```

---

## Usage Examples

### Basic Editor Setup

```typescript
import { createEditor, setLanguage, updateTheme } from '$lib/editor-loader';
import { themeStore } from '$lib/stores/theme';

// Create editor
const editor = await createEditor(document.getElementById('editor'), {
  theme: $themeStore.current,
  onChange: (update) => {
    if (update.docChanged) {
      handleContentChange(update);
    }
  }
});

// Load Python file
await setLanguage(editor, 'python');
setEditorContent(editor, fileContent);
```

### Tab System Integration

```typescript
import { createEditor, saveEditorState, restoreEditorState } from '$lib/editor-loader';

const editorStates = new Map();

async function switchTab(filePath: string) {
  // Save current state
  if (currentFilePath) {
    editorStates.set(currentFilePath, saveEditorState(editor));
  }

  // Load new file
  const content = await readFile(filePath);
  const language = detectLanguage(filePath);

  if (language) {
    await setLanguage(editor, language);
  }

  // Restore or set content
  const savedState = editorStates.get(filePath);
  if (savedState) {
    restoreEditorState(editor, savedState);
  } else {
    setEditorContent(editor, content);
  }

  currentFilePath = filePath;
}
```

### Plugin Hook Integration

```typescript
import { registerPluginHook } from '$lib/editor-loader';

// Register plugin hook
const unregister = registerPluginHook('content_change', (view, data) => {
  // Notify plugins of content changes
  pluginsStore.trigger('editor:content_change', data);
});

// Cleanup on editor destroy
onDestroy(() => {
  unregister();
});
```

### Diff View

```typescript
import { createDiffEditor, getEditorContent } from '$lib/editor-loader';

// Show diff for file changes
const { original, modified } = await createDiffEditor(container, {
  original: previousContent,
  modified: currentContent,
  theme: $themeStore.current
});

// Get edited content
const newContent = getEditorContent(modified);
```

---

## Related Documentation

### Components Using This Module

- **[Editor.svelte](2_Editor.svelte.md)** - Main editor component, uses all APIs
- **[App.svelte](0_App.svelte.md)** - Initializes editor on mount

### Related Stores

- **[editor.ts](12_editor.ts.md)** - Editor state store
- **[theme.ts](6_theme.ts.md)** - Theme store
- **[keybindings.ts](7_keybindings.ts.md)** - Keybinding store

### Backend Integration

- **Language files loaded from backend** (planned)
- **Theme files loaded from backend** (implemented)

### External Dependencies

- **CodeMirror 6 Core**: `@codemirror/view`, `@codemirror/state`
- **CodeMirror Extensions**: `@codemirror/commands`, `@codemirror/language`, etc.
- **Language Packages**: 12 separate `@codemirror/lang-*` packages

### Project Documentation

- **[STATUS.md](../../STATUS.md)** - Development progress
- **[Technical Details](../3_technical-details.md)** - Editor architecture

---

## Implementation Notes

### Lazy Loading Strategy

Languages are loaded on-demand using dynamic imports:
```typescript
const { python } = await import('@codemirror/lang-python');
```

This reduces initial bundle size. Each language package is ~50-200KB.

### Performance Optimizations

1. **Code Splitting**: Each language in separate chunk
2. **Caching**: Loaded languages cached in memory
3. **Compartments**: Avoid full editor recreation
4. **RAF Debouncing**: Scroll sync uses `requestAnimationFrame`

### Extension Order

Keymap order matters - later keymaps override earlier ones:
```typescript
keymap.of([
  ...closeBracketsKeymap,  // Highest priority
  ...defaultKeymap,
  ...searchKeymap,
  // ... etc
])
```

### Theme CSS Variables

The theme system uses CSS custom properties for flexibility:
- `--editor-bg`, `--editor-fg` - Basic colors
- `--cursor-color`, `--cursor-width` - Cursor style
- `--selection-bg` - Selection highlight
- `--line-active` - Active line background
- `--gutter-bg`, `--line-number` - Gutter styling

These are set by theme.ts and consumed by editor-loader.ts.

### Plugin Hooks Performance

Hooks run synchronously on every update. Keep handlers lightweight:
```typescript
registerPluginHook('content_change', (view, data) => {
  // BAD: Heavy computation on every change
  analyzeEntireDocument(data.newDoc);

  // GOOD: Debounce or queue
  queueAnalysis(data.changes);
});
```

### Memory Management

Always call `destroyEditor()` when removing editor:
```typescript
onDestroy(() => {
  destroyEditor(editorView);
});
```

Failure to cleanup causes memory leaks from event listeners and plugin hooks.

---

## Future Enhancements

### Planned Features

- **LSP Integration**: Language Server Protocol support
- **Collaborative Editing**: CRDT-based real-time collaboration
- **Minimap**: Overview of document
- **Breadcrumbs**: Symbol navigation
- **Inlay Hints**: Type hints, parameter names
- **Semantic Highlighting**: Token coloring based on semantics

### Extension Points

The module is designed for extensibility:
- Custom language support via `LanguageRegistry`
- Custom themes via `createThemeExtension`
- Custom extensions via `extensions` parameter
- Custom hooks via `PluginHooksManager`

---

**Documentation Version**: 2.0.0
**Module Version**: 0.1.0
**Accuracy**: Verified against source code 2025-10-28
