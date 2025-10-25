# 1. Complete Directory Tree

## Status Legend

- ✅ = Implemented - Feature is complete and functional
- 🚧 = In Progress - Feature is partially implemented
- 📋 = Planned - Feature is designed but not yet implemented
- ⚙️ = Settings or Config - Configuration files

## Implementation Status

- Core Architecture: ✅ Complete
- UI Components: ✅ Complete  
- Theme System: ✅ Basic implementation
- Language Support: ✅ Basic implementation
- Plugin System: 📋 Planned
- File Operations: 📋 Planned

```plaintext
skretchpad/
├── .git/
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── release.yml
│
├── src-tauri/                         # Rust backend (Tauri)
│   ├── src/
│   │   ├── main.rs                    # ✅ Application entry point
│   │   ├── window_manager.rs          # ✅ Window controls (always-on-top, chrome toggle)
│   │   ├── theme_engine.rs            # ✅ Theme loading and CSS generation
│   │   ├── language_loader.rs         # ✅ Language definition loading
│   │   ├── plugin_system/             # 📋 Plugin system modules
│   │   │   ├── sandbox.rs             # 📋 Plugin isolation
│   │   │   ├── api.rs                 # 📋 Plugin API commands
│   │   │   ├── capabilities.rs        # 📋 Capability model
│   │   │   └── trust.rs               # 📋 Plugin trust levels
│   │   └── security/                  # 📋 Security modules
│   │       └── threat_matrix.rs       # 📋 Security threat analysis
│   ├── icons/                         # App icons (various sizes)
│   │   ├── icon.icns                  # macOS
│   │   ├── icon.ico                   # Windows
│   │   └── icon.png                   # Linux
│   ├── Cargo.toml                     # ⚙️ Rust dependencies & metadata
│   ├── Cargo.lock                     # Lock file (generated)
│   ├── tauri.conf.json                # ⚙️ Tauri app configuration
│   └── build.rs                       # Build script (if needed)
│
├── src/                               # Frontend (Svelte + TypeScript)
│   ├── components/
│   │   ├── App.svelte                 # ✅ Main application component
│   │   ├── Editor.svelte              # ✅ CodeMirror 6 editor wrapper
│   │   ├── Chrome.svelte              # ✅ Title bar / menu bar
│   │   └── StatusBar.svelte           # ✅ Bottom status bar
│   ├── lib/                           # 📋 Planned library modules
│   │   ├── theme-engine.ts            # 📋 Theme loading & transitions
│   │   ├── editor-loader.ts           # 📋 CodeMirror setup utilities
│   │   ├── plugin-api.ts              # 📋 Plugin API types & interfaces
│   │   ├── keybindings.ts             # 📋 Keyboard shortcut manager
│   │   └── stores/
│   │       ├── editor.ts              # 📋 Editor state management
│   │       ├── theme.ts               # 📋 Theme state management
│   │       ├── ui.ts                  # 📋 UI visibility state
│   │       └── plugins.ts             # 📋 Plugin state management
│   ├── features/                      # 📋 Planned feature modules
│   │   ├── syntax/
│   │   ├── diff/
│   │   └── search/
│   ├── styles/                        # 📋 Planned styling modules
│   │   ├── global.css
│   │   ├── theme-transitions.css
│   │   ├── glass-effects.css
│   │   └── editor.css
│   └── main.ts                        # ✅ Application entry point
│   ├── features/
│   │   ├── syntax/
│   │   │   ├── highlighter.ts         # Syntax highlighting logic
│   │   │   └── theme-mapper.ts        # Map tokens to theme colors
│   │   ├── diff/
│   │   │   ├── parser.ts              # Git diff parser
│   │   │   └── renderer.ts            # Diff UI renderer
│   │   └── search/
│   │       ├── finder.ts              # In-file search
│   │       └── SearchBar.svelte       # Search UI
│   ├── styles/
│   │   ├── global.css                 # Global styles
│   │   ├── theme-transitions.css      # Theme switching animations
│   │   ├── glass-effects.css          # Liquid glass styling
│   │   └── editor.css                 # Editor-specific styles
│   ├── App.svelte                     # Root component
│   ├── main.ts                        # Entry point
│   └── vite-env.d.ts                  # Vite type definitions
│
├── languages/                         # Language definitions
│   ├── python.lang.json
│   ├── rust.lang.json
│   ├── javascript.lang.json
│   ├── typescript.lang.json
│   ├── markdown.lang.json
│   ├── json.lang.json
│   ├── yaml.lang.json
│   ├── toml.lang.json
│   ├── html.lang.json
│   ├── css.lang.json
│   └── README.md                      # Language definition schema docs
│
├── themes/                            # Theme files
│   ├── glass-dark.toml                # ✅ Default glass dark theme
│   ├── glass-light.toml               # 📋 Planned light variant
│   ├── cyberpunk.toml                 # 📋 Planned community theme
│   ├── nord.toml                      # 📋 Planned Nord color scheme
│   └── README.md                      # 📋 Theme format documentation
│
├── languages/                         # Language definitions
│   ├── python.lang.json               # ✅ Python language configuration
│   ├── rust.lang.json                 # ✅ Rust language configuration
│   ├── markdown.lang.json             # ✅ Markdown language configuration
│   ├── javascript.lang.json           # 📋 Planned JavaScript configuration
│   ├── json.lang.json                 # 📋 Planned JSON configuration
│   └── README.md                      # 📋 Language definition documentation
│
├── plugins/                           # Plugin directory
│   ├── git/                           # 📋 Planned Git plugin
│   │   ├── plugin.toml                # 📋 Plugin manifest
│   │   ├── main.ts                    # 📋 Plugin entry point
│   │   ├── components/
│   │   │   ├── StatusPanel.svelte     # 📋 Git status panel
│   │   │   ├── BranchManager.svelte   # 📋 Branch management
│   │   │   └── CommitDialog.svelte    # 📋 Commit dialog
│   │   ├── lib/
│   │   │   ├── git-commands.ts        # 📋 Git CLI wrappers
│   │   │   └── diff-parser.ts         # 📋 Diff parsing utilities
│   │   └── README.md
│   ├── .gitkeep                       # Keep directory in git
│   └── README.md                      # 📋 Plugin development guide
│
├── keybindings/                       # Keybinding configurations
│   ├── default.toml                   # Default keybindings
│   ├── vim.toml                       # Vim-style bindings
│   └── README.md
│
├── docs/                              # Documentation
│   ├── ARCHITECTURE.md                # System architecture
│   ├── PLUGIN_API.md                  # Plugin development guide
│   ├── THEME_GUIDE.md                 # Theme creation guide
│   ├── LANGUAGE_GUIDE.md              # Adding language support
│   └── CONTRIBUTING.md
│
├── public/                            # Static assets
│   └── favicon.ico
│
├── dist/                              # Build output (gitignored)
├── node_modules/                      # npm dependencies (gitignored)
├── target/                            # Rust build artifacts (gitignored)
│
├── .gitignore                         # ⚙️ Git ignore rules
├── .eslintrc.cjs                      # ⚙️ ESLint config
├── .prettierrc                        # ⚙️ Prettier config
├── package.json                       # ⚙️ npm dependencies & scripts
├── package-lock.json                  # npm lock file (generated)
├── tsconfig.json                      # ⚙️ TypeScript compiler config
├── tsconfig.node.json                 # ⚙️ TypeScript config for Node
├── svelte.config.js                   # ⚙️ Svelte compiler config
├── vite.config.ts                     # ⚙️ Vite bundler config
├── rust-toolchain.toml                # ⚙️ Rust toolchain version
├── LICENSE                            # MIT/Apache-2.0
└── README.md                          # Project overview
```
