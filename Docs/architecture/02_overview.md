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

- [Editor](src/components/Editor.svelte) | [editor-store](`src/lib/stores/editor.ts`)
- [application of themes](src/lib/stores/theme.ts) | [Theme loading](src-tauri/src/theme_engine.rs)
- [Plugin lifecycle](`src/lib/stores/plugins.ts`) | [trust/capabilities](src-tauri/src/plugin_system/*)
- [source-control](src/lib/stores/git.ts) | [diff-view](src/features/diff/DiffView.svelte)
- [chrome](`src/components/Chrome.svelte`) | [status](src/components/StatusBar.svelte) | [shell](src/components/SideBar.svelte)

## Current Baseline (v0.1.0)

- 66 registered Tauri commands
- 19 Svelte component files
- 6 built-in themes
- 2 local plugins
- 327 frontend tests and 191 Rust tests passing

## Canonical References

- [Release-status](Docs/reports/STATUS_2026-02-10.md)
- [Task-tracking](Docs/TODO.md)
- [Changelog](Docs/CHANGELOG.md)
- [Directory-map](Docs/architecture/01_directory-tree.md)
