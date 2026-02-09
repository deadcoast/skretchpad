# Changelog

All notable changes to skretchpad will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.11] - 2026-02-08

### Added

- **Trust system integration**: `TrustVerifier` managed state, signature validation in `activate()`, auto_grant_permissions for first-party plugins
- **PluginStatus enriched**: New fields `trust`, `loaded_at`, `auto_approve`, `capability_tier` in serialized plugin status
- **Capability tier computation**: `is_subset_of()` with presets (`none`/`workspace_read`/`workspace_read_write`/`first_party`) determines plugin tier (sandboxed/read-only/read-write/full)
- **Event cleanup on deactivate**: `unregister_event_listener()` called for all events, lifecycle events emitted (`plugin:activated`/`plugin:deactivated`)
- **Real resource limit enforcement**: `check_resource_limits()` returns `MemoryLimitExceeded`/`RateLimitExceeded` errors, `Timeout`/`SerializationError` used in sandbox methods
- **WorkerRegistry**: Managed state tracking workers alongside SandboxRegistry, with `create_worker`/`remove_worker`/`shutdown_all`
- **10 new Tauri commands**: `unload_plugin`, `get_plugin_event_listeners`, `get_file_watcher_count`, `list_active_sandboxes`, `get_plugin_resource_stats`, `grant_plugin_capability`, `add_trusted_key`, `remove_trusted_key`, `get_worker_info`, `register_plugin_worker`
- **Frontend trust support**: `TrustLevel` type, auto-approve first-party plugins, `unload()` method, trust badges in StatusBar

### Changed

- **Loader error variants**: All `LoaderError` variants now used (`ManifestNotFound`/`InvalidManifest`/`AlreadyLoaded`/`PluginNotFound`)
- **Plugin sandbox**: Field getters (`id()`, `capabilities()`, `resource_limits()`), `cleanup()` sends `Shutdown` to worker
- **Worker**: `send_shutdown()` method, field getters (`id()`, `capabilities()`, `resource_limits()`)

### Removed

- **24 dead-code warnings**: All eliminated by wiring scaffolded APIs into real execution paths (0 warnings in `cargo check`)

## [0.0.10] - 2026-02-08

### Added

- **DOMPurify**: XSS sanitization for plugin panel HTML content and status bar text
- **3 new themes**: Cyberpunk, Nord, Solarized Dark -- auto-discovered by theme engine
- **Plugin hot-reload**: notify-based file watcher on plugin dirs, debounced 500ms, auto in dev mode
- **HotReloadRegistry**: Manages per-plugin watchers with enable/disable Tauri commands
- **Breadcrumb.svelte**: File path breadcrumbs above editor with clickable segments
- **Minimap.svelte**: Canvas-based code overview sidebar, click-to-scroll, viewport indicator
- **SplitPane.svelte**: Resizable horizontal/vertical split with drag divider
- **Split editor**: Ctrl+\\ toggles split, `view.splitEditorRight`/`Down`/`Close` commands

### Changed

- Build output: 130 modules (was 129)
- StatusBar: DOMPurify sanitizes plugin-contributed text

## [0.0.9] - 2026-02-08

### Added

- **TabBar.svelte**: Visual multi-tab bar wired to editor.ts store with reorderTabs(), closeOtherTabs(), closeTabsToRight()
- **git.rs**: 15 Tauri commands wrapping git CLI (status, stage, unstage, commit, push, pull, fetch, branch, log, diff, stash, remote, clone, init, checkout)
- **git.ts**: Reactive Svelte store with 3-second auto-refresh for git state
- **SideBar.svelte overhaul**: Activity bar (40px icon strip) + built-in panels (Explorer, Source Control)
- **SourceControlPanel.svelte**: VSCode-style SCM panel with staged/unstaged sections
- **ChangeItem.svelte**: File change row with status badge + hover actions (stage/unstage/discard)
- **StatusBar.svelte**: Built-in git branch display + sync status (ahead/behind)
- **DiffView.svelte overhaul**: Hunk navigation (Alt+Up/Down), unified/side-by-side toggle, language support, change stats
- **editor-loader.ts**: `createDiffEditor` supports language detection + unified mode
- **9 new SVG icons**: gitBranch, gitCommit, gitPullRequest, gitMerge, add, remove, discard, sync, sourceControl
- **Keyboard shortcut**: Ctrl+Shift+G opens Source Control panel
- **Command**: `view.sourceControl` command registered in palette

