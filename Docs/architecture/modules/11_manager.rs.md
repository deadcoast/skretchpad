# manager.rs

> Source file: `src-tauri/src/plugin_system/manager.rs`
> Last updated: v0.1.0 (2026-02-10)
> Status: Implemented

## Purpose

Orchestrates plugin runtime lifecycle and active sandbox state.

## Responsibilities

- Discover/load/activate/deactivate/reload/unload plugin lifecycle.
- Dependency checks and active-state tracking.
- Event listener registration/unregistration and lifecycle events.
- Status projection for frontend consumption.

## References

- `Docs/architecture/modules/10_loader.rs.md`
- `Docs/architecture/modules/12_main.rs.md`
