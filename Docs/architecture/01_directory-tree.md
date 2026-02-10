# Directory Tree

> Last updated: v0.0.4 (2026-02-07)

## Status Legend

- **OK** = Implemented and compiling
- **STUB** = File exists but functionality is placeholder
- **MANIFEST** = Declaration/config only (no runtime logic)
- **CFG** = Configuration file

## Overview

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

## Project Structure

```plaintext
skretchpad/
├── src-tauri/                             # Rust backend (Tauri 2.0)
│   ├── src/
│   │   ├── main.rs                        # OK    Tauri app setup, command registration
│   │   ├── window_manager.rs              # OK    Window controls (always-on-top, chrome toggle)
│   │   ├── theme_engine.rs                # OK    Theme loading from TOML files
│   │   ├── language_loader.rs             # OK    Language definition loading from JSON
│   │   └── plugin_system/                 # OK    Plugin system modules
│   │       ├── mod.rs                     # OK    Module re-exports
│   │       ├── sandbox.rs                 # OK    V8 sandbox, SandboxRegistry (RwLock)
│   │       ├── worker.rs                  # OK    Worker thread JS execution (deno_core)
│   │       ├── capabilities.rs            # OK    Permission model (filesystem/network/commands/UI)
│   │       ├── loader.rs                  # OK    TOML manifest parser, plugin discovery
│   │       ├── manager.rs                 # OK    Plugin lifecycle (discover/load/activate/deactivate)
│   │       ├── api.rs                     # OK    25+ Tauri commands for plugin operations
│   │       └── trust.rs                   # OK    Trust levels (first-party/local/community)
│   ├── js/
│   │   └── plugin_api.js                  # OK    JavaScript API injected into plugin sandboxes
│   ├── icons/
│   │   ├── icon.icns                      #       macOS app icon
│   │   ├── icon.ico                       #       Windows app icon
│   │   └── icon.png                       #       Linux app icon
│   ├── capabilities/
│   │   └── default.json                   # CFG   Tauri 2.0 permissions (core:default, dialog:default)
│   ├── Cargo.toml                         # CFG   Rust dependencies and metadata
│   ├── Cargo.lock                         # CFG   Generated lock file
│   ├── tauri.conf.json                    # CFG   Tauri app configuration
│   └── build.rs                           # CFG   Build script
│
├── src/                                   # Frontend (Svelte 4 + TypeScript)
│   ├── components/
│   │   ├── App.svelte                     # OK    Main app shell, command dispatch, shortcuts
│   │   ├── Editor.svelte                  # OK    CodeMirror 6 wrapper, 11 editor commands
│   │   ├── Chrome.svelte                  # OK    Title bar, window controls, pin button
│   │   ├── StatusBar.svelte               # OK    Bottom status bar with plugin items
│   │   ├── CommandPalette.svelte          # OK    Ctrl+Shift+P command palette
│   │   ├── NotificationToast.svelte       # OK    Toast notifications (fly in/fade out)
│   │   ├── SideBar.svelte                 # OK    Side panel for plugin UI
│   │   ├── PluginPermissionDialog.svelte  # OK    Plugin permission approval with risk badges
│   │   └── SettingsPanel.svelte           # OK    Settings UI (appearance, editor, keybindings, files)
│   ├── lib/
│   │   ├── editor-loader.ts               # OK    CodeMirror 6 setup, language loading
│   │   ├── plugin-api.ts                  # OK    TypeScript bridge to Rust plugin API
│   │   ├── stores/
│   │   │   ├── editor.ts                  # OK    Editor state and file management
│   │   │   ├── theme.ts                   # OK    Theme loading, CSS variable injection
│   │   │   ├── keybindings.ts             # OK    Keybinding schemes (Default/Vim/Emacs)
│   │   │   ├── plugins.ts                 # OK    Plugin registry and command store
│   │   │   ├── notifications.ts           # OK    Notification toast state
│   │   │   └── ui.ts                      # OK    UI utilities (color, animation, format)
│   │   └── utils/
│   │       └── debounce.ts                # OK    Debounce utility
│   ├── features/
│   │   └── diff/
│   │       └── DiffView.svelte            # OK    Side-by-side diff viewer (CodeMirror MergeView)
│   ├── configs/
│   │   └── keybindings.toml               # CFG   Default keybinding definitions
│   └── main.ts                            # OK    Svelte app entry point
│
├── plugins/                               # Plugin directory
│   ├── git/
│   │   ├── plugin.toml                    # MANIFEST  Git integration plugin manifest
│   │   └── main.ts                        # OK        Plugin entry point (written, not runtime-tested)
│   └── git-status/
│       └── plugin.toml                    # MANIFEST  Git status plugin manifest
│
├── themes/                                # Theme definitions (TOML)
│   ├── glass-dark.toml                    # OK    Default dark glass theme
│   └── glass-light.toml                   # OK    Light glass theme
│
├── languages/                             # Language definitions (JSON)
│   ├── python.lang.json                   # OK    Python language config
│   ├── rust.lang.json                     # OK    Rust language config
│   └── markdown.lang.json                 # OK    Markdown language config
│
├── Docs/                                  # Documentation
│   ├── STATUS.md                          #       Module status and build state
│   ├── TODO.md                            #       Development task tracking
│   ├── directory_tree.md                  #       This file
│   └── architecture/
│       ├── 1_overview.md                  #       Project overview and design goals
│       ├── 2_techstack.md                 #       Technology stack and framework choices
│       ├── 3_technical-details.md         #       Deep technical implementation details
│       ├── 4_configs.md                   #       Configuration and setup details
│       └── modules/                       #       Per-module documentation
│           ├── 1_sandbox.rs.md
│           ├── 1.1_capabilities.rs.md
│           ├── 1.1_worker.rs.md
│           ├── 2_Editor.svelte.md
│           ├── 3_api.rs.md
│           ├── 4_main.ts.md
│           ├── 5_editor-loader.ts.md
│           ├── 8_plugin-api.ts.md
│           ├── 9_loader.rs.md
│           ├── 10_manager.rs.md
│           ├── 11_main.rs.md
│           ├── 12_editor.ts.md
│           ├── 13_plugins.ts.md
│           ├── 14_debounce.ts.md
│           └── 15_ui.ts.md
│
├── setup.ps1                              #       PowerShell install/verification script (40 checks)
├── .gitignore                             # CFG
├── package.json                           # CFG   npm dependencies and scripts
├── package-lock.json                      # CFG   Generated lock file
├── tsconfig.json                          # CFG   TypeScript compiler config
├── tsconfig.node.json                     # CFG   TypeScript config for Node
├── svelte.config.js                       # CFG   Svelte compiler config
├── vite.config.ts                         # CFG   Vite bundler config
├── AGENTS.md                              # CFG   Repository guidelines for agents
├── CHANGELOG.md                           #       Version changelog
├── README.md                              #       Project overview
└── LICENSE                                #       MIT License
```

## File Counts

| Category                   | Files  | Approx LOC  |
|----------------------------|--------|-------------|
| Rust backend               | 11     | ~4,500      |
| TypeScript/Svelte frontend | 24     | ~10,000     |
| Plugin manifests/code      | 3      | ~200        |
| Config files               | 11     | ~350        |
| Documentation              | 20+    | --          |
| **Total source**           | **38** | **~15,050** |