### Changed

- Build output: 129 modules (was 122)
- 310 frontend tests + 154 Rust tests all pass

## [0.0.8] - 2026-02-08

### Added

- **4 new language grammars**: Go (`@codemirror/lang-go`), Java (`@codemirror/lang-java`), C/C++ (`@codemirror/lang-cpp`), PHP (`@codemirror/lang-php`) -- 16 total
- **Auto-save**: Timer-based save on document change, respects `settingsStore.files.autoSave` and `autoSaveDelay` settings; timer cleared on manual save and component destroy
- **Editor settings wiring**: Reactive statements connect `settingsStore` to CodeMirror compartments (`setWordWrap`, `setLineNumbers`, `setTabSize`, `setFontSize`)
- **Shared editor state**: `SharedEditorState` (Arc<Mutex>) in Rust allows plugin ops to read editor content and active file synchronously
- **`update_editor_state` Tauri command**: Frontend pushes editor content and file path to backend on every change (debounced 500ms)
- **Async hook support**: `pump_event_loop()` in `worker.rs` creates a tokio runtime and calls `runtime.run_event_loop(false)` with 5-second timeout after script/hook execution
- **Accessibility attributes**: `aria-label` on window controls, `aria-haspopup`/`aria-expanded` on menu triggers, `role="menubar"` on menu bar, `role="tablist"`/`"tab"`/`"tabpanel"` and `aria-selected` on SideBar

### Changed

- **`op_plugin_get_editor_content`**: Now reads from `SharedEditorState` instead of emitting fire-and-forget events; returns `{content, file}` JSON
- **`op_plugin_get_active_file`**: Now reads from `SharedEditorState`; returns `{path}` or null
- **`PluginWorker::new`**: Accepts `EditorStateHandle` parameter, injects into `PluginOpState`
- **`PluginSandbox::new`**: Accepts and passes `EditorStateHandle` to worker
- **`PluginManager::new`**: Accepts and stores `EditorStateHandle`, passes to sandbox on activation
- **`Editor.svelte`**: Imports `settingsStore` and editor reconfigure functions; auto-save timer in `handleEditorChange`; syncs state to backend

### Removed

- **`src/lib/plugin-api.ts`**: Deleted 1,194 lines of dead code (zero imports anywhere in codebase); real plugin API lives in `src-tauri/js/plugin_api.js`

## [0.0.7] - 2026-02-08

### Added

- **Unified theme system**: TOML files are now the single source of truth for all themes
- **`load_theme_data` Tauri command**: Returns full theme as camelCase JSON from snake_case TOML
- **`list_themes` Tauri command**: Returns available theme metadata for frontend selectors
- **Expanded Rust theme structs**: `PaletteTheme` (20 fields), `UiTheme` (27 fields), `EditorLineTheme`, `EditorGutterTheme`, `WindowShadow`, expanded `ChromeTheme` and `SyntaxTheme`
- **`to_frontend_json()` method**: Builds camelCase JSON matching TypeScript `Theme` interface with smart defaults for optional fields
- **`to_css_vars()` expansion**: Now generates 85+ CSS variables covering palette, window, chrome, editor, syntax, UI, and transitions
- **Async theme loading**: Frontend `themeStore.init()` loads themes from backend with caching and localStorage persistence
- **100+ new Rust theme tests**: Parsing, CSS generation, JSON output, round-trip validation for all 3 themes
- **Serde dual-rename strategy**: `#[serde(rename_all(deserialize = "snake_case", serialize = "camelCase"))]` on all theme structs

### Changed

