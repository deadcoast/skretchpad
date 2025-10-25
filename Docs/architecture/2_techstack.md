# Core Architecture

## Tech Stack Recommendation

Framework: Tauri 2.x
Frontend: Solid.js or Svelte (lighter than React, faster)
Text Engine: Monaco Editor (modular) or CodeMirror 6 (more minimal)
Styling: Tailwind CSS with custom design tokens
State: Nanostores or Solid signals
File System: Tauri's fs API

---

## UI/UX Design System

### Visual Hierarchy Levels

```rust
// Design token structure
struct UIState {
    chrome: ChromeVisibility,  // 0-100% opacity
    glass_blur: f32,           // backdrop blur intensity
    accent_color: Color,
    window_opacity: f32,
}

enum ChromeVisibility {
    Hidden,        // Cmd+Shift+H - pure text window
    Minimal,       // Title bar + status only
    Full,          // All UI elements visible
}
```

### "Liquid Glass" Theme System

```toml
# themes/glass-dark.toml
[window]
background = "rgba(18, 18, 18, 0.85)"
backdrop_blur = 20
border_radius = 12
border = "1px solid rgba(255, 255, 255, 0.1)"

[chrome]
height = 32
background = "rgba(28, 28, 28, 0.95)"
blur = 10

[editor]
background = "transparent"
foreground = "#e4e4e4"
cursor = "#00d9ff"
selection = "rgba(0, 217, 255, 0.2)"

[syntax]
comment = "#6a737d"
keyword = "#ff79c6"
string = "#50fa7b"
function = "#8be9fd"
# ... modular token system
```

---

## Modular Syntax System

### Language Definition Format

```typescript
// languages/python.lang.json
{
  "id": "python",
  "extensions": [".py", ".pyw"],
  "tokenizer": "tree-sitter-python", // or textmate grammar
  "config": {
    "comments": {
      "line": "#",
      "block": ["'''", "'''"]
    },
    "brackets": [
      ["(", ")"],
      ["[", "]"],
      ["{", "}"]
    ],
    "autoClosingPairs": [
      { "open": "'", "close": "'" },
      { "open": "\"", "close": "\"" }
    ]
  },
  "theme_mapping": {
    "keyword": "syntax.keyword",
    "string": "syntax.string",
    "function": "syntax.function"
    // Maps language tokens to theme tokens
  }
}
```

### Language Loader System

```rust
// src-tauri/src/language_loader.rs
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Deserialize)]
pub struct LanguageDefinition {
    id: String,
    extensions: Vec<String>,
    tokenizer: String,
    config: LanguageConfig,
    theme_mapping: HashMap<String, String>,
}

pub struct LanguageRegistry {
    languages: HashMap<String, LanguageDefinition>,
}

impl LanguageRegistry {
    pub fn load_language(&mut self, path: &str) -> Result<()> {
        // Hot-reload language definitions
    }
    
    pub fn detect_language(&self, filename: &str) -> Option<&LanguageDefinition> {
        // Extension-based detection
    }
}
```

---

## Plugin System Architecture

### Plugin Manifest Format

```toml
# plugins/git-status/plugin.toml
name = "git-status"
version = "0.1.0"
author = "heat"

[permissions]
filesystem = ["read"]
commands = ["git"]

[hooks]
on_file_open = "check_git_status"
on_save = "update_git_status"

[ui]
status_bar = true
sidebar = false

[commands]
git.status = { key = "Ctrl+G", label = "Git Status" }
git.diff = { key = "Ctrl+Shift+G", label = "Git Diff" }
```

### Plugin API Design

```typescript
// Plugin API surface
interface SkretchpadPlugin {
  activate(context: PluginContext): void;
  deactivate(): void;
}

interface PluginContext {
  // File operations
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  
  // Editor operations
  getActiveEditor(): Editor | null;
  onDidChangeActiveEditor(callback: (editor: Editor) => void): void;
  
  // UI extensions
  addStatusBarItem(item: StatusBarItem): Disposable;
  registerCommand(command: Command): Disposable;
  
  // Events
  on(event: EditorEvent, callback: Function): void;
}
```

---

## Feature Specifications

### 1. Window Management

```rust
// src-tauri/src/window_manager.rs
#[tauri::command]
pub fn toggle_always_on_top(window: tauri::Window) -> Result<bool> {
    let current = window.is_always_on_top()?;
    window.set_always_on_top(!current)?;
    Ok(!current)
}

#[tauri::command]
pub fn set_chrome_visibility(window: tauri::Window, level: ChromeLevel) {
    match level {
        ChromeLevel::Hidden => {
            window.set_decorations(false);
            // Emit event to hide internal chrome
        },
        ChromeLevel::Minimal => {
            window.set_decorations(true);
            // Show minimal UI
        },
        ChromeLevel::Full => {
            window.set_decorations(true);
            // Show all UI elements
        }
    }
}
```

### 2. Diff View Integration

```typescript
// src/features/diff/DiffView.svelte
<script lang="ts">
  import { createDiffEditor } from 'monaco-editor';
  
  export let original: string;
  export let modified: string;
  
  let diffEditor;
  
  onMount(() => {
    diffEditor = createDiffEditor(container, {
      theme: 'glass-dark',
      readOnly: false,
      renderSideBySide: true,
      // Minimal UI
      lineNumbers: 'on',
      minimap: { enabled: false },
      scrollbar: { vertical: 'hidden' }
    });
    
    diffEditor.setModel({
      original: monaco.editor.createModel(original),
      modified: monaco.editor.createModel(modified)
    });
  });
</script>
```

### 3. Keyboard-First Navigation

```toml
# keybindings.toml
[global]
"Ctrl+Shift+H" = "toggle_chrome"
"Ctrl+P" = "toggle_pin"
"Ctrl+," = "open_settings"
"Ctrl+Shift+P" = "command_palette"

[editor]
"Ctrl+D" = "diff_view"
"Ctrl+/" = "toggle_comment"
"Ctrl+Shift+F" = "format_document"

[navigation]
"Ctrl+Tab" = "next_tab"
"Ctrl+Shift+Tab" = "previous_tab"
"Ctrl+W" = "close_tab"
```

---

## Implementation Phases

### Phase 1: Core (MVP) ✅ COMPLETED

- [x] Basic Tauri window with CodeMirror 6
- [x] Syntax highlighting for markdown, python, rust, json, javascript
- [x] Dark theme with transparency (glass theme)
- [ ] File open/save
- [x] Always-on-top toggle (backend ready)
- [x] Chrome visibility toggle

### Phase 2: Enhanced Features 🚧 IN PROGRESS

- [ ] Diff view mode
- [x] Theme system with hot-reload (basic implementation)
- [x] Language definition loader (structure in place)
- [x] Status bar with file info
- [ ] Command palette

### Phase 3: Extensibility 📋 PLANNED

- [ ] Plugin manifest parser
- [ ] Plugin API implementation
- [ ] Plugin marketplace/discovery
- [ ] Custom keybinding editor

---

## Ditrectory Structure and Design

[SEE DIRECTORY TREE](Docs/directory_tree.md)

## Key Design Principles

1. Minimal by default, powerful when needed - Hide complexity until requested
2. File-based configuration - TOML/JSON for themes, languages, plugins (no database)
3. Hot-reload everything - Languages, themes, plugins reload without restart
4. Zero-config syntax - Auto-detect language from extension
5. Native performance - Leverage Rust for file operations and heavy lifting
6. Keyboard-first - Every action accessible via keyboard
