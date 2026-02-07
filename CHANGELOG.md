# Changelog

All notable changes to skretchpad will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

### Fixed

- **File watcher drop bug**: Watchers were immediately dropped after creation; now persisted in `FileWatcherRegistry`
- **Dialog invocations**: Replaced broken `invoke('show_save_dialog')` / `invoke('show_confirm_dialog')` with `@tauri-apps/plugin-dialog` API
- **setup.ps1 Join-Path bug**: Fixed 3+ argument `Join-Path` calls for PowerShell 5.1 compatibility
- **Plugin manifest parsing**: `PluginManifest` now uses flexible TOML parsing with `#[serde(default)]` and raw `toml::Value` for permissions/UI sections
- **Plugin discovery path**: Development mode now resolves plugins/ from project root instead of empty AppData directory
- **Plugin sandbox bridge**: `plugin_api.js` replaced `Tauri.invoke()` (unavailable in deno_core) with request queue pattern and `__hooks__` registration system
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

### Changed

- npm dependencies installed (were previously missing)
- `showNotification()` in ui.ts now routes to the notification store
- Editor stub functions replaced with real CodeMirror command implementations
- `_editorAPI` console.log removed; replaced with proper `editorCommands` export

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

### Known Issues

- Code written but not compiled -- 13+ Rust errors present
- npm dependencies not installed
- Editor commands were stubs (no implementations)

## [0.1.0] - 2025-10-24

### Added

- Basic Tauri 2.0 application setup
- Simple Svelte 4 frontend structure
- Basic CodeMirror 6 editor integration
- Simple UI components (Chrome, Editor, StatusBar)
- Working build pipeline for frontend and backend
- Glass dark theme (TOML-based)
- Language definitions for Python, Rust, Markdown

---

## Version History

- **0.0.4** - Native file I/O, file dialogs, DiffView, settings UI, permission dialog, file watcher cleanup
- **0.0.3** - Compilation fixes, editor commands, command palette, notifications
- **0.0.2** - Plugin system architecture (backend + frontend stores)
- **0.1.0** - Initial minimal working version

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
