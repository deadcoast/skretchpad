# Editor.svelte Architecture

## 2. `src/components/Editor.svelte`

Why:

- Central orchestration point for the entire application
- Manages editor lifecycle (mount/unmount/destroy)
- File I/O coordination with Tauri backend
- Syntax highlighting coordination with language loader
- Theme application and hot-reload handling
- Plugin hook execution (on_file_open, on_file_save, etc.)
- Keybinding system integration
- Diff view toggling
- State synchronization between Svelte stores and CodeMirror
- Performance optimization (debouncing, virtual scrolling)

Integration Points:

- CodeMirror 6 view management
- Tauri fs API
- Theme engine
- Plugin system
- Keybinding manager
- Multiple Svelte stores (editor, theme, ui, plugins)
- Status bar updates

---

```svelte
<!-- src/components/Editor.svelte -->
```

---

## Integration Dependencies Map

### Component Dependencies

```plaintext
Editor.svelte (THIS FILE)
├─> Svelte Framework
│   ├─> onMount (lifecycle)
│   ├─> onDestroy (lifecycle)
│   └─> tick (reactive updates)
│
├─> Tauri APIs
│   ├─> @tauri-apps/api/tauri → invoke()
│   └─> @tauri-apps/api/event → listen()
│
├─> CodeMirror 6
│   ├─> EditorView (codemirror)
│   └─> ViewUpdate (@codemirror/view)
│
├─> Local Modules
│   ├─> src/lib/editor-loader.ts
│   │   ├─> createEditor()
│   │   ├─> destroyEditor()
│   │   ├─> setLanguage()
│   │   └─> updateTheme()
│   │
│   ├─> src/lib/utils/debounce.ts
│   │   └─> debounce()
│   │
│   ├─> src/lib/stores/editor.ts
│   │   ├─> editorStore
│   │   └─> EditorState (type)
│   │
│   ├─> src/lib/stores/theme.ts
│   │   ├─> themeStore
│   │   └─> Theme (type)
│   │
│   ├─> src/lib/stores/ui.ts
│   │   └─> uiStore
│   │
│   ├─> src/lib/stores/plugins.ts
│   │   └─> pluginStore
│   │
│   ├─> src/lib/stores/keybindings.ts
│   │   └─> keybindingStore
│   │
│   └─> src/lib/plugin-api.ts
│       └─> PluginHookEvent (type)
│
└─> Backend Tauri Commands (invoke calls)
    ├─> read_file
    ├─> write_file
    ├─> get_file_metadata
    ├─> get_original_content
    ├─> plugin_execute_hook
    ├─> show_open_dialog
    └─> create_new_file
```

## Required Files to Create (Priority Order)

### CRITICAL - Must exist before Editor.svelte works

```plaintext
1. src/lib/editor-loader.ts
   └─> Exports: createEditor(), destroyEditor(), setLanguage(), updateTheme()
   └─> Required by: Editor.svelte (line 7)

2. src/lib/stores/editor.ts
   └─> Exports: editorStore, EditorState type
   └─> Required by: Editor.svelte (line 8)

3. src/lib/stores/theme.ts
   └─> Exports: themeStore, Theme type
   └─> Required by: Editor.svelte (line 9)

4. src/lib/stores/ui.ts
   └─> Exports: uiStore
   └─> Required by: Editor.svelte (line 10)

5. src/lib/stores/plugins.ts
   └─> Exports: pluginStore
   └─> Required by: Editor.svelte (line 11)

6. src/lib/stores/keybindings.ts
   └─> Exports: keybindingStore
   └─> Required by: Editor.svelte (line 12)

7. src/lib/plugin-api.ts
   └─> Exports: PluginHookEvent type
   └─> Required by: Editor.svelte (line 13)

8. src/lib/utils/debounce.ts
   └─> Exports: debounce()
   └─> Required by: Editor.svelte (line 6)
```

### IMPORTANT - Backend integration

```plaintext
9. src-tauri/src/commands/file.rs
   └─> Commands: read_file, write_file, get_file_metadata
   └─> Required by: Editor.svelte invoke() calls

10. src-tauri/src/commands/plugin.rs
    └─> Commands: plugin_execute_hook
    └─> Required by: Plugin system integration
```

## File-Level Dependencies Diagram

