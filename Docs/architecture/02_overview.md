# Architecture Overview

> Last updated: v0.1.0 (2026-02-10)

## Product Direction

Skretchpad is a desktop developer editor focused on three outcomes:
- fast local editing
- secure plugin execution
- theme-driven visual consistency

## Runtime Shape

- Frontend: `Svelte 4 + TypeScript` in `src/`
- Backend: `Rust + Tauri 2` in `src-tauri/`
- Editor core: `CodeMirror 6`
- Plugin runtime: `deno_core` isolate workers with capability enforcement

## Data Flow

```text
UI (Svelte components/stores)
  -> invoke() IPC commands
Rust command handlers (main.rs + plugin_system/api.rs + git.rs + theme_engine.rs)
  -> filesystem / git / plugin worker / theme loading
  -> results back to UI stores/components
```

## Major Subsystems

- Editor and file state: `src/components/Editor.svelte`, `src/lib/stores/editor.ts`
- Theme loading and application: `src/lib/stores/theme.ts`, `src-tauri/src/theme_engine.rs`
- Plugin lifecycle/trust/capabilities: `src-tauri/src/plugin_system/*`, `src/lib/stores/plugins.ts`
- Source control and diff: `src/lib/stores/git.ts`, `src/features/diff/DiffView.svelte`
- Shell/chrome/status: `src/components/Chrome.svelte`, `src/components/StatusBar.svelte`, `src/components/SideBar.svelte`

## Current Baseline (v0.1.0)

- 66 registered Tauri commands
- 19 Svelte component files
- 6 built-in themes
- 2 local plugins
- 327 frontend tests and 181 Rust tests passing

## Canonical References

- Release status: `Docs/reports/STATUS_2026-02-10.md`
- Task tracking: `Docs/TODO.md`
- Changelog: `Docs/CHANGELOG.md`
- Directory map: `Docs/architecture/01_directory-tree.md`
