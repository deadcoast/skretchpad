# Gap Analysis: Architecture Docs vs Actual Source Code

**Date**: 2026-02-08
**Scope**: All files under `Docs/architecture/` compared against `src-tauri/src/` and `src/`
**Method**: Systematic section-by-section comparison of documented features against implemented code

---

## Summary

| Category | Documented | Implemented | Gap Severity |
|----------|-----------|-------------|-------------|
| Theme Engine | Full TOML pipeline + color derivation + validation | TOML parse + CSS vars (**no** validation, **no** color derivation, **no** hot-reload watcher) | **HIGH** |
| Plugin Capabilities | Fully typed enums + scoped paths | Fully implemented + tested | LOW |
| Plugin Trust/Signatures | TrustLevel + signature verification | TrustLevel implemented; signature verification is **stub** (no real crypto) | MEDIUM |
| Plugin Sandbox | deno_core with resource limits + memory checks | deno_core worker runs; **no** memory limit checks, **no** per-op timeout enforcement | **HIGH** |
| Plugin API (Frontend) | 29+ invoke calls across 7 API classes | Only ~15 have backend handlers; **~14 invoke calls hit dead ends** | **HIGH** |
| Git Plugin | Full TypeScript class with status/diff/commit/push/pull/branch | Only `main.js` sandbox scripts; **no** TypeScript plugin class, **no** sidebar UI | **HIGH** |
| Theme Hot-Reload | File watcher + `theme:reload` event | `theme:reload` listener exists in `ThemeEngine` but **no** file watcher set up | MEDIUM |
| Theme Validation | `is_valid_css_color()` + blur bounds checking | **Not implemented** -- no validation on parsed themes | MEDIUM |
| Theme Color Derivation | `ColorScheme` + HSV-based palette generation | **Not implemented** -- no `palette` crate, no `color_utils.rs` | **HIGH** |
| Theme Frontend Store | Rich `Theme` interface with `palette`, `ui`, `editor.line/gutter` fields | Store exists with full types but **disconnected from Rust backend** -- uses hardcoded JS themes | **HIGH** |
| Theme TOML Files | 1 documented (`liquid-glass-dark.toml`) | 3 exist (`milkytext.toml`, `glass-dark.toml`, `glass-light.toml`) | OK |
| ThemeEngine class (TS) | Instantiated, applies themes via `invoke('load_theme')` | Class exists but **never instantiated** in app -- `theme.ts` store handles theming directly | MEDIUM |
| Plugin Permission Dialog | Svelte component with risk badges | Component exists (`PluginPermissionDialog.svelte`) | LOW |
| Security Threat Matrix | `threat_matrix.rs` with threat levels | File exists but is **dead code** (`#[allow(dead_code)]` on module) | LOW |
| Window Shadow | `shadow.color`, `shadow.blur`, `shadow.offset` | **Not in Rust structs** -- `WindowTheme` has no shadow field | MEDIUM |
| Chrome Active State | `active.background`, `active.border` in docs | **Not in Rust structs** -- `ChromeTheme` has no active fields | LOW |
| Editor Line/Gutter | `line.active`, `line.number`, `gutter.background` | **Not in Rust `EditorTheme`** -- but IS in frontend `theme.ts` store | MEDIUM |
| UI Button/Input/Tooltip | Full UI theme section in docs | Rust has minimal `UiTheme` (only `status_bar`); Frontend has full `UiTheme` type | MEDIUM |
| Syntax Language Overrides | `[syntax.python]`, `[syntax.rust]`, `[syntax.markdown]` | **Not supported** -- Rust `SyntaxTheme` has only base tokens | MEDIUM |
| Status Bar Module Doc | `StatusBar.svelte.md` is modified (in git status) | StatusBar.svelte exists | OK |

---

## Detailed Findings

### 1. THEME ENGINE -- Highest Gap Area

#### What the docs describe (`3_technical-details.md` Section 3):

1. **Theme Definition Format** -- Rich TOML with `[window]`, `[chrome]`, `[editor]`, `[syntax]`, `[ui]`, `[transitions]` sections, including:
   - `window.shadow` (color, blur, offset)
   - `chrome.active.background` / `chrome.active.border`
   - `editor.cursor.blink_interval`
   - `editor.line.active` / `line.number` / `line.number.active`
   - `editor.gutter.background` / `gutter.width`
   - `editor.selection.foreground`
   - Full `[ui]` with buttons, inputs, tooltips
   - `[syntax.python]`, `[syntax.rust]`, `[syntax.markdown]` language-specific overrides

2. **Theme Engine (Rust)** -- Fully typed `Theme` struct with:
   - `Theme::from_toml()` with validation
   - `Theme::to_css_vars()` generating all CSS properties
   - `Theme::validate()` -- checks CSS color validity, blur bounds
   - `ThemeBase` enum (`Dark`, `Light`, `HighContrast`)

