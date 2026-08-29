# Documentation Integrity Check

## Lint Front end

- Created 29 minutets ago
  > skretchpad@0.1.0 docs:check
  > Run: npm run docs:check
  > node scripts/docs-check.mjs

### docs:check failed with the following issues

Found shorthand type coercions JS-0066

> Anti-pattern
> Minor: 7 hours ago — 7 hours old
> Seen in 1 file: 1 instance

Found boolean assert comparison RS-W1024

> Anti-pattern
> Minor: 7 hours ago — 7 hours old
> Seen in 2 files: 2 instances

Found manual implementation of Instant::elapsed RS-W1045

> Anti-pattern
> Minor: 7 hours ago — 7 hours old
> Seen in 1 file: 1 instance

Detected the use of variables before they are defined JS-0357

> Anti-pattern
> Major: 7 hours ago — 7 hours old
> Seen in 4 files: 36 instances

Found non-null assertions JS-0339

> Anti-pattern
> Major: 7 hours ago — 7 hours old
> Seen in 10 files: 21 instances

Prefer var declarations be placed at the top of their scope JS-0102

> Anti-pattern
> Minor: 16 minutes ago — 7 hours old
> Seen in 2 files: 11 instances

Require template literals instead of string concatenation JS-0246

> Anti-pattern
> Minor: 7 hours ago — 7 hours old
> Seen in 5 files: 19 instances

Initialization in variable declarations against recommended approach JS-0119

> Anti-pattern
> Minor: 7 hours ago — 7 hours old
> Seen in 1 file: 1 instance

Default parameters should be placed after non-default ones JS-0302

> Anti-pattern
> Major: 7 hours ago — 7 hours old
> Seen in 2 files: 4 instances

Either all code paths should have explicit returns, or none of them JS-0045

> Anti-pattern
> Minor: 7 hours ago — 7 hours old
> Seen in 1 file: 1 instance

Consider using let or const instead of var JS-0239

> Anti-pattern
> Major: 16 minutes ago — 7 hours old
> Seen in 2 files: 11 instances

Detected empty functions JS-0321

> Anti-pattern
> Minor: 7 hours ago — 7 hours old
> Seen in 6 files: 17 instances

Found short variable name JS-C1002

> Anti-pattern
> Minor: 7 hours ago — 7 hours old
> Seen in 2 files: 2 instances

Found manual implementation of .split_once(..) RS-W1066

> Anti-pattern
> Minor: 7 hours ago — 7 hours old
> Seen in 1 file: 1 instance

Empty call to new() RS-W1079

> Anti-pattern
> Minor: 7 hours ago — 7 hours old
> Seen in 2 files: 7 instances

Found occurrence of Default::default() RS-W1051

> Anti-pattern
> Minor: 2 hours ago — 7 hours old
> Seen in 1 file: 1 instance

Found unnecessary chain of map and unwrap_or RS-W1072

> Anti-pattern
> Minor: 7 hours ago — 7 hours old
> Seen in 3 files: 3 instances

Consider using arrow functions for callbacks JS-0241

> Anti-pattern
> Minor: 7 hours ago — 7 hours old
> Seen in 2 files: 10 instances

Function with cyclomatic complexity higher than threshold RS-R1000

> Anti-pattern
> Minor: 7 hours ago — 7 hours old
> Seen in 2 files: 2 instances

Detected the delete operator with computed key expressions JS-0320

> Anti-pattern
> Minor: 7 hours ago — 7 hours old
> Seen in 1 file: 2 instances

Use shorthand property syntax for object literals JS-0240

> Anti-pattern
> Minor: 7 hours ago — 7 hours old
> Seen in 2 files: 2 instances

---

## Lint Documentation

> skretchpad@0.1.0 docs:check
> node scripts/docs-check.mjs

docs:check failed with the following issues:

