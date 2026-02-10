# Skretchpad — Future Features & Roadmap

> Living document tracking essential features, improvements, and upgrades.
> Current baseline: **v0.0.11** — 56 Tauri commands, 17 Svelte components, 16 languages, 6 themes, 2 plugins, 316 tests passing.

---

## Priority Legend

| Tag    | Meaning                                      |
|--------|----------------------------------------------|
| **P0** | Critical — needed for daily-driver viability |
| **P1** | High — expected in any modern editor         |
| **P2** | Medium — significant quality-of-life         |
| **P3** | Nice-to-have — polish and delight            |

---

## 1. Core Editor (P0)

### 1.1 Quick Open / Go To File (`Ctrl+P`)
Fuzzy file finder over the entire workspace. Index file paths on workspace open, debounced re-index on fs changes. Render in the existing CommandPalette component with a "file mode" variant. Should handle 100k+ files without lag (stream results, virtual scroll).

### 1.2 Go To Line (`Ctrl+G`)
Simple numeric input dialog that scrolls CodeMirror to the target line. Keybinding already registered but no UI exists.

### 1.3 Go To Symbol (`Ctrl+Shift+O`)
List symbols (functions, classes, headings) in the current file via CodeMirror's syntax tree. No LSP required — parse the CM6 tree directly. Opens in CommandPalette with `@` prefix filter.

### 1.4 Multi-Cursor Editing
CodeMirror 6 supports multi-cursor natively. Wire up:
- `Ctrl+D` — select next occurrence
- `Ctrl+Shift+L` — select all occurrences
- `Alt+Click` — add cursor at click position
- `Ctrl+Alt+Up/Down` — add cursor above/below

### 1.5 Code Folding
CM6 has `foldGutter()` and `foldKeymap`. Enable fold markers in the gutter and wire `Ctrl+Shift+[` / `Ctrl+Shift+]` for fold/unfold. Add "Fold All" / "Unfold All" to command palette.

### 1.6 Bracket Matching & Pair Colorization
CM6 `bracketMatching()` extension for highlight-on-cursor. Add rainbow bracket colorization via a custom extension or `@replit/codemirror-indentation-markers`.

### 1.7 Indent Guides
Render subtle vertical lines at each indentation level. CM6 extension or custom decoration.

### 1.8 Sticky Scroll
Pin the current scope's opening line (function/class signature) at the top of the editor as the user scrolls deeper into nested code. Similar to VS Code's sticky scroll.

---

## 2. File Explorer Enhancements (P0)

### 2.1 File CRUD Operations
Right-click context menu with:
- New File / New Folder
- Rename (`F2`)
- Delete (with confirmation dialog)
- Duplicate
- Copy Path / Copy Relative Path

Backend: add `create_file`, `create_directory`, `rename_path`, `delete_path` Tauri commands.

### 2.2 Drag & Drop
- Reorder / move files and folders within the tree
- Drop external files into the explorer to copy them into the workspace

### 2.3 File Type Icons
Replace the single generic file icon with distinct icons per extension (or extension group). Ship a small SVG icon set: `.js/.ts`, `.py`, `.rs`, `.json`, `.md`, `.html/.css`, `.svg/.png`, `.toml/.yaml`, `.go`, `.java`, `.c/.cpp`, folder-open variant. Map via `getFileIcon(filename)` utility.

### 2.4 Git Status Decorations
Show colored dot or letter badge on each file/folder in the tree:
- **M** (modified, yellow) — **A** (added, green) — **D** (deleted, red) — **U** (untracked, grey)
- Folder badges aggregate child statuses.
Wire to the existing `gitStore` data.

### 2.5 File Filtering & Search
Filter input at the top of the explorer to narrow visible files by name pattern. Separate from workspace-wide content search.

### 2.6 Collapse All Button
Header action to recursively collapse every expanded folder.

---

## 3. Workspace-Wide Search (P0)

