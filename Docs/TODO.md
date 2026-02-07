# TODO - Skretchpad Development Tasks

> Last updated: v0.0.3 (2026-02-07)

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

## Remaining Work

### HIGH Priority

- [ ] Wire file open/save dialogs (backend exists, frontend needs dialog UI)
- [ ] End-to-end plugin runtime testing (plugin system compiles but untested at runtime)
- [ ] Implement file watcher cleanup (`unwatch` path)

### MEDIUM Priority

- [ ] Build DiffView component logic (currently placeholder shell)
- [ ] Wire plugin command confirmation dialog flow
- [ ] Format document integration (needs external formatter like Prettier/rustfmt)
- [ ] Add TOML language support (no official @codemirror/lang-toml -- may need community package)

### LOW Priority

- [ ] Add automated test suite (Vitest + Svelte Testing Library)
- [ ] Add more themes (cyberpunk, nord, solarized)
- [ ] Add more language definitions (Go, Java, C/C++, PHP)
- [ ] Plugin hot-reload support
- [ ] Multi-tab / split editor support
- [ ] Minimap component
- [ ] Breadcrumb navigation
- [ ] Settings UI panel

## Success Criteria

1. **Compilation**: `cargo check` and `npm run build` pass with 0 errors -- **MET**
2. **Plugin Loading**: Plugins can be discovered and loaded -- **Compiles, needs runtime test**
3. **Plugin Execution**: Plugins can execute JavaScript in V8 sandbox -- **Compiles, needs runtime test**
4. **Editor Commands**: All registered commands dispatch correctly -- **MET**
5. **UI Integration**: Command palette, notifications, status bar functional -- **MET**