```plaintext
┌──────────────────────────────────────────────────────────────┐
│                    EDITOR.SVELTE INTEGRATION                 │
└──────────────────────────────────────────────────────────────┘

┌─────────────────┐
│  Editor.svelte  │ (THIS FILE - 750 lines)
└────────┬────────┘
         │
         ├─────────────────────────────────────────────────────┐
         │                                                     │
         ▼                                                     ▼
┌──────────────────┐                                   ┌─────────────────┐
│ editor-loader.ts │  MUST CREATE                      │   Svelte Core   │
├──────────────────┤                                   ├─────────────────┤
│ • createEditor   │                                   │ • onMount       │
│ • destroyEditor  │                                   │ • onDestroy     │
│ • setLanguage    │                                   │ • tick          │
│ • updateTheme    │                                   └─────────────────┘
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  CodeMirror 6    │  External dependency (npm)
├──────────────────┤
│ • EditorView     │
│ • State          │
│ • Extensions     │
└──────────────────┘

         │
         ├──────────────────────┬─────────────────────┬───────────────┐
         │                      │                     │               │
         ▼                      ▼                     ▼               ▼
┌───────────────┐     ┌──────────────┐     ┌──────────────┐  ┌─────────────┐
│ editor.ts     │     │  theme.ts    │     │   ui.ts      │  │ plugins.ts  │
│ (store)       │     │  (store)     │     │  (store)     │  │ (store)     │
├───────────────┤     ├──────────────┤     ├──────────────┤  ├─────────────┤
│ • editorStore │     │ • themeStore │     │ • uiStore    │  │•pluginStore │
│ • EditorState │     │ • Theme type │     └──────────────┘  └─────────────┘
└───────────────┘     └──────────────┘
     ⚠️ CREATE           ⚠️ CREATE            ⚠️ CREATE         ⚠️ CREATE

         │
         ▼
┌──────────────────┐
│keybindings.ts    │ ⚠️ MUST CREATE
│(store)           │
├──────────────────┤
│•keybindingStore  │
└──────────────────┘

         │
         ▼
┌──────────────────┐
│ plugin-api.ts    │ ⚠️ MUST CREATE
├──────────────────┤
│•PluginHookEvent  │
└──────────────────┘

         │
         ▼
┌──────────────────────────────────────────────────────────────┐
│                    TAURI BACKEND COMMANDS                    │
├──────────────────────────────────────────────────────────────┤
│ src-tauri/src/commands/                                      │
│   ├─> file.rs                                                │
│   │   ├─> read_file(path: String) -> String                  │
│   │   ├─> write_file(path: String, content: String)          │
│   │   └─> get_file_metadata(path: String) -> Metadata        │
│   │                                                          │
│   ├─> plugin.rs                                              │
│   │   └─> plugin_execute_hook(                               │
│   │          pluginId: String,                               │
│   │          hookName: String,                               │
│   │          data: Value                                     │
│   │       )                                                  │
│   │                                                          │
│   └─> dialog.rs                                              │
│       ├─> show_open_dialog() -> Option<String>               │
│       └─> create_new_file() -> String                        │
└──────────────────────────────────────────────────────────────┘
          ⚠️ MUST CREATE ALL BACKEND COMMANDS
```

## Integration Checklist

### COMPLETED

- `src/components/Editor.svelte` (750 lines) - Main editor component

### MUST CREATE NEXT (in dependency order)

- Phase 1: Utilities

```plaintext
1. src/lib/utils/debounce.ts (20 lines)
   export function debounce<T extends (...args: any[]) => any>(
     fn: T,
     delay: number
   ): (...args: Parameters<T>) => void
```

- Phase 2: Type Definitions

```plaintext
2. src/lib/plugin-api.ts (100-200 lines)
   - PluginHookEvent interface
   - Plugin API type definitions
```

- Phase 3: Stores (can be created in parallel)

```plaintext
3. src/lib/stores/editor.ts (100-150 lines)
   - editorStore (writable store)
   - EditorState interface

4. src/lib/stores/theme.ts (150-200 lines)
   - themeStore (writable store)
   - Theme interface
   - Theme loading/switching logic

5. src/lib/stores/ui.ts (80-100 lines)
   - uiStore (writable store)
   - UI state (chrome visibility, etc.)

6. src/lib/stores/plugins.ts (100-150 lines)
   - pluginStore (writable store)
   - Active plugins tracking

7. src/lib/stores/keybindings.ts (100-150 lines)
   - keybindingStore (writable store)
   - Keybinding definitions
```

- Phase 4: Editor Loader (complex, needs CodeMirror setup)

```plaintext
8. src/lib/editor-loader.ts (500-700 lines) ⭐ MOST COMPLEX
   - createEditor()
   - destroyEditor()
   - setLanguage()
   - updateTheme()
   - Extension management
   - Language loading
```

- Phase 5: Backend Commands

```plaintext
9. src-tauri/src/commands/mod.rs
   pub mod file;
   pub mod plugin;
   pub mod dialog;

10. src-tauri/src/commands/file.rs (200-300 lines)
    - read_file command
    - write_file command
    - get_file_metadata command

11. src-tauri/src/commands/plugin.rs (100-150 lines)
    - plugin_execute_hook command

12. src-tauri/src/commands/dialog.rs (100-150 lines)
    - show_open_dialog command
    - create_new_file command

13. src-tauri/src/main.rs (modifications)
    - Register all commands
    - Initialize state
```

## Dependency Flow Summary

```plaintext
Editor.svelte (750 LOC)
├── REQUIRES: 8 frontend files (1,500-2,000 LOC total)
├── REQUIRES: 4 backend files (500-700 LOC total)
└── DEPENDS ON: CodeMirror 6 (external npm package)

Total Additional Code Required: ~2,000-2,700 LOC
Complexity: ⭐⭐⭐⭐⭐
Integration Points: 12 files across frontend + backend
```

## Critical Path (What to Build First)

```plaintext
1. debounce.ts        (20 lines) ────┐
2. plugin-api.ts      (150 lines)    │
3. All stores         (650 lines)    ├─> Enable Editor.svelte compilation
4. editor-loader.ts   (650 lines) ───┘
                                      │
                                      ▼
5. Backend commands   (700 lines) ───> Enable full Editor.svelte functionality
```

Recommendation: Start with stores (they're simpler) to unblock Editor compilation, then tackle `editor-loader.ts` (the most complex piece), finally integrate backend commands for full functionality.