### 3.1 Find in Files (`Ctrl+Shift+F`)
New sidebar panel with:
- Search input with regex toggle, case-sensitivity toggle, whole-word toggle
- Replace input with replace-one / replace-all
- File include/exclude glob filters
- Results grouped by file, with line previews and click-to-open

Backend: add `search_workspace` Tauri command using `grep`/`ripgrep` subprocess or Rust `ignore` + `regex` crates for speed. Stream results back via Tauri events for large workspaces.

### 3.2 Search Result Highlighting
When navigating from a search result into the editor, highlight all matches in the viewport with a distinct background color and scroll to the first match.

---

## 4. Integrated Terminal (P0)

### 4.1 Terminal Panel (`Ctrl+``)
Embed a terminal emulator in a bottom panel using `xterm.js` + `@xterm/addon-fit`. Backend: spawn a PTY process (`conpty` on Windows, `pty` on Unix) and pipe stdin/stdout over Tauri events or WebSocket.

### 4.2 Multiple Terminal Instances
Tab bar within the terminal panel to create/switch/close terminal sessions. Each session tracks its own shell process and working directory.

### 4.3 Terminal Theming
Map terminal ANSI colors to the active Skretchpad theme's CSS variables so terminals look consistent with the editor.

---

## 5. Language Intelligence (P1)

### 5.1 LSP Client Integration
Generic Language Server Protocol client in Rust that communicates with any LSP-compliant server over stdio. Manage server lifecycle per language (auto-start on file open, shutdown on last file close).

Features unlocked:
- **Autocomplete** — completions popup with documentation
- **Hover info** — type signatures, docs on mouse hover
- **Go to Definition** (`F12` / `Ctrl+Click`)
- **Find All References** (`Shift+F12`)
- **Rename Symbol** (`F2` in editor)
- **Signature Help** — parameter hints while typing
- **Diagnostics** — inline error/warning squiggles, problems panel

### 5.2 Diagnostics / Problems Panel
Bottom panel listing all errors and warnings from LSP, linters, or build tools. Click to navigate to source location. Badge count on the status bar.

### 5.3 Inline Diagnostics
Render error/warning squiggles under code via CM6 `lintGutter()` + `Diagnostic` extension. Show message on hover.

### 5.4 Code Actions & Quick Fix (`Ctrl+.`)
Surface LSP code actions (auto-import, extract variable, fix spelling) in a dropdown at the cursor position.

---

## 6. Git & Source Control Enhancements (P1)

### 6.1 Inline Git Blame
Gutter annotation showing last commit author + date per line. Toggle via command palette or status bar. Hover for full commit details.

### 6.2 Git Graph / Log Viewer
Visual branch graph in the Source Control panel. Show commit history with graph lines, author avatars, and commit messages. Click a commit to see its diff.

