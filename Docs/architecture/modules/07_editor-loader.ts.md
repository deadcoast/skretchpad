# editor-loader.ts

> Source file: `src/lib/editor-loader.ts`
> Last updated: v0.1.0 (2026-02-10)
> Status: Implemented

## Purpose

Encapsulates CodeMirror initialization and dynamic reconfiguration used by `Editor.svelte`.

## Responsibilities

- Creates editor instances and extensions.
- Maintains language registry and lazy language loading.
- Applies theme tokens and editor settings compartments.
- Exposes helper APIs for cursor, selection, formatting-related operations, and editor updates.

## Current Baseline

- 16 language definitions registered.
- Supports runtime reconfiguration for word wrap, line numbers, tab size, and font size.
- Used as the only editor setup path in current app runtime.

## References

- `Docs/architecture/modules/04_Editor.svelte.md`
- `Docs/architecture/modules/08_theme.ts.md`
