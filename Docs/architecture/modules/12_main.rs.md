# main.rs

> Source file: `src-tauri/src/main.rs`
> Last updated: v0.1.0 (2026-02-10)
> Status: Implemented

## Purpose

Backend entrypoint for Tauri app setup, managed state initialization, and command registration.

## Current Baseline

- Registers 66 Tauri commands across file, plugin, theme, and git domains.
- Initializes plugin manager, trust verifier, worker registry, and sandbox-related state.
- Binds plugin dialog integration and startup setup logic.

## References

- `Docs/reports/STATUS_2026-02-10.md`
- `Docs/architecture/modules/10_loader.rs.md`
- `Docs/architecture/modules/11_manager.rs.md`
