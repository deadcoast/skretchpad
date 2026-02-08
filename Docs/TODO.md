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

## TODO 0.0.1 - Plan to implement

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

## TODO 0.0.2 - Plan to implement                                                                                                    │

Skretchpad -- Testing Suite & CI/CD Pipeline

>Context

Skretchpad is at a stable, working state with 48 Rust tests but zero frontend tests, no CI/CD, no pre-commit hooks, and no coverage tooling. The user wants to establish a professional testing baseline at 90% coverage before continuing feature development, integrated into GitHub commits and workflows. This plan builds a complete quality assurance pipeline from scratch.

Current state: 48 Rust tests across 6 of 12 modules. Security-critical modules (ops.rs, worker.rs, sandbox.rs) have 0 tests. No frontend test framework installed.

---

## Phase 1: Frontend Test Infrastructure

1A. Install dependencies

```ps1
npm install -D vitest @testing-library/svelte @testing-library/jest-dom jsdom @vitest/coverage-v8 husky lint-staged  
```

1B. Create vitest.config.ts (project root)

 Separate config from vite.config.ts. Key features:
- jsdom environment
- $lib path alias matching vite.config.ts
- Global test setup file
- Tauri API module aliases pointing to mock files
- V8 coverage provider with 90% line/function/statement thresholds, 85% branch threshold
- Coverage includes src/lib/**/*.ts and src/lib/**/*.svelte, excludes src/lib/icons/** (SVG exports, not logic)

1C. Create test setup and mock files

src/test/setup.ts -- Global setup:
- Import @testing-library/jest-dom/vitest for DOM matchers
- Mock window.matchMedia, requestAnimationFrame, cancelAnimationFrame
- Mock navigator.clipboard (writeText, readText)
- Set navigator.platform to 'Win32'

src/test/mocks/tauri-core.ts -- Mock @tauri-apps/api/core:
- invoke as vi.fn with handler registry
- Helper: mockInvokeHandler(cmd, handler) for per-test command mocking
- Helper: clearInvokeHandlers() for cleanup

src/test/mocks/tauri-event.ts -- Mock @tauri-apps/api/event:
- listen, emit, once as vi.fn with in-memory listener map
- Helper: emitTestEvent(event, payload) to simulate backend events
- Helper: clearListeners() for cleanup

src/test/mocks/tauri-dialog.ts -- Mock @tauri-apps/plugin-dialog:
- save, open, ask, confirm, message as vi.fn returning defaults

src/test/mocks/tauri-path.ts -- Mock @tauri-apps/api/path

src/test/mocks/tauri-fs.ts -- Mock @tauri-apps/plugin-fs

1D. Add npm scripts to package.json
```json
 "test": "vitest run",
 "test:watch": "vitest",
 "test:coverage": "vitest run --coverage",
 "test:rust": "cd src-tauri && cargo test",
 "test:all": "npm run test:coverage && npm run test:rust",
 "prepare": "husky"
```

---

## Phase 2: Frontend Tests -- Pure Functions (highest ROI)

2A. src/lib/utils/debounce.test.ts (~15 tests)

All 7 exported functions tested with vi.useFakeTimers():

- debounce: calls after wait, not before, deduplicates rapid calls, uses latest args
- debounceImmediate: immediate=true fires first call, suppresses during wait
- throttle: fires immediately, blocks during wait, fires trailing call
- debounceAsync: returns promise, debounces async calls
- debounceLeading: fires on leading edge, suppresses during wait
- debounceWithCancel: cancel() prevents execution, flush() fires immediately
- debounceWithMaxWait: guarantees execution within maxWait even under continuous debouncing

2B. src/lib/utils/ui.test.ts (~30 tests)

Color utilities (pure math, no DOM):

- hexToRgb: valid hex, hex without hash, invalid hex, short hex (null)
- rgbToHex: standard values, single digit padding
- parseColor: hex input, rgb input, rgba input, invalid input
- getLuminance: black (~0), white (~1)
- isDark: black (true), white (false)
- getContrastRatio: black vs white (~21)
- lighten, darken, withAlpha: verify output format and values

Format utilities (pure string manipulation):

- formatFileSize: 0 B, 1024 -> 1 KB, 1.5 MB
- formatDuration: seconds only, minutes+seconds, hours
- formatRelativeTime: seconds ago, minutes ago, hours ago, just now
- truncate: short (unchanged), long (ellipsis)
- truncatePath: short path, long path with first/.../filename

Keyboard utilities:

- getModifierKey: returns 'Ctrl' on Win32
- formatShortcut: replaces Ctrl/Alt/Shift for platform

Platform detection:

- isWindows, isMac, isLinux, getPlatform with mocked navigator.platform

Easing functions (pure math):

- easeInOutCubic: t=0 returns 0, t=1 returns 1, t=0.5 returns 0.5
- easeOutExpo: t=1 returns 1
- easeInOutExpo: t=0 returns 0, t=1 returns 1

Async utilities:

- sleep: resolves after ms (fake timers)
- withTimeout: resolves before timeout, rejects on timeout
- retry: succeeds on first try, retries on failure, gives up after maxAttempts

---

## Phase 3: Frontend Tests -- Svelte Stores

3A. src/lib/stores/notifications.test.ts (~12 tests)

- Store starts empty
- add() creates notification with defaults (type='info', duration=4000)
- add() returns unique IDs
- Custom type and duration options work
- Duration=0 creates persistent notification (no auto-dismiss)
- Adding >5 notifications trims to most recent 5
- dismiss(id) removes specific notification
- dismiss() with non-existent ID is no-op
- clear() removes all
- info(), success(), warning(), error() set correct types
- Auto-dismiss fires after duration (vi.useFakeTimers)
- notificationCount derived store tracks length

3B. src/lib/stores/plugins.test.ts (~8 tests)

> Tests with mocked invoke:

- Starts with empty state
- registerCommand / unregisterCommand lifecycle
- registerPanel / showPanel / hidePanel lifecycle
- registerStatusBarItem / sort by priority
- Permission approval flow

3C. src/lib/stores/settings.test.ts (~6 tests)
- Default settings values
- Update individual settings
- Nested settings merge correctly
- Reset to defaults

3D. src/lib/stores/keybindings.test.ts (~8 tests)
- Default scheme loaded
- Scheme switching
- Custom binding add/remove
- Key parsing and formatting

3E. src/lib/stores/theme.test.ts (~6 tests)
- Default theme loaded
- Theme switching updates current theme
- CSS variable application

---

## Phase 4: Rust Test Expansion -- Security Critical

4A. src-tauri/src/plugin_system/ops.rs -- Extract + test sanitization (NEW: ~15 tests)

> Refactor: Extract inline sanitization into a testable function:

```rust
 pub(crate) fn sanitize_args(args: &[String]) -> Vec<String> {
     args.iter()
         .map(|arg| arg.replace(&['|', '&', ';', '>', '<', '`', '$', '\n', '\r'][..], ""))
         .collect()
 }
```

> Sanitization tests (9):

- Strips |, ;, &, >, <, `, $, \n, \r individually
- Preserves clean arguments unchanged
- Combined injection: "git; rm -rf /" -> "git rm -rf /"

Capability validation tests via filesystem (6, using tempfile):
- Read file allowed within workspace (WorkspaceRead capability)
- Read file denied outside workspace
- Write file denied with read-only capability
- Path traversal ../../etc/passwd blocked after canonicalization
- List files denied outside workspace
- Write file allowed with ReadWrite within workspace

4B. src-tauri/src/plugin_system/api.rs -- Expand from 3 to ~25 tests

 validate_fs_read (5 new): None denies all, Scoped allows in-scope, Scoped denies out-of-scope, WorkspaceRead allows  
 in workspace, denies outside
 validate_fs_write (5 new): None denies, WorkspaceRead denies writes, ReadWrite allows in workspace, denies outside,  
 Scoped works
 validate_network (4 new): None denies, Unrestricted allows, invalid URL errors, URL without host errors
 validate_ui (5 new): status_bar, sidebar, notifications, webview capability checks, unknown operation
 AuditLogger (4 new): creation, log+retrieve, rotation at max_events, filter by plugin, clear
 FileWatcherRegistry (2 new): register increases count, unregister decreases count

4C. src-tauri/src/plugin_system/sandbox.rs -- NEW: ~6 tests

- PluginError Display implementations for all variants
- ResourceLimits default values (50MB, 5s, 100 ops)
- ResourceStats construction and field access
- SandboxConfig builder pattern

4D. src-tauri/src/plugin_system/worker.rs -- NEW: ~4 tests

- WorkerResponse::Success serialization
- WorkerResponse::Error serialization
- Hook name caching returns static reference
- Different hook names produce different statics

4E. src-tauri/src/plugin_system/capabilities.rs -- Expand from 9 to ~18 tests

- FilesystemCapability::None denies both read and write
- NetworkCapability::None denies all domains
- Unrestricted allows any domain
- add_domain on None creates DomainAllowlist
- disallow_command removes from allowlist
- UiCapability::all() has all fields true
- Capabilities merge (Scoped union, DomainAllowlist union)
- is_subset checks
- None is subset of everything

4F. src-tauri/src/plugin_system/manager.rs -- Expand from 2 to ~6 tests

- PluginState serialization (all variants)
- ManagerError Display implementations
- Event listener register/unregister

---

Phase 5: Integration Tests

5A. src-tauri/tests/integration_ops.rs

> Cross-module integration tests using tempfile:

- Full filesystem op flow: create workspace -> set capability -> read/write/list
- Path traversal prevention end-to-end
- Capability denial end-to-end

5B. Svelte Component Tests (~3 components)

src/components/NotificationToast.test.ts (~4 tests):
- Renders notification message text
- Correct CSS class for each type
- Dismiss button works
- Action button calls callback

src/components/StatusBar.test.ts (~3 tests):
- Renders file name
- Shows line/column position
- Shows language indicator

src/components/CommandPalette.test.ts (~4 tests):
- Renders when visible
- Filters commands by input
- Arrow keys move selection
- Enter executes, Escape closes

---

## Phase 6: CI/CD Pipeline

6A. Create .github/workflows/ci.yml

Jobs (5 total, with dependencies):

1. lint-frontend (ubuntu-latest):
- checkout, setup-node 20, npm ci
- npm run lint (ESLint)
- npx prettier --check "src/**/*.{ts,svelte,css}"
- npm run check (svelte-check)

