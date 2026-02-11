# Configuration Reference

> Last updated: v0.1.0 (2026-02-10)

This page documents where configuration actually lives in the current codebase.

## Application and Build

- [package.json](package.json)
  - frontend scripts (`dev`, `build`, `check`, `lint`, `test`, `test:coverage`, `test:rust`, `test:all`)
  - frontend dependencies and tooling versions
- [vite.config.ts](vite.config.ts)
  - frontend bundler behavior for local dev and build
- [svelte.config.js](svelte.config.js)
  - Svelte compiler/preprocess behavior
- [tsconfig.json](tsconfig.json), [tsconfig.node.json](tsconfig.node.json)
  - TypeScript compile settings

## Tauri and Rust

- [tauri.conf.json](src-tauri/tauri.conf.json)
  - product version (`0.1.0`)
  - window defaults (custom decorations, transparent shell, sizing)
  - app security policy and plugin fs scope
- [Cargo.toml](src-tauri/Cargo.toml)
  - Rust dependencies and crate metadata
- [capabilities/default.json](src-tauri/capabilities/default.json)
  - Tauri capability baseline

## Runtime Feature Config

- [keybindings.toml](src/configs/keybindings.toml)
  - keybinding scheme data
- [themes/*.toml](themes/*.toml)
  - built-in theme definitions
- [plugins/*/plugin.toml](plugins/*/plugin.toml)
  - plugin metadata, capabilities, trust, commands

## Notes

- Prefer the files above as source of truth over copied snippets.
- Cross-check active runtime behavior with:
  - [STATUS](Docs/reports/STATUS_2026-02-10.md)
  - [TODO](Docs/TODO.md)
  - [CHANGELOG](Docs/CHANGELOG.md)

---
