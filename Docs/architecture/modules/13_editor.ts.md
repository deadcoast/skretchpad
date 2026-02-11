# editor.ts (Store)

> Source file: `src/lib/stores/editor.ts`
> Last updated: v0.1.0 (2026-02-10)
> Status: Implemented

## Purpose

Central editor/file store for tabs, active file, dirty state, and filesystem interactions.

## Responsibilities

- Tab lifecycle and active tab selection.
- Open/save/save-as/new/close flows.
- File metadata, cursor state, and editor-facing status sync.
- Integration with Tauri file APIs and dialog APIs.

## References

- [editor-svelte](Docs/architecture/modules/04_Editor.svelte.md)
- [statusbar-svelte](Docs/architecture/modules/17_StatusBar.svelte.md)
