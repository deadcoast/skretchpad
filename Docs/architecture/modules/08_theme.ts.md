# theme.ts (Store)

> Source file: `src/lib/stores/theme.ts`
> Last updated: v0.1.0 (2026-02-10)
> Status: Implemented

## Purpose

Theme store responsible for discovering, loading, selecting, and applying themes to the document.

## Responsibilities

- Load theme metadata/list from backend commands.
- Apply selected theme CSS variables to the app.
- Persist and restore selected theme.
- Expose reactive theme state for UI and editor layers.

## Integration

- Backend commands in `src-tauri/src/theme_engine.rs`.
- Consumed by `App.svelte`, `Editor.svelte`, and settings UI.

## References

- `Docs/architecture/modules/12_main.rs.md`
- `Docs/architecture/modules/04_Editor.svelte.md`
