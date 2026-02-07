# Editor.svelte Architecture

> **Source File**: [`src/components/Editor.svelte`](../../../src/components/Editor.svelte)
> **Status**: ✅ Implemented (1010 LOC)
> **Component Type**: Main CodeMirror Editor Container
> **Last Updated**: 2025-10-28

---

## Table of Contents

- [Overview](#overview)
- [Component API](#component-api)
- [Dependencies](#dependencies)
- [Lifecycle Management](#lifecycle-management)
- [File Operations](#file-operations)
- [Plugin Integration](#plugin-integration)
- [Language Detection](#language-detection)
- [State Management](#state-management)
- [UI Features](#ui-features)
- [Related Documentation](#related-documentation)

---

## Overview

`Editor.svelte` is the central orchestration component for Skretchpad's code editing functionality. It wraps CodeMirror 6 and provides complete file management, plugin integration, theme application, and state synchronization.

### Key Responsibilities

- **Editor Lifecycle**: Initializes/destroys CodeMirror 6 editor instance
- **File I/O**: Open, save, save-as, close, reload operations via Tauri
- **Syntax Highlighting**: Auto-detects language from file extension
- **Theme Integration**: Applies themes dynamically from theme store
- **Plugin Hooks**: Executes plugin callbacks at key lifecycle points
- **Keybinding Management**: Integrates custom keybinding schemes
- **State Sync**: Updates stores with cursor position, selection, dirty state
- **Error Handling**: Displays error banners and loading indicators

---

## Component API

### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `initialPath` | `string \| null` | No | `null` | File to open on mount |
| `readOnly` | `boolean` | No | `false` | Read-only mode |

### Exported Functions

```typescript
// Public API for parent components
export function getEditorView(): EditorView | null
export function getCurrentFilePath(): string | null
export function isDirtyFile(): boolean
export async function save(): Promise<void>
export async function open(path: string): Promise<void>
export async function close(): Promise<void>
export function getContent(): string
export function setContent(content: string): void
```

---

## Dependencies

### Svelte Stores

| Store | Import | Purpose |
|-------|--------|---------|
| `editorStore` | `../lib/stores/editor` | Cursor, selection, dirty state |
| `themeStore` | `../lib/stores/theme` | Theme management |
| `uiStore` | `../lib/stores/ui` | UI visibility state |
| `pluginStore` | `../lib/stores/plugins` | Active plugins |
| `keybindingStore` | `../lib/stores/keybindings` | Keybinding schemes |

**References**: See [`12_editor.ts.md`](12_editor.ts.md), [`6_theme.ts.md`](6_theme.ts.md), [`13_plugins.ts.md`](13_plugins.ts.md)

### Utilities

| Function | Import | Purpose |
|----------|--------|---------|
| `createEditor` | `../lib/editor-loader` | Creates CodeMirror instance |
| `destroyEditor` | `../lib/editor-loader` | Cleanup on unmount |
| `setLanguage` | `../lib/editor-loader` | Sets syntax mode |
| `updateTheme` | `../lib/editor-loader` | Applies theme |
| `debounce` | `../lib/utils/debounce` | Debounces handlers |

**Reference**: [`5_editor-loader.ts.md`](5_editor-loader.ts.md), [`14_debounce.ts.md`](14_debounce.ts.md)

### CodeMirror 6 Language Modes

```typescript
const languageMap = {
  'python': python(),
  'rust': rust(),
  'markdown': markdown(),
  'javascript': javascript(),
  'json': json(),
};
```

**Source**: Lines 50-56

---

## Lifecycle Management

### Initialization (onMount)

```typescript
onMount(async () => {
  await initializeEditor();        // Create CodeMirror instance
  await setupEventListeners();     // Listen for Tauri events
  await setupStoreSubscriptions(); // Subscribe to stores

  if (initialPath) {
    await openFile(initialPath);   // Open initial file
  }
});
```

**Source**: Lines 62-75

#### `initializeEditor()`

1. Gets current theme from `themeStore`
2. Gets keybindings from `keybindingStore`
3. Calls `createEditor()` with callbacks:
   - `onChange`: Handles content changes (debounced 300ms)
   - `onCursorMove`: Updates cursor position
   - `onSelection`: Updates selection info
4. Updates `editorStore` with editor view instance

**Source**: Lines 85-108

### Event Listeners Setup

| Event | Handler | Purpose |
|-------|---------|---------|
| `file:open` | `openFile(path)` | Opens file from external trigger |
| `file:save` | `saveCurrentFile()` | Saves from external trigger |
| `theme:changed` | `applyTheme(theme)` | Applies new theme |
| `keybindings:changed` | `reloadKeybindings()` | Reloads keybindings |
| `window:focus` | `checkForExternalChanges()` | Checks for file modifications |

**Source**: Lines 114-144

### Store Subscriptions

- **themeStore**: Applies theme when changed
- **uiStore**: Reacts to UI state changes
- **keybindingStore**: Reloads keybindings when changed

**Source**: Lines 150-172

### Cleanup (onDestroy)

```typescript
async function cleanup() {
  await executePluginHook('before_editor_destroy', { path: currentFilePath });

  // Unsubscribe from events
  for (const unsub of unsubscribers) unsub();

  // Unsubscribe from stores
  for (const unsub of storeUnsubscribers) unsub();

  // Destroy editor
  if (editorView) destroyEditor(editorView);
}
```

**Source**: Lines 622-647

---

## File Operations

### Open File

```typescript
async function openFile(filePath: string)
```

**Flow**:
1. Checks if current file is dirty → prompts to save
2. Executes `before_file_open` plugin hook
3. Calls `invoke('read_file', { path })`
4. Detects language from file extension
5. Updates editor content via transaction
6. Applies syntax highlighting
7. Updates state and stores
8. Executes `on_file_open` plugin hook

**Source**: Lines 178-241

### Save File

```typescript
async function saveCurrentFile()
```

**Flow**:
1. Executes `before_file_save` plugin hook
2. Gets content from editor
3. Calls `invoke('write_file', { path, content })`
4. Marks file as clean
5. Executes `on_file_save` plugin hook

**Source**: Lines 243-284

### Other Operations

| Function | Purpose | Source |
|----------|---------|--------|
| `saveFileAs(newPath)` | Save to new path, re-detect language | Lines 286-314 |
| `closeCurrentFile()` | Prompt to save, clear editor | Lines 316-340 |
| `reloadCurrentFile()` | Reload from disk with confirmation | Lines 342-349 |
| `checkForExternalChanges()` | Check file metadata for changes | Lines 351-366 |

---

## Plugin Integration

### Plugin Hook Execution

```typescript
async function executePluginHook(hookName: string, data: PluginHookEvent)
```

Executes hooks for all active plugins via `plugin_execute_hook` Tauri command.

**Source**: Lines 487-501

### Available Hooks

| Hook Name | Trigger | Data Payload |
|-----------|---------|--------------|
| `before_file_open` | Before opening file | `{ path }` |
| `on_file_open` | After opening file | `{ path, content, language }` |
| `before_file_save` | Before saving file | `{ path, content }` |
| `on_file_save` | After saving file | `{ path, content }` |
| `on_content_change` | Content changed (debounced) | `{ path, changes }` |
| `before_editor_destroy` | Before editor cleanup | `{ path }` |

---

## Language Detection

```typescript
async function detectLanguage(filePath: string): Promise<string | null>
```

Maps file extensions to language identifiers:

| Extension | Language | Mode |
|-----------|----------|------|
| `.py` | `python` | `python()` |
| `.rs` | `rust` | `rust()` |
| `.js`, `.jsx` | `javascript` | `javascript()` |
| `.ts`, `.tsx` | `typescript` | *(planned)* |
| `.md` | `markdown` | `markdown()` |
| `.json` | `json` | `json()` |
| `.yaml`, `.yml` | `yaml` | *(planned)* |
| `.toml` | `toml` | *(planned)* |
| `.html` | `html` | *(planned)* |
| `.css` | `css` | *(planned)* |

**Source**: Lines 372-392

---

## State Management

### Local State

```typescript
let editorContainer: HTMLDivElement;      // DOM container
let editorView: EditorView | null = null; // CodeMirror instance
let currentFilePath: string | null = null;
let currentLanguage: string | null = null;
let isDirty: boolean = false;             // Unsaved changes
let isLoading: boolean = false;           // Loading indicator
let error: string | null = null;          // Error message
```

**Source**: Lines 29-35

### Editor State Object

```typescript
let editorState: EditorState = {
  cursorPosition: { line: 1, column: 1 },
  selectionLength: 0,
  lineCount: 1,
  encoding: 'utf-8',
  eolType: 'LF',
};
```

Updated by `updateEditorState()` and synced to `editorStore`.

**Source**: Lines 42-48

### State Update Flow

```plaintext
Editor Change
    ↓
handleEditorChange (debounced 300ms)
    ↓
updateEditorState()
    ↓
editorStore.updateState(editorState)
    ↓
StatusBar.svelte (reactive update)
```

---

## UI Features

### Error Banner

```svelte
{#if error}
  <div class="error-banner">
    <span class="error-icon">⚠️</span>
    <span class="error-message">{error}</span>
    <button class="error-dismiss" on:click={() => error = null}>×</button>
  </div>
{/if}
```

Displays at top of editor with slide-down animation.

**Source**: Lines 717-723

### Loading Overlay

```svelte
{#if isLoading}
  <div class="loading-overlay">
    <div class="loading-spinner"></div>
    <span class="loading-text">Loading...</span>
  </div>
{/if}
```

Full-screen overlay with spinner during file operations.

**Source**: Lines 725-730

### Empty State

```svelte
{#if !currentFilePath}
  <div class="empty-state">
    <h2>No file open</h2>
    <p>Open a file to start editing</p>
    <button on:click={() => invoke('show_open_dialog')}>Open File</button>
    <button on:click={() => invoke('create_new_file')}>New File</button>
  </div>
{/if}
```

Displays when no file is open with action buttons.

**Source**: Lines 740-755

### Styling Features

- **Glass effect**: Transparent background with backdrop blur
- **Custom scrollbars**: Thin, glass-styled scrollbars
- **Cursor**: Cyan accent color (`#00d9ff`)
- **Selection**: Semi-transparent cyan background
- **Active line**: Subtle highlight
- **Gutter**: Dark background with line numbers
- **Fold indicators**: Show on hover

**Source**: Lines 762-1009

---

## Related Documentation

### Component Documentation

- **[App.svelte](0_App.svelte.md)** - Root component
- **[Chrome.svelte](Chrome.svelte.md)** - Title bar
- **[StatusBar.svelte](StatusBar.svelte.md)** - Status bar with plugin items

### Store Documentation

- **[editor.ts](12_editor.ts.md)** - Editor state store
- **[theme.ts](6_theme.ts.md)** - Theme management
- **[plugins.ts](13_plugins.ts.md)** - Plugin registry
- **[keybindings.ts](7_keybindings.ts.md)** - Keybinding schemes

### Utility Documentation

- **[editor-loader.ts](5_editor-loader.ts.md)** - CodeMirror setup
- **[debounce.ts](14_debounce.ts.md)** - Debounce utility
- **[plugin-api.ts](8_plugin-api.ts.md)** - Plugin types

### Backend Documentation

- **[api.rs](3_api.rs.md)** - Tauri commands
- **[manager.rs](10_manager.rs.md)** - Plugin manager

### Project Status

- **[STATUS.md](../../STATUS.md)** - Development progress
- **[TODO.md](../../TODO.md)** - Implementation tasks
- **[Technical Details](../3_technical-details.md)** - Implementation details

---

## Implementation Status

### ✅ Implemented Features

- Complete file I/O (open, save, close, reload)
- Plugin hook system with 6 hook points
- Language detection for 5 languages (Python, Rust, JS, Markdown, JSON)
- Theme application and hot-reload
- Keybinding integration
- State management and store sync
- Error handling and user prompts
- Loading states and empty state UI
- External change detection (partial)
- Debounced change handlers
- Cursor and selection tracking
- Dirty state management
- Window title updates

### 📋 Planned Features

- Search and replace functionality (stubs at lines 547-569)
- Editor commands (undo, redo, format, comment) (stubs at lines 575-616)
- Diff view implementation (stub at lines 507-524)
- Complete external file change detection
- Additional language modes (TypeScript, YAML, TOML, HTML, CSS)

---

**Documentation Version**: 2.0.0
**Component Version**: 0.1.0
**Accuracy**: Verified against source code 2025-10-28