3. **Theme Transitions** -- CSS file with `.theme-transitioning *` transitions, glass effects

4. **Color Scheme Derivation** -- `ColorScheme::from_base()` using `palette` crate (HSV color theory), `generate_syntax_palette()` auto-generating complementary colors, `generate_theme_from_color` Tauri command

5. **Frontend ThemeEngine class** -- Instantiated, calls `invoke('load_theme')`, applies CSS vars, transitions, persists to localStorage, listens for `theme:reload`

6. **Hot-Reload** -- `hot_reload_theme` Tauri command, file watcher on theme TOML

#### What's actually implemented:

**Rust (`theme_engine.rs`)**:
- `Theme` struct **partially** matches -- has `metadata`, `window`, `chrome`, `editor`, `syntax`, `ui` (optional), `transitions` (optional)
- **Missing from Rust structs**: `window.shadow`, `chrome.active`, `editor.cursor.blink_interval`, `editor.line`, `editor.gutter`, `editor.selection.foreground`, `editor.fontFamily/fontSize/lineHeight`, UI buttons/inputs/tooltips
- `to_css_vars()` **works** but generates a subset of the documented CSS vars
- **No** `validate()` method
- **No** `is_valid_css_color()` function
- `ThemeBase` is `String` not an enum (metadata.base is plain String)
- 4 Tauri commands registered: `load_theme`, `apply_theme`, `get_theme_metadata`, `list_themes`
- **No** `hot_reload_theme` command
- **No** `generate_theme_from_color` command
- **No** `palette` crate dependency
- **No** `color_utils.rs` file

**Frontend (`theme.ts` store)**:
- Has a **richer** `Theme` interface than Rust: includes `palette` (16-color ANSI), `editor.line`, `editor.gutter`, `editor.fontFamily/fontSize/lineHeight`, full `UiTheme` with 25+ fields
- Contains **hardcoded** themes (MILKYTEXT, LIQUID_GLASS_DARK) in TypeScript
- `applyThemeToDocument()` sets **85+ CSS variables** directly from the TS object
- **Does NOT call the Rust backend** -- themes are applied purely from JS constants
- The Rust backend themes (TOML files) are **never loaded by the frontend**

**Frontend (`theme-engine.ts`)**:
- `ThemeEngine` class exists exactly as documented
- But it is **never instantiated** anywhere in the app
- The app uses the `themeStore` from `theme.ts` instead, which is self-contained in JS

**Disconnect**: Two parallel theme systems exist:
1. Rust: TOML files -> parse -> CSS vars (tested, 3 themes on disk)
2. Frontend: Hardcoded TS objects -> `document.documentElement.style.setProperty()` (actually used)

**They don't talk to each other.**

#### Not Implemented:
- [ ] `palette` crate for HSV color derivation
- [ ] `ColorScheme` / `generate_syntax_palette()`
- [ ] `generate_theme_from_color` command
- [ ] `hot_reload_theme` command / file watcher
- [ ] `Theme::validate()`
- [ ] Language-specific syntax overrides (`[syntax.python]`, etc.)
- [ ] Window shadow in TOML/Rust
- [ ] Chrome active state in TOML/Rust
- [ ] Editor line/gutter in Rust structs
- [ ] ThemeEngine class instantiation / wiring to app
- [ ] Frontend calling Rust backend for themes

---

### 2. PLUGIN SYSTEM

#### 2a. Capabilities (`capabilities.rs`) -- GOOD MATCH
Docs describe capability-based security with `FilesystemCapability`, `NetworkCapability`, `CommandCapability`, `UiCapability`. Source matches almost exactly, including:
- All enum variants (`None`, `WorkspaceRead`, `WorkspaceReadWrite`, `Scoped`, `DomainAllowlist`, `Unrestricted`)
- Permission checking methods (`can_read`, `can_write`, `can_access`, `can_execute`)
- Merge logic, subset checks
- Comprehensive tests (25+ tests)

**Gap**: Minor -- doc shows `PathBuf` in Scoped sets, source uses `HashSet<String>`.

#### 2b. Trust/Signatures (`trust.rs`) -- PARTIAL MATCH
- `TrustLevel` enum matches (FirstParty, Verified, Community, Local)
- `auto_grant_permissions()` and `requires_signature()` match
- `PluginSignature` struct exists
- `TrustVerifier` exists but `verify_signature()` is a **stub** -- just checks if key is in trusted set, no real cryptographic verification
- No actual signature checking of plugin files

#### 2c. Sandbox (`sandbox.rs`) -- PARTIAL MATCH
Docs describe:
- `PluginSandbox` with `resource_limits: ResourceLimits` (max_memory, max_cpu_time, max_operations)
- `call_hook()` with timeout + memory limit check + heap_statistics() inspection
- `execute_with_limits()` checking heap before each execution

