# Editor.svelte

> Source file: `src/components/Editor.svelte`
> Last updated: v0.1.0 (2026-02-10)
> Status: Implemented

## Purpose

Primary CodeMirror container used by the app for file editing, editor state synchronization, plugin hook execution, and command execution.

## Responsibilities

- Open/save/save-as/close/reload operations.
- Language detection and runtime language switching.
- Theme + settings application to editor instance.
- Cursor/selection/line-count sync to `editorStore` for status bar updates.
- Plugin hook execution around file lifecycle operations.

## Current State

- Implemented and active in app shell.
- Uses `src/lib/editor-loader.ts` for editor creation and reconfiguration.
- Integrates with `keybindingStore`, `themeStore`, `settingsStore`, and `pluginsStore`.

## References

- `Docs/architecture/modules/07_editor-loader.ts.md`
- `Docs/architecture/modules/13_editor.ts.md`
- `Docs/architecture/modules/17_StatusBar.svelte.md`
