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

## Features

- **Liquid Glass UI** -- modern glass theme with backdrop blur and transparency
- **Plugin System** -- sandboxed V8 runtime with capability-based security
- **Command Palette** -- Ctrl+Shift+P quick access to all commands
- **Native File I/O** -- open, save, read, write files via native dialogs
- **Settings Panel** -- Ctrl+, for appearance, editor, keybinding, and file settings
- **Diff Viewer** -- side-by-side diff with CodeMirror MergeView
- **Format Document** -- Prettier integration for JS, TS, JSON, HTML, CSS, Markdown, YAML
- **Syntax Highlighting** -- JavaScript, TypeScript, Python, Rust, JSON, Markdown, HTML, CSS, YAML, XML, SQL, TOML
- **Editor Commands** -- undo, redo, comment toggle, duplicate/delete/move lines, find & replace
- **Always on Top** -- pin the window above other applications
- **Chrome Toggle** -- hide title bar for distraction-free editing
- **Theme System** -- TOML-based themes with CSS variable injection and hot-reload
- **Keybinding System** -- configurable shortcuts with Default, Vim, and Emacs schemes
- **Notification Toasts** -- non-intrusive notifications with action buttons

## Source-of-Truth Files

- [package.json](package.json)
- [Cargo.toml](src-tauri/Cargo.toml)
- [tauri.conf.json](src-tauri/tauri.conf.json)
- [editor-loader.ts](src/lib/editor-loader.ts)
- [main.rs](src-tauri/src/main.rs)

---
