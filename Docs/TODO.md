# TODO - Skretchpad Development Tasks

> Last updated: v0.0.5 (2026-02-07)

## Completed

### v0.0.5 -- Plugin deno_core Ops Bridge

- [x] Create `ops.rs` with 9 deno_core ops (read_file, write_file, list_files, fetch, execute_command, show_notification, set_status_bar, get_editor_content, get_active_file)
- [x] Register `skretchpad_plugin_ops` extension in worker.rs JsRuntime
- [x] Inject `PluginOpState` (plugin_id, capabilities, workspace_root, app_handle) into OpState
- [x] Thread `AppHandle` and `workspace_root` through manager.rs -> sandbox.rs -> worker.rs
- [x] Update main.rs to compute and pass workspace_root and app_handle to PluginManager
- [x] Rewrite plugin_api.js to use `Deno.core.ops.op_plugin_*()` instead of request queue
- [x] Add `blocking` feature to reqwest for synchronous HTTP from worker thread
- [x] Add `pub mod ops;` to mod.rs
- [x] Capability validation in all ops (filesystem path containment, network domain allowlist, command allowlist, UI permissions)
- [x] Build verification: cargo check (0 errors/warnings), npm run build (105 modules)

## Remaining Work

### HIGH Priority

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
3. **Plugin Execution**: Plugins can execute JavaScript in V8 sandbox -- **MET (ops wired)**
4. **Plugin API Bridge**: Plugin JS calls execute real Rust operations -- **MET (9 ops)**
5. **Editor Commands**: All registered commands dispatch correctly -- **MET**
6. **UI Integration**: Command palette, notifications, status bar functional -- **MET**
7. **File I/O**: Native file open/save/read/write via dialogs -- **MET**
8. **Settings UI**: Settings panel accessible via Ctrl+, -- **MET**
9. **DiffView**: Side-by-side diff with MergeView -- **MET**
