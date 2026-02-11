# keybindings.ts (Store)

> Source file: `src/lib/stores/keybindings.ts`
> Last updated: v0.1.0 (2026-02-10)
> Status: Implemented

## Purpose

Maintains keybinding schemes, parsing/formatting helpers, command resolution, and execution routing hooks.

## Responsibilities

- Default/Vim/Emacs scheme state.
- Key event normalization and lookup.
- Runtime command execution handoff.
- Custom binding overrides and scheme switching support.

## Notes

- App shell currently wires a subset of global shortcuts directly in [app-svelte](App.svelte); this store remains the broader keybinding model.

## References

- `Docs/settings/keyboard_shortcuts.md`
- `Docs/architecture/modules/01_entry-points.md`