### 6.3 Merge Conflict Resolution
Detect conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`) and render inline "Accept Current / Accept Incoming / Accept Both" action buttons above each conflict block. Wire to the existing DiffView infrastructure.

### 6.4 Gutter Change Indicators
Colored bars in the editor gutter showing added (green), modified (blue), and deleted (red) lines relative to the git index. Click gutter bar to see inline diff popup.

### 6.5 Stash Management UI
List stashes in the Source Control panel with apply, pop, drop actions. Currently `git_stash` command exists but has no frontend.

### 6.6 Branch Management
Create, delete, and merge branches from the Source Control panel. Show branch list with ahead/behind counts.

---

## 7. Snippets & Autocomplete (P1)

### 7.1 Snippet Engine
User-defined code snippets with tab stops, placeholders, and transformations. Store in `~/.skretchpad/snippets/{language}.json`. Trigger via prefix typing + Tab or from autocomplete dropdown.

### 7.2 Basic Word Autocomplete
Even without LSP, offer word-based autocomplete from the current file and open tabs. CM6's `autocompletion()` extension with a custom `CompletionSource`.

### 7.3 Emmet Support
For HTML/CSS/JSX files, integrate Emmet abbreviation expansion. `div.container>ul>li*5` expands on Tab.

---

## 8. UI / UX Polish (P2)

### 8.1 Welcome Tab
On launch with no open files, show a welcome tab with:
- Recent files/workspaces
- Quick actions (Open Folder, New File, Open Settings)
- Keyboard shortcut cheat sheet
- Version / changelog highlights

### 8.2 Recent Files (`Ctrl+R`)
Track last 50 opened files in `~/.skretchpad/recent.json`. Show in command palette with `recent:` prefix and in the welcome tab.

### 8.3 Zen Mode (`Ctrl+K Z`)
Distraction-free mode: hide sidebar, status bar, tab bar, and title bar. Full-screen editor with centered content column. Escape to exit.

### 8.4 Minimap Enhancements
- Highlight search results in minimap
- Show git change indicators (green/red bars)
- Show diagnostic markers (error = red dot, warning = yellow dot)
- Configurable width and position (left/right)

### 8.5 Editor Tabs — Drag & Drop Reorder
Currently `reorderTabs()` exists in the store but no drag interaction. Add drag-and-drop on TabBar using HTML5 drag events.

### 8.6 Split Editor Sync
Fix the current limitation where split panes don't share tab state. Options:
- Linked mode: both panes follow the same file (different scroll positions)
- Independent mode: separate tab lists per pane (current behavior, but polished)

### 8.7 Breadcrumb Symbol Navigation
Extend Breadcrumb.svelte to show symbol path (file > class > method) using CM6 syntax tree. Click any segment to jump or show a dropdown of siblings.

### 8.8 Notifications Center
Add a bell icon in the status bar that opens a notification history panel. Currently notifications auto-dismiss with no way to review past ones.

### 8.9 Custom Title Bar Menus
The File/Edit/View menus in Chrome.svelte are basic. Add full dropdown menus with all available commands, keyboard shortcut hints, and separator groups.

### 8.10 Drag-to-Resize Panels
The sidebar width (300px) is fixed. Add a drag handle between the sidebar and editor for user-adjustable width. Persist width in settings.

---

## 9. Theme & Appearance (P2)

### 9.1 Syntax Theme Customization
Let users override individual token colors (keywords, strings, comments, etc.) per theme via a visual editor or JSON config. Store overrides in settings.

### 9.2 Theme Preview on Hover
In the Settings panel theme selector, preview the theme on hover before committing the switch.

### 9.3 Icon Theme Support
Pluggable icon themes (Seti, Material, etc.) that override the default file/folder icons in the explorer and tab bar.

### 9.4 Font Ligature Support
Setting to enable/disable programming ligatures (for fonts like Fira Code, JetBrains Mono). Add `font-variant-ligatures` CSS toggle.

### 9.5 Additional Built-In Themes
- Monokai Pro
- One Dark
- Dracula
- Catppuccin (Mocha, Latte)
- GitHub Light / Dark
- Gruvbox

---

## 10. Plugin Ecosystem (P2)

### 10.1 Plugin Marketplace UI
New sidebar panel for browsing, searching, and installing plugins. Plugin registry backend (could be a simple JSON index hosted on GitHub). Show install count, rating, description, and screenshots.

### 10.2 Plugin Install from URL / Registry
`install_plugin` Tauri command that downloads a plugin archive, validates its manifest and signature, extracts to `plugins/`, and activates it.

### 10.3 Plugin Settings UI
Per-plugin configuration panel accessible from the plugin's status bar item or the settings panel. Plugins declare their settings schema in `plugin.toml`.

### 10.4 Plugin API Expansion
- `op_editor_get_selection` — get selected text
- `op_editor_insert_text` — insert at cursor
- `op_editor_get_cursor` — cursor position
- `op_editor_set_cursor` — move cursor
- `op_editor_fold` / `op_editor_unfold` — code folding control
- `op_ui_show_input` — prompt user for input
- `op_ui_show_quickpick` — dropdown selection
- `op_workspace_get_config` — read workspace settings

### 10.5 Plugin Signature Verification
Replace the stub `is_valid()` in trust.rs with real Ed25519 signature verification. Sign first-party plugins at build time. Warn users about unsigned third-party plugins.

### 10.6 Plugin Update System
Check for plugin updates on launch (configurable interval). Show update badge in sidebar. One-click update with rollback on failure.

---

## 11. Performance & Reliability (P2)

### 11.1 Large File Handling
Files >1MB should not be loaded entirely into memory. Implement chunked/virtual rendering for large files. Show a warning banner and disable minimap/syntax highlighting for files >5MB.

### 11.2 File Watcher for External Changes
Watch open files for external modifications (other editors, git operations). Show "File changed on disk. Reload?" prompt. Use the existing `FileWatcherRegistry` infrastructure.

### 11.3 Crash Recovery / Session Restore
On launch, restore previously open tabs and their scroll positions. Persist session state to `~/.skretchpad/session.json` on every tab change. On crash, recover unsaved changes from auto-save cache.

### 11.4 Workspace Indexing
Background index of all file paths and symbols on workspace open. Powers quick open, go-to-symbol, and workspace search. Incremental re-index on file changes.

### 11.5 Editor State Persistence
Remember per-file: scroll position, cursor position, fold state, selection. Restore when re-opening a file.

### 11.6 Startup Performance
Lazy-load heavy components (DiffView, SettingsPanel, SourceControlPanel) on first use. Defer plugin activation until after the UI is interactive. Measure and track time-to-interactive.

---

## 12. Keybindings & Input (P2)

### 12.1 Vim Mode (Full)
The current Vim scheme has 7 bindings. Implement full modal editing:
- Normal, Insert, Visual, Command modes
- Motions: `w`, `b`, `e`, `f`, `t`, `gg`, `G`, `{`, `}`
- Operators: `d`, `c`, `y`, `>`, `<`, `=`
- Commands: `:w`, `:q`, `:wq`, `:e`, `:%s`
- Visual block selection
- Macro recording (`q`)
- Registers (`"a-z`)

