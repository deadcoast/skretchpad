# Skretchpad Development Status

> Last updated: v0.0.11 (2026-02-08)

## Build Status

| Target                       | Status   | Notes                  |
|------------------------------|----------|------------------------|
| Rust backend (`cargo check`) | **PASS** | 0 errors, 0 warnings   |
| Rust backend (`cargo build`) | **PASS** | Full link verified      |
| Rust tests (`cargo test`)    | **PASS** | 178/178 tests pass     |
| Frontend (`npm run build`)   | **PASS** | 136 modules bundled    |
| Frontend tests (`vitest`)    | **PASS** | 316/316 tests pass     |
| Runtime (`tauri dev`)        | **PASS** | 2 plugins activated    |

## Module Status

### Backend (Rust) -- 13 files, ~5,700 LOC

| Module               | Status      | Description                                                                   |
|----------------------|-------------|-------------------------------------------------------------------------------|
| `main.rs`            | Operational | Tauri app setup, 40+ commands, TrustVerifier + WorkerRegistry managed state   |
| `ops.rs`             | Operational | 9 deno_core ops (fs/network/command/UI/editor) with capability validation     |
| `sandbox.rs`         | Operational | V8 sandbox, SandboxRegistry (RwLock), resource limits, timeout, cleanup       |
| `worker.rs`          | Operational | Worker thread, WorkerRegistry, send_shutdown, field getters                   |
| `capabilities.rs`    | Operational | Capability model (filesystem/network/commands/UI), presets, merge, is_subset_of |
| `loader.rs`          | Operational | TOML manifest parser, plugin registry, discovery, all error variants used     |
| `manager.rs`         | Operational | Plugin lifecycle, trust checks, event cleanup, unload, capability tier        |
| `api.rs`             | Operational | 25+ Tauri commands, FileWatcherRegistry, AuditLogger                          |
| `trust.rs`           | Operational | Trust levels (first-party/verified/community/local), TrustVerifier, signatures |
| `git.rs`             | Operational | 15 git CLI wrapper commands (status, stage, commit, push, pull, etc.)         |
| `window_manager.rs`  | Operational | Window controls                                                               |
| `theme_engine.rs`    | Operational | Theme file loading, CSS variable generation, JSON output                      |
| `language_loader.rs` | Operational | Language definition loading                                                   |

### Frontend (TypeScript/Svelte) -- 32+ files, ~11,000 LOC

#### UI Components

| Component                       | Status      | Description                                                |
|---------------------------------|-------------|------------------------------------------------------------|
| `App.svelte`                    | Operational | Main app shell, command dispatch, 18+ keyboard shortcuts   |
| `Editor.svelte`                 | Operational | CodeMirror 6 wrapper, 11 commands, auto-save, settings     |
| `Chrome.svelte`                 | Operational | Title bar, window controls, always-on-top pin, aria-labels |
| `StatusBar.svelte`              | Operational | Status bar with plugin items, trust badges, git branch     |
| `TabBar.svelte`                 | Operational | Multi-tab bar with reorder, close other/right              |
| `CommandPalette.svelte`         | Operational | Ctrl+Shift+P command palette with 18+ built-in commands    |
| `NotificationToast.svelte`      | Operational | Animated toast notifications (fly in/fade out)             |
| `SideBar.svelte`                | Operational | Activity bar + Explorer + Source Control panels            |
| `SourceControlPanel.svelte`     | Operational | VSCode-style SCM panel with staged/unstaged sections       |
| `ChangeItem.svelte`             | Operational | File change row with status badge + hover actions          |
| `PluginPermissionDialog.svelte` | Operational | Plugin permission approval with risk badges                |
| `SettingsPanel.svelte`          | Operational | Settings UI (appearance, editor, keybindings, files)       |
| `DiffView.svelte`               | Operational | Diff viewer with hunk nav, unified/side-by-side toggle     |
| `Breadcrumb.svelte`             | Operational | File path breadcrumbs above editor with clickable segments |
| `Minimap.svelte`                | Operational | Canvas-based code overview sidebar, click-to-scroll        |
| `SplitPane.svelte`              | Operational | Resizable horizontal/vertical split with drag divider      |

#### Libraries and Stores

