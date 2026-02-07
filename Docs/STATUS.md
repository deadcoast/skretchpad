# Skretchpad Development Status

> Last updated: v0.0.6 (2026-02-07)

## Build Status

| Target                       | Status   | Notes                |
|------------------------------|----------|----------------------|
| Rust backend (`cargo check`) | **PASS** | 0 errors, 0 warnings |
| Rust backend (`cargo build`) | **PASS** | Full link verified   |
| Rust tests (`cargo test`)    | **PASS** | 40/40 tests pass     |
| Frontend (`npm run build`)   | **PASS** | 105 modules bundled  |
| Runtime (`tauri dev`)        | **PASS** | 2 plugins activated  |
| Setup script (`setup.ps1`)   | **PASS** | 40/40 checks pass    |

## Module Status

### Backend (Rust) -- 12 files, ~5,000 LOC

| Module               | Status      | Description                                                                   |
|----------------------|-------------|-------------------------------------------------------------------------------|
| `main.rs`            | Operational | Tauri app setup, command registration, file I/O, workspace_root resolution    |
| `ops.rs`             | Operational | 9 deno_core ops (fs/network/command/UI/editor) with capability validation     |
| `sandbox.rs`         | Operational | V8 plugin sandboxing, SandboxRegistry (RwLock), passes AppHandle to worker    |
| `worker.rs`          | Operational | Worker thread, skretchpad_plugin_ops extension, PluginOpState injection       |
| `capabilities.rs`    | Operational | Capability-based permission model (filesystem/network/commands/UI)            |
| `loader.rs`          | Operational | TOML manifest parser, plugin registry, discovery (17 tests)                   |
| `manager.rs`         | Operational | Plugin lifecycle, entry point loading, workspace_root + AppHandle             |
| `api.rs`             | Operational | 25+ Tauri commands, FileWatcherRegistry, plugin_unwatch_path                  |
| `trust.rs`           | Operational | Trust levels (first-party, local, community) with kebab-case serde (7 tests)  |
| `window_manager.rs`  | Operational | Window controls                                                               |
| `theme_engine.rs`    | Operational | Theme file loading                                                            |
| `language_loader.rs` | Operational | Language definition loading                                                   |

### Frontend (TypeScript/Svelte) -- 24 files, ~10,000 LOC

#### UI Components

| Component                       | Status      | Description                                                |
|---------------------------------|-------------|------------------------------------------------------------|
| `App.svelte`                    | Operational | Main app shell, command dispatch, 18+ keyboard shortcuts   |
| `Editor.svelte`                 | Operational | CodeMirror 6 wrapper, 11 editor commands, file open dialog |
| `Chrome.svelte`                 | Operational | Title bar, window controls, always-on-top pin              |
| `StatusBar.svelte`              | Operational | Bottom status bar with plugin item slots                   |
| `CommandPalette.svelte`         | Operational | Ctrl+Shift+P command palette with 18+ built-in commands    |
| `NotificationToast.svelte`      | Operational | Animated toast notifications (fly in/fade out)             |
| `SideBar.svelte`                | Operational | Side panel for plugin UI panels                            |
| `PluginPermissionDialog.svelte` | Operational | Plugin permission approval with risk badges                |
| `SettingsPanel.svelte`          | Operational | Settings UI (appearance, editor, keybindings, files)       |
| `DiffView.svelte`               | Operational | Side-by-side diff viewer with CodeMirror MergeView         |

#### Libraries and Stores

| Module                    | Status      | Description                                                 |
|---------------------------|-------------|-------------------------------------------------------------|
| `editor-loader.ts`        | Operational | CodeMirror 6 setup, language loading, MergeView diff        |
| `plugin-api.ts`           | Operational | TypeScript bridge to Rust plugin API (25+ invoke calls)     |
| `stores/editor.ts`        | Operational | Editor state, file management, native dialog integration    |
| `stores/theme.ts`         | Operational | Theme loading, CSS variable injection, hot-reload           |
| `stores/keybindings.ts`   | Operational | Keybinding schemes (Default, Vim, Emacs)                    |
| `stores/plugins.ts`       | Operational | Plugin registry, command store, permission approval flow    |
| `stores/notifications.ts` | Operational | Notification toast state, auto-dismiss, convenience methods |
| `stores/ui.ts`            | Operational | UI utilities (color, animation, format, showNotification)   |
| `utils/debounce.ts`       | Operational | Debounce utility                                            |

### Plugin Sandbox

| Component           | Status          | Description                                                      |
|---------------------|-----------------|------------------------------------------------------------------|
| `plugin_api.js`     | Operational     | JS API injected into sandbox, calls `Deno.core.ops.op_plugin_*` |
| `ops.rs`            | Operational     | 9 Rust ops: fs(3), network(1), command(1), UI(2), editor(2)     |
| Extension           | Operational     | `skretchpad_plugin_ops` deno_core extension registered in worker |
| State injection     | Operational     | `PluginOpState` with capabilities, workspace_root, app_handle    |
| Entry point loading | Operational     | manager.activate() reads and executes plugin main.js in sandbox  |

### Plugins

