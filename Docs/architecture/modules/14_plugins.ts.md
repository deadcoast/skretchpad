# plugins.ts (Store)

> Source file: `src/lib/stores/plugins.ts`
> Last updated: v0.1.0 (2026-02-10)
> Status: Implemented

## Purpose

Frontend plugin registry/store handling plugin discovery state, activation status, UI contributions, and command/event integration.

## Responsibilities

- Initialize/discover/load/activate/deactivate/reload plugin state.
- Track plugin statuses from backend.
- Manage plugin-contributed status bar items and panels.
- Provide plugin-related derived stores for UI components.

## References

- [manager-rs](Docs/architecture/modules/11_manager.rs.md)
- [statusbar-svelte](Docs/architecture/modules/17_StatusBar.svelte.md)