| Module                    | Status      | Description                                                 |
|---------------------------|-------------|-------------------------------------------------------------|
| `editor-loader.ts`        | Operational | CodeMirror 6 setup, 16 languages, MergeView diff           |
| `stores/editor.ts`        | Operational | Editor state, file management, native dialog integration    |
| `stores/theme.ts`         | Operational | Async theme loading, CSS variable injection, caching        |
| `stores/keybindings.ts`   | Operational | Keybinding schemes (Default, Vim, Emacs)                    |
| `stores/plugins.ts`       | Operational | Plugin registry, trust support, unload, auto-approve        |
| `stores/git.ts`           | Operational | Reactive git state with 3s auto-refresh                     |
| `stores/notifications.ts` | Operational | Notification toast state, auto-dismiss, convenience methods |
| `stores/settings.ts`      | Operational | Settings persistence via Tauri file I/O                     |
| `stores/ui.ts`            | Operational | UI utilities (color, animation, format, showNotification)   |
| `utils/debounce.ts`       | Operational | Debounce utility                                            |

### Plugin Sandbox

| Component           | Status          | Description                                                      |
|---------------------|-----------------|------------------------------------------------------------------|
| `plugin_api.js`     | Operational     | JS API injected into sandbox, calls `Deno.core.ops.op_plugin_*`  |
| `ops.rs`            | Operational     | 9 Rust ops: fs(3), network(1), command(1), UI(2), editor(2)      |
| Extension           | Operational     | `skretchpad_plugin_ops` deno_core extension registered in worker |
| State injection     | Operational     | `PluginOpState` with capabilities, workspace_root, app_handle    |
| Entry point loading | Operational     | manager.activate() reads and executes plugin main.js in sandbox  |
| Trust verification  | Operational     | TrustVerifier checks signatures before activation                |
| Resource limits     | Operational     | check_resource_limits() enforces memory/operations bounds        |

### Plugins

| Plugin                   | Status           | Description                                                  |
|--------------------------|------------------|--------------------------------------------------------------|
| `git/plugin.toml`        | Operational      | Git integration plugin manifest (first-party)                |
| `git/main.js`            | Runtime Verified | Plugin entry point, git branch display, file save hooks      |
| `git-status/plugin.toml` | Operational      | Git status plugin manifest (first-party)                     |
| `git-status/main.js`     | Runtime Verified | Lightweight git branch status bar display                    |

### Assets

| Asset                          | Status      | Description                           |
|--------------------------------|-------------|---------------------------------------|
| `themes/glass-dark.toml`       | Operational | Default dark glass theme              |
| `themes/glass-light.toml`      | Operational | Light glass theme                     |
| `themes/milkytext.toml`        | Operational | MilkyText dark theme                  |
| `themes/cyberpunk.toml`        | Operational | Cyberpunk neon theme                  |
| `themes/nord.toml`             | Operational | Nord arctic theme                     |
| `themes/solarized-dark.toml`   | Operational | Solarized Dark theme                  |
| `languages/python.lang.json`   | Operational | Python language definition            |
| `languages/rust.lang.json`     | Operational | Rust language definition              |
| `languages/markdown.lang.json` | Operational | Markdown language definition          |
| `configs/keybindings.toml`     | Operational | Default keybinding definitions        |

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
| Go         | `@codemirror/lang-go`               | Installed |
| Java       | `@codemirror/lang-java`             | Installed |
| C/C++      | `@codemirror/lang-cpp`              | Installed |
| PHP        | `@codemirror/lang-php`              | Installed |

## Test Suite

| Module           | Tests | Description                                                    |
|------------------|-------|----------------------------------------------------------------|
| `capabilities.rs`| 16    | Filesystem, network, command, UI, presets, merge, subset       |
| `loader.rs`      | 17    | Discovery, manifest parsing, capabilities building, TOML       |
| `trust.rs`       | 7     | Serde kebab-case, trust level properties, verifier             |
| `api.rs`         | 22    | Filesystem, network, command validation, audit logger          |
| `manager.rs`     | 22    | Events, state serde, trust fields, capability tier, errors     |
| `sandbox.rs`     | 14    | Error display, resource limits, stats, registry                |
| `worker.rs`      | 12    | Response serialization, hook caching, registry ops             |
| `ops.rs`         | 12    | Sanitization, serialization                                    |
| `git.rs`         | 5     | Porcelain v2 parsing, status chars                             |
| `theme_engine.rs`| 14    | Parsing, CSS generation, JSON output, round-trip               |
| `integration`    | 6     | Cross-module capability chain, sanitization, audit             |
| **Rust Total**   | **178**| All pass                                                      |
| **Frontend**     | **316**| 10 test files (Vitest + jsdom)                                |
| **Grand Total**  | **494**| All pass                                                      |