1. lint-rust (ubuntu-latest):
- checkout, dtolnay/rust-toolchain@stable (rustfmt, clippy)
- Swatinem/rust-cache@v2 (workspaces: src-tauri)
- Install Linux system deps (libwebkit2gtk-4.1-dev, libgtk-3-dev, etc.)
- cargo fmt --all -- --check
- cargo clippy --all-targets --all-features -- -D warnings

1. test-frontend (matrix: ubuntu-latest, windows-latest), needs lint-frontend:
- checkout, setup-node 20, npm ci
- npm run test:coverage
- Upload coverage artifact (ubuntu only)

1. test-rust (matrix: ubuntu-latest, windows-latest), needs lint-rust:
- checkout, rust-toolchain (llvm-tools-preview), rust-cache
- Install system deps (Linux only)
- taiki-e/install-action@cargo-llvm-cov
- cargo llvm-cov --lcov --output-path ../coverage/rust-lcov.info
- Upload coverage artifact (ubuntu only)

1. build-check (matrix: ubuntu-latest, windows-latest), needs test-*:
- Full build verification: npm run build + cargo check

> Key choices:
- cargo-llvm-cov over cargo-tarpaulin because tarpaulin doesn't support Windows
- taiki-e/install-action for pre-built binary install (no compile time)
- Swatinem/rust-cache@v2 saves 3-5 minutes per Rust build
- Coverage uploaded from Ubuntu only to avoid duplicate reports
- Matrix strategy ensures cross-platform compatibility