Consider integrating `@replit/codemirror-vim` which provides a complete Vim emulation layer for CM6.

### 12.2 Emacs Mode (Full)
The current Emacs scheme has 13 bindings. Expand with:
- Kill ring (`Ctrl+K`, `Ctrl+Y`, `Meta+Y`)
- Mark and region operations
- `Ctrl+X` prefix commands
- Rectangle operations
- Keyboard macros

Consider `@replit/codemirror-emacs` for CM6.

### 12.3 Custom Keybinding Editor UI
Visual keybinding editor in the Settings panel. Show all commands, current bindings, and conflicts. Click to rebind. Export/import keybinding profiles.

### 12.4 Key Chord Support
Two-step shortcuts like `Ctrl+K Ctrl+C` (comment) and `Ctrl+K Ctrl+U` (uncomment). The keybinding store needs a chord state machine.

---

## 13. Developer Experience (P2)

### 13.1 Task Runner
Read `package.json` scripts, `Makefile` targets, or a custom `tasks.json`. Show in a "Tasks" panel or command palette. Run tasks in the integrated terminal.

### 13.2 Build Output Panel
Capture stdout/stderr from build commands and display in a dedicated panel with ANSI color support. Clickable file paths to navigate to errors.

### 13.3 Markdown Preview
Side-by-side live preview for `.md` files. Render with a lightweight Markdown-to-HTML library. Sync scroll between editor and preview.

### 13.4 Image Preview
When opening `.png`, `.jpg`, `.svg`, `.gif`, `.webp` files, render the image instead of showing binary content. Show dimensions and file size in the status bar.

