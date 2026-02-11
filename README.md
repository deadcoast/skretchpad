# ----
```
           ▄▄▄▄ ▄▄ ▄▄ ▄▄▄▄  ▄▄▄▄▄ ▄▄▄▄▄▄ ▄▄▄▄ ▄▄ ▄▄ ▄▄▄▄   ▄▄▄  ▄▄▄▄
          ███▄▄ ██▄█▀ ██▄█▄ ██▄▄    ██  ██▀▀▀ ██▄██ ██▄█▀ ██▀██ ██▀██
          ▄▄██▀ ██ ██ ██ ██ ██▄▄▄   ██  ▀████ ██ ██ ██    ██▀██ ████▀
          v0.1.0
```

<div align="center">

Fast, Minimal, Feature Rich Text Editor inspired by 80's Compute Aesthetics.

Tauri 2.0 &middot; Svelte 4 &middot; CodeMirror 6 &middot; Rust &middot; deno_core V8

---

</div>

## Overview

Skretchpad is a desktop text editor that prioritizes three things: **speed**, **extensibility**, and **visual integrity**. The frontend renders through a native WebView with glass morphism and full theme control. The backend is Rust. Plugins execute in isolated V8 sandboxes on dedicated worker threads with capability-based security. Every pixel is intentional.

![desktop-preview](https://github.com/deadcoast/skretchpad/blob/main/Docs/assets/png/editor-desktop.png)

```
┌─────────────────────────────────────────────────────────┐
│  [pin] [eye]    File  Edit  View         [─] [□] [×]    │  Chrome
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1 │ fn main() {                                        │
│  2 │     println!("Hello, skretchpad");                 │  CodeMirror 6
│  3 │ }                                                  │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  * main.rs  Rust          Ln 2, Col 12     Plugins: 2   │  Status Bar
└─────────────────────────────────────────────────────────┘
```

## Quick Start

### Prerequisites

| Tool     | Version     | Purpose               |
|----------|-------------|-----------------------|
| Node.js  | 18+         | Frontend toolchain    |
| Rust     | 1.80+       | Backend compilation   |
| Cargo    | (with Rust) | Dependency management |
| WebView2 | (Windows)   | Native rendering      |

#### Setup

```bash
# Clone
git clone https://github.com/deadcoast/skretchpad.git
cd skretchpad

# Verify environment (recommended)
.\setup.ps1

# Install dependencies
npm install

# Launch with hot reload
npm run tauri:dev
```

#### Build

```bash
# Frontend only
npm run build

# Production desktop binary
npm run tauri:build
```

#### Test

```bash
# Frontend tests (Vitest + jsdom)
npm test

# Frontend with coverage
npm run test:coverage

# Rust tests
cd src-tauri && cargo test

# All tests
npm run test:all
```

#### Verify

```bash
# TypeScript + Svelte type check
npx svelte-check --tsconfig ./tsconfig.json

# Rust backend
cd src-tauri && cargo check
```
## Features

### Plugin System
![plugin-boot](https://github.com/deadcoast/skretchpad/blob/main/Docs/assets/png/plugin-boot.png)

- Sandboxed V8 runtime per plugin (deno_core 0.230)
- 9 bridge ops: filesystem (3), network (1), commands (1), UI (2), editor (2)
- Capability-based security with TOML manifests and trust levels (first-party/verified/community/local)
- Permission approval dialog with risk assessment; first-party plugins auto-approve
- Auto-discovery from `plugins/` directory with hot-reload in dev mode
- Resource limits: memory, operations, and CPU timeout enforcement
- Trust verification with signature checking (verified plugins require signatures)
- Full lifecycle: activate/deactivate/reload/unload with event emission

### Editor
![milkytext-rust](https://github.com/deadcoast/skretchpad/blob/main/Docs/assets/png/milkytext-rust.png)

- CodeMirror 6 with compartment-based hot-swapping
- 16 language grammars -- JS, TS, Python, Rust, JSON, Markdown, HTML, CSS, YAML, XML, SQL, TOML, Go, Java, C/C++, PHP
- Custom syntax highlighting from theme palette (40+ Lezer tag mappings)
- Format document via Prettier (JS, TS, JSON, HTML, CSS, Markdown, YAML)
- Undo, redo, toggle comment, duplicate/delete/move lines, find & replace

### Interface
- Glass morphism with backdrop blur and transparency
- Minimal mode -- eye icon strips chrome and status bar to transparent, leaving only text
- Native window controls (minimize, maximize, close) with drag region
- Always-on-top pin toggle
- Multi-tab bar with drag reorder, close other/right
- File explorer visible by default, with drag-resizable right edge and persisted width
- File menu support for `Open Folder...` with live explorer root switching
- File tree language/category visuals with hidden-file blending for dotfiles and control docs
- Command palette (Ctrl+Shift+P) with 18+ registered commands
- Settings panel (Ctrl+,) for appearance, editor, keybindings, files
- Diff viewer with hunk navigation, unified/side-by-side toggle, language support
- Source control panel (Ctrl+Shift+G) with staged/unstaged sections
- Breadcrumb navigation above editor
- Minimap code overview sidebar
- Split editor (Ctrl+\\) with resizable panes
- Live status bar cursor tracking (`Ln`, `Col`) and selection length sync
- Notification toast system with action buttons
- DOMPurify XSS sanitization for plugin content
- Retro boot sequence on launch with plugin status confirmation

### Theme Engine
- TOML files as single source of truth -- Rust parses, frontend renders
- 16-color ANSI palette + semantic colors + UI hierarchy
- 85+ CSS variables injected at runtime via `applyThemeToDocument()`
- `load_theme_data` Tauri command returns camelCase JSON from snake_case TOML
- 6 built-in themes: MilkyText, Liquid Glass Dark, Liquid Glass Light, Cyberpunk, Nord, Solarized Dark
- Async theme loading with caching and localStorage persistence
- Settings panel theme switcher with live preview

## Plugin Manifest

Plugins declare capabilities in [`plugin.toml`](plugins/git/plugin.toml):

```toml
name = "my-plugin"
version = "1.0.0"
author = "you"
description = "What it does"
trust = "community"

[permissions]
filesystem = "WorkspaceRead"

[permissions.network]
type = "DomainAllowlist"
domains = ["api.example.com"]

[permissions.commands]
allowlist = []

[permissions.ui]
status_bar = true
notifications = true
```

The sandbox bridge exposes 9 ops to plugin JS code:

| Op           | Capability | Description                      |
|--------------|------------|----------------------------------|
| `fs_read`    | filesystem | Read files within workspace      |
| `fs_write`   | filesystem | Write files within workspace     |
| `fs_list`    | filesystem | List directory contents          |
| `net_fetch`  | network    | HTTP requests to allowed domains |
| `cmd_exec`   | commands   | Execute allowed system commands  |
| `ui_notify`  | ui         | Show notification toasts         |
| `ui_status`  | ui         | Update status bar items          |
| `editor_get` | editor     | Read editor content              |
| `editor_set` | editor     | Modify editor content            |

## Keyboard Shortcuts

| Shortcut           | Action                       |
|--------------------|------------------------------|
| `Ctrl+Shift+P`     | Command palette              |
| `Ctrl+O`           | Open file                    |
| `File->OpenFolder` | Open folder                  |
| `Ctrl+N`           | New file                     |
| `Ctrl+S`           | Save                         |
| `Ctrl+Shift+S`     | Save as                      |
| `Ctrl+W`           | Close file                   |
| `Ctrl+,`           | Settings                     |
| `Ctrl+B`           | Toggle sidebar               |
| `Ctrl+Shift+H`     | Toggle chrome (minimal mode) |
| `Ctrl+F`           | Find & replace               |
| `Ctrl+Shift+F`     | Format document              |
| `Ctrl+/`           | Toggle comment               |
| `Ctrl+Shift+D`     | Duplicate line               |
| `Ctrl+Shift+K`     | Delete line                  |
| `Alt+Up/Down`      | Move lines up/down           |
| `Ctrl+\`           | Split editor                 |
| `Ctrl+Shift+G`     | Source control panel         |
| `Ctrl+Z`           | Undo                         |
| `Ctrl+Shift+Z`     | Redo                         |

## Documentation

| Document                                                            | Description                 |
|---------------------------------------------------------------------|-----------------------------|
| [Architecture Overview](Docs/architecture/02_overview.md)           | System design and data flow |
| [Tech Stack](Docs/architecture/core/01_techstack.md)                | Dependencies and rationale  |
| [Technical Details](Docs/architecture/core/02_technical-details.md) | Implementation specifics    |
| [Configuration](Docs/architecture/core/03_configs.md)               | Build and runtime config    |
| [Directory Tree](Docs/architecture/01_directory-tree.md)            | Full project structure      |
| [Features](Docs/architecture/core/04_features.md)                   | Feature specifications      |
| [Keyboard Shortcuts](Docs/settings/keyboard_shortcuts.md)           | Complete shortcut reference |
| [Status](Docs/reports/STATUS_2026-02-10.md)                         | Current development status  |
| [Changelog](Docs/CHANGELOG.md)                                      | Version history             |

## Stack

| Layer      | Technology          | Role                                |
|------------|---------------------|-------------------------------------|
| Runtime    | Tauri 2.0           | Native desktop shell, IPC, file I/O |
| Frontend   | Svelte 4            | Reactive UI components              |
| Editor     | CodeMirror 6        | Text editing, syntax, extensions    |
| Backend    | Rust (2021 ed.)     | Performance-critical operations     |
| Plugins    | deno_core 0.230     | V8 isolate sandbox per plugin       |
| Build      | Vite 5              | Frontend bundling, HMR              |
| Styling    | CSS Variables       | Theme-driven, 85+ properties        |
| Testing    | Vitest + Cargo Test | Frontend + backend test suites      |
| CI/CD      | GitHub Actions      | Lint, test, build (cross-platform)  |
| Pre-commit | Husky + lint-staged | ESLint, Prettier, cargo fmt         |
| Dialogs    | tauri-plugin-dialog | Native OS file/save dialogs         |
| Formatting | Prettier 3          | Code formatting (7 languages)       |
| File Watch | notify 6.0          | Filesystem event monitoring         |

## License

MIT

---

<div align="center">

Built by [deadcoast](https://github.com/deadcoast)

</div>