6B. Pre-commit hooks via Husky

> .husky/pre-commit:
```ps1
 npx lint-staged
 cd src-tauri && cargo fmt --all -- --check
```

```json
 package.json lint-staged config:
 "lint-staged": {
   "src/**/*.{ts,svelte}": ["eslint --fix", "prettier --write"],
   "src/**/*.css": ["prettier --write"]
 }
```

Tests are NOT in pre-commit (too slow). They run in CI.

---

## Phase 7: Test File Organization

Convention: Colocated .test.ts files next to the code they test.
```txt
 src/
   test/
     setup.ts
     mocks/
       tauri-core.ts
       tauri-event.ts
       tauri-dialog.ts
       tauri-path.ts
       tauri-fs.ts
   lib/
     utils/
       debounce.test.ts          # ~15 tests
       ui.test.ts                # ~30 tests
     stores/
       notifications.test.ts    # ~12 tests
       plugins.test.ts          # ~8 tests
       settings.test.ts         # ~6 tests
       theme.test.ts            # ~6 tests
       keybindings.test.ts      # ~8 tests
   components/
     NotificationToast.test.ts  # ~4 tests
     StatusBar.test.ts          # ~3 tests
     CommandPalette.test.ts     # ~4 tests

 src-tauri/
   src/plugin_system/
     ops.rs          # +15 tests (currently 0)
     sandbox.rs      # +6 tests (currently 0)
     worker.rs       # +4 tests (currently 0)
     api.rs          # +22 tests (currently 3)
     capabilities.rs # +9 tests (currently 9)
     manager.rs      # +4 tests (currently 2)
   tests/
     integration_ops.rs  # ~6 tests
```