- **Frontend `theme.ts` refactored**: Removed ~220 lines of hardcoded theme constants (`MILKYTEXT`, `LIQUID_GLASS_DARK`); store now initializes asynchronously from backend
- **`createThemeStore()` rewritten**: Added `init()` method, `switchTheme()` calls backend, theme cache keyed by file stem
- **`SettingsPanel.svelte`**: Theme selector now uses `ThemeInfo.name` from `$themeStore.available` instead of hardcoded options
- **TOML theme files fully populated**: All 3 themes (`milkytext.toml`, `glass-dark.toml`, `glass-light.toml`) now include complete `[palette]`, `[chrome]`, `[editor.line]`, `[editor.gutter]`, `[syntax]`, `[ui]`, and `[transitions]` sections
- **ESLint config**: Disabled `svelte/no-at-html-tags` rule (all `@html` usage is for trusted internal SVG icons)
- **`theme.test.ts` rewritten**: 16 tests for async store API with mocked `invoke` handlers and `localStorage.clear()` in `beforeEach`

### Removed

- **`src/lib/theme-engine.ts`**: Dead 69-line `ThemeEngine` class (never instantiated)
- **`src/lib/theme-engine.test.ts`**: Tests for deleted module
- **Hardcoded theme constants**: `MILKYTEXT` and `LIQUID_GLASS_DARK` objects removed from `theme.ts`

### Fixed

- **Theme store defensive guards**: Added `?? []` for `listThemesFromBackend()`, optional chaining in `switchTheme()` and `resetToDefault()`
- **TOML theme conflicts**: Fixed `[chrome]` section structure (`background.color` + `background.blur` instead of conflicting `background` as both string and table)
- **`milkytext.toml` corrections**: `base = "dark"` (was wrong), proper `selection.background`, correct `border.color`

## [0.0.6] - 2026-02-07

### Added

- **End-to-end plugin runtime testing**: App launches, discovers 2 plugins, loads and activates both successfully
- **Plugin entry point loading**: `manager.activate()` now reads and executes the plugin's `main.js` in the V8 sandbox before calling activation hooks
- **40 automated Rust tests** across 5 modules (loader: 17, trust: 7, capabilities: 10, api: 3, manager: 3)
- **`tempfile` dev-dependency** for test fixtures with temporary plugin directories
- **Success logging**: Plugin discovery/loading/activation now prints confirmation messages to stdout

### Fixed

- **Plugin scripts never executed**: Entry point scripts were not loaded into the sandbox during activation; hooks were called but never registered
- **TrustLevel serde mismatch**: TOML `trust = "first-party"` failed parsing because serde expected PascalCase (`FirstParty`); added `#[serde(rename_all = "kebab-case")]`
- **TypeScript in JS-only runtime**: Plugin `main.ts` files used TypeScript syntax (`as string`, `: string`) but deno_core's JsRuntime only runs JavaScript; converted to `main.js`
- **Command result handling**: Plugins treated `OpCommandOutput {stdout, stderr, status}` as a plain string; fixed to use `result.stdout.trim()`
- **Async hooks not resolving**: Plugin hooks used `async/await` but deno_core uses explicit microtask policy; made hooks synchronous
- **Default entry point**: Changed `default_main()` from `"main.ts"` to `"main.js"` in loader
- **Missing `CommandCapability` import** in api.rs test module

### Changed

- Plugin manifests updated: `main = "main.js"` (was `main.ts`)
- Plugin scripts rewritten as pure JavaScript (no TypeScript syntax, no async/await)
- Manager tests cleaned up to remove unused `tempfile`/`fs` imports and dead `create_test_manifest` helper

## [0.0.5] - 2026-02-07

### Added

- **deno_core ops bridge**: 9 ops connecting plugin JS API to actual Rust operations (`ops.rs`)
  - `op_plugin_read_file` -- `std::fs::read_to_string` with path canonicalization and filesystem capability validation
  - `op_plugin_write_file` -- `std::fs::write` with parent-directory canonicalization and write capability validation
  - `op_plugin_list_files` -- `std::fs::read_dir` with read capability validation
  - `op_plugin_fetch` -- `reqwest::blocking::Client` with network domain allowlist validation
  - `op_plugin_execute_command` -- `std::process::Command` with command allowlist and argument sanitization
  - `op_plugin_show_notification` -- `AppHandle.emit()` with UI notification capability check
  - `op_plugin_set_status_bar` -- `AppHandle.emit()` with UI status_bar capability check
  - `op_plugin_get_editor_content` -- fire-and-forget event emission (sync return limitation)
  - `op_plugin_get_active_file` -- fire-and-forget event emission (sync return limitation)