**What exists** (from MEMORY.md notes):
- deno_core V8 runtime in worker threads
- 9 ops registered (fs×3, network×1, command×1, UI×2, editor×2)
- Worker timeout checks **post-execution** only
- **No** pre-execution memory limit check
- **No** `ResourceLimits` struct
- **No** `heap_statistics()` inspection
- **No** per-operation rate limiting

#### 2d. Plugin API Frontend Bridge (`plugin-api.ts`) -- MAJOR GAPS

The frontend defines **7 API classes** with rich interfaces. Many invoke calls target commands that **don't exist** in the Rust backend:

**Frontend invoke calls WITHOUT backend handlers** (counted from `main.rs` registered commands):

| Frontend Call | Backend Handler | Status |
|---|---|---|
| `workspace_get_configuration` | None | MISSING |
| `workspace_update_configuration` | None | MISSING |
| `workspace_get_files` | None | MISSING |
| `workspace_find_files` | None | MISSING |
| `plugin_create_directory` | None | MISSING |
| `plugin_delete_path` | None | MISSING |
| `plugin_copy_path` | None | MISSING |
| `plugin_move_path` | None | MISSING |
| `plugin_show_confirm` | None | MISSING |
| `plugin_show_input_box` | None | MISSING |
| `plugin_show_quick_pick` | None | MISSING |
| `plugin_report_progress` | None | MISSING |
| `plugin_update_status_bar_item` | None | MISSING |
| `plugin_update_panel` | None | MISSING |
| `plugin_register_command` | None | MISSING |
| `plugin_execute_command_by_id` | None | MISSING |
| `plugin_get_commands` | None | MISSING |
| `plugin_replace_selection` | None | MISSING |
| `plugin_set_cursor_position` | None | MISSING |
| `plugin_insert_text` | None | MISSING |
| `plugin_open_file` | None | MISSING |
| `plugin_close_file` | None | MISSING |
| `plugin_save_file` | None | MISSING |
| `plugin_save_all_files` | None | MISSING |
| `plugin_open_diff_view` | None | MISSING |
| `plugin_reload_all_files` | None | MISSING |
| `plugin_apply_edits` | None | MISSING |
| `plugin_download` | None | MISSING |
| `get_plugin_metadata` | None | MISSING |

That's **~29 missing backend handlers**.

Additionally, several frontend `EditorAPI` methods return hardcoded stubs:
- `getActiveFile()` returns `null`
- `getOpenFiles()` returns `[]`
- `getContent()` returns `''`
- `getSelection()` returns `''`
- `getCursorPosition()` returns `{ line: 0, column: 0 }`

---

### 3. GIT INTEGRATION

#### What docs describe (`3_technical-details.md` Section 4):

Full TypeScript `GitPlugin` class with:
- `activate()` / `deactivate()` lifecycle
- Repository detection (`findGitRoot()`)
- Git status parsing (`--porcelain=v2`)
- Diff parsing with hunk extraction
- Status bar item with branch/ahead/behind/changes display
- Quick commit, push, pull operations
- Branch manager with checkout
- File watchers on `.git/` directory
- Svelte `StatusPanel.svelte` component with stage/unstage/discard/diff actions

#### What actually exists:

Two plugins in `plugins/`:
- `plugins/git/plugin.toml` + `plugins/git/main.js`
- `plugins/git-status/plugin.toml` + `plugins/git-status/main.js`

These are **sandbox scripts** (plain JavaScript using deno_core ops), not TypeScript classes using the `PluginContext` API. They use `globalThis.__hooks__` for hook registration and `Skretchpad.commands.execute()` / `Skretchpad.ui.showNotification()` from the ops bridge.

**Not implemented**:
- [ ] Full `GitPlugin` TypeScript class
- [ ] Repository detection in plugin code
- [ ] Git status parsing (`--porcelain=v2`)
- [ ] Diff parsing with hunks
- [ ] Rich status bar integration (branch + ahead/behind)
- [ ] Quick commit / push / pull commands
- [ ] Branch manager
- [ ] `StatusPanel.svelte` Svelte component
- [ ] File watcher on `.git/` directory (from plugin side)

The plugins are minimal proof-of-concept scripts that demonstrate the sandbox bridge works, not the full-featured git integration described in docs.

---

### 4. SECURITY / THREAT MATRIX

`src-tauri/src/security/threat_matrix.rs` exists but the entire `security` module is dead code (`#[allow(dead_code)]` on the `plugin_system` module in `main.rs`). The threat matrix is documentation-as-code but not referenced anywhere.

---

### 5. EDITOR COMMANDS (API Commands from Rust)

**Registered backend commands** (from `main.rs`):

Native file ops (5): `read_file`, `write_file`, `save_file`, `get_file_metadata`, `emit_editor_event`