---

> Implementation Order

```txt
 ┌──────┬──────────────────────────────────────┬───────────┬──────────────────────────────────────────────────┐
 │ Step │                 What                 │ New Tests │              Files Created/Modified              │
 ├──────┼──────────────────────────────────────┼───────────┼──────────────────────────────────────────────────┤
 │ 1    │ Install npm packages                 │ 0         │ package.json                                     │
 ├──────┼──────────────────────────────────────┼───────────┼──────────────────────────────────────────────────┤
 │ 2    │ Create vitest.config.ts              │ 0         │ vitest.config.ts                                 │
 ├──────┼──────────────────────────────────────┼───────────┼──────────────────────────────────────────────────┤
 │ 3    │ Create test setup + Tauri mocks      │ 0         │ src/test/setup.ts, src/test/mocks/*.ts (5 files) │
 ├──────┼──────────────────────────────────────┼───────────┼──────────────────────────────────────────────────┤
 │ 4    │ Add npm scripts                      │ 0         │ package.json                                     │
 ├──────┼──────────────────────────────────────┼───────────┼──────────────────────────────────────────────────┤
 │ 5    │ Write debounce.test.ts               │ ~15       │ src/lib/utils/debounce.test.ts                   │
 ├──────┼──────────────────────────────────────┼───────────┼──────────────────────────────────────────────────┤
 │ 6    │ Write ui.test.ts                     │ ~30       │ src/lib/utils/ui.test.ts                         │
 ├──────┼──────────────────────────────────────┼───────────┼──────────────────────────────────────────────────┤
 │ 7    │ Write notifications.test.ts          │ ~12       │ src/lib/stores/notifications.test.ts             │
 ├──────┼──────────────────────────────────────┼───────────┼──────────────────────────────────────────────────┤
 │ 8    │ Write remaining store tests          │ ~28       │ 4 test files                                     │
 ├──────┼──────────────────────────────────────┼───────────┼──────────────────────────────────────────────────┤
 │ 9    │ Extract ops.rs sanitize_args + tests │ ~15       │ ops.rs                                           │
 ├──────┼──────────────────────────────────────┼───────────┼──────────────────────────────────────────────────┤
 │ 10   │ Expand api.rs tests                  │ ~22       │ api.rs                                           │
 ├──────┼──────────────────────────────────────┼───────────┼──────────────────────────────────────────────────┤
 │ 11   │ Add sandbox.rs + worker.rs tests     │ ~10       │ sandbox.rs, worker.rs                            │
 ├──────┼──────────────────────────────────────┼───────────┼──────────────────────────────────────────────────┤
 │ 12   │ Expand capabilities.rs + manager.rs  │ ~13       │ capabilities.rs, manager.rs                      │
 ├──────┼──────────────────────────────────────┼───────────┼──────────────────────────────────────────────────┤
 │ 13   │ Create integration_ops.rs            │ ~6        │ src-tauri/tests/integration_ops.rs               │
 ├──────┼──────────────────────────────────────┼───────────┼──────────────────────────────────────────────────┤
 │ 14   │ Write component tests                │ ~11       │ 3 test files                                     │
 ├──────┼──────────────────────────────────────┼───────────┼──────────────────────────────────────────────────┤
 │ 15   │ Setup husky + lint-staged            │ 0         │ .husky/pre-commit, package.json                  │
 ├──────┼──────────────────────────────────────┼───────────┼──────────────────────────────────────────────────┤
 │ 16   │ Create CI workflow                   │ 0         │ .github/workflows/ci.yml                         │
 └──────┴──────────────────────────────────────┴───────────┴──────────────────────────────────────────────────┘
```
> Total new tests: ~162 (96 frontend + 66 Rust) added to existing 48 Rust = ~210 total