- **`skretchpad_plugin_ops` extension**: Registered in worker.rs JsRuntime via `deno_core::extension!` macro
- **`PluginOpState`**: Per-plugin state (plugin_id, capabilities, workspace_root, app_handle) injected into OpState
- **reqwest blocking**: Added `blocking` feature for synchronous HTTP from worker threads

### Changed

- `plugin_api.js` rewritten to use `Deno.core.ops.op_plugin_*()` instead of request queue pattern
- `worker.rs` integrates `skretchpad_plugin_ops` extension and injects `PluginOpState` into runtime
- `sandbox.rs` accepts and passes `workspace_root` and `AppHandle` to worker
- `manager.rs` stores `workspace_root` and `AppHandle`, passes to sandbox on activation
- `main.rs` computes `workspace_root` (project root in dev, app_data_dir in release) and passes to PluginManager

## [0.0.4] - 2026-02-07

### Added

- **Native file I/O commands**: `read_file`, `write_file`, `save_file`, `get_file_metadata`, `emit_editor_event` Tauri commands
- **File dialogs**: Native open/save/confirm dialogs via `tauri-plugin-dialog` (Rust + JS)
- **Tauri 2.0 capabilities**: `src-tauri/capabilities/default.json` with `core:default` and `dialog:default` permissions
- **File watcher registry**: `FileWatcherRegistry` in api.rs to persist watchers and prevent premature drop
- **Unwatch command**: `plugin_unwatch_path` Tauri command for cleaning up file watchers
- **DiffView component**: Side-by-side diff viewer using `@codemirror/merge` MergeView
- **Settings UI panel**: `SettingsPanel.svelte` with appearance, editor, keybinding, and file settings
- **Plugin permission dialog wiring**: Full approval/denial flow in plugins store with promise-based callback
- **File commands in palette**: file.open (Ctrl+O), file.new (Ctrl+N), file.saveAs (Ctrl+Shift+S), file.close (Ctrl+W)
- **Settings shortcut**: Ctrl+, to open settings panel
- **TOML language support**: Via `@codemirror/legacy-modes` StreamLanguage parser
- **Format document**: Prettier integration (JS, TS, JSON, HTML, CSS, Markdown, YAML) with lazy-loaded parsers
- **Setup script**: `setup.ps1` PowerShell install/verification script (40 checks)
- **TrustLevel Default impl**: Added `Default` impl for `TrustLevel` enum (required by serde)
- **Tauri commands**: `read_file`, `write_file`, `save_file`
- **Commands**: `get_file_metadata` and `emit_editor_event`, `plugin_unwatch_path`
- **(Rust + JS)**: `tauri-plugin-dialog`
- **StreamLanguage adapter**: TOML to language registry
- **Permission approval:** flow to plugins.ts store
- **Keybindings**: Ctrl+O, Ctrl+N, Ctrl+Shift+S, Ctrl+W

### Fixed

- **File watcher drop bug**: Watchers were immediately dropped after creation; now persisted in `FileWatcherRegistry`
- **Dialog invocations**: Replaced broken `invoke('show_save_dialog')` / `invoke('show_confirm_dialog')` with `@tauri-apps/plugin-dialog` API
- **setup.ps1 Join-Path bug**: Fixed 3+ argument `Join-Path` calls for PowerShell 5.1 compatibility
- **Plugin manifest parsing**: `PluginManifest` now uses flexible TOML parsing with `#[serde(default)]` and raw `toml::Value` for permissions/UI sections
- **Plugin discovery path**: Development mode now resolves plugins/ from project root instead of empty AppData directory
- **Plugin sandbox bridge**: `plugin_api.js` replaced `Tauri.invoke()` with request queue pattern and `__hooks__` registration system
- **Worker hook calling**: Changed from non-existent `globalThis.plugin.hooks` to `globalThis.__hooks__` with graceful fallback
- **Worker timeout**: Timeout check now executes after script runs instead of being a no-op (checked immediately after `Instant::now()`)
- **Hook name memory leak**: Cached hook names in static `LazyLock<Mutex<HashMap>>` instead of `Box::leak` on every call
- **Plugin deactivation**: Deactivated plugins now stay visible in status list (state set to `Loaded` instead of removed from map)
- **Event listener cleanup**: `plugin-api.ts` now properly resolves `listen()` Promise before storing UnlistenFn
- **Git plugin API**: Rewritten to use sandbox `globalThis.skretchpad` API instead of non-existent `PluginContext` class methods
- **git-status plugin**: Created missing `main.ts` entry point and fixed incompatible TOML schema
- **TrustLevel Default**: Added `Default` impl for `TrustLevel` enum (required by serde)
- **PluginSignature dedup**: Removed duplicate struct from `loader.rs`, re-exported from `trust.rs`

