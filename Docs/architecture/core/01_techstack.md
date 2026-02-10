# Tech Stack

> Last updated: v0.1.0 (2026-02-10)

## Core Stack

- Desktop runtime: `Tauri 2`
- Frontend: `Svelte 4`, `TypeScript`, `Vite 5`
- Editor engine: `CodeMirror 6`
- Backend: `Rust 2021`
- Plugin sandbox: `deno_core` (worker-based)
- Testing: `Vitest` (frontend), `cargo test` (backend)

## Why This Stack

- Tauri keeps distribution lightweight and gives secure native IPC.
- Svelte + TypeScript keeps UI code small and reactive.
- CodeMirror 6 is modular and performs well for the minimal/fast editor goal.
- Rust backend handles filesystem, plugin, git, and theme operations with predictable performance.

## Operational Facts (v0.1.0)

- Registered backend commands: `66`
- Language supports wired in editor loader: `16`
- Built-in themes: `6`
- Local plugin packages: `2`
- Frontend component files: `19`

## Source-of-Truth Files

- `package.json`
- `src-tauri/Cargo.toml`
- `src-tauri/tauri.conf.json`
- `src/lib/editor-loader.ts`
- `src-tauri/src/main.rs`