---

Verification Plan:

> After implementation:

1. npm test -- all frontend tests pass
2. npm run test:coverage -- 90%+ coverage, exits cleanly
3. cd src-tauri && cargo test -- all ~114 Rust tests pass
4. cd src-tauri && cargo clippy -- -D warnings -- 0 warnings
5. git commit -- husky pre-commit hook runs lint-staged + cargo fmt check
6. Push to GitHub -- CI workflow runs all 5 jobs, all pass green
7. Coverage artifacts uploaded and viewable

---

## TODO 0.0.7 - Plan to implement

### Theme Unification Plan

> Context
> The app has two diverged theme systems that don't talk to each other:

1. Rust backend (theme_engine.rs): Parses TOML files into a Theme struct, generates CSS vars string via to_css_vars(). Has 4 Tauri commands but the load_theme command returns a CSS string — never consumed by the
 frontend.
2. Frontend (stores/theme.ts): Has hardcoded MILKYTEXT and LIQUID_GLASS_DARK Theme objects (~220 lines of constants), applies ~85 CSS vars via applyThemeToDocument(). Completely self-contained.
3. Dead code (theme-engine.ts): 69-line ThemeEngine class that calls invoke('load_theme') — never instantiated anywhere.

Goal: Make TOML files the single source of truth. Frontend loads themes from Rust backend, removes hardcoded constants.

> Key Design Decision

Instead of converting load_theme to return the full Theme JSON (which requires complex snake_case → camelCase mapping and restructuring between the Rust struct shape and TS interface shape), we keep load_theme returning a CSS   string but also add a load_theme_json command that returns the full Theme as JSON. The frontend's applyThemeToDocument() already works perfectly — we just need to feed it Theme objects from Rust instead of hardcoded constants.

Actually, looking more carefully: the Rust ChromeTheme has background: ChromeBackground { color, blur } + foreground + height, but the TS ChromeTheme has flat background: string + foreground + height + blur? + border? + menuBackground? etc. These structures don't align. Converting Rust→TS JSON would require custom serialization. The simpler path: expand the Rust struct to match the TS interface exactly, and use #[serde(rename_all = "camelCase")] on all structs.

## Phase 1: Restructure Rust Theme struct to match TS interface

File: src-tauri/src/theme_engine.rs

> Changes:

