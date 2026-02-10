# TODO - Skretchpad Development Tasks

> Last updated: v0.0.11 (2026-02-08)

---

## Completed

### v0.0.11 - Wire Plugin System Scaffolding

- [x] **Trust system integration**: TrustVerifier managed state, signature validation in activate, auto_grant_permissions for first-party
- [x] **PluginStatus enriched**: trust, loaded_at, auto_approve, capability_tier fields
- [x] **Capability tier computation**: is_subset_of + presets (none/workspace_read/workspace_read_write/first_party)
- [x] **Event cleanup on deactivate**: unregister_event_listener for all events, lifecycle events emitted
- [x] **Real resource limit enforcement**: check_resource_limits returns MemoryLimitExceeded/RateLimitExceeded
- [x] **WorkerRegistry**: Managed state tracking workers alongside SandboxRegistry
- [x] **10 new Tauri commands**: unload_plugin, get_plugin_event_listeners, get_file_watcher_count, list_active_sandboxes, get_plugin_resource_stats, grant_plugin_capability, add/remove_trusted_key, get_worker_info, register_plugin_worker
- [x] **Frontend trust support**: TrustLevel type, auto-approve first-party, unload method, trust badges
- [x] **Dead code elimination**: All 24 warnings resolved by wiring APIs into real execution paths (0 warnings)

### v0.0.10 - Security, Themes & UI Components

- [x] **DOMPurify**: XSS sanitization for plugin panel HTML content and status bar text
- [x] **3 new themes**: Cyberpunk, Nord, Solarized Dark (6 total, auto-discovered)
- [x] **Plugin hot-reload**: notify-based file watcher on plugin dirs, debounced 500ms
- [x] **Breadcrumb.svelte**: File path breadcrumbs above editor with clickable segments
- [x] **Minimap.svelte**: Canvas-based code overview sidebar, click-to-scroll
- [x] **SplitPane.svelte**: Resizable horizontal/vertical split with drag divider
- [x] **Split editor**: Ctrl+\\ toggles split, view.splitEditorRight/Down/Close commands
- [x] **Dead plugin files**: Superseded .ts files cleaned up

### v0.0.9 - Tab Bar, Git Integration & Source Control

- [x] **TabBar.svelte**: Visual multi-tab bar with reorderTabs, closeOtherTabs, closeTabsToRight
- [x] **git.rs**: 15 Tauri commands wrapping git CLI
- [x] **git.ts**: Reactive Svelte store with 3s auto-refresh
- [x] **SideBar overhaul**: Activity bar (40px icon strip) + built-in panels (Explorer, Source Control)
- [x] **SourceControlPanel.svelte**: VSCode-style SCM panel with staged/unstaged sections
- [x] **ChangeItem.svelte**: File change row with status badge + hover actions
- [x] **StatusBar.svelte**: Built-in git branch + sync status
- [x] **DiffView overhaul**: Hunk nav (Alt+Up/Down), unified/side-by-side toggle, language support, stats
- [x] **9 new SVG icons**: git-related icons
- [x] **Ctrl+Shift+G**: Source Control shortcut

### v0.0.8 - Plugin System Improvements

- [x] **Dead code removal**: Deleted `src/lib/plugin-api.ts` (1,194 lines, zero imports anywhere)
- [x] **4 new language grammars**: Go, Java, C/C++, PHP (16 total)
- [x] **Editor settings wiring**: `settingsStore` -> CodeMirror compartments (wordWrap, lineNumbers, tabSize, fontSize)
- [x] **Auto-save**: Timer-based save on doc change, respects `autoSave` and `autoSaveDelay` settings
- [x] **Accessibility pass**: ARIA labels on Chrome.svelte window controls, `role=menubar`/`aria-haspopup`/`aria-expanded` on menus, `role=tablist`/`tab`/`tabpanel` + `aria-selected` on SideBar
- [x] **Editor ops round-trip**: `SharedEditorState` (Arc<Mutex>) pushed from frontend via `update_editor_state` command, read synchronously by plugin ops (no more fire-and-forget events)
- [x] **Async hook support**: Event loop pumped after script/hook execution in worker.rs (tokio runtime + 5s timeout)

### v0.0.7 - Theme Unification

