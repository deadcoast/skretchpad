# Entry Points

> Source files: `src/main.ts`, `src/App.svelte`
> Last updated: v0.1.0 (2026-02-10)
> Status: Implemented

## Purpose

Defines app bootstrap (`main.ts`) and the main desktop shell (`App.svelte`) that wires chrome, sidebar, editor, status bar, command palette, settings, plugin startup, and keyboard shortcuts.

## Runtime Responsibilities

- App startup and boot sequence gating.
- Theme initialization and sync from settings.
- Plugin discovery/load/activation initialization.
- Command routing for file/editor/view actions.
- Global keyboard shortcuts handling.
- Open-file and open-folder flows.

## Key Integrations

- `src/components/Chrome.svelte`
- `src/components/SideBar.svelte`
- `src/components/Editor.svelte`
- `src/components/StatusBar.svelte`
- `src/lib/stores/*`
- Tauri invoke commands (`read_file`, `list_directory`, plugin and theme commands)

## Notes

- `App.svelte` is the canonical command-dispatch layer.
- `main.ts` remains intentionally minimal (Svelte mount only).

## References

- `Docs/reports/STATUS_2026-02-10.md`
- `Docs/TODO.md`