Plugin management (7): `discover_plugins`, `load_plugin`, `activate_plugin`, `deactivate_plugin`, `reload_plugin`, `get_plugin_status`, `get_all_plugin_statuses`

Plugin API (18): `plugin_read_file`, `plugin_write_file`, `plugin_list_directory`, `plugin_watch_path`, `plugin_unwatch_path`, `plugin_fetch`, `plugin_execute_command`, `plugin_show_notification`, `plugin_add_status_bar_item`, `plugin_remove_status_bar_item`, `plugin_show_panel`, `plugin_hide_panel`, `plugin_get_editor_content`, `plugin_set_editor_content`, `plugin_get_active_file`, `plugin_register_event`, `plugin_emit_event`, `plugin_execute_hook`

Audit (2): `get_audit_logs`, `clear_audit_logs`

Theme (4): `load_theme`, `apply_theme`, `get_theme_metadata`, `list_themes`

**Total registered: 36 commands**

---

## Priority-Ordered Action Items

### P0 (Critical -- Two systems diverged)
1. **Unify theme systems**: Frontend `theme.ts` store ignores Rust TOML pipeline entirely. Need to either:
   - Wire frontend to call `load_theme`/`apply_theme` Rust commands, OR
   - Move the rich theme types from TS into the TOML format and extend Rust structs

2. **Wire missing plugin API handlers**: 29 frontend invoke calls hit dead ends. These will throw errors if any plugin tries to use them.

### P1 (High -- Documented but not implemented)
3. **Theme validation**: No `validate()` on parsed themes (could crash on invalid TOML values)
4. **Sandbox resource limits**: No memory/CPU enforcement in the V8 sandbox
5. **Git plugin**: Current plugins are PoC scripts, not the documented full-featured integration
6. **Color derivation engine**: `palette` crate, `ColorScheme`, `generate_theme_from_color` -- none exist

### P2 (Medium -- Partial implementations)
7. **Theme hot-reload**: Listener exists but no file watcher
8. **Signature verification**: Stub only, no real crypto
9. **Editor API stubs**: `getActiveFile()`, `getContent()`, etc. return null/empty
10. **Rust theme struct gaps**: Missing `window.shadow`, `editor.line/gutter`, full `ui` section

### P3 (Low -- Cosmetic/minor)
11. **Security threat_matrix.rs**: Dead code, never referenced
12. **ThemeEngine class**: Exists but unused (replaced by store)
13. **ThemeBase as String vs Enum**: Minor type safety gap

---

## File-Level Cross-Reference

| Doc Section | Documented File/Module | Actual Source File | Match |
|---|---|---|---|
| Theme TOML format | `themes/liquid-glass-dark.toml` | `themes/glass-dark.toml`, `themes/glass-light.toml`, `themes/milkytext.toml` | Partial (3 files exist, schema subset) |
| Theme Engine (Rust) | `src-tauri/src/theme_engine/mod.rs` | `src-tauri/src/theme_engine.rs` (single file, not module dir) | Partial |
| Theme Engine (TS) | `src/lib/theme-engine.ts` | `src/lib/theme-engine.ts` | EXISTS but unused |
| Theme Store | (not in arch docs) | `src/lib/stores/theme.ts` | Extra (not documented, IS the actual theme system) |
| Color Utils | `src-tauri/src/theme_engine/color_utils.rs` | Does not exist | MISSING |
| Capabilities | `src-tauri/src/plugin_system/capabilities.rs` | `src-tauri/src/plugin_system/capabilities.rs` | GOOD |
| Sandbox | `src-tauri/src/plugin_system/sandbox.rs` | `src-tauri/src/plugin_system/sandbox.rs` | Partial (no limits) |
| Plugin API | `src-tauri/src/plugin_system/api.rs` | `src-tauri/src/plugin_system/api.rs` | Partial (subset of commands) |
| Trust | `src-tauri/src/plugin_system/trust.rs` | `src-tauri/src/plugin_system/trust.rs` | Partial (stub crypto) |
| Plugin API (TS) | `src/lib/plugin-api.ts` | `src/lib/plugin-api.ts` | Types complete; implementations stub |
| Git Plugin | `plugins/git/main.ts` (TypeScript class) | `plugins/git/main.js` (sandbox script) | MAJOR GAP |
| Git Status Panel | `plugins/git/components/StatusPanel.svelte` | Does not exist | MISSING |
| Permission Dialog | `src/components/PluginPermissionDialog.svelte` | `src/components/PluginPermissionDialog.svelte` | GOOD |
| Theme Transitions CSS | `src/styles/theme-transitions.css` | Inline in components / `theme.ts` store | Partial |
| Threat Matrix | (in arch doc code samples) | `src-tauri/src/security/threat_matrix.rs` | Exists but dead code |
