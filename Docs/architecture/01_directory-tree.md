# Directory Tree

> Last updated: v0.1.0 (2026-02-10)

## Overview

```text
skretchpad/
├── src/                          # Frontend (Svelte 4 + TypeScript)
│   ├── App.svelte
│   ├── components/               # 17 component files
│   │   ├── BootScreen.svelte
│   │   ├── Chrome.svelte
│   │   ├── Editor.svelte
│   │   ├── SideBar.svelte
│   │   ├── StatusBar.svelte
│   │   └── ...
│   ├── features/
│   │   └── diff/DiffView.svelte
│   ├── lib/
│   │   ├── editor-loader.ts
│   │   ├── stores/               # editor/theme/plugins/keybindings/settings/git/ui/notifications
│   │   ├── utils/
│   │   └── icons/
│   ├── configs/
│   │   └── keybindings.toml
│   └── test/
├── src-tauri/                    # Backend (Rust, Tauri 2)
│   ├── src/
│   │   ├── main.rs
│   │   ├── git.rs
│   │   ├── theme_engine.rs
│   │   ├── window_manager.rs
│   │   ├── language_loader.rs
│   │   └── plugin_system/
│   │       ├── api.rs
│   │       ├── capabilities.rs
│   │       ├── loader.rs
│   │       ├── manager.rs
│   │       ├── ops.rs
│   │       ├── sandbox.rs
│   │       ├── trust.rs
│   │       └── worker.rs
│   ├── js/plugin_api.js
│   └── tauri.conf.json
├── plugins/                      # Local plugins
│   ├── git/
│   └── git-status/
├── themes/                       # Built-in TOML themes
│   ├── milkytext.toml
│   ├── glass-dark.toml
│   ├── glass-light.toml
│   ├── cyberpunk.toml
│   ├── nord.toml
│   └── solarized-dark.toml
├── Docs/                         # Project docs
│   ├── CHANGELOG.md
│   ├── TODO.md
│   ├── reports/
│   ├── plans/
│   ├── architecture/
│   └── settings/
├── README.md
└── package.json
```

## Current Counts (v0.1.0)

- Registered Tauri commands: `66`
- Frontend component files (`src/**/*.svelte`): `19`
- Built-in themes: `6`
- Local plugins: `2`
- Frontend tests: `327`
- Rust tests: `181`

## Architecture Docs Map

- `Docs/architecture/02_overview.md`
- `Docs/architecture/core/01_techstack.md`
- `Docs/architecture/core/02_technical-details.md`
- `Docs/architecture/core/03_configs.md`
- `Docs/architecture/modules/*.md`
