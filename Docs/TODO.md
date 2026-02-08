# TODO - Skretchpad Development Tasks

> Last updated: v0.0.8 (2026-02-08)

---

## Completed

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

---

## Remaining Work

### MEDIUM Priority

- [ ] **More themes**: Cyberpunk, Nord, Solarized
- [ ] **Plugin hot-reload**: Watch plugin directory for changes, auto-reload
- [ ] **Multi-tab / split editor**: Tab bar with multiple open files

### LOW Priority

- [ ] **Minimap component**: Code overview sidebar
- [ ] **Breadcrumb navigation**: File path breadcrumbs above editor
- [ ] **XSS in plugin panel HTML**: Sanitize or sandbox plugin HTML before rendering (DOMPurify or iframe sandbox)
- [ ] **Dead plugin files**: Delete `plugins/git/main.ts`, `plugins/git-status/main.ts`, `plugins/git/components/StatusPanel.svelte` (superseded by `.js` versions)

---

## Current Stats

| Metric | Value |
|--------|-------|
| Frontend tests | 310 (10 files) |
| Rust tests | 148 (7 modules) |
| Total tests | 458 |
| Frontend coverage | 98.8% statements, 87.9% branches |
| Vite modules | 122 |
| Languages supported | 16 |
| Themes | 3 (MilkyText, Liquid Glass Dark, Liquid Glass Light) |
| CSS variables | 85+ |
| Plugin bridge ops | 9 |
| Command palette commands | 18+ |
| Keyboard shortcuts | 17 |

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
