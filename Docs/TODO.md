# TODO - Skretchpad Development Tasks

> Last updated: v0.0.4 (2026-02-07)

## Completed

### v0.0.1 -- Thread Safety Architecture

- [x] Resolve `deno_core::JsRuntime` thread safety issue with worker-based architecture
- [x] Redesign plugin sandboxing for thread safety
- [x] Implement message passing between main thread and workers

### v0.0.2 -- Plugin System Implementation

- [x] `sandbox.rs` -- V8 sandbox with resource limits
- [x] `capabilities.rs` -- Capability-based permission model
- [x] `api.rs` -- 25+ Tauri commands (filesystem, network, UI, editor)
- [x] `loader.rs` -- TOML manifest parser and plugin registry
- [x] `manager.rs` -- Plugin lifecycle management
- [x] `worker.rs` -- Worker thread JS execution (deno_core)
- [x] `trust.rs` -- Trust levels (first-party, local, community)
- [x] `main.rs` -- Tauri app setup and command registration
- [x] `plugin-api.ts` -- TypeScript bridge to Rust plugin API
- [x] `editor-loader.ts` -- CodeMirror 6 setup with compartments
- [x] `theme.ts` -- Theme loading with CSS variable injection
- [x] `keybindings.ts` -- Keybinding schemes (Default, Vim, Emacs)
- [x] `editor.ts` -- Editor state and file management store
- [x] `plugins.ts` -- Plugin registry and command store
- [x] `ui.ts` -- UI utilities
- [x] `debounce.ts` -- Debounce utility
- [x] `Editor.svelte` -- CodeMirror 6 editor wrapper
- [x] `StatusBar.svelte` -- Status bar with plugin items
- [x] `SideBar.svelte` -- Side panel for plugins
- [x] `CommandPalette.svelte` -- Command palette component
- [x] `PluginPermissionDialog.svelte` -- Permission approval dialog
- [x] Git plugin manifest (`plugins/git/plugin.toml`)
- [x] Git status plugin manifest (`plugins/git-status/plugin.toml`)
- [x] Example git plugin entry point (`plugins/git/main.ts`)

### v0.0.3 -- Compilation Fixes & Feature Wiring

**Phase 1: Dependency Resolution**
- [x] Fix async-trait, uuid, reqwest, url dependency resolution
- [x] Resolve all E0432 (unresolved import) errors
- [x] Resolve all E0433 (failed to resolve) errors
- [x] `cargo check` passes without dependency errors

**Phase 2: API Mismatches**
- [x] Align SandboxRegistry API (register/get/remove methods)
- [x] Fix PluginSandbox constructor parameter mismatch
- [x] Fix `plugin_info.capabilities` vs `plugin_info.manifest.capabilities`
- [x] Fix Arc<SandboxRegistry> mutability with RwLock

**Phase 3: Thread Safety**
- [x] Fix Arc<SandboxRegistry> interior mutability (RwLock wrapping HashMap)
- [x] Fix `hook_name` lifetime in worker.rs (Box::leak for static strings)
- [x] All methods on SandboxRegistry take `&self` with async lock

**Phase 4: Serialization**
- [x] Fix notify::Event serialization (manual JSON payload)
- [x] Fix FileInfo deserialization (added Deserialize derive)
- [x] Replace broken `emit_and_wait` with oneshot channel pattern

**Phase 5: Remaining Compilation**
- [x] Fix PluginError to ManagerError conversion (Send + Sync bounds)
- [x] Fix return type mismatches in manager.rs
- [x] Fix `Window` -> `WebviewWindow` (9 occurrences in api.rs)
- [x] Eliminate all 35 compiler warnings (dead code, unused imports/variables)

**Phase 6: Frontend Wiring**
- [x] Wire 11 editor commands to CodeMirror 6 (undo, redo, comment, duplicate, delete, move, search)
- [x] Wire command palette (Ctrl+Shift+P) with 13 built-in commands
- [x] Wire always-on-top toggle to Tauri `setAlwaysOnTop()` API
- [x] Create notification toast system (store + component)
- [x] Install and enable YAML, XML, SQL language support
- [x] Add write path canonicalization (security fix)
- [x] Add capability validation on editor content APIs
- [x] Fix JSON error propagation in `plugin_get_active_file`

### v0.0.4 -- Feature Wiring & UI Completion

