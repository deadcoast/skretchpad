# TODO - Skretchpad Development Tasks

> Last updated: v0.0.6 (2026-02-07)

## Completed

### v0.0.6 -- End-to-End Plugin Runtime Testing

- [x] Full `cargo build` linking verification (not just check)
- [x] Fix plugin entry point loading (scripts were never executed in sandbox)
- [x] Fix TrustLevel serde: `#[serde(rename_all = "kebab-case")]` for TOML compatibility
- [x] Convert plugin scripts from TypeScript to JavaScript (deno_core has no TS transpiler)
- [x] Fix plugin command result handling (`result.stdout.trim()` instead of raw object)
- [x] Make plugin hooks synchronous (async hooks can't resolve without event loop pump)
- [x] Update manifest default entry point: `main.ts` -> `main.js`
- [x] Runtime verification: app launches, discovers 2 plugins, loads and activates both
- [x] Add 40 automated Rust tests (loader: 17, trust: 7, capabilities: 10, api: 3, manager: 3)
- [x] Add `tempfile` dev-dependency for test fixtures
- [x] Fix pre-existing `CommandCapability` import in api.rs tests

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

(none)

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
2. **Plugin Loading**: Plugins can be discovered and loaded -- **MET (runtime verified)**
3. **Plugin Execution**: Plugins can execute JavaScript in V8 sandbox -- **MET (runtime verified)**
4. **Plugin API Bridge**: Plugin JS calls execute real Rust operations -- **MET (9 ops)**
5. **Editor Commands**: All registered commands dispatch correctly -- **MET**
6. **UI Integration**: Command palette, notifications, status bar functional -- **MET**
7. **File I/O**: Native file open/save/read/write via dialogs -- **MET**
8. **Settings UI**: Settings panel accessible via Ctrl+, -- **MET**
9. **DiffView**: Side-by-side diff with MergeView -- **MET**
10. **E2E Runtime**: App launches, plugins discover/load/activate, ops execute -- **MET**
11. **Test Suite**: 40 automated Rust unit tests pass -- **MET**