### Changed

- `editor.ts` store now uses `@tauri-apps/plugin-dialog` for save/confirm dialogs
- `Editor.svelte` empty-state buttons now trigger native file open dialog; `formatDocument` now uses Prettier
- `App.svelte` expanded with 5 new commands, 6 new keyboard shortcuts, settings panel, permission dialog
- `plugins.ts` store checks plugin capabilities before activation (permission approval flow)
- `editor-loader.ts` `createDiffEditor` rewritten to use `@codemirror/merge` MergeView; added TOML language
- `PluginPermissionDialog.svelte` rebuilt with risk badges, styled approval UI
- `DiffView.svelte` rebuilt from placeholder to functional MergeView component
- `loader.rs` manifest parsing now handles flexible TOML structures for permissions and UI sections
- `worker.rs` hook system uses cached names and post-execution timeout checks
- `main.rs` plugin discovery resolves to project root in development mode

- **Native File I/O**
- Register all new commands in invoke_handler

- **File Dialogs**
- Create `src-tauri/capabilities/default.json` for Tauri 2.0 permissions
- Replace `invoke('show_save_dialog')` with `@tauri-apps/plugin-dialog` API
- Wire file.open, file.new, file.saveAs, file.close commands in App.svelte

- **File Watcher Cleanup**
- Create `FileWatcherRegistry` (tokio::sync::Mutex<HashMap>)
- Fix watcher drop bug (persist in managed state)

- **DiffView Component**
- Install `@codemirror/merge` package
- Rewrite `createDiffEditor` with MergeView
- Rebuild `DiffView.svelte` with proper lifecycle

- **Settings UI Panel**
- Create `SettingsPanel.svelte` (appearance, editor, keybindings, files)
- Wire Ctrl+, shortcut and view.openSettings command
- Custom toggle switches, glass-panel styling

- **Plugin Permission Dialog**
- Rebuild `PluginPermissionDialog.svelte` with risk badges
- Wire dialog in App.svelte

- **Setup Script**
- Create `setup.ps1` PowerShell install/verification script
- Fix Join-Path bug for PowerShell 5.1 compatibility

- **TOML Language Support**
- Install `@codemirror/legacy-modes` package
- Map `.toml` extension to TOML language

- **Format Document**
- Integrate Prettier (standalone browser build)
- Support JS, TS, JSON, HTML, CSS, Markdown, YAML formatting
- Lazy-load parser plugins for code splitting

- **Plugin Runtime Fixes**
- Fix `PluginManifest` struct to accept flexible TOML schemas (serde defaults, raw toml::Value)
- Fix plugin discovery path (dev mode resolves to project root, not AppData)
- Fix `plugin_api.js` to use request queue instead of non-existent `Tauri.invoke()`
- Fix `worker.rs` hook calling (use `globalThis.__hooks__` with graceful fallback)
- Fix worker timeout (check elapsed after execution, not before)
- Fix hook name memory leak (cached static HashMap via LazyLock)
- Fix plugin deactivation (set state to Loaded instead of removing from map)
- Fix event listener cleanup (await listen() Promise before storing UnlistenFn)
- Rewrite git plugin main.ts to use sandbox API
- Create git-status main.ts entry point
- Fix git-status plugin.toml schema
- Remove duplicate PluginSignature (re-export from trust.rs)

## [0.0.3] - 2026-02-07

### Fixed

