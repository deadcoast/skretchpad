# skretchpad

A minimal, modern text editor for developers built with Tauri 2.0, Svelte 4, and CodeMirror 6.

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

## Current Status

### Working

- Full Tauri 2.0 + Svelte 4 + CodeMirror 6 application
- Plugin system backend (sandbox, loader, manager, API, worker threads)
- 30+ Tauri commands for plugin operations + native file I/O
- 18+ built-in commands wired through command palette
- Native file open/save dialogs via `tauri-plugin-dialog`
- Settings UI panel (appearance, editor, keybindings, files)
- Side-by-side diff viewer with CodeMirror MergeView
- Plugin permission approval dialog with risk badges
- File watcher registry with cleanup (unwatch support)
- Notification toast system (store + component)
- Always-on-top window toggle via Tauri API
- Theme and keybinding stores with default configurations
- Plugin capability-based security model (filesystem/network/commands/UI permissions)
- First-party plugin manifests (git, git-status)
- Build: 0 errors, 0 warnings (both Rust and TypeScript)

### In Progress

- End-to-end plugin runtime testing (code paths verified, needs full Tauri app launch)
- Plugin deno_core ops (request queue needs Rust op wiring for actual API calls)

## Quick Start

### Prerequisites

- Node.js 18+
- Rust 1.70+
- Tauri CLI (`cargo install tauri-cli`)

### Development

```bash
# Install dependencies
npm install

# Start development server (web only)
npm run dev

# Start desktop app with hot reload
npm run tauri:dev
```

### Building

```bash
# Build frontend
npm run build

# Build desktop app
npm run tauri:build
```

### Verification

```bash
# Check TypeScript / Svelte
npx svelte-check

# Check Rust backend
cd src-tauri && cargo check
```

## Architecture

```
skretchpad/
  src/                          # Frontend (Svelte 4 + TypeScript)
    components/                 # UI components
      App.svelte                  Main app shell
      Editor.svelte               CodeMirror 6 editor wrapper
      Chrome.svelte               Title bar / window controls
      StatusBar.svelte            Bottom status bar with plugin items
      CommandPalette.svelte       Ctrl+Shift+P command palette
      NotificationToast.svelte    Toast notification overlay
      PluginPermissionDialog.svelte  Plugin permission approval
      SettingsPanel.svelte        Settings UI panel
      SideBar.svelte              Side panel for plugins
    lib/                        # Core libraries
      editor-loader.ts            CodeMirror 6 setup and language loading
      plugin-api.ts               TypeScript bridge to Rust plugin API
      stores/                   # Svelte stores
        editor.ts                 Editor state and file management
        theme.ts                  Theme loading and CSS variable injection
        keybindings.ts            Keybinding schemes and dispatch
        plugins.ts                Plugin registry and command store
        notifications.ts          Notification toast state
        ui.ts                     UI utilities (color, animation, format)
      utils/
        debounce.ts               Debounce utility
    features/
      diff/DiffView.svelte        Side-by-side diff viewer (MergeView)
    configs/
      keybindings.toml            Default keybinding definitions
    main.ts                       Svelte app entry point

  src-tauri/                    # Backend (Rust + Tauri 2.0)
    src/
      main.rs                     Tauri app setup and command registration
      plugin_system/              Plugin system modules
        mod.rs                      Module re-exports
        api.rs                      25+ Tauri commands, FileWatcherRegistry
        sandbox.rs                  V8 sandbox with resource limits
        worker.rs                   Worker thread JS execution (deno_core)
        manager.rs                  Plugin lifecycle (discover/load/activate/deactivate)
        loader.rs                   TOML manifest parser and plugin registry
        capabilities.rs             Permission model (filesystem/network/commands/UI)
        trust.rs                    Trust levels (first-party/local/community)
      window_manager.rs           Window controls
      theme_engine.rs             Theme loading
      language_loader.rs          Language definition loading
    js/
      plugin_api.js               JavaScript API injected into plugin sandboxes

  plugins/                      # Plugin directory
    git/                          Git integration plugin
      plugin.toml                   Plugin manifest
      main.ts                       Plugin entry point
    git-status/
      plugin.toml                   Git status plugin manifest

  themes/                       # Theme definitions (TOML)
    glass-dark.toml               Default dark glass theme
    glass-light.toml              Light glass theme

  languages/                    # Language definitions (JSON)
    python.lang.json
    rust.lang.json
    markdown.lang.json
```

## Keyboard Shortcuts

| Shortcut       | Action          |
|----------------|-----------------|
| Ctrl+Shift+P   | Command Palette |
| Ctrl+O         | Open File       |
| Ctrl+N         | New File        |
| Ctrl+S         | Save            |
| Ctrl+Shift+S   | Save As         |
| Ctrl+W         | Close File      |
| Ctrl+,         | Settings        |
| Ctrl+Z         | Undo            |
| Ctrl+Shift+Z   | Redo            |
| Ctrl+/         | Toggle Comment  |
| Ctrl+Shift+D   | Duplicate Line  |
| Ctrl+Shift+K   | Delete Line     |
| Alt+Up         | Move Lines Up   |
| Alt+Down       | Move Lines Down |
| Ctrl+F         | Find            |

## Plugin System

Plugins run in isolated V8 sandboxes (via deno_core) on dedicated worker threads. Each plugin declares capabilities in a TOML manifest:

```toml
name = "my-plugin"
version = "1.0.0"
author = "you"
description = "A plugin"
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

Plugins are auto-discovered from the `plugins/` directory and first-party plugins are activated automatically on startup.

## Documentation

- [Architecture Overview](docs/architecture/1_overview.md)
- [Tech Stack](docs/architecture/2_techstack.md)
- [Technical Details](docs/architecture/3_technical-details.md)
- [Configuration](docs/architecture/4_configs.md)
- [Status](docs/STATUS.md)
- [Changelog](CHANGELOG.md)

## License

MIT License - see [LICENSE](LICENSE) for details.
