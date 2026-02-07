# keybindings.ts Architecture

> **Source File**: [`src/lib/stores/keybindings.ts`](../../../src/lib/stores/keybindings.ts)
> **Status**: ✅ Implemented
> **Module Type**: Svelte Store - Keybinding Management
> **Lines of Code**: 654

---

## Table of Contents

- [Overview](#overview)
- [Type System](#type-system)
- [Built-in Schemes](#built-in-schemes)
- [Store API](#store-api)
- [Helper Functions](#helper-functions)
- [Context System](#context-system)
- [Event Handling](#event-handling)
- [Derived Stores](#derived-stores)
- [Related Documentation](#related-documentation)

---

## Overview

`keybindings.ts` provides comprehensive keyboard shortcut management for Skretchpad. It includes multiple built-in keybinding schemes (Default, Vim, Emacs), custom binding support, context-aware execution, and cross-platform key handling.

### Key Features

- **Multiple Schemes**: Default, Vim, and Emacs keybinding schemes
- **Custom Bindings**: User-defined shortcuts that overlay scheme bindings
- **Context Awareness**: Conditional keybindings based on editor state
- **Cross-Platform**: Automatic Cmd/Ctrl mapping for macOS/Windows
- **Global Handling**: Window-level keydown event interception
- **Backend Integration**: Load custom schemes from disk
- **Visual Formatting**: Platform-appropriate display (⌘ vs Ctrl)

---

## Type System

### KeyModifier

```typescript
export type KeyModifier = 'Ctrl' | 'Shift' | 'Alt' | 'Cmd' | 'Meta';
```

**Source**: Line 11

Modifier keys for keyboard shortcuts.

### Keybinding

```typescript
export interface Keybinding {
  key: string;              // Key pressed (e.g., 'o', 'F3', '`')
  modifiers: KeyModifier[]; // Active modifiers
  command: string;          // Command ID to execute
  when?: string;            // Optional context condition
  args?: Record<string, any>; // Optional command arguments
}
```

**Source**: Lines 13-19

Individual keybinding definition.

**Example**:
```typescript
{
  key: 's',
  modifiers: ['Ctrl'],
  command: 'file.save',
  when: 'editorFocused' // Optional
}
```

### Keybindings

```typescript
export type Keybindings = Record<string, Keybinding>;
```

**Source**: Line 21

Map of keybinding ID (e.g., `"Ctrl+S"`) to Keybinding object.

### KeybindingScheme

```typescript
export interface KeybindingScheme {
  name: string;         // Display name
  description: string;  // User-facing description
  author: string;       // Creator/maintainer
  bindings: Keybindings; // All bindings in this scheme
}
```

**Source**: Lines 23-28

Complete keybinding scheme (theme).

### KeybindingState

```typescript
export interface KeybindingState {
  current: Keybindings;              // Active bindings (scheme + custom)
  currentScheme: KeybindingScheme | null; // Active scheme
  available: KeybindingScheme[];     // All loaded schemes
  customBindings: Keybindings;       // User-defined bindings
  loading: boolean;
  error: string | null;
}
```

**Source**: Lines 30-37

Store state structure.

### KeyEvent

```typescript
export interface KeyEvent {
  key: string;      // Key identifier (e.g., 'a', 'Enter', 'F1')
  code: string;     // Physical key code (e.g., 'KeyA', 'Enter')
  ctrlKey: boolean; // Ctrl pressed
  shiftKey: boolean; // Shift pressed
  altKey: boolean;  // Alt pressed
  metaKey: boolean; // Meta/Cmd pressed
}
```

**Source**: Lines 39-46

Normalized keyboard event.

---

## Built-in Schemes

### DEFAULT_SCHEME

```typescript
const DEFAULT_SCHEME: KeybindingScheme = {
  name: 'Default',
  description: 'Default keybindings for skretchpad',
  author: 'skretchpad',
  bindings: {
    // 30+ keybindings
  }
};
```

**Source**: Lines 52-224

**Binding Categories**:

#### File Operations
| Keybinding | Command | Description |
|------------|---------|-------------|
| `Ctrl+O` | `file.open` | Open file |
| `Ctrl+S` | `file.save` | Save file |
| `Ctrl+Shift+S` | `file.saveAs` | Save as |
| `Ctrl+W` | `file.close` | Close file |
| `Ctrl+N` | `file.new` | New file |

**Source**: Lines 57-83

#### Edit Operations
| Keybinding | Command | Description |
|------------|---------|-------------|
| `Ctrl+Z` | `edit.undo` | Undo |
| `Ctrl+Y`, `Ctrl+Shift+Z` | `edit.redo` | Redo |
| `Ctrl+C` | `edit.copy` | Copy |
| `Ctrl+X` | `edit.cut` | Cut |
| `Ctrl+V` | `edit.paste` | Paste |
| `Ctrl+A` | `edit.selectAll` | Select all |
| `Ctrl+/` | `edit.toggleComment` | Toggle comment |
| `Ctrl+D` | `edit.duplicateLine` | Duplicate line |
| `Ctrl+Shift+K` | `edit.deleteLine` | Delete line |

**Source**: Lines 85-135

#### Search Operations
| Keybinding | Command | Description |
|------------|---------|-------------|
| `Ctrl+F` | `search.find` | Find |
| `Ctrl+H` | `search.replace` | Replace |
| `F3` | `search.findNext` | Find next |
| `Shift+F3` | `search.findPrevious` | Find previous |

**Source**: Lines 137-157

#### View Operations
| Keybinding | Command | Description |
|------------|---------|-------------|
| `Ctrl+Shift+H` | `view.toggleChrome` | Toggle title bar |
| `Ctrl+P` | `view.togglePin` | Toggle window pin |
| `Ctrl+,` | `view.openSettings` | Open settings |
| `Ctrl+Shift+P` | `view.commandPalette` | Command palette |

**Source**: Lines 159-179

#### Navigation
| Keybinding | Command | Description |
|------------|---------|-------------|
| `Ctrl+G` | `navigation.gotoLine` | Go to line |
| `Ctrl+Tab` | `navigation.nextTab` | Next tab |
| `Ctrl+Shift+Tab` | `navigation.previousTab` | Previous tab |

**Source**: Lines 181-196

#### Formatting
| Keybinding | Command | Description |
|------------|---------|-------------|
| `Shift+Alt+F` | `format.document` | Format document |

**Source**: Lines 198-203

#### Git Commands
| Keybinding | Command | Context | Description |
|------------|---------|---------|-------------|
| `Ctrl+Shift+G` | `git.status` | - | Git status |
| `Ctrl+K` | `git.commit` | `gitAvailable` | Commit |

**Source**: Lines 205-216

#### Terminal
| Keybinding | Command | Description |
|------------|---------|-------------|
| `Ctrl+\`` | `terminal.toggle` | Toggle terminal |

**Source**: Lines 218-223

### VIM_SCHEME

```typescript
const VIM_SCHEME: KeybindingScheme = {
  name: 'Vim',
  description: 'Vim-style keybindings',
  author: 'skretchpad',
  bindings: {
    // Vim modal bindings
  }
};
```

**Source**: Lines 226-276

**Key Bindings**:
- `h`, `j`, `k`, `l` - Movement (when `vim.normalMode`)
- `i` - Insert mode (when `vim.normalMode`)
- `a` - Append mode (when `vim.normalMode`)
- `Escape` - Normal mode (when `vim.insertMode`)

### EMACS_SCHEME

```typescript
const EMACS_SCHEME: KeybindingScheme = {
  name: 'Emacs',
  description: 'Emacs-style keybindings',
  author: 'skretchpad',
  bindings: {
    // Emacs control-key bindings
  }
};
```

**Source**: Lines 278-315

**Key Bindings**:
- `Ctrl+F` - Move forward
- `Ctrl+B` - Move backward
- `Ctrl+N` - Move down
- `Ctrl+P` - Move up
- `Ctrl+A` - Move to line start
- `Ctrl+E` - Move to line end

---

## Store API

### Initialization

```typescript
const { subscribe, update } = writable<KeybindingState>({
  current: DEFAULT_SCHEME.bindings,
  currentScheme: DEFAULT_SCHEME,
  available: [DEFAULT_SCHEME, VIM_SCHEME, EMACS_SCHEME],
  customBindings: {},
  loading: false,
  error: null,
});
```

**Source**: Lines 322-329

Store initializes with Default scheme active.

### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `setScheme(scheme)` | `(scheme: KeybindingScheme) => void` | Switch to specified scheme |
| `loadScheme(name)` | `(name: string) => Promise<void>` | Load scheme by name (local or backend) |
| `addCustomBinding(id, binding)` | `(id: string, binding: Keybinding) => void` | Add user-defined binding |
| `removeCustomBinding(id)` | `(id: string) => void` | Remove custom binding |
| `resetToDefault()` | `() => void` | Reset to DEFAULT_SCHEME |
| `clearCustomBindings()` | `() => void` | Remove all custom bindings |
| `getCommand(event)` | `(event: KeyEvent) => string \| null` | Get command for key event |
| `execute(event)` | `(event: KeyEvent) => Promise<boolean>` | Execute command for key event |

### setScheme

```typescript
setScheme: (scheme: KeybindingScheme) => void
```

**Source**: Lines 337-346

Switches to the specified keybinding scheme. Custom bindings are preserved and overlaid on top of the scheme.

**Example**:
```typescript
keybindingStore.setScheme(VIM_SCHEME);
```

### loadScheme

```typescript
loadScheme: async (schemeName: string) => Promise<void>
```

**Source**: Lines 348-375

Loads a keybinding scheme by name. Checks local schemes first, then attempts to load from backend.

**Process**:
1. Search `available` array for scheme with matching name
2. If found locally, call `setScheme()`
3. If not found, invoke `load_keybinding_scheme` backend command
4. Add loaded scheme to `available` array
5. Apply scheme

**Example**:
```typescript
await keybindingStore.loadScheme('Emacs');
await keybindingStore.loadScheme('custom-scheme'); // From backend
```

### addCustomBinding

```typescript
addCustomBinding: (id: string, binding: Keybinding) => void
```

**Source**: Lines 377-389

Adds a user-defined keybinding that overlays the current scheme.

**Example**:
```typescript
keybindingStore.addCustomBinding('Ctrl+Shift+D', {
  key: 'd',
  modifiers: ['Ctrl', 'Shift'],
  command: 'editor.duplicateDown'
});
```

### removeCustomBinding

```typescript
removeCustomBinding: (id: string) => void
```

**Source**: Lines 391-407

Removes a custom binding by ID.

**Example**:
```typescript
keybindingStore.removeCustomBinding('Ctrl+Shift+D');
```

### resetToDefault

```typescript
resetToDefault: () => void
```

**Source**: Lines 410-419

Resets current scheme to `DEFAULT_SCHEME` while preserving custom bindings.

### clearCustomBindings

```typescript
clearCustomBindings: () => void
```

**Source**: Lines 421-432

Removes all custom bindings and returns to pure scheme bindings.

### getCommand

```typescript
getCommand: (event: KeyEvent) => string | null
```

**Source**: Lines 434-450

Looks up the command associated with a key event.

**Process**:
1. Convert KeyEvent to Keybinding using `eventToKeybinding()`
2. Convert Keybinding to string ID using `keybindingToString()`
3. Lookup binding in `state.current`
4. Check `when` context condition if specified
5. Return command ID or `null`

### execute

```typescript
execute: async (event: KeyEvent) => Promise<boolean>
```

**Source**: Lines 452-466

Executes the command associated with a key event.

**Returns**: `true` if command was executed, `false` if no binding found

**Example**:
```typescript
const handled = await keybindingStore.execute({
  key: 's',
  code: 'KeyS',
  ctrlKey: true,
  shiftKey: false,
  altKey: false,
  metaKey: false
});
// Returns true and executes 'file.save' command
```

---

## Helper Functions

### eventToKeybinding

```typescript
function eventToKeybinding(event: KeyEvent): Keybinding
```

**Source**: Lines 476-494

Converts a KeyEvent to a Keybinding object. Handles platform-specific modifier mapping (Ctrl vs Cmd on macOS).

**Platform Handling**:
- macOS: `metaKey` → `Cmd`
- Windows/Linux: `ctrlKey` → `Ctrl`

### keybindingToString

```typescript
function keybindingToString(binding: Keybinding): string
```

**Source**: Lines 499-518

Converts a Keybinding to a string ID for lookup.

**Example**:
```typescript
keybindingToString({
  key: 's',
  modifiers: ['Ctrl', 'Shift'],
  command: 'file.saveAs'
})
// Returns: "Ctrl+Shift+s"
```

### parseKeybinding

```typescript
export function parseKeybinding(str: string): Keybinding
```

**Source**: Lines 520-533

Parses a keybinding string into a Keybinding object.

**Example**:
```typescript
parseKeybinding('Ctrl+Shift+S')
// Returns: { key: 'S', modifiers: ['Ctrl', 'Shift'], command: '' }
```

### isMac

```typescript
function isMac(): boolean
```

**Source**: Lines 535-540

Detects if running on macOS using platform detection.

### formatKeybinding

```typescript
export function formatKeybinding(binding: Keybinding): string
```

**Source**: Lines 559-588

Formats a keybinding for display with platform-appropriate symbols.

**Platform-Specific Formatting**:

| Modifier | macOS | Windows/Linux |
|----------|-------|---------------|
| Ctrl/Cmd | `⌘` | `Ctrl` |
| Shift | `⇧` | `Shift` |
| Alt | `⌥` | `Alt` |

**Example**:
```typescript
formatKeybinding({ key: 's', modifiers: ['Ctrl'], command: 'file.save' })
// macOS: "⌘S"
// Windows: "Ctrl+S"
```

---

## Context System

### evaluateContext

```typescript
function evaluateContext(condition: string): boolean
```

**Source**: Lines 542-557

Evaluates a context condition string.

**Built-in Contexts**:
- `vim.normalMode` - Vim normal mode active
- `vim.insertMode` - Vim insert mode active
- `gitAvailable` - Git integration available

**Implementation Note**: Current implementation is simplified. Production version would integrate with actual editor state tracking.

**Example**:
```typescript
{
  key: 'k',
  modifiers: ['Ctrl'],
  command: 'git.commit',
  when: 'gitAvailable' // Only active if git is available
}
```

---

## Event Handling

### Global Keydown Handler

```typescript
window.addEventListener('keydown', async (event) => {
  // Skip input fields
  if (event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement) {
    return;
  }

  const keyEvent: KeyEvent = { /* convert event */ };
  const handled = await keybindingStore.execute(keyEvent);

  if (handled) {
    event.preventDefault();
    event.stopPropagation();
  }
});
```

**Source**: Lines 622-650

**Process**:
1. Ignore events from input/textarea elements
2. Convert browser KeyboardEvent to KeyEvent
3. Execute keybinding via store
4. If command executed, prevent default browser behavior

### Backend Event Listener

```typescript
listen<KeybindingScheme>('keybindings:changed', (event) => {
  keybindingStore.setScheme(event.payload);
});
```

**Source**: Lines 650-655

Listens for keybinding scheme changes from backend and applies them automatically.

---

## Derived Stores

### currentSchemeName

```typescript
export const currentSchemeName = derived(
  keybindingStore,
  ($kb) => $kb.currentScheme?.name || 'Custom'
);
```

**Source**: Lines 594-600

Returns current scheme name or `"Custom"` if no scheme active.

### hasCustomBindings

```typescript
export const hasCustomBindings = derived(
  keybindingStore,
  ($kb) => Object.keys($kb.customBindings).length > 0
);
```

**Source**: Lines 602-608

Returns `true` if user has defined any custom bindings.

### keybindingArray

```typescript
export const keybindingArray = derived(keybindingStore, ($kb) =>
  Object.entries($kb.current).map(([id, binding]) => ({
    id,
    ...binding,
  }))
);
```

**Source**: Lines 610-618

Converts keybindings Record to array for iteration.

**Usage**:
```typescript
{#each $keybindingArray as binding}
  <div class="keybinding">
    <span>{formatKeybinding(binding)}</span>
    <span>{binding.command}</span>
  </div>
{/each}
```

---

## Usage Examples

### Switch Keybinding Scheme

```typescript
import { keybindingStore } from '$lib/stores/keybindings';

// Switch to Vim mode
keybindingStore.setScheme(VIM_SCHEME);

// Load from backend
await keybindingStore.loadScheme('custom-ide-scheme');
```

### Add Custom Keybinding

```typescript
keybindingStore.addCustomBinding('Ctrl+Shift+D', {
  key: 'd',
  modifiers: ['Ctrl', 'Shift'],
  command: 'editor.duplicateDown'
});
```

### Display Keybindings in UI

```typescript
import { keybindingArray, formatKeybinding } from '$lib/stores/keybindings';

{#each $keybindingArray as binding}
  <div class="keybinding-row">
    <kbd>{formatKeybinding(binding)}</kbd>
    <span>{binding.command}</span>
  </div>
{/each}
```

### Manual Command Execution

```typescript
// Simulate Ctrl+S press
const result = await keybindingStore.execute({
  key: 's',
  code: 'KeyS',
  ctrlKey: true,
  shiftKey: false,
  altKey: false,
  metaKey: false
});

if (result) {
  console.log('File saved via keybinding');
}
```

---

## Related Documentation

### Components Using This Store

- **[App.svelte](0_App.svelte.md)** - Root component, initializes keybindings
- **[Editor.svelte](2_Editor.svelte.md)** - Editor receives keyboard events
- **Settings Component** (planned) - Keybinding customization UI

### Backend Commands

- **`load_keybinding_scheme(schemeName)`** - Load scheme from disk
- **`save_keybinding_scheme(scheme)`** - Save custom scheme
- **`execute_command(command)`** - Execute command by ID

### Related Frontend Files

- **[editor.ts](12_editor.ts.md)** - Editor store that receives keybinding commands
- **[plugins.ts](13_plugins.ts.md)** - Plugins can register custom commands

### Project Documentation

- **[STATUS.md](../../STATUS.md)** - Development progress
- **[Technical Details](../3_technical-details.md)** - Keybinding system architecture

---

## Implementation Notes

### Custom vs Scheme Bindings

Custom bindings are merged with scheme bindings using spread operator:

```typescript
current: { ...scheme.bindings, ...state.customBindings }
```

This means custom bindings always override scheme bindings with the same ID.

### Platform Detection

Platform detection uses `navigator.platform` which is deprecated but still widely supported. Future versions should use `navigator.userAgentData.platform` (when available).

### Context Evaluation

The current context system is simplified. Production implementation should:
- Track editor mode state (normal, insert, visual)
- Track git availability dynamically
- Support complex conditions (e.g., `gitAvailable && editorFocused`)
- Provide context registration API for plugins

### Performance Considerations

- Keybinding lookup is O(1) using Record
- Event handler runs on every keydown (unavoidable)
- Context evaluation should be optimized for frequently-checked contexts
- Consider caching formatted keybindings for display

---

**Documentation Version**: 2.0.0
**Module Version**: 0.1.0
**Accuracy**: Verified against source code 2025-10-28
