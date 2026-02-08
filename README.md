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

## Features

### Plugin System
![plugin-boot](https://github.com/deadcoast/skretchpad/blob/main/Docs/assets/png/plugin-boot.png)

- Sandboxed V8 runtime per plugin (deno_core 0.230)
- 9 bridge ops: filesystem (3), network (1), commands (1), UI (2), editor (2)
- Capability-based security with TOML manifests
- Permission approval dialog with risk assessment
- Auto-discovery from `plugins/` directory
- First-party plugins activate on startup

![milkytext-rust](https://github.com/deadcoast/skretchpad/blob/main/Docs/assets/png/milkytext-rust.png)

### Editor
- CodeMirror 6 with compartment-based hot-swapping
- 12 language grammars -- JS, TS, Python, Rust, JSON, Markdown, HTML, CSS, YAML, XML, SQL, TOML
- Custom syntax highlighting from theme palette (40+ Lezer tag mappings)
- Format document via Prettier (JS, TS, JSON, HTML, CSS, Markdown, YAML)
- Undo, redo, toggle comment, duplicate/delete/move lines, find & replace

### Interface
- Glass morphism with backdrop blur and transparency
- Minimal mode -- eye icon strips chrome and status bar to transparent, leaving only text
- Native window controls (minimize, maximize, close) with drag region
- Always-on-top pin toggle
- Command palette (Ctrl+Shift+P) with 18+ registered commands
- Settings panel (Ctrl+,) for appearance, editor, keybindings, files
- Side-by-side diff viewer (CodeMirror MergeView)
- Notification toast system with action buttons
- Retro boot sequence on launch with plugin status confirmation

### Theme Engine
- 16-color ANSI palette + semantic colors + UI hierarchy
- 70+ CSS variables injected at runtime
- TOML-based theme definitions
- MilkyText default theme (dark, high-contrast, warm accents)

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
npx tauri dev
```

#### Build

```bash
# Frontend only
npm run build

# Production desktop binary
npx tauri build
```

#### Verify

```bash
# TypeScript + Svelte type check
npx svelte-check --tsconfig ./tsconfig.json

# Rust backend
cd src-tauri && cargo check
```

## Architecture

```
skretchpad/
├── src/                          # Frontend (Svelte + TypeScript)
│   ├── components/               # 9 Svelte components
│   │   ├── BootScreen.svelte     #   Retro boot sequence
│   │   ├── Chrome.svelte         #   Title bar + menus + window controls
│   │   ├── Editor.svelte         #   CodeMirror 6 wrapper
│   │   ├── CommandPalette.svelte #   Ctrl+Shift+P command launcher
│   │   ├── StatusBar.svelte      #   File info + cursor + plugins
│   │   ├── SettingsPanel.svelte  #   Configuration UI
│   │   ├── SideBar.svelte        #   Plugin panel host
│   │   ├── NotificationToast.svelte
│   │   └── PluginPermissionDialog.svelte
│   ├── features/
│   │   └── diff/DiffView.svelte  # Side-by-side diff viewer
│   ├── lib/
│   │   ├── editor-loader.ts      # CodeMirror setup + syntax highlighting
│   │   ├── plugin-api.ts         # Frontend plugin API bridge
│   │   ├── icons/index.ts        # SVG icon system
│   │   ├── stores/               # 7 Svelte stores (editor, theme, plugins, ...)
│   │   └── utils/                # Debounce, UI helpers
│   └── App.svelte                # Root component
│
├── src-tauri/                    # Backend (Rust)
│   ├── src/
│   │   ├── main.rs               # Tauri entry + command registration
│   │   ├── theme_engine.rs       # TOML theme parsing
│   │   ├── security/             # Threat matrix
│   │   └── plugin_system/        # 8 modules
│   │       ├── sandbox.rs        #   V8 isolate management
│   │       ├── worker.rs         #   Thread pool execution
│   │       ├── ops.rs            #   9 deno_core op bridges
│   │       ├── capabilities.rs   #   Permission model
│   │       ├── loader.rs         #   Discovery + manifest parsing
│   │       ├── manager.rs        #   Lifecycle orchestration
│   │       └── api.rs            #   Tauri command handlers
│   └── js/plugin_api.js          # Sandbox-side JS API
│
├── plugins/                      # First-party plugins
│   ├── git/                      #   Git operations
│   └── git-status/               #   Repository status
│
├── themes/                       # TOML theme definitions
│   ├── milkytext.toml            #   Default theme
│   └── glass-dark.toml           #   Glass dark variant
│
└── docs/                         # Architecture docs, module guides
```

**~15,000 lines of code** across 40+ source files.

## Plugin Manifest

Plugins declare capabilities in `plugin.toml`:

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

| Shortcut       | Action                       |
|----------------|------------------------------|
| `Ctrl+Shift+P` | Command palette              |
| `Ctrl+O`       | Open file                    |
| `Ctrl+N`       | New file                     |
| `Ctrl+S`       | Save                         |
| `Ctrl+Shift+S` | Save as                      |
| `Ctrl+W`       | Close file                   |
| `Ctrl+,`       | Settings                     |
| `Ctrl+B`       | Toggle sidebar               |
| `Ctrl+Shift+H` | Toggle chrome (minimal mode) |
| `Ctrl+F`       | Find & replace               |
| `Ctrl+Shift+F` | Format document              |
| `Ctrl+/`       | Toggle comment               |
| `Ctrl+Shift+D` | Duplicate line               |
| `Ctrl+Shift+K` | Delete line                  |
| `Alt+Up/Down`  | Move lines up/down           |
| `Ctrl+Z`       | Undo                         |
| `Ctrl+Shift+Z` | Redo                         |

## Documentation

| Document                                                      | Description                 |
|---------------------------------------------------------------|-----------------------------|
| [Architecture Overview](docs/architecture/1_overview.md)      | System design and data flow |
| [Tech Stack](docs/architecture/2_techstack.md)                | Dependencies and rationale  |
| [Technical Details](docs/architecture/3_technical-details.md) | Implementation specifics    |
| [Configuration](docs/architecture/4_configs.md)               | Build and runtime config    |
| [Directory Tree](docs/architecture/0_directory-tree.md)       | Full project structure      |
| [Features](docs/architecture/features.md)                     | Feature specifications      |
| [Keyboard Shortcuts](docs/keyboard_shortcuts.md)              | Complete shortcut reference |
| [Status](docs/STATUS.md)                                      | Current development status  |
| [Changelog](docs/CHANGELOG.md)                                | Version history             |

## Stack

| Layer      | Technology          | Role                                |
|------------|---------------------|-------------------------------------|
| Runtime    | Tauri 2.0           | Native desktop shell, IPC, file I/O |
| Frontend   | Svelte 4            | Reactive UI components              |
| Editor     | CodeMirror 6        | Text editing, syntax, extensions    |
| Backend    | Rust (2021 ed.)     | Performance-critical operations     |
| Plugins    | deno_core 0.230     | V8 isolate sandbox per plugin       |
| Build      | Vite 5              | Frontend bundling, HMR              |
| Styling    | CSS Variables       | Theme-driven, 70+ properties        |
| Dialogs    | tauri-plugin-dialog | Native OS file/save dialogs         |
| Formatting | Prettier 3          | Code formatting (7 languages)       |
| File Watch | notify 6.0          | Filesystem event monitoring         |

## License

MIT

---

<div align="center">

Built by [deadcoast](https://github.com/deadcoast)

</div>