- **13+ Rust compilation errors** resolved across sandbox.rs, manager.rs, worker.rs, api.rs, loader.rs
- **Thread safety**: SandboxRegistry redesigned with interior mutability (RwLock wrapping HashMap)
- **Tauri 2.0 API**: `Window` replaced with `WebviewWindow`, `event.payload()` usage corrected
- **Send bounds**: All error types now implement `Send + Sync` for async compatibility
- **deno_core lifetimes**: `Box::leak` for static string references required by V8 runtime
- **Write path canonicalization**: `plugin_write_file` now canonicalizes paths (security fix)
- **Capability validation**: Editor content APIs now validate UI capabilities
- **JSON error handling**: `plugin_get_active_file` now propagates parse errors instead of swallowing them
- **35 compiler warnings** eliminated (dead code, unused imports, unused variables)

### Added

- **11 editor commands** wired to CodeMirror 6: undo, redo, toggleComment, duplicateLine, deleteLine, moveLinesUp, moveLinesDown, openSearchReplace, findNext, findPrevious, replaceNext, replaceAll
- **Command palette** (Ctrl+Shift+P) with 13 built-in commands and plugin command integration
- **Notification toast system**: `notifications.ts` store + `NotificationToast.svelte` component
- **Always-on-top** window toggle wired to Tauri `setAlwaysOnTop()` API
- **3 CodeMirror language supports**: YAML (`@codemirror/lang-yaml`), XML (`@codemirror/lang-xml`), SQL (`@codemirror/lang-sql`)
- **`editorCommands` export** on Editor component for external command dispatch
- **(security fix)**: Write path canonicalization
- **Content APIs**: Capability validation on editor

### Changed

- npm dependencies installed (were previously missing)
- `showNotification()` in ui.ts now routes to the notification store
- Editor stub functions replaced with real CodeMirror command implementations
- `_editorAPI` console.log removed; replaced with proper `editorCommands` export

- **Phase 1: Dependency Resolution**
- Fix async-trait, uuid, reqwest, url dependency resolution
- Resolve all E0432 (unresolved import) errors
- Resolve all E0433 (failed to resolve) errors
- `cargo check` passes without dependency errors

- **Phase 2: API Mismatches**
- Align SandboxRegistry API (register/get/remove methods)
- Fix PluginSandbox constructor parameter mismatch
- Fix `plugin_info.capabilities` vs `plugin_info.manifest.capabilities`
- Fix Arc<SandboxRegistry> mutability with RwLock

- **Phase 3: Thread Safety**
- Fix Arc<SandboxRegistry> interior mutability (RwLock wrapping HashMap)
- Fix `hook_name` lifetime in worker.rs (Box::leak for static strings)
- All methods on SandboxRegistry take `&self` with async lock

- **Phase 4: Serialization**
- Fix notify::Event serialization (manual JSON payload)
- Fix FileInfo deserialization (added Deserialize derive)
- Replace broken `emit_and_wait` with oneshot channel pattern

- **Phase 5: Remaining Compilation**
- Fix PluginError to ManagerError conversion (Send + Sync bounds)
- Fix return type mismatches in manager.rs
- Fix `Window` -> `WebviewWindow` (9 occurrences in api.rs)
- Eliminate all 35 compiler warnings (dead code, unused imports/variables)

- **Phase 6: Frontend Wiring**
- Wire 11 editor commands to CodeMirror 6 (undo, redo, comment, duplicate, delete, move, search)
- Wire command palette (Ctrl+Shift+P) with 13 built-in commands
- Wire always-on-top toggle to Tauri `setAlwaysOnTop()` API
- Create notification toast system (store + component)
- Install and enable YAML, XML, SQL language support
- Fix JSON error propagation in `plugin_get_active_file`

## [0.0.2] - 2025-10-25

### Added

- Full plugin system architecture (Rust backend):
  - `sandbox.rs` - Plugin sandboxing with deno_core V8 runtime
  - `worker.rs` - Worker thread JavaScript execution
  - `capabilities.rs` - Capability-based permission model
  - `loader.rs` - TOML manifest parser and plugin registry
  - `manager.rs` - Plugin lifecycle management
  - `api.rs` - 25+ Tauri commands for plugin operations
  - `trust.rs` - Trust levels (first-party, local, community)
