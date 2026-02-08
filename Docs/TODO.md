# TODO - Skretchpad Development Tasks

> Last updated: v0.0.6 (2026-02-07)

## Completed

## Remaining Work

### HIGH Priority

- [ ] **Editor ops (sync return)**: `getEditorContent` and `getActiveFile` fire events but can't return data synchronously (needs async op support or channel-based pattern)
- [ ] **Async plugin hooks**: Plugin hooks must be synchronous; `async/await` in hooks requires event loop pumping which is not yet implemented
- [ ] **~29 frontend plugin-api.ts invoke calls** have no backend handler (legacy bridge, superseded by deno_core ops for sandbox plugins)

### MEDIUM Priority

### LOW Priority

- [ ] Add automated test suite (Vitest + Svelte Testing Library)
- [ ] Add more themes (cyberpunk, nord, solarized)
- [ ] Add more language definitions (Go, Java, C/C++, PHP)
- [ ] Plugin hot-reload support
- [ ] Multi-tab / split editor support
- [ ] Minimap component
- [ ] Breadcrumb navigation

## Plan to implement

Skretchpad v0.1.0 -- Comprehensive Revision Plan

### Context

An honest audit of the codebase reveals that while the core architecture (Tauri + Svelte + CodeMirror + deno_core
plugin sandbox) is sound, the application is roughly 60% complete by professional standards.

Critical gaps include:  
emoji characters used as UI icons, window control buttons with zero functionality, settings that don't persist,
orphaned Rust modules, dead code, a broken Chrome toggle, and numerous stub implementations in the plugin API. This  
plan addresses every gap to bring skretchpad to a genuinely complete, polished v0.1.0 release that adheres to the
Minimal Retro Futurism design language.

---
 Phase 1: Icon System Overhaul (CRITICAL)

 Problem: Every icon in the app is a raw Unicode emoji or HTML entity. No professional application does this. Emojis  
 render inconsistently across platforms and look amateurish.

 Current emoji locations:
- Chrome.svelte:32 -- 📌 (pin button)
- Chrome.svelte:39 -- 👁 (eye/chrome toggle button)
- Chrome.svelte:18-20 -- −, □, × (window controls, HTML entities)
- StatusBar.svelte:42 -- 📄 (file icon)
- StatusBar.svelte:105 -- 🔌 (plugin icon)
- PluginPermissionDialog.svelte:33 -- &#x1F6E1; (shield icon)
- NotificationToast.svelte:18-25 -- &#10003;, &#10007;, &#9888;, &#8505; (status icons)
- SettingsPanel.svelte:84 -- &times; (close button)
- SideBar.svelte:68 -- × (close button)
- DiffView.svelte:42 -- &times; (close button)

Solution: Create an inline SVG icon system. No external dependency needed -- define SVG icon components directly.

### Files to create

- src/lib/icons/index.ts -- Export all icon SVG strings as named constants
  - Icons needed (minimum 16): pin, eye, eyeOff, minimize, maximize, restore, close, file, plugin, shield,
 checkmark, xmark, warning, info, settings, chevronDown
  - Each icon: 16x16 viewBox, 1.5px stroke, currentColor for theming
  - Design language: geometric, minimal, clean lines (retro-futurist aesthetic -- think Dieter Rams meets sci-fi
 HUD)

### Files to modify

- Chrome.svelte -- Replace 📌, 👁, −, □, × with SVG icons
- StatusBar.svelte -- Replace 📄, 🔌 with SVG icons
- PluginPermissionDialog.svelte -- Replace shield emoji with SVG icon
- NotificationToast.svelte -- Replace HTML entity icons with SVG icons
- SettingsPanel.svelte -- Replace &times; with SVG close icon
- SideBar.svelte -- Replace × with SVG close icon
- DiffView.svelte -- Replace &times; with SVG close icon

---
 Phase 2: Window Controls (CRITICAL)

 Problem: The three window control buttons (minimize, maximize, close) in Chrome.svelte:18-20 are purely decorative.  
 They have styled colored circles but zero event handlers and zero Tauri API calls. They do absolutely nothing when
 clicked.

 Files to modify:

- Chrome.svelte:
  - Add on:click handlers to all three control buttons
  - Import getCurrentWindow from @tauri-apps/api/window
  - Minimize button: getCurrentWindow().minimize()
  - Maximize button: getCurrentWindow().toggleMaximize() (toggle between maximize/restore)
  - Close button: getCurrentWindow().close()
  - Track maximized state via getCurrentWindow().isMaximized() to swap maximize/restore icon
  - Add data-tauri-drag-region to .title-bar for native window dragging
  - Add props: accept onMinimize, onMaximize, onClose from parent or call directly
- App.svelte:
  - Add listener for window maximize/unmaximize state changes to update icon
  - Consider: track isMaximized state to pass to Chrome component

---
 Phase 3: Chrome Toggle Bug Fix (CRITICAL)

 Problem: In App.svelte:194, the entire Chrome component is wrapped in {#if chromeVisible}. When the eye button hides
  Chrome, the toggle button disappears too -- there's no way to bring it back except reloading the app.

 Files to modify:

- App.svelte:
  - Remove {#if chromeVisible} wrapper around Chrome component
  - Instead, pass chromeVisible as a prop to Chrome and let Chrome handle its own visibility with CSS (e.g.,
 transform: translateY(-100%) or height: 0; overflow: hidden)
  - OR: Add a keyboard shortcut to toggle chrome (Ctrl+Shift+H is already documented in Chrome.svelte:37 as the
 shortcut but is NOT wired in handleKeydown)
  - Best approach: Do BOTH. Chrome animates away via CSS transition, AND Ctrl+Shift+H keyboard shortcut is
 registered in handleKeydown
- Chrome.svelte:
  - Add export let visible = true; prop
  - Apply CSS class chrome--hidden when !visible to slide/animate away
  - Keep the eye button always accessible (or provide alternative re-show mechanism)

---

## Phase 4: Settings Persistence (HIGH)

 Problem: All settings in SettingsPanel.svelte are local let variables. Every time the app restarts, all settings
 reset to defaults. The toggle switches for word wrap, line numbers, minimap, and auto-save don't actually modify the
  CodeMirror editor instance -- they just set local variables.

### Files to create

- src/lib/stores/settings.ts -- Persistent settings store
  - Store settings as JSON in the Tauri app data directory via read_file/write_file commands
  - Default values for all settings
  - load() on app startup, save() on any change (debounced)
  - Settings schema: { appearance: { theme, fontSize, fontFamily }, editor: { tabSize, wordWrap, lineNumbers,
 minimap }, files: { autoSave, autoSaveDelay }, keybindings: { scheme } }

### Files to modify

- SettingsPanel.svelte:
  - Replace local let variables with store subscriptions
  - Wire toggle changes to actually reconfigure the CodeMirror editor via editorStore
  - Word wrap: reconfigure via CodeMirror EditorView.lineWrapping extension
  - Line numbers: toggle the lineNumbers() extension
  - Tab size: reconfigure indentUnit and tabSize facets
- App.svelte:
  - Import settings store
  - Load settings on mount
  - Pass relevant settings to Editor component
- src/components/Editor.svelte:
  - Accept settings props or subscribe to settings store
  - Apply settings to CodeMirror compartments on change
  - Use compartment pattern already established in editor-loader.ts
- src-tauri/src/main.rs:
  - Add get_app_data_dir command to expose the app data path
  - OR use existing read_file/write_file with a known path

---

## Phase 5: Orphaned Rust Modules (HIGH)

 Problem: Three Rust source files exist but are NOT declared in main.rs via mod. They're invisible to the compiler:
- src-tauri/src/theme_engine.rs -- 137 lines, has working load_theme/apply_theme commands
- src-tauri/src/window_manager.rs -- 41 lines, has toggle_always_on_top/set_chrome_visibility commands
- src-tauri/src/language_loader.rs -- 26 lines, NON-COMPILING stub (missing types)

### Decision

 theme_engine.rs: INTEGRATE. It has real TOML parsing logic and CSS variable generation that the frontend theme
 system could use. Currently the frontend theme.ts store loads themes from hardcoded JS objects -- this should be
 backed by the Rust theme engine reading actual .toml files.

 window_manager.rs: DELETE. Its functionality (toggle_always_on_top, set_chrome_visibility) is already handled inline
  in App.svelte (line 180-188 for always-on-top) and the chrome toggle. Duplicating it in Rust adds no value since
 Tauri window APIs are called from the frontend.

 language_loader.rs: DELETE along with languages/*.lang.json files. The entire languages/ directory is dead code --
 an abandoned custom language definition system that was superseded by CodeMirror 6's built-in language packages (12  
 languages already integrated via editor-loader.ts).

### Files to modify

- src-tauri/src/main.rs: Add mod theme_engine; and register its commands
- src-tauri/src/theme_engine.rs: Review and fix any compilation issues, ensure it works with the TOML theme files

### Files to delete

- src-tauri/src/window_manager.rs
- src-tauri/src/language_loader.rs
- languages/python.lang.json
- languages/rust.lang.json
- languages/markdown.lang.json

---

## Phase 6: TOML Theme Bug Fix (HIGH)

- Problem: themes/glass-dark.toml lines 15-16 have a TOML conflict -- background is defined as both a plain string and a dotted table key:
```toml
 [chrome]
 background = "rgba(28, 28, 28, 0.95)"
 background.blur = 10
```
> This is invalid TOML. background can't be both a string and a table.

### Files to modify

- themes/glass-dark.toml: Restructure to use consistent dotted key notation:
```toml
 [chrome]
 background.color = "rgba(28, 28, 28, 0.95)"
 background.blur = 10
```

- src-tauri/src/theme_engine.rs: Update parsing to match the corrected schema
- Frontend theme.ts: Update to match if it reads these values

---

## Phase 7: Dead Code Cleanup (MEDIUM)

### Files to delete

- plugins/git/main.ts -- Superseded by plugins/git/main.js (deno_core requires JS, not TS)
- plugins/git-status/main.ts -- Superseded by plugins/git-status/main.js
- plugins/git/components/StatusPanel.svelte -- References non-existent ../types module, never rendered
- plugins/git/types.ts -- If it exists, dead import target

### Files to modify

- src-tauri/src/plugin_system/api.rs:5: Remove unused CommandCapability import (rustc warning)
- src/lib/plugin-api.ts: This file has ~29 invoke() calls to backend commands that don't exist (workspace_get_configuration, workspace_update_configuration, workspace_get_files, workspace_find_files, plugin_create_directory, plugin_delete_path, plugin_copy_path, plugin_move_path, plugin_register_command, plugin_execute_command_by_id, plugin_get_commands, plugin_show_confirm, plugin_show_input_box, plugin_show_quick_pick, plugin_update_panel, plugin_report_progress, plugin_replace_selection, plugin_set_cursor_position, plugin_insert_text, plugin_open_file, plugin_close_file, plugin_save_file, plugin_save_all_files, plugin_open_diff_view, plugin_reload_all_files, plugin_apply_edits, plugin_download, plugin_update_status_bar_item, get_plugin_metadata).
  - Mark these as TODO with a clear comment explaining they are planned future API surface
  - OR implement a subset that's actually used (the sandbox ops cover the real plugin runtime; this file is the
 frontend-side plugin context for hypothetical non-sandboxed plugins)
  - The loadPlugin function at line 1168 imports from /plugins/${pluginId}/main.ts which doesn't work
  - Best approach: Add clear JSDoc marking this as a "Plugin API contract definition + future frontend bridge" with  
 @deprecated on unimplemented methods that throw

---

## Phase 8: Accessibility (MEDIUM)

 Problem: Zero ARIA labels on interactive elements. No keyboard navigation for window controls. No focus management
 in dialogs. Screen readers would find the app unusable.

### Files to modify

- Chrome.svelte: Add aria-label to all buttons ("Minimize window", "Maximize window", "Close window", "Toggle pin to
  top", "Toggle title bar")
- StatusBar.svelte: Add aria-label to plugin indicator button, role="status" on status bar
- SettingsPanel.svelte: Fix a11y warnings (lines 78-81 have svelte-ignore comments suppressing click-without-keydown
  warnings). Add proper on:keydown handlers. Add role="dialog" and aria-labelledby
- CommandPalette.svelte: Add role="listbox" to results, role="option" to items, aria-selected to selected item,
 aria-activedescendant on input
- NotificationToast.svelte: Add role="alert" and aria-live="polite" to notification container
- PluginPermissionDialog.svelte: Add aria-labelledby and aria-describedby, focus trap
- DiffView.svelte: Add aria-label to close button

---

## Phase 9: Frontend Component Polish (MEDIUM)

### SideBar (src/components/SideBar.svelte)

- Problem: Skeleton component. Shows placeholder text ("Panel: {panel.id}", "Plugin: {panel.plugin_id}") instead of
 actual content. Never rendered in App.svelte.

#### Action

- Wire into App.svelte layout (add to .editor-container as a flex sibling)
- Add toggle command in command palette (view.toggleSidebar)
- Add keyboard shortcut (Ctrl+B, standard)
- For now, display plugin panels with their raw HTML content (which plugins emit via plugin_show_panel)

### DiffView (src/features/diff/DiffView.svelte)

#### Problem: Component exists and is well-implemented, but there's no way to invoke it from the UI. No menu item, no
 command, no keyboard shortcut.

#### Action
- Add view.openDiffView command to command palette
- When invoked with no args, show a file picker to select two files
- Wire through App.svelte to conditionally render DiffView overlay

### NotificationToast

- Status: Actually well-implemented. Uses Svelte transitions, supports actions, auto-dismiss. The only issue is the HTML entity icons (covered in Phase 1).

### CommandPalette

- Status: Well-implemented. Proper keyboard navigation, filtering, category grouping. No changes needed beyond
 accessibility (Phase 8).

### PluginPermissionDialog

- Status: Well-implemented. Risk badges, capability display, approve/deny flow. Only needs icon fix (Phase 1) and
 accessibility (Phase 8).

---

## Phase 10: Editor Integration Gaps (MEDIUM)

### Settings <-> Editor wiring

- Problem: SettingsPanel toggles don't actually change the editor behavior. Flipping "Word Wrap" or "Line Numbers" has
  no effect on CodeMirror.

#### Action (partially covered in Phase 4)

- src/lib/editor-loader.ts: Expose compartment reconfiguration functions:
  - setWordWrap(enabled: boolean)
  - setLineNumbers(enabled: boolean)
  - setTabSize(size: number)
  - setFontSize(size: number)
- src/components/Editor.svelte: Subscribe to settings store and call reconfiguration functions

### Auto-save

- Problem: Auto-save toggle exists in settings but nothing implements the timer-based save logic.

#### Action

- In Editor.svelte or editor store: implement debounced auto-save using setTimeout
- On doc change, start/reset the auto-save timer
- On save, clear the timer
- Respect the autoSaveDelay setting

 ---

## Phase 11: Backend Hardening (LOW)

### Unused import cleanup

- api.rs:5: Remove CommandCapability from import

### Memory leak: Box::leak in worker.rs

- The Box::leak() call for hook name caching allocates static strings that are never freed
- Low priority since plugin workers are long-lived, but should use a proper cache (e.g., LazyLock<HashMap<String,
 &'static str>>)

### XSS in plugin panel HTML

- api.rs emits raw HTML content from plugins to the frontend via panel events without sanitization
- The frontend should sanitize or sandbox plugin HTML before rendering (iframe sandbox or DOMPurify)
- LOW priority since plugins are already capability-gated

---

## Phase 12: Linting Error Cleanup (LOW)

- Delete Docs/linting-errors.json after fixes are applied (it's a snapshot, not a living doc)
- Update Docs/user-notes.md to mark resolved items
- Delete old .ts plugin files that generate the TypeScript errors

---

## Implementation Order

┌───────┬──────────┬──────────┬────────────┬─────────────────────────────────────────────────┐
│ Order │ Phase    │ Priority │ Est. Files │                   Description                   │
├───────┼──────────┼──────────┼────────────┼─────────────────────────────────────────────────┤
│  1    │ Phase 1  │ CRITICAL │  8         │ SVG icon system -- replace all emoji/entities   │
├───────┼──────────┼──────────┼────────────┼─────────────────────────────────────────────────┤
│  2    │ Phase 2  │ CRITICAL │  2         │ Window controls -- wire minimize/maximize/close │
├───────┼──────────┼──────────┼────────────┼─────────────────────────────────────────────────┤
│  3    │ Phase 3  │ CRITICAL │  2         │ Chrome toggle -- fix disappearing buttons       │
├───────┼──────────┼──────────┼────────────┼─────────────────────────────────────────────────┤
│  4    │ Phase 6  │ HIGH     │  2         │ TOML theme conflict fix                         │
├───────┼──────────┼──────────┼────────────┼─────────────────────────────────────────────────┤
│  5    │ Phase 5  │ HIGH     │  4+        │ Orphaned modules -- integrate/delete            │
├───────┼──────────┼──────────┼────────────┼─────────────────────────────────────────────────┤
│  6    │ Phase 7  │ MEDIUM   │  5+        │ Dead code cleanup                               │
├───────┼──────────┼──────────┼────────────┼─────────────────────────────────────────────────┤
│  7    │ Phase 4  │ HIGH     │  4         │ Settings persistence store                      │
├───────┼──────────┼──────────┼────────────┼─────────────────────────────────────────────────┤
│  8    │ Phase 10 │ MEDIUM   │  3         │ Editor settings wiring + auto-save              │
├───────┼──────────┼──────────┼────────────┼─────────────────────────────────────────────────┤
│  9    │ Phase 8  │ MEDIUM   │  7         │ Accessibility pass                              │
├───────┼──────────┼──────────┼────────────┼─────────────────────────────────────────────────┤
│  10   │ Phase 9  │ MEDIUM   │  3         │ SideBar integration + DiffView access           │
├───────┼──────────┼──────────┼────────────┼─────────────────────────────────────────────────┤
│  11   │ Phase 11 │ LOW      │  2         │ Backend hardening                               │
├───────┼──────────┼──────────┼────────────┼─────────────────────────────────────────────────┤
│  12   │ Phase 12 │ LOW      │  3         │ Linting/docs cleanup                            │
└───────┴──────────┴──────────┴────────────┴─────────────────────────────────────────────────┘

### Verification

After all phases:

1. cargo check from src-tauri/ -- 0 errors, 0 warnings
2. cargo test -- all 40+ tests pass
3. npm run build -- clean build, 100+ modules
4. Manual verification:
- Window controls minimize/maximize/close the window
- Chrome toggle hides/shows with animation, reversible via keyboard shortcut
- All icons are crisp SVGs, no emoji anywhere
- Settings persist across app restart
- Settings toggles actually change editor behavior
- Theme loads from corrected TOML without errors
- No orphaned Rust modules, no dead code
- All buttons have ARIA labels
- Sidebar can be toggled and shows plugin panels
- DiffView accessible from command palette

### Design Principles (Reference)

All visual changes must adhere to:

- MINIMAL RETRO FUTURISM: Retro analog sci-fi meets modern minimalism
- Clean geometric shapes, no decorative excess
- Consistent 1.5px stroke weight on icons
- Color palette: #00d9ff (primary/accent), #e4e4e4 (text), dark glass backgrounds
- Glass morphism: backdrop-filter: blur(), semi-transparent backgrounds
- Smooth transitions: 100-200ms ease-out
- Monospace secondary font for technical UI elements

## Success Criteria

---
