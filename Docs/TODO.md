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
