# Skretchpad Development Status

> Last updated: v0.0.3 (2026-02-07)

## Build Status

| Target | Status | Notes |
|--------|--------|-------|
| Rust backend (`cargo build`) | **PASS** | 0 errors, 0 warnings |
| Frontend (`npm run build`) | **PASS** | 90 modules bundled |
| Svelte check (`npx svelte-check`) | **PASS** | 0 errors, 6 a11y warnings (pre-existing) |

## Module Status

### Backend (Rust) -- 8 files, ~4,000 LOC

| Module | Status | Description |
|--------|--------|-------------|
| `main.rs` | Operational | Tauri app setup, command registration, AppState |
| `sandbox.rs` | Operational | V8 plugin sandboxing with deno_core, thread-safe SandboxRegistry (RwLock) |
| `worker.rs` | Operational | Worker thread JS execution, message passing |
| `capabilities.rs` | Operational | Capability-based permission model (filesystem/network/commands/UI) |
| `loader.rs` | Operational | TOML manifest parser, plugin registry, discovery |
| `manager.rs` | Operational | Plugin lifecycle (discover/load/activate/deactivate) |
| `api.rs` | Operational | 25+ Tauri commands for plugin filesystem, network, UI, editor ops |
| `trust.rs` | Operational | Trust levels (first-party, local, community) |
| `window_manager.rs` | Operational | Window controls |
| `theme_engine.rs` | Operational | Theme file loading |
| `language_loader.rs` | Operational | Language definition loading |

### Frontend (TypeScript/Svelte) -- 22 files, ~9,000 LOC

#### UI Components

| Component | Status | Description |
|-----------|--------|-------------|
| `App.svelte` | Operational | Main app shell, command dispatch, keyboard shortcuts |
| `Editor.svelte` | Operational | CodeMirror 6 wrapper, 11 editor commands wired |
| `Chrome.svelte` | Operational | Title bar, window controls, always-on-top pin |
| `StatusBar.svelte` | Operational | Bottom status bar with plugin item slots |
| `CommandPalette.svelte` | Operational | Ctrl+Shift+P command palette with 13 built-in commands |
| `NotificationToast.svelte` | Operational | Animated toast notifications (fly in/fade out) |
| `SideBar.svelte` | Operational | Side panel for plugin UI panels |
| `PluginPermissionDialog.svelte` | Operational | Plugin permission approval dialog |
| `DiffView.svelte` | Placeholder | Diff viewer UI (shell only, no logic) |

#### Libraries and Stores

| Module | Status | Description |
|--------|--------|-------------|
| `editor-loader.ts` | Operational | CodeMirror 6 setup, language loading, compartments |
| `plugin-api.ts` | Operational | TypeScript bridge to Rust plugin API (25+ invoke calls) |
| `stores/editor.ts` | Operational | Editor state and file management store |
| `stores/theme.ts` | Operational | Theme loading, CSS variable injection, hot-reload |
| `stores/keybindings.ts` | Operational | Keybinding schemes (Default, Vim, Emacs) |
| `stores/plugins.ts` | Operational | Plugin registry, command store, lifecycle |
| `stores/notifications.ts` | Operational | Notification toast state, auto-dismiss, convenience methods |
| `stores/ui.ts` | Operational | UI utilities (color, animation, format, showNotification) |
| `utils/debounce.ts` | Operational | Debounce utility |

### Plugins

| Plugin | Status | Description |
|--------|--------|-------------|
| `git/plugin.toml` | Manifest Only | Git integration plugin manifest |
| `git/main.ts` | Written | Plugin entry point (not runtime-tested) |
| `git-status/plugin.toml` | Manifest Only | Git status plugin manifest |

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
| TOML | N/A | No official package exists |

## What Works (v0.0.3)

- Full Tauri 2.0 + Svelte 4 + CodeMirror 6 application compiles and builds
- 11 editor commands wired through CodeMirror 6 (undo, redo, comment, duplicate/delete/move lines, search)
- Command palette (Ctrl+Shift+P) with 13 built-in commands + plugin command integration
- Notification toast system with auto-dismiss, color-coded types, action buttons
- Always-on-top window toggle via Tauri API
- Plugin system backend: sandbox, loader, manager, API, worker threads all compile
- 25+ Tauri commands registered for plugin operations
- Capability-based security model enforced on editor content APIs
- Write path canonicalization (security hardening)
- Theme and keybinding stores with default configurations

## What's Not Wired Yet

- **File open/save dialogs**: Backend commands exist but frontend UI not connected
- **DiffView component**: Placeholder shell, no diff logic
- **Plugin command confirmation dialog**: UI exists but not triggered
- **File watcher cleanup**: No `unwatch` path implemented
- **Format document**: Command registered but needs external formatter integration
- **TOML language support**: No official `@codemirror/lang-toml` package
- **End-to-end plugin testing**: Plugin system compiles but hasn't been runtime-tested with actual plugins

## Version History

| Version | Date | Summary |
|---------|------|---------|
| 0.0.3 | 2026-02-07 | Compilation fixes, editor commands, command palette, notifications |
| 0.0.2 | 2025-10-25 | Plugin system architecture (backend + frontend stores) |
| 0.1.0 | 2025-10-24 | Initial minimal working version |