- [x] **Phase 5 (Orphaned Modules)**: Integrated `theme_engine.rs` into `main.rs`, expanded all structs, added `load_theme_data` + `list_themes` commands
- [x] **Phase 6 (TOML Theme Fix)**: Fixed `[chrome]` section conflicts (`background.color` + `background.blur`), corrected `milkytext.toml` values
- [x] **Theme store refactor**: Removed hardcoded `MILKYTEXT` and `LIQUID_GLASS_DARK` constants (~220 LOC), added async `init()` loading from backend
- [x] **Dead code cleanup**: Deleted `theme-engine.ts` (69 lines) and `theme-engine.test.ts` (104 lines)
- [x] **SettingsPanel theme selector**: Now uses `ThemeInfo.name` from `$themeStore.available` instead of hardcoded options
- [x] **TOML theme files**: All 3 themes fully populated with palette, chrome, editor, syntax, UI, and transitions sections
- [x] **Theme tests**: 16 frontend tests + 100+ Rust tests for theme parsing, CSS generation, JSON output

### v0.0.6 - Testing Suite & CI/CD

- [x] **310 frontend tests** across 10 test files (Vitest + jsdom)
- [x] **148 Rust tests** across 7 modules (cargo test)
- [x] **Vitest config** with V8 coverage, Tauri API mocks, path aliases
- [x] **GitHub Actions CI** workflow (lint, test, build on Ubuntu + Windows)
- [x] **Husky + lint-staged** pre-commit hooks (ESLint, Prettier, cargo fmt)
- [x] **Settings store** (`settings.ts`) with persistence via Tauri file I/O

### v0.0.5 - Plugin Runtime

- [x] **9 deno_core ops** bridge: filesystem (3), network (1), commands (1), UI (2), editor (2)
- [x] **Plugin entry point loading**: manager reads `main.js`, executes in sandbox, calls hooks
- [x] **E2E runtime**: App launches, discovers 2 plugins, loads and activates both

### v0.0.4 - Core Features

- [x] **SVG icon system**: 16 inline SVG icons replacing all emoji/HTML entities
- [x] **Window controls**: Minimize, maximize, close wired to Tauri API
- [x] **Chrome toggle**: CSS animation + `Ctrl+Shift+H` keyboard shortcut
- [x] **Native file I/O**: `read_file`, `write_file`, `save_file`, `get_file_metadata` commands
- [x] **File dialogs**: `@tauri-apps/plugin-dialog` for open/save/confirm
- [x] **DiffView**: Side-by-side diff viewer with `@codemirror/merge`
- [x] **Settings panel**: Appearance, editor, keybindings, files (Ctrl+,)
- [x] **Plugin permission dialog**: Risk badges, capability display, approve/deny flow
- [x] **Format document**: Prettier integration (JS, TS, JSON, HTML, CSS, MD, YAML)
- [x] **TOML language support**: Via `@codemirror/legacy-modes` StreamLanguage
- [x] **16 language grammars**: JS, TS, Python, Rust, JSON, MD, HTML, CSS, YAML, XML, SQL, TOML, Go, Java, C/C++, PHP
- [x] **File Explorer panel**: Currently placeholder, needs tree view with file operations

---

## PRIORITY WORK
- [ ] **Terminal panel**: Integrated terminal emulator
- [ ] **Search across files**: Project-wide search (Ctrl+Shift+F)
- [ ] **Frontend wiring for new commands**: 10 new v0.1.0 Tauri commands need UI hooks (except unload_plugin)

### REMAINING WORK

- [ ] **Split editor state sharing**: Second pane opens independently but doesn't share tab state with main pane
- [ ] **Plugin marketplace/registry**: Discovery and installation of third-party plugins

---

## Current Stats

| Metric                   | Value                                                                     |
|--------------------------|---------------------------------------------------------------------------|
| Frontend tests           | 316 (10 files)                                                            |
| Rust tests               | 178 (11 modules)                                                          |
| Total tests              | 494                                                                       |
| Vite modules             | 136                                                                       |
| Languages supported      | 16                                                                        |
| Themes                   | 6 (MilkyText, Glass Dark, Glass Light, Cyberpunk, Nord, Solarized Dark)   |
| CSS variables            | 85+                                                                       |
| Plugin bridge ops        | 9                                                                         |
| Tauri commands           | 40+                                                                       |
| Command palette commands | 18+                                                                       |
| Keyboard shortcuts       | 20+                                                                       |
| Cargo warnings           | 0                                                                         |

---

## Design Principles

All visual changes must adhere to:

- **Minimal Retro Futurism**: Retro analog sci-fi meets modern minimalism
- Clean geometric shapes, no decorative excess
- Consistent 1.5px stroke weight on icons
- Color palette: `#00d9ff` (primary/accent), `#e4e4e4` (text), dark glass backgrounds
- Glass morphism: `backdrop-filter: blur()`, semi-transparent backgrounds
- Smooth transitions: 100-200ms ease-out
- Monospace secondary font for technical UI elements
