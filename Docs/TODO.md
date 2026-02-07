# TODO - Skretchpad Development Tasks

> Last updated: v0.0.4 (2026-02-07)

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