1. Add PaletteTheme struct (new) — 20 string fields matching TS ThemePalette:
- background, foreground, cursor_color, selection_background, selection_foreground?
- 16 ANSI colors: black, red, green, yellow, blue, purple, cyan, white, bright_black..bright_white
1. Flatten ChromeTheme — remove ChromeBackground sub-struct, make fields flat:
- background: String, foreground: String, height: u32
- Add: blur: Option<u32>, border: Option<String>, menu_background: Option<String>, menu_hover: Option<String>,menu_foreground: Option<String>
1. Expand EditorTheme — add nested line and gutter + font fields:
- Add line: EditorLineTheme (new struct: active, number, number_active)
- Add gutter: EditorGutterTheme (new struct: background, border?)
- Add font_family: Option<String>, font_size: Option<u32>, line_height: Option<f32>
1. Add optional fields to SyntaxTheme (keep TokenStyle for existing 9, add optional string fields):
- Add: tag, attribute, property, punctuation, regexp, heading, link, meta — all Option<TokenStyle>
1. Expand UiTheme — currently only has status_bar. Make it a full struct with all TS fields:
- status_bar: UiStatusBarTheme
- primary, border, border_subtle, text_primary, text_secondary, text_disabled
- button_background, button_hover, button_active
- input_background, input_border, input_focus
- tooltip_background, scrollbar_thumb, scrollbar_thumb_hover
- error, warning, success, info
- search_match, search_match_selected, selection_match
1. Make ui required (not Option<UiTheme>) — all themes must have it
2. Make transitions required (not Option<TransitionsTheme>) — all themes must have it
3. Add palette: PaletteTheme to Theme struct
4. Add WindowShadow to WindowTheme: shadow: Option<WindowShadow> with color, blur, offset fields
5. Add #[serde(rename_all = "camelCase")] to ALL structs (for JSON serialization to frontend)
- BUT TOML files use snake_case keys. Since rename_all applies to both serialize AND deserialize, we need a
 workaround:
- Use #[serde(alias = "snake_case_name")] on each field, OR
- Better: Keep snake_case in Rust, add a to_frontend_json() method using serde_json::Value manipulation, OR
- Best: Use separate deserialize (snake_case for TOML) and serialize (camelCase for JSON) via:
```rust
#[serde(rename_all(deserialize = "snake_case", serialize = "camelCase"))] // this is the cleanest approach
```
1. Add load_theme_data Tauri command — returns Theme as JSON (the struct auto-serializes as camelCase)
2. Update to_css_vars() to include all new fields

> Serde Strategy
```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all(deserialize = "snake_case", serialize = "camelCase"))]
pub struct ChromeTheme { ... }
```

This way:
- TOML deserialization reads menu_background (snake_case)
- JSON serialization writes menuBackground (camelCase)

For TokenStyle: keep the custom deserializer (supports string or object), but serialization always writes full object. Frontend syntax fields are plain strings, so to_frontend_json() will extract just .color from each TokenStyle when building the response.

> New command
```rust
 #[tauri::command]
 pub async fn load_theme_data(theme_name: String) -> Result<serde_json::Value, String> {
     // Parse TOML, then manually build camelCase JSON matching TS Theme interface
 }
```

## Phase 2: Populate TOML theme files

Files: themes/milkytext.toml, themes/glass-dark.toml, themes/glass-light.toml

Copy exact values from TS hardcoded constants into TOML. Fix known discrepancies:

- milkytext.toml: base = "dark" (not "light")
- milkytext.toml: selection.background = "rgba(255, 255, 255, 0.15)" (not "#FFFFFF")
- milkytext.toml: border.color = "rgba(255, 255, 255, 0.08)" (not "rgba(0, 0, 0, 0.1)")

Add all new sections: [palette], [chrome] expanded fields, [editor.line], [editor.gutter], [syntax] expanded, [ui] full fields.

For glass-light.toml: derive values from the dark theme with appropriate light-mode adjustments (or populate from any existing data).

## Phase 3: Frontend theme.ts refactor

File: src/lib/stores/theme.ts