- Frontend stores and libraries:
  - `editor.ts` - Editor state and file management store
  - `theme.ts` - Theme loading with CSS variable injection
  - `keybindings.ts` - Keybinding schemes (Default, Vim, Emacs)
  - `plugins.ts` - Plugin registry and command store
  - `plugin-api.ts` - TypeScript bridge to Rust plugin API
  - `editor-loader.ts` - CodeMirror 6 setup with compartments
  - `ui.ts` - UI utilities (color, animation, format)
- UI components:
  - `CommandPalette.svelte` - Command palette
  - `StatusBar.svelte` - Status bar with plugin items
  - `SideBar.svelte` - Side panel for plugins
  - `PluginPermissionDialog.svelte` - Permission approval dialog
- First-party plugin manifests (git, git-status) with example git plugin

### Changed

- `sandbox.rs` -- V8 sandbox with resource limits
- `capabilities.rs` -- Capability-based permission model
- `api.rs` -- 25+ Tauri commands (filesystem, network, UI, editor)
- `loader.rs` -- TOML manifest parser and plugin registry
- `manager.rs` -- Plugin lifecycle management
- `worker.rs` -- Worker thread JS execution (deno_core)
- `trust.rs` -- Trust levels (first-party, local, community)
- `main.rs` -- Tauri app setup and command registration
- `plugin-api.ts` -- TypeScript bridge to Rust plugin API
- `editor-loader.ts` -- CodeMirror 6 setup with compartments
- `theme.ts` -- Theme loading with CSS variable injection
- `keybindings.ts` -- Keybinding schemes (Default, Vim, Emacs)
- `editor.ts` -- Editor state and file management store
- `plugins.ts` -- Plugin registry and command store
- `ui.ts` -- UI utilities
- `debounce.ts` -- Debounce utility
- `Editor.svelte` -- CodeMirror 6 editor wrapper
- `StatusBar.svelte` -- Status bar with plugin items
- `SideBar.svelte` -- Side panel for plugins
- `CommandPalette.svelte` -- Command palette component
- `PluginPermissionDialog.svelte` -- Permission approval dialog
- Git plugin manifest (`plugins/git/plugin.toml`)
- Git status plugin manifest (`plugins/git-status/plugin.toml`)
- Example git plugin entry point (`plugins/git/main.ts`)

### Known Issues

- Code written but not compiled -- 13+ Rust errors present
- npm dependencies not installed
- Editor commands were stubs (no implementations)

## [0.0.1] - 2025-10-24

### Added

- Basic Tauri 2.0 application setup
- Simple Svelte 4 frontend structure
- Basic CodeMirror 6 editor integration
- Simple UI components (Chrome, Editor, StatusBar)
- Working build pipeline for frontend and backend
- Glass dark theme (TOML-based)
- Language definitions for Python, Rust, Markdown

### Changed

- Resolve `deno_core::JsRuntime` thread safety issue with worker-based architecture
- Redesign plugin sandboxing for thread safety
- Implement message passing between main thread and workers

---

## Version History

- **0.0.11** - Wire plugin scaffolding: trust system, event cleanup, resource limits, WorkerRegistry, 10 new commands, 0 warnings
- **0.0.10** - DOMPurify XSS protection, 3 new themes, plugin hot-reload, breadcrumbs, minimap, split editor
- **0.0.9** - Tab bar, git integration (15 commands), source control panel, diff overhaul
- **0.0.8** - Dead code removal, 4 new languages, editor settings wiring, auto-save, accessibility, editor ops round-trip, async hooks
- **0.0.7** - Theme unification: TOML as single source of truth, expanded Rust structs, async frontend loading
- **0.0.6** - E2E runtime testing, plugin loading fixes, 40 automated tests, trust serde fix
- **0.0.5** - deno_core ops bridge (9 ops), plugin API calls execute real Rust operations
- **0.0.4** - Native file I/O, file dialogs, DiffView, settings UI, permission dialog, file watcher cleanup
- **0.0.3** - Compilation fixes, editor commands, command palette, notifications
- **0.0.2** - Plugin system architecture (backend + frontend stores)
- **0.0.1** - Initial Svelte + Tauri + CodeMirror setup

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