**Native File I/O**
- [x] Add `read_file`, `write_file`, `save_file` Tauri commands
- [x] Add `get_file_metadata` and `emit_editor_event` commands
- [x] Register all new commands in invoke_handler

**File Dialogs**
- [x] Add `tauri-plugin-dialog` (Rust + JS)
- [x] Create `src-tauri/capabilities/default.json` for Tauri 2.0 permissions
- [x] Replace `invoke('show_save_dialog')` with `@tauri-apps/plugin-dialog` API
- [x] Wire file.open, file.new, file.saveAs, file.close commands in App.svelte
- [x] Add Ctrl+O, Ctrl+N, Ctrl+Shift+S, Ctrl+W keyboard shortcuts

**File Watcher Cleanup**
- [x] Create `FileWatcherRegistry` (tokio::sync::Mutex<HashMap>)
- [x] Fix watcher drop bug (persist in managed state)
- [x] Add `plugin_unwatch_path` command

**DiffView Component**
- [x] Install `@codemirror/merge` package
- [x] Rewrite `createDiffEditor` with MergeView
- [x] Rebuild `DiffView.svelte` with proper lifecycle

**Settings UI Panel**
- [x] Create `SettingsPanel.svelte` (appearance, editor, keybindings, files)
- [x] Wire Ctrl+, shortcut and view.openSettings command
- [x] Custom toggle switches, glass-panel styling

**Plugin Permission Dialog**
- [x] Add permission approval flow to plugins.ts store
- [x] Rebuild `PluginPermissionDialog.svelte` with risk badges
- [x] Wire dialog in App.svelte

**Setup Script**
- [x] Create `setup.ps1` PowerShell install/verification script
- [x] Fix Join-Path bug for PowerShell 5.1 compatibility

**TOML Language Support**
- [x] Install `@codemirror/legacy-modes` package
- [x] Add TOML to language registry with StreamLanguage adapter
- [x] Map `.toml` extension to TOML language

**Format Document**
- [x] Integrate Prettier (standalone browser build)
- [x] Support JS, TS, JSON, HTML, CSS, Markdown, YAML formatting
- [x] Lazy-load parser plugins for code splitting

**Plugin Runtime Fixes**
- [x] Fix `PluginManifest` struct to accept flexible TOML schemas (serde defaults, raw toml::Value)
- [x] Fix plugin discovery path (dev mode resolves to project root, not AppData)
- [x] Fix `plugin_api.js` to use request queue instead of non-existent `Tauri.invoke()`
- [x] Fix `worker.rs` hook calling (use `globalThis.__hooks__` with graceful fallback)
- [x] Fix worker timeout (check elapsed after execution, not before)
- [x] Fix hook name memory leak (cached static HashMap via LazyLock)
- [x] Fix plugin deactivation (set state to Loaded instead of removing from map)
- [x] Fix event listener cleanup (await listen() Promise before storing UnlistenFn)
- [x] Rewrite git plugin main.ts to use sandbox API
- [x] Create git-status main.ts entry point
- [x] Fix git-status plugin.toml schema
- [x] Add TrustLevel Default impl
- [x] Remove duplicate PluginSignature (re-export from trust.rs)

## Remaining Work

### HIGH Priority

- [ ] Implement deno_core ops for plugin API bridge (request queue -> actual Rust operations)
- [ ] End-to-end plugin runtime testing with actual Tauri app launch

### MEDIUM Priority

### LOW Priority

- [ ] Add automated test suite (Vitest + Svelte Testing Library)
- [ ] Add more themes (cyberpunk, nord, solarized)
- [ ] Add more language definitions (Go, Java, C/C++, PHP)
- [ ] Plugin hot-reload support
- [ ] Multi-tab / split editor support
- [ ] Minimap component
- [ ] Breadcrumb navigation

## Success Criteria

1. **Compilation**: `cargo check` and `npm run build` pass with 0 errors -- **MET**
2. **Plugin Loading**: Plugins can be discovered and loaded -- **Compiles, needs runtime test**
3. **Plugin Execution**: Plugins can execute JavaScript in V8 sandbox -- **Compiles, needs runtime test**
4. **Editor Commands**: All registered commands dispatch correctly -- **MET**
5. **UI Integration**: Command palette, notifications, status bar functional -- **MET**
6. **File I/O**: Native file open/save/read/write via dialogs -- **MET**
7. **Settings UI**: Settings panel accessible via Ctrl+, -- **MET**
8. **DiffView**: Side-by-side diff with MergeView -- **MET**