- README.md: broken link 'Docs/architecture/core/04_features.md' -> 'Docs/architecture/core/04_features.md' not found
- Docs/architecture/01_directory-tree.md: broken link 'Docs/architecture/02_overview.md' -> 'Docs/architecture/Docs/architecture/02_overview.md' not found
- Docs/architecture/01_directory-tree.md: broken link 'Docs/architecture/core/01_techstack.md' -> 'Docs/architecture/Docs/architecture/core/01_techstack.md' not found
- Docs/architecture/01_directory-tree.md: broken link 'Docs/architecture/core/02_technical-details.md' -> 'Docs/architecture/Docs/architecture/core/02_technical-details.md' not found
- Docs/architecture/01_directory-tree.md: broken link 'Docs/architecture/core/03_configs.md' -> 'Docs/architecture/Docs/architecture/core/03_configs.md' not found
- Docs/architecture/01*directory-tree.md: broken link 'Docs/architecture/modules/*.md' -> 'Docs/architecture/Docs/architecture/modules/\_.md' not found
- Docs/architecture/02_overview.md: broken link 'src/components/Editor.svelte' -> 'Docs/architecture/src/components/Editor.svelte' not found
- Docs/architecture/02_overview.md: broken link '`src/lib/stores/editor.ts`' -> 'Docs/architecture/`src/lib/stores/editor.ts`' not found
- Docs/architecture/02_overview.md: broken link 'src/lib/stores/theme.ts' -> 'Docs/architecture/src/lib/stores/theme.ts' not found
- Docs/architecture/02_overview.md: broken link 'src-tauri/src/theme_engine.rs' -> 'Docs/architecture/src-tauri/src/theme_engine.rs' not found
- Docs/architecture/02_overview.md: broken link '`src/lib/stores/plugins.ts`' -> 'Docs/architecture/`src/lib/stores/plugins.ts`' not found
- Docs/architecture/02*overview.md: broken link 'src-tauri/src/plugin_system/*' -> 'Docs/architecture/src-tauri/src/plugin*system/*' not found
- Docs/architecture/02_overview.md: broken link 'src/lib/stores/git.ts' -> 'Docs/architecture/src/lib/stores/git.ts' not found
- Docs/architecture/02_overview.md: broken link 'src/features/diff/DiffView.svelte' -> 'Docs/architecture/src/features/diff/DiffView.svelte' not found
- Docs/architecture/02_overview.md: broken link '`src/components/Chrome.svelte`' -> 'Docs/architecture/`src/components/Chrome.svelte`' not found
- Docs/architecture/02_overview.md: broken link 'src/components/StatusBar.svelte' -> 'Docs/architecture/src/components/StatusBar.svelte' not found
- Docs/architecture/02_overview.md: broken link 'src/components/SideBar.svelte' -> 'Docs/architecture/src/components/SideBar.svelte' not found
- Docs/architecture/02_overview.md: broken link 'Docs/reports/STATUS_2026-02-10.md' -> 'Docs/architecture/Docs/reports/STATUS_2026-02-10.md' not found
- Docs/architecture/02_overview.md: broken link 'Docs/TODO.md' -> 'Docs/architecture/Docs/TODO.md' not found
- Docs/architecture/02_overview.md: broken link 'Docs/CHANGELOG.md' -> 'Docs/architecture/Docs/CHANGELOG.md' not found
- Docs/architecture/02_overview.md: broken link 'Docs/architecture/01_directory-tree.md' -> 'Docs/architecture/Docs/architecture/01_directory-tree.md' not found
- Docs/architecture/core/01_techstack.md: broken link 'package.json' -> 'Docs/architecture/core/package.json' not found
- Docs/architecture/core/01_techstack.md: broken link 'src-tauri/Cargo.toml' -> 'Docs/architecture/core/src-tauri/Cargo.toml' not found
- Docs/architecture/core/01_techstack.md: broken link 'src-tauri/tauri.conf.json' -> 'Docs/architecture/core/src-tauri/tauri.conf.json' not found
- Docs/architecture/core/01_techstack.md: broken link 'src/lib/editor-loader.ts' -> 'Docs/architecture/core/src/lib/editor-loader.ts' not found
- Docs/architecture/core/01_techstack.md: broken link 'src-tauri/src/main.rs' -> 'Docs/architecture/core/src-tauri/src/main.rs' not found
- Docs/architecture/core/03_configs.md: broken link 'package.json' -> 'Docs/architecture/core/package.json' not found
- Docs/architecture/core/03_configs.md: broken link 'vite.config.ts' -> 'Docs/architecture/core/vite.config.ts' not found
- Docs/architecture/core/03_configs.md: broken link 'svelte.config.js' -> 'Docs/architecture/core/svelte.config.js' not found
- Docs/architecture/core/03_configs.md: broken link 'tsconfig.json' -> 'Docs/architecture/core/tsconfig.json' not found
- Docs/architecture/core/03_configs.md: broken link 'tsconfig.node.json' -> 'Docs/architecture/core/tsconfig.node.json' not found
- Docs/architecture/core/03_configs.md: broken link 'src-tauri/tauri.conf.json' -> 'Docs/architecture/core/src-tauri/tauri.conf.json' not found
- Docs/architecture/core/03_configs.md: broken link 'src-tauri/Cargo.toml' -> 'Docs/architecture/core/src-tauri/Cargo.toml' not found
- Docs/architecture/core/03_configs.md: broken link 'src-tauri/capabilities/default.json' -> 'Docs/architecture/core/src-tauri/capabilities/default.json' not found
- Docs/architecture/core/03_configs.md: broken link 'src/configs/keybindings.toml' -> 'Docs/architecture/core/src/configs/keybindings.toml' not found
- Docs/architecture/core/03*configs.md: broken link 'themes/*.toml' -> 'Docs/architecture/core/themes/\_.toml' not found
- Docs/architecture/core/03*configs.md: broken link 'plugins/*/plugin.toml' -> 'Docs/architecture/core/plugins/\_/plugin.toml' not found
- Docs/architecture/core/03_configs.md: broken link 'Docs/reports/STATUS_2026-02-10.md' -> 'Docs/architecture/core/Docs/reports/STATUS_2026-02-10.md' not found
- Docs/architecture/core/03_configs.md: broken link 'Docs/TODO.md' -> 'Docs/architecture/core/Docs/TODO.md' not found
- Docs/architecture/core/03_configs.md: broken link 'Docs/CHANGELOG.md' -> 'Docs/architecture/core/Docs/CHANGELOG.md' not found
- Docs/architecture/modules/01_entry-points.md: broken link 'src/components/Chrome.svelte' -> 'Docs/architecture/modules/src/components/Chrome.svelte' not found
- Docs/architecture/modules/01_entry-points.md: broken link 'src/components/SideBar.svelte' -> 'Docs/architecture/modules/src/components/SideBar.svelte' not found
- Docs/architecture/modules/01_entry-points.md: broken link 'src/components/Editor.svelte' -> 'Docs/architecture/modules/src/components/Editor.svelte' not found
- Docs/architecture/modules/01_entry-points.md: broken link 'src/components/StatusBar.svelte' -> 'Docs/architecture/modules/src/components/StatusBar.svelte' not found
- Docs/architecture/modules/01*entry-points.md: broken link 'src/lib/stores/*' -> 'Docs/architecture/modules/src/lib/stores/\_' not found
- Docs/architecture/modules/01_entry-points.md: broken link 'App.svelte' -> 'Docs/architecture/modules/App.svelte' not found
- Docs/architecture/modules/01_entry-points.md: broken link 'main.ts' -> 'Docs/architecture/modules/main.ts' not found
- Docs/architecture/modules/01_entry-points.md: broken link 'Docs/reports/STATUS_2026-02-10.md' -> 'Docs/architecture/modules/Docs/reports/STATUS_2026-02-10.md' not found
- Docs/architecture/modules/01_entry-points.md: broken link 'Docs/TODO.md' -> 'Docs/architecture/modules/Docs/TODO.md' not found
- Docs/architecture/modules/02_sandbox.rs.md: broken link 'src-tauri/src/plugin_system/sandbox.rs' -> 'Docs/architecture/modules/src-tauri/src/plugin_system/sandbox.rs' not found
- Docs/architecture/modules/02_sandbox.rs.md: broken link 'src-tauri/src/plugin_system/sandbox.rs' -> 'Docs/architecture/modules/src-tauri/src/plugin_system/sandbox.rs' not found
- Docs/architecture/modules/02_sandbox.rs.md: broken link 'src-tauri/src/plugin_system/mod.rs' -> 'Docs/architecture/modules/src-tauri/src/plugin_system/mod.rs' not found
- Docs/architecture/modules/02_sandbox.rs.md: broken link 'src-tauri/src/plugin_system/loader.rs' -> 'Docs/architecture/modules/src-tauri/src/plugin_system/loader.rs' not found
- Docs/architecture/modules/02_sandbox.rs.md: broken link 'src-tauri/src/plugin_system/manager.r`' -> 'Docs/architecture/modules/src-tauri/src/plugin_system/manager.r`' not found
- Docs/architecture/modules/02_sandbox.rs.md: broken link 'src-tauri/src/plugin_system/api.rs' -> 'Docs/architecture/modules/src-tauri/src/plugin_system/api.rs' not found
- Docs/architecture/modules/02_sandbox.rs.md: broken link 'src-tauri/src/main.rs' -> 'Docs/architecture/modules/src-tauri/src/main.rs' not found
- Docs/architecture/modules/03_capabilities.rs.md: broken link 'src-tauri/src/plugin_system/capabilities.rs' -> 'Docs/architecture/modules/src-tauri/src/plugin_system/capabilities.rs' not found
- Docs/architecture/modules/04_Editor.svelte.md: broken link 'Docs/architecture/modules/07_editor-loader.ts.md' -> 'Docs/architecture/modules/Docs/architecture/modules/07_editor-loader.ts.md' not found
- Docs/architecture/modules/04_Editor.svelte.md: broken link 'Docs/architecture/modules/13_editor.ts.md' -> 'Docs/architecture/modules/Docs/architecture/modules/13_editor.ts.md' not found
- Docs/architecture/modules/04_Editor.svelte.md: broken link 'Docs/architecture/modules/17_StatusBar.svelte.md' -> 'Docs/architecture/modules/Docs/architecture/modules/17_StatusBar.svelte.md' not found
- Docs/architecture/modules/04_worker.rs.md: broken link 'src-tauri/src/plugin_system/worker.rs' -> 'Docs/architecture/modules/src-tauri/src/plugin_system/worker.rs' not found
- Docs/architecture/modules/05_api.rs.md: broken link 'src-tauri/src/plugin_system/api.rs' -> 'Docs/architecture/modules/src-tauri/src/plugin_system/api.rs' not found
- Docs/architecture/modules/05_api.rs.md: broken link 'src-tauri/src/plugin_system/api.rs' -> 'Docs/architecture/modules/src-tauri/src/plugin_system/api.rs' not found
- Docs/architecture/modules/05_api.rs.md: broken link 'src-tauri/src/plugin_system/sandbox.rs' -> 'Docs/architecture/modules/src-tauri/src/plugin_system/sandbox.rs' not found
- Docs/architecture/modules/05_api.rs.md: broken link 'src-tauri/src/plugin_system/capabilities.rs' -> 'Docs/architecture/modules/src-tauri/src/plugin_system/capabilities.rs' not found
- Docs/architecture/modules/06_main.ts.md: broken link 'src/App.svelte' -> 'Docs/architecture/modules/src/App.svelte' not found
- Docs/architecture/modules/06_main.ts.md: broken link 'Docs/architecture/modules/01_entry-points.md' -> 'Docs/architecture/modules/Docs/architecture/modules/01_entry-points.md' not found
- Docs/architecture/modules/07_editor-loader.ts.md: broken link 'Docs/architecture/modules/04_Editor.svelte.md' -> 'Docs/architecture/modules/Docs/architecture/modules/04_Editor.svelte.md' not found
- Docs/architecture/modules/07_editor-loader.ts.md: broken link 'Docs/architecture/modules/08_theme.ts.md' -> 'Docs/architecture/modules/Docs/architecture/modules/08_theme.ts.md' not found
- Docs/architecture/modules/08_theme.ts.md: broken link 'Docs/architecture/modules/12_main.rs.md' -> 'Docs/architecture/modules/Docs/architecture/modules/12_main.rs.md' not found
- Docs/architecture/modules/08_theme.ts.md: broken link 'Docs/architecture/modules/04_Editor.svelte.md' -> 'Docs/architecture/modules/Docs/architecture/modules/04_Editor.svelte.md' not found
- Docs/architecture/modules/09_plugin-api.ts.md: broken link 'Docs/architecture/modules/05_api.rs.md' -> 'Docs/architecture/modules/Docs/architecture/modules/05_api.rs.md' not found
- Docs/architecture/modules/09_plugin-api.ts.md: broken link 'Docs/architecture/modules/12_main.rs.md' -> 'Docs/architecture/modules/Docs/architecture/modules/12_main.rs.md' not found
- Docs/architecture/modules/09_plugin-api.ts.md: broken link 'Docs/architecture/modules/12_main.rs.md' -> 'Docs/architecture/modules/Docs/architecture/modules/12_main.rs.md' not found
- Docs/architecture/modules/09_plugin-api.ts.md: broken link 'Docs/architecture/modules/14_plugins.ts.md' -> 'Docs/architecture/modules/Docs/architecture/modules/14_plugins.ts.md' not found
- Docs/architecture/modules/09_plugin-api.ts.md: broken link 'Docs/architecture/modules/05_api.rs.md' -> 'Docs/architecture/modules/Docs/architecture/modules/05_api.rs.md' not found
- Docs/architecture/modules/10_loader.rs.md: broken link 'Docs/architecture/modules/11_manager.rs.md' -> 'Docs/architecture/modules/Docs/architecture/modules/11_manager.rs.md' not found
- Docs/architecture/modules/10_loader.rs.md: broken link 'Docs/architecture/modules/12_main.rs.md' -> 'Docs/architecture/modules/Docs/architecture/modules/12_main.rs.md' not found
- Docs/architecture/modules/11_manager.rs.md: broken link 'Docs/architecture/modules/10_loader.rs.md' -> 'Docs/architecture/modules/Docs/architecture/modules/10_loader.rs.md' not found
- Docs/architecture/modules/11_manager.rs.md: broken link 'Docs/architecture/modules/12_main.rs.md' -> 'Docs/architecture/modules/Docs/architecture/modules/12_main.rs.md' not found
- Docs/architecture/modules/12_main.rs.md: broken link 'Docs/reports/STATUS_2026-02-10.md' -> 'Docs/architecture/modules/Docs/reports/STATUS_2026-02-10.md' not found
- Docs/architecture/modules/12_main.rs.md: broken link 'Docs/architecture/modules/10_loader.rs.md' -> 'Docs/architecture/modules/Docs/architecture/modules/10_loader.rs.md' not found
- Docs/architecture/modules/12_main.rs.md: broken link 'Docs/architecture/modules/11_manager.rs.md' -> 'Docs/architecture/modules/Docs/architecture/modules/11_manager.rs.md' not found
- Docs/architecture/modules/13_editor.ts.md: broken link 'Docs/architecture/modules/04_Editor.svelte.md' -> 'Docs/architecture/modules/Docs/architecture/modules/04_Editor.svelte.md' not found
- Docs/architecture/modules/13_editor.ts.md: broken link 'Docs/architecture/modules/17_StatusBar.svelte.md' -> 'Docs/architecture/modules/Docs/architecture/modules/17_StatusBar.svelte.md' not found
- Docs/architecture/modules/14_plugins.ts.md: broken link 'Docs/architecture/modules/11_manager.rs.md' -> 'Docs/architecture/modules/Docs/architecture/modules/11_manager.rs.md' not found
- Docs/architecture/modules/14_plugins.ts.md: broken link 'Docs/architecture/modules/17_StatusBar.svelte.md' -> 'Docs/architecture/modules/Docs/architecture/modules/17_StatusBar.svelte.md' not found
- Docs/architecture/modules/15_debounce.ts.md: broken link 'Docs/architecture/modules/04_Editor.svelte.md' -> 'Docs/architecture/modules/Docs/architecture/modules/04_Editor.svelte.md' not found
- Docs/architecture/modules/15_debounce.ts.md: broken link 'Docs/architecture/modules/13_editor.ts.md' -> 'Docs/architecture/modules/Docs/architecture/modules/13_editor.ts.md' not found
- Docs/architecture/modules/16_ui.ts.md: broken link 'Docs/architecture/modules/17_StatusBar.svelte.md' -> 'Docs/architecture/modules/Docs/architecture/modules/17_StatusBar.svelte.md' not found
- Docs/architecture/modules/16_ui.ts.md: broken link 'Docs/architecture/modules/18_Chrome.svelte.md' -> 'Docs/architecture/modules/Docs/architecture/modules/18_Chrome.svelte.md' not found
- Docs/architecture/modules/17_StatusBar.svelte.md: broken link 'Docs/architecture/modules/13_editor.ts.md' -> 'Docs/architecture/modules/Docs/architecture/modules/13_editor.ts.md' not found
- Docs/architecture/modules/17_StatusBar.svelte.md: broken link 'Docs/architecture/modules/14_plugins.ts.md' -> 'Docs/architecture/modules/Docs/architecture/modules/14_plugins.ts.md' not found
- Docs/architecture/modules/18_Chrome.svelte.md: broken link 'Docs/architecture/modules/01_entry-points.md' -> 'Docs/architecture/modules/Docs/architecture/modules/01_entry-points.md' not found
- Docs/architecture/modules/18_Chrome.svelte.md: broken link 'Docs/architecture/modules/17_StatusBar.svelte.md' -> 'Docs/architecture/modules/Docs/architecture/modules/17_StatusBar.svelte.md' not found
- Docs/architecture/modules/19_git-plugin-main.ts.md: broken link 'plugins/git/main.ts' -> 'Docs/architecture/modules/plugins/git/main.ts' not found
- Docs/architecture/modules/19_git-plugin-main.ts.md: broken link 'Docs/architecture/modules/14_plugins.ts.md' -> 'Docs/architecture/modules/Docs/architecture/modules/14_plugins.ts.md' not found
- Docs/architecture/modules/19_git-plugin-main.ts.md: broken link 'Docs/architecture/modules/05_api.rs.md' -> 'Docs/architecture/modules/Docs/architecture/modules/05_api.rs.md' not found
- Docs/architecture/modules/20_keybindings.ts.md: broken link 'App.svelte' -> 'Docs/architecture/modules/App.svelte' not found
  Error: Process completed with exit code 1.

---