| Plugin                   | Status           | Description                                                  |
|--------------------------|------------------|--------------------------------------------------------------|
| `git/plugin.toml`        | Operational      | Git integration plugin manifest                              |
| `git/main.js`            | Runtime Verified | Plugin entry point, git branch display, file save hooks      |
| `git-status/plugin.toml` | Operational      | Git status plugin manifest                                   |
| `git-status/main.js`     | Runtime Verified | Lightweight git branch status bar display                    |

### Assets

| Asset                          | Status      | Description                    |
|--------------------------------|-------------|--------------------------------|
| `themes/glass-dark.toml`       | Operational | Default dark glass theme       |
| `themes/glass-light.toml`      | Written     | Light glass theme (not tested) |
| `languages/python.lang.json`   | Operational | Python language definition     |
| `languages/rust.lang.json`     | Operational | Rust language definition       |
| `languages/markdown.lang.json` | Operational | Markdown language definition   |
| `configs/keybindings.toml`     | Operational | Default keybinding definitions |

## Language Support

| Language   | CodeMirror Package                  | Status    |
|------------|-------------------------------------|-----------|
| JavaScript | `@codemirror/lang-javascript`       | Installed |
| TypeScript | `@codemirror/lang-javascript`       | Installed |
| Python     | `@codemirror/lang-python`           | Installed |
| Rust       | `@codemirror/lang-rust`             | Installed |
| JSON       | `@codemirror/lang-json`             | Installed |
| Markdown   | `@codemirror/lang-markdown`         | Installed |
| HTML       | `@codemirror/lang-html`             | Installed |
| CSS        | `@codemirror/lang-css`              | Installed |
| YAML       | `@codemirror/lang-yaml`             | Installed |
| XML        | `@codemirror/lang-xml`              | Installed |
| SQL        | `@codemirror/lang-sql`              | Installed |
| TOML       | `@codemirror/legacy-modes` (stream) | Installed |

## Test Suite

| Module           | Tests | Description                                              |
|------------------|-------|----------------------------------------------------------|
| `capabilities.rs`| 10    | Filesystem, network, command, UI capability validation   |
| `loader.rs`      | 17    | Discovery, manifest parsing, capabilities building, TOML |
| `trust.rs`       | 7     | Serde kebab-case, trust level properties, verifier       |
| `api.rs`         | 3     | Filesystem, network, command validation helpers          |
| `manager.rs`     | 3     | Event listeners, plugin state serde                      |
| **Total**        | **40**| All pass                                                 |

## What Works (v0.0.6)

- Full Tauri 2.0 + Svelte 4 + CodeMirror 6 application compiles, builds, and **runs**
- **Plugin runtime verified**: 2 plugins discovered, loaded, activated end-to-end
- **Plugin API bridge**: 9 deno_core ops connect JS plugin calls to Rust operations
- **Plugin entry point loading**: manager reads main.js and executes in V8 sandbox
- **Capability validation in ops**: filesystem path containment, network domain allowlist, command allowlist, UI permissions
- 11 editor commands wired through CodeMirror 6 (undo, redo, comment, duplicate/delete/move lines, search)
- Command palette (Ctrl+Shift+P) with 18+ built-in commands + plugin command integration
- Native file open/save dialogs via `tauri-plugin-dialog`
- Native file I/O commands (read_file, write_file, save_file, get_file_metadata)
- Settings UI panel (Ctrl+,) with appearance, editor, keybinding, and file settings
- Side-by-side diff viewer with CodeMirror MergeView (`@codemirror/merge`)
- Plugin permission approval dialog with risk badges and capability display
- File watcher registry with proper cleanup (unwatch support)
- Notification toast system with auto-dismiss, color-coded types, action buttons
- Always-on-top window toggle via Tauri API
- Plugin system backend: sandbox, loader, manager, API, worker threads, **ops** all compile and run
- 30+ Tauri commands registered (plugin operations + file I/O)
- Capability-based security model enforced in both Tauri commands and deno_core ops
- Write path canonicalization (security hardening)
- Theme and keybinding stores with default configurations
- Keyboard shortcuts: Ctrl+O (open), Ctrl+N (new), Ctrl+S (save), Ctrl+Shift+S (save as), Ctrl+W (close), Ctrl+, (settings)
- 40 automated Rust tests passing

## Known Limitations

- **Editor ops (sync return)**: `getEditorContent` and `getActiveFile` fire events but can't return data synchronously (needs async op support or channel-based pattern)
- **Async plugin hooks**: Plugin hooks must be synchronous; `async/await` in hooks requires event loop pumping which is not yet implemented
- **~29 frontend plugin-api.ts invoke calls** have no backend handler (legacy bridge, superseded by deno_core ops for sandbox plugins)

## Version History

| Version | Date       | Summary                                                                             |
|---------|------------|-------------------------------------------------------------------------------------|
| 0.0.6   | 2026-02-07 | E2E runtime testing, plugin loading fixes, 40 automated tests, trust serde fix      |
| 0.0.5   | 2026-02-07 | deno_core ops bridge (9 ops), plugin API calls execute real Rust operations          |
| 0.0.4   | 2026-02-07 | Native file I/O, dialogs, DiffView, settings UI, permission dialog, watcher cleanup |
| 0.0.3   | 2026-02-07 | Compilation fixes, editor commands, command palette, notifications                  |
| 0.0.2   | 2025-10-25 | Plugin system architecture (backend + frontend stores)                              |
| 0.1.0   | 2025-10-24 | Initial minimal working version                                                     |
