# editor.ts Architecture

> **Source File**: [`src/lib/stores/editor.ts`](../../../src/lib/stores/editor.ts)
> **Status**: ✅ Implemented
> **Module Type**: Svelte Store - Editor State Management
> **Lines of Code**: 737

---

## Table of Contents

- [Overview](#overview)
- [Type Definitions](#type-definitions)
- [Store API](#store-api)
- [Tab Management](#tab-management)
- [File Operations](#file-operations)
- [Derived Stores](#derived-stores)
- [Event Listeners](#event-listeners)
- [Related Documentation](#related-documentation)

---

## Overview

`editor.ts` provides comprehensive state management for the editor system using Svelte stores. It implements a **tab-based file management system** with auto-save, dirty state tracking, and editor state persistence.

### Key Features

- **Multi-tab support**: Open multiple files simultaneously
- **Auto-save**: Debounced auto-save (1s delay)
- **State persistence**: Saves/restores cursor position and scroll state
- **Dirty tracking**: Tracks unsaved changes per file
- **File events**: Emits events for plugin integration
- **Recent actions**: Tracks file operations for undo/redo

---

## Type Definitions

### OpenFile

```typescript
export interface OpenFile {
  path: string;
  name: string;
  content: string;
  language?: string;
  isDirty: boolean;
  snapshot?: EditorStateSnapshot;
  lastSaved?: number;
}
```

**Source**: Lines 27-35

Represents an open file with all metadata.

### Tab

```typescript
export interface Tab {
  id: string;
  file: OpenFile;
  active: boolean;
}
```

**Source**: Lines 37-41

Represents a tab containing an open file.

### EditorState

```typescript
export interface EditorState {
  tabs: Tab[];
  activeTabId: string | null;
  editorView: EditorView | null;
  cursorPosition: { line: number; column: number };
  selection: string;
  canUndo: boolean;
  canRedo: boolean;
  isLoading: boolean;
  error: string | null;
}
```

**Source**: Lines 43-53

Main store state structure.

### EditorAction

```typescript
export interface EditorAction {
  type: 'open' | 'save' | 'close' | 'create' | 'rename';
  file: string;
  timestamp: number;
}
```

**Source**: Lines 55-59

Tracks recent file operations.

---

## Store API

### Core Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `initialize(container)` | `(container: HTMLElement) => Promise<void>` | Initializes CodeMirror editor |
| `openFile(path)` | `(path: string) => Promise<void>` | Opens file in new tab |
| `createFile()` | `() => Promise<void>` | Creates new untitled file |
| `saveFile()` | `() => Promise<void>` | Saves active file |
| `saveFileAs()` | `() => Promise<void>` | Save with new path |
| `closeTab(tabId)` | `(tabId: string) => Promise<void>` | Closes specific tab |
| `switchTab(tabId)` | `(tabId: string) => Promise<void>` | Switches to different tab |

### Bulk Operations

| Method | Description | Source |
|--------|-------------|--------|
| `saveAll()` | Saves all dirty files | Lines 581-590 |
| `closeAll()` | Closes all tabs | Lines 570-576 |
| `reloadFile(path)` | Reloads file from disk | Lines 595-629 |

### Utility Methods

| Method | Description | Source |
|--------|-------------|--------|
| `getActiveFile()` | Returns active file or null | Lines 561-565 |
| `getRecentActions()` | Returns action history | Lines 634-636 |
| `clearError()` | Clears error state | Lines 641-646 |
| `cleanup()` | Destroys editor and resets state | Lines 651-670 |
| `updateEditorContent(content, language)` | Updates editor with new content | Lines 544-556 |

---

## Tab Management

### Opening Files

```typescript
await editorStore.openFile('/path/to/file.rs');
```

**Flow**:
1. Check if file already open → switch to existing tab
2. Read file content via `invoke('read_file')`
3. Detect language from file extension
4. Create `OpenFile` and `Tab` objects
5. Save current tab's editor state
6. Add new tab and mark as active
7. Update editor content
8. Emit `file:open` event for plugins

**Source**: Lines 191-273

### Switching Tabs

```typescript
await editorStore.switchTab('tab-123');
```

**Flow**:
1. Save current tab's editor state (cursor, scroll)
2. Update active tab in store
3. Load new tab's content into editor
4. Restore previous editor state if available

**Source**: Lines 508-539

### Closing Tabs

```typescript
await editorStore.closeTab('tab-123');
```

**Flow**:
1. Check if file is dirty
2. Prompt user to save if needed
3. Remove tab from array
4. Activate next tab if closing active tab
5. Load activated tab's content
6. Emit `file:close` event

**Source**: Lines 437-503

---

## File Operations

### Auto-Save System

```typescript
const debouncedSave = debounce(async (path: string, content: string) => {
  await invoke('save_file', { path, content });
  // Mark file as clean
  // Emit save event
}, 1000);
```

**Source**: Lines 82-108

- **Debounce**: 1 second delay
- **Trigger**: Content change in editor
- **Behavior**: Automatically saves without user interaction

### Manual Save

```typescript
await editorStore.saveFile();
```

**Flow**:
1. Get active tab
2. If no path, prompt for save location
3. Get content from editor view
4. Call `invoke('save_file')`
5. Mark file as clean
6. Record save action
7. Emit `file:save` event

**Source**: Lines 313-377

### Save As

```typescript
await editorStore.saveFileAs();
```

**Flow**:
1. Show save dialog via `invoke('show_save_dialog')`
2. Save file to new path
3. Update tab with new path and name
4. Detect language for new extension
5. Mark as clean

**Source**: Lines 382-432

---

## Derived Stores

### activeFile

```typescript
export const activeFile = derived(editorStore, ($editor) => {
  const activeTab = $editor.tabs.find((tab) => tab.id === $editor.activeTabId);
  return activeTab?.file || null;
});
```

**Source**: Lines 682-685

Returns the currently active file or `null`.

### hasUnsavedChanges

```typescript
export const hasUnsavedChanges = derived(editorStore, ($editor) =>
  $editor.tabs.some((tab) => tab.file.isDirty)
);
```

**Source**: Lines 690-692

Returns `true` if any tab has unsaved changes.

### openFileCount

```typescript
export const openFileCount = derived(
  editorStore,
  ($editor) => $editor.tabs.length
);
```

**Source**: Lines 697-700

Returns the number of open tabs.

### activeTab

```typescript
export const activeTab = derived(editorStore, ($editor) =>
  $editor.tabs.find((tab) => tab.id === $editor.activeTabId)
);
```

**Source**: Lines 705-707

Returns the active `Tab` object or `undefined`.

---

## Event Listeners

### Backend File Events

```typescript
// Reload file when changed externally
listen<{ path: string }>('file:changed', async (event) => {
  await editorStore.reloadFile(event.payload.path);
});

// Close tab when file deleted
listen<{ path: string }>('file:deleted', async (event) => {
  const tab = state.tabs.find((t) => t.file.path === event.payload.path);
  if (tab) await editorStore.closeTab(tab.id);
});
```

**Source**: Lines 714-727

### Browser Events

```typescript
// Prevent closing with unsaved changes
window.addEventListener('beforeunload', (e) => {
  const state = get(editorStore);
  if (state.tabs.some((tab) => tab.file.isDirty)) {
    e.preventDefault();
    e.returnValue = '';
  }
});
```

**Source**: Lines 730-736

Prevents accidental data loss by prompting when closing browser with unsaved changes.

---

## Editor Initialization

### Setup Flow

```typescript
await editorStore.initialize(containerElement);
```

**Process**:
1. Check if already initialized
2. Get current theme from `themeStore`
3. Create CodeMirror editor with:
   - `onChange`: Marks file dirty, triggers auto-save
   - `onCursorMove`: Updates cursor position in store
   - `onSelection`: Updates selection text in store
4. Store editor view in state
5. Subscribe to theme changes

**Source**: Lines 116-186

### Editor Callbacks

| Callback | Trigger | Action |
|----------|---------|--------|
| `onChange` | Content modified | Mark dirty, auto-save, update content in tab |
| `onCursorMove` | Cursor position changes | Update `cursorPosition` in store |
| `onSelection` | Text selected | Update `selection` in store |

---

## State Persistence

### Saving State

```typescript
// Before switching tabs
if (currentTab && state.editorView) {
  currentTab.file.snapshot = saveEditorState(state.editorView);
}
```

**What's saved**:
- Cursor position
- Scroll position
- Selection ranges

**Source**: Lines 233-236, 512-515

### Restoring State

```typescript
// After switching tabs
if (newTab.file.snapshot && state.editorView) {
  restoreEditorState(state.editorView, newTab.file.snapshot);
}
```

**Source**: Lines 485-488, 534-537

---

## Usage Examples

### Opening and Editing Files

```typescript
import { editorStore, activeFile } from '$lib/stores/editor';

// Initialize editor
await editorStore.initialize(containerElement);

// Open file
await editorStore.openFile('/path/to/file.ts');

// Get active file (reactive)
$: currentFile = $activeFile;

// Save file
await editorStore.saveFile();
```

### Tab Management

```typescript
import { editorStore, openFileCount, hasUnsavedChanges } from '$lib/stores/editor';

// Create new file
await editorStore.createFile();

// Switch tabs
await editorStore.switchTab(tabId);

// Close tab
await editorStore.closeTab(tabId);

// Check for unsaved changes
if ($hasUnsavedChanges) {
  await editorStore.saveAll();
}
```

---

## Related Documentation

### Dependencies

- **[editor-loader.ts](5_editor-loader.ts.md)** - CodeMirror setup functions
- **[theme.ts](6_theme.ts.md)** - Theme store
- **[debounce.ts](14_debounce.ts.md)** - Debounce utility for auto-save

### Components Using This Store

- **[Editor.svelte](2_Editor.svelte.md)** - Main editor component
- **[StatusBar.svelte](StatusBar.svelte.md)** - Displays cursor position, selection

### Backend Commands

- **`read_file`** - Read file content
- **`save_file`** - Write file content
- **`show_save_dialog`** - File save dialog
- **`show_confirm_dialog`** - Confirmation dialog
- **`emit_editor_event`** - Emit events for plugins

### Project Documentation

- **[STATUS.md](../../STATUS.md)** - Development progress
- **[Technical Details](../3_technical-details.md)** - Implementation patterns

---

## Implementation Notes

### Tab ID Generation

```typescript
const tab: Tab = {
  id: `tab-${Date.now()}-${Math.random()}`,
  // ...
};
```

Uses timestamp + random number for unique IDs. Not cryptographically secure but sufficient for tab identification.

### Auto-Save Behavior

- **Debounce**: 1000ms (1 second)
- **Trigger**: Every content change
- **Condition**: Only if file has a path (not untitled)
- **Result**: File saved silently in background

### Memory Considerations

- Editor state snapshots stored per tab
- Recent actions array grows unbounded (potential memory leak)
- Consider implementing action history limit

---

**Documentation Version**: 2.0.0
**Module Version**: 0.1.0
**Accuracy**: Verified against source code 2025-10-28