## What Works (v0.0.11)

- Full Tauri 2.0 + Svelte 4 + CodeMirror 6 application compiles, builds, and **runs**
- **Plugin runtime verified**: 2 plugins discovered, loaded, activated end-to-end
- **Plugin trust system**: TrustVerifier, signature validation, auto-approve first-party
- **Plugin API bridge**: 9 deno_core ops connect JS plugin calls to Rust operations
- **Plugin entry point loading**: manager reads main.js and executes in V8 sandbox
- **Plugin resource limits**: Memory, operations, and timeout enforcement
- **Plugin event cleanup**: Proper event listener unregistration on deactivate
- **Plugin lifecycle**: activate/deactivate/reload/unload with lifecycle events
- **Capability validation**: filesystem path containment, network domain allowlist, command allowlist, UI permissions
- **Capability tier computation**: sandboxed/read-only/read-write/full based on preset comparison
- 15 git commands (status, stage, unstage, commit, push, pull, fetch, branch, etc.)
- Reactive git store with 3-second auto-refresh
- Source control panel with staged/unstaged sections
- Multi-tab bar with reorder, close other, close right
- 11 editor commands wired through CodeMirror 6
- Command palette (Ctrl+Shift+P) with 18+ built-in commands
- Native file open/save dialogs via `tauri-plugin-dialog`
- Native file I/O commands (read_file, write_file, save_file, get_file_metadata)
- Settings UI panel (Ctrl+,) with appearance, editor, keybinding, and file settings
- Diff viewer with hunk navigation, unified/side-by-side toggle, language support
- DOMPurify XSS sanitization for plugin HTML content
- Plugin hot-reload with file watching (dev mode)
- Breadcrumb navigation above editor
- Minimap code overview sidebar
- Split editor (Ctrl+\\)
- 6 themes (MilkyText, Glass Dark, Glass Light, Cyberpunk, Nord, Solarized Dark)
- 16 language grammars
- 40+ Tauri commands registered
- 0 compiler warnings
- 494 automated tests (178 Rust + 316 frontend)

## Known Limitations

- File Explorer panel is placeholder only
- Split editor panes share same editorStore (second pane opens independently but doesn't share tab state)
- 10 new v0.0.11 Tauri commands not yet invoked from frontend (except unload_plugin)

## Version History

| Version | Date       | Summary                                                                             |
|---------|------------|-------------------------------------------------------------------------------------|
| 0.0.11  | 2026-02-08 | Wire plugin scaffolding: trust, events, resources, WorkerRegistry, 10 new commands  |
| 0.0.10  | 2026-02-08 | DOMPurify, 3 new themes, hot-reload, breadcrumbs, minimap, split editor             |
| 0.0.9   | 2026-02-08 | Tab bar, git integration (15 commands), source control panel, diff overhaul         |
| 0.0.8   | 2026-02-08 | Dead code removal, 4 languages, settings wiring, auto-save, accessibility           |
| 0.0.7   | 2026-02-08 | Theme unification: TOML as single source of truth                                   |
| 0.0.6   | 2026-02-07 | E2E runtime testing, plugin loading fixes, 40 automated tests                       |
| 0.0.5   | 2026-02-07 | deno_core ops bridge (9 ops), plugin API calls execute real Rust operations         |
| 0.0.4   | 2026-02-07 | Native file I/O, dialogs, DiffView, settings UI, permission dialog                  |
| 0.0.3   | 2026-02-07 | Compilation fixes, editor commands, command palette, notifications                  |
| 0.0.2   | 2025-10-25 | Plugin system architecture (backend + frontend stores)                              |
| 0.0.1   | 2025-10-24 | Initial minimal working version                                                     |