1. Remove MILKYTEXT constant (lines 145-254)
2. Remove LIQUID_GLASS_DARK constant (lines 260-369)
3. Add async function loadThemeFromBackend(fileName: string): Promise<Theme>
- Calls invoke('load_theme_data', { themeName: fileName })
- Returns the Theme object directly (JSON is already camelCase)
1. Modify createThemeStore():
- Initialize with current: null and loading: true
- Add init() method that calls invoke('list_themes'), then loads default theme
- Modify switchTheme() to call backend if theme not in local cache
1. Keep applyThemeToDocument() unchanged — it works perfectly
2. Keep all derived stores, type definitions — no changes needed
3. Update initialization block (lines 570-575) to call init() instead of synchronous apply

## Phase 4: Delete dead code

- Delete src/lib/theme-engine.ts (69 lines)
- Remove any imports if they exist (likely none since it's never used)

## Phase 5: Update SettingsPanel.svelte

File: src/lib/components/SettingsPanel.svelte

- Theme selector should call invoke('list_themes') for available theme list (instead of hardcoded array)
- Use themeStore.switchTheme(name) which now calls backend

## Phase 6: Null guards

Files: src/lib/editor-loader.ts, src/lib/components/Editor.svelte, src/lib/components/DiffView.svelte

- Guard against $themeStore.current === null during initial async load
- editor-loader.ts: createSyntaxHighlighting() should fallback if no theme yet

## Phase 7: Verify

1. cargo check from src-tauri/ — 0 errors
2. npm run build — 0 errors
3. cargo test from src-tauri/ — theme tests pass
4. npx vitest run — frontend tests pass
5. cargo tauri dev — app launches, themes load from TOML, switching works

> File Change Summary
┌─────────────────────────────────────────┬──────────────────────────────────────────────────┬──────────────┐
│                  File                   │                      Action                      │ LOC estimate │
├─────────────────────────────────────────┼──────────────────────────────────────────────────┼──────────────┤
│ src-tauri/src/theme_engine.rs           │ MODIFY — expand structs, add load_theme_data cmd │ +200         │
├─────────────────────────────────────────┼──────────────────────────────────────────────────┼──────────────┤
│ themes/milkytext.toml                   │ MODIFY — add all missing sections                │ +60          │
├─────────────────────────────────────────┼──────────────────────────────────────────────────┼──────────────┤
│ themes/glass-dark.toml                  │ MODIFY — add all missing sections                │ +60          │
├─────────────────────────────────────────┼──────────────────────────────────────────────────┼──────────────┤
│ themes/glass-light.toml                 │ MODIFY — add all missing sections                │ +60          │
├─────────────────────────────────────────┼──────────────────────────────────────────────────┼──────────────┤
│ src/lib/stores/theme.ts                 │ MODIFY — remove hardcoded, add async init        │ net -100     │
├─────────────────────────────────────────┼──────────────────────────────────────────────────┼──────────────┤
│ src/lib/theme-engine.ts                 │ DELETE                                           │ -69          │
├─────────────────────────────────────────┼──────────────────────────────────────────────────┼──────────────┤
│ src/lib/components/SettingsPanel.svelte │ MODIFY — dynamic theme list                      │ ~10          │
├─────────────────────────────────────────┼──────────────────────────────────────────────────┼──────────────┤
│ src/lib/editor-loader.ts                │ MODIFY — null guard                              │ ~5           │
├─────────────────────────────────────────┼──────────────────────────────────────────────────┼──────────────┤
│ src/lib/components/Editor.svelte        │ MODIFY — null guard                              │ ~5           │
├─────────────────────────────────────────┼──────────────────────────────────────────────────┼──────────────┤
│ src/lib/components/DiffView.svelte      │ MODIFY — null guard                              │ ~5           │
├─────────────────────────────────────────┼──────────────────────────────────────────────────┼──────────────┤
│ src-tauri/src/main.rs                   │ MODIFY — register load_theme_data cmd            │ +1           │
└─────────────────────────────────────────┴──────────────────────────────────────────────────┴──────────────┘
> Implementation Order

1. Phase 1 (Rust struct expansion + new command) → cargo check
2. Phase 2 (TOML files) → cargo test
3. Phase 3 + 4 (frontend refactor + delete dead code)
4. Phase 5 + 6 (SettingsPanel + null guards) → npm run build
5. Phase 7 (full verify)

---
