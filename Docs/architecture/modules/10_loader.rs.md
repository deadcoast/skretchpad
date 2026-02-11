# loader.rs

> Source file: `src-tauri/src/plugin_system/loader.rs`
> Last updated: v0.1.0 (2026-02-10)
> Status: Implemented

## Purpose

Discovers plugin directories, parses manifests, builds capability/trust metadata, and provides loader access APIs.

## Responsibilities

- Plugin discovery under workspace plugin roots.
- Manifest parse and validation.
- Capability/trust mapping from manifest fields.
- Loader registry management (`load`, `unload`, lookup helpers).

## References

- [manager-rs](Docs/architecture/modules/11_manager.rs.md)
- [main-rs](Docs/architecture/modules/12_main.rs.md)
