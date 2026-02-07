# Skretchpad Development Status

> Last updated: v0.0.4 (2026-02-07)

## Build Status

| Target | Status | Notes |
|--------|--------|-------|
| Rust backend (`cargo check`) | **PASS** | 0 errors, 0 warnings |
| Frontend (`npm run build`) | **PASS** | 105 modules bundled |
| Setup script (`setup.ps1`) | **PASS** | 40/40 checks pass |

## Module Status

### Backend (Rust) -- 11 files, ~4,500 LOC

| Module | Status | Description |
|--------|--------|-------------|
| `main.rs` | Operational | Tauri app setup, command registration, file I/O commands, dialog plugin |
| `sandbox.rs` | Operational | V8 plugin sandboxing with deno_core, thread-safe SandboxRegistry (RwLock) |
| `worker.rs` | Operational | Worker thread JS execution, message passing |
| `capabilities.rs` | Operational | Capability-based permission model (filesystem/network/commands/UI) |
| `loader.rs` | Operational | TOML manifest parser, plugin registry, discovery |
| `manager.rs` | Operational | Plugin lifecycle (discover/load/activate/deactivate) |
| `api.rs` | Operational | 25+ Tauri commands, FileWatcherRegistry, plugin_unwatch_path |
| `trust.rs` | Operational | Trust levels (first-party, local, community) |
| `window_manager.rs` | Operational | Window controls |
| `theme_engine.rs` | Operational | Theme file loading |
| `language_loader.rs` | Operational | Language definition loading |

### Frontend (TypeScript/Svelte) -- 24 files, ~10,000 LOC

#### UI Components

| Component | Status | Description |
|-----------|--------|-------------|
| `App.svelte` | Operational | Main app shell, command dispatch, 18+ keyboard shortcuts |
| `Editor.svelte` | Operational | CodeMirror 6 wrapper, 11 editor commands, file open dialog |
| `Chrome.svelte` | Operational | Title bar, window controls, always-on-top pin |
| `StatusBar.svelte` | Operational | Bottom status bar with plugin item slots |
| `CommandPalette.svelte` | Operational | Ctrl+Shift+P command palette with 18+ built-in commands |
| `NotificationToast.svelte` | Operational | Animated toast notifications (fly in/fade out) |
| `SideBar.svelte` | Operational | Side panel for plugin UI panels |
| `PluginPermissionDialog.svelte` | Operational | Plugin permission approval with risk badges |
| `SettingsPanel.svelte` | Operational | Settings UI (appearance, editor, keybindings, files) |
| `DiffView.svelte` | Operational | Side-by-side diff viewer with CodeMirror MergeView |

#### Libraries and Stores

| Module | Status | Description |
|--------|--------|-------------|
| `editor-loader.ts` | Operational | CodeMirror 6 setup, language loading, MergeView diff |
| `plugin-api.ts` | Operational | TypeScript bridge to Rust plugin API (25+ invoke calls) |
| `stores/editor.ts` | Operational | Editor state, file management, native dialog integration |
| `stores/theme.ts` | Operational | Theme loading, CSS variable injection, hot-reload |
| `stores/keybindings.ts` | Operational | Keybinding schemes (Default, Vim, Emacs) |
| `stores/plugins.ts` | Operational | Plugin registry, command store, permission approval flow |
| `stores/notifications.ts` | Operational | Notification toast state, auto-dismiss, convenience methods |
| `stores/ui.ts` | Operational | UI utilities (color, animation, format, showNotification) |
| `utils/debounce.ts` | Operational | Debounce utility |

### Plugins

| Plugin | Status | Description |
|--------|--------|-------------|
| `git/plugin.toml` | Manifest | Git integration plugin manifest |
| `git/main.ts` | Written | Plugin entry point (sandbox API, not runtime-tested) |
| `git-status/plugin.toml` | Manifest | Git status plugin manifest |
| `git-status/main.ts` | Written | Plugin entry point (sandbox API, not runtime-tested) |

### Assets

| Asset | Status | Description |
|-------|--------|-------------|
| `themes/glass-dark.toml` | Operational | Default dark glass theme |
| `themes/glass-light.toml` | Written | Light glass theme (not tested) |
| `languages/python.lang.json` | Operational | Python language definition |
| `languages/rust.lang.json` | Operational | Rust language definition |
| `languages/markdown.lang.json` | Operational | Markdown language definition |
| `configs/keybindings.toml` | Operational | Default keybinding definitions |

## Language Support

| Language | CodeMirror Package | Status |
|----------|--------------------|--------|
| JavaScript | `@codemirror/lang-javascript` | Installed |
| TypeScript | `@codemirror/lang-javascript` | Installed |
| Python | `@codemirror/lang-python` | Installed |
| Rust | `@codemirror/lang-rust` | Installed |
| JSON | `@codemirror/lang-json` | Installed |
| Markdown | `@codemirror/lang-markdown` | Installed |
| HTML | `@codemirror/lang-html` | Installed |
| CSS | `@codemirror/lang-css` | Installed |
| YAML | `@codemirror/lang-yaml` | Installed |
| XML | `@codemirror/lang-xml` | Installed |
| SQL | `@codemirror/lang-sql` | Installed |
| TOML | `@codemirror/legacy-modes` (stream) | Installed |

## What Works (v0.0.4)

- Full Tauri 2.0 + Svelte 4 + CodeMirror 6 application compiles and builds
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
- Plugin system backend: sandbox, loader, manager, API, worker threads all compile
- 30+ Tauri commands registered (plugin operations + file I/O)
- Capability-based security model enforced on editor content APIs
- Write path canonicalization (security hardening)
- Theme and keybinding stores with default configurations
- Keyboard shortcuts: Ctrl+O (open), Ctrl+N (new), Ctrl+S (save), Ctrl+Shift+S (save as), Ctrl+W (close), Ctrl+, (settings)

## What's Not Wired Yet

- **Plugin deno_core ops**: Request queue in plugin sandbox needs Rust ops to execute actual API calls
- **End-to-end plugin testing**: Plugin system compiles and code paths verified, needs runtime test with actual Tauri app

## Version History

| Version | Date | Summary |
|---------|------|---------|
| 0.0.4 | 2026-02-07 | Native file I/O, dialogs, DiffView, settings UI, permission dialog, watcher cleanup |
| 0.0.3 | 2026-02-07 | Compilation fixes, editor commands, command palette, notifications |
| 0.0.2 | 2025-10-25 | Plugin system architecture (backend + frontend stores) |
| 0.1.0 | 2025-10-24 | Initial minimal working version |
