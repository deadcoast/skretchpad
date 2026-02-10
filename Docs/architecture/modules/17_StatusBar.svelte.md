# StatusBar.svelte

> Source file: `src/components/StatusBar.svelte`
> Last updated: v0.1.0 (2026-02-10)
> Status: Implemented

## Purpose

Bottom status UI for file/editor/plugin state presentation.

## Responsibilities

- Render cursor position (`Ln`, `Col`) and selection details.
- Render file/language/encoding and other editor status items.
- Render plugin-contributed status bar items.
- Provide plugin action menu surface.

## References

- `Docs/architecture/modules/13_editor.ts.md`
- `Docs/architecture/modules/14_plugins.ts.md`