### 13.5 JSON / TOML / YAML Formatter
Extend the existing Prettier integration with format-on-save support. Add settings: `files.formatOnSave` (boolean), `files.formatOnSaveLanguages` (array).

### 13.6 Color Picker
Detect color values (`#hex`, `rgb()`, `hsl()`) in code and show a small color swatch inline. Click to open a color picker that writes back the chosen color.

### 13.7 Compare Files
Command palette action: "Compare Two Files" — opens the existing DiffView with two user-selected files.

### 13.8 Workspace Settings
Support a `.skretchpad/settings.json` in the workspace root that overrides global settings. Show "(Workspace)" badge in settings panel when overrides are active.

---

## 14. Accessibility (P3)

### 14.1 Screen Reader Support
Ensure all interactive elements have proper ARIA labels (partially done). Add `aria-live` regions for dynamic content changes (notifications, search results, git status updates).

### 14.2 High Contrast Theme
A theme specifically designed for users with low vision. Meet WCAG AAA contrast ratios (7:1) for all text.

### 14.3 Keyboard Navigation Audit
Ensure every feature is fully keyboard-accessible. Tab order should be logical. Focus traps in dialogs. Skip-to-content links.

### 14.4 Reduced Motion Mode
Respect `prefers-reduced-motion` media query. Disable all CSS transitions and animations when enabled.

---

## 15. Platform Integration (P3)

### 15.1 Native OS File Associations
Register Skretchpad as a handler for common code file extensions on install. Double-clicking a `.js` file opens it in Skretchpad.

### 15.2 CLI Launcher
`skretch <file|folder>` command-line tool to open files/folders in a running or new Skretchpad instance. `skretch --diff file1 file2` for diff mode.

### 15.3 Auto-Update
Tauri's built-in updater for seamless background updates with release notes. Check on startup, notify in status bar.

### 15.4 Window State Persistence
Remember window position, size, and maximized state across sessions. Restore on launch.

### 15.5 Multi-Window Support
Open additional editor windows with `Ctrl+Shift+N`. Each window can have its own set of tabs and workspace context.

---

## 16. Collaboration (P3)

### 16.1 Shared Editing (CRDT)
Real-time collaborative editing using a CRDT library (Yjs or Automerge). Peer-to-peer via WebRTC or through a relay server. Show remote cursors with usernames.

### 16.2 Live Share Sessions
One-click session sharing via URL. Guest users see the host's editor in real-time. Permission controls for read-only vs. edit access.

---

## Implementation Order (Suggested)

### Phase 1 — Daily Driver (v0.1.x)
1. Quick Open (`Ctrl+P`) — *most impactful single feature*
2. File Explorer CRUD + context menu
3. Integrated terminal
4. Workspace-wide search (`Ctrl+Shift+F`)
5. Go To Line (`Ctrl+G`)
6. Multi-cursor editing
7. Code folding
8. Session restore / crash recovery

### Phase 2 — Power User (v0.2.x)
1. LSP client (autocomplete, go-to-definition, diagnostics)
2. Full Vim mode (`@replit/codemirror-vim`)
3. Git gutter indicators + inline blame
4. Merge conflict resolution UI
5. Snippet engine
6. Recent files
7. Markdown preview
8. File type icons in explorer

### Phase 3 — Ecosystem (v0.3.x)
1. Plugin marketplace UI
2. Plugin install/update system
3. Plugin API expansion
4. Plugin signature verification
5. Task runner
6. Theme customization editor
7. Additional themes (Monokai, Dracula, Catppuccin, etc.)

### Phase 4 — Polish (v0.4.x)
1. Zen mode
2. Sticky scroll
3. Breadcrumb symbol navigation
4. Minimap enhancements
5. Custom keybinding editor
6. Image preview
7. Color picker
8. Welcome tab

### Phase 5 — Platform (v0.5.x)
1. CLI launcher
2. Auto-update
3. File associations
4. Multi-window support
5. Collaboration / shared editing
