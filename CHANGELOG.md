# Changelog

All notable changes to skretchpad will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

- **0.0.3** - Compilation fixes, editor commands, command palette, notifications
- **0.0.2** - Plugin system architecture (backend + frontend stores)
- **0.1.0** - Initial minimal working version

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
