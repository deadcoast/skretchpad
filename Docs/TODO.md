# TODO - Skretchpad Maintenance and Polish

> Living TODO Document
> Current baseline: **v0.1.0**
> Last updated: `v0.1.0` (2026-02-10)

---

## High Priority

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
Fuzzy file finder over the entire workspace. Index file paths on workspace open, debounced re-index on fs changes. Render in the existing CommandPalette component with a "file mode" variant. Should handle 100k+ files without lag (stream results, virtual scroll)
Status: `PARTIAL` - `Ctrl+P` now routes to quick-open file dialog (`file.quickOpen`), but indexed fuzzy workspace finder is still pending.

### 1.2 Go To Line (`Ctrl+G`)
Simple numeric input dialog that scrolls CodeMirror to the target line. Keybinding already registered but no UI exists
Status: `COMPLETE` - `Ctrl+G` now opens Go To Line input and jumps editor cursor/viewport to the requested line.
Validation: `npm run lint` + `npm run check` + `npm run test -- --run src/components/CommandPalette.test.ts src/components/StatusBar.test.ts src/lib/utils/path.test.ts`

### 1.3 Go To Symbol (`Ctrl+Alt+O` suggested)
List symbols (functions, classes, headings) in the current file via CodeMirror's syntax tree. No LSP required — parse the CM6 tree directly. Opens in CommandPalette with `@` prefix filter

### 1.4 Multi-Cursor Editing
CodeMirror 6 supports multi-cursor natively. Wire up:
- `Ctrl+D` — select next occurrence
- `Ctrl+Shift+L` — select all occurrences
- `Alt+Click` — add cursor at click position
- `Ctrl+Alt+Up/Down` — add cursor above/below

### 1.5 Code Folding
CM6 has `foldGutter()` and `foldKeymap`. Enable fold markers in the gutter and wire `Ctrl+Shift+[` / `Ctrl+Shift+]` for fold/unfold. Add "Fold All" / "Unfold All" to command palette

### 1.6 Bracket Matching & Pair Colorization
CM6 `bracketMatching()` extension for highlight-on-cursor. Add rainbow bracket colorization via a custom extension or `@replit/codemirror-indentation-markers`

### 1.7 Indent Guides
Render subtle vertical lines at each indentation level. CM6 extension or custom decoration

### 1.8 Sticky Scroll
Pin the current scope's opening line (function/class signature) at the top of the editor as the user scrolls deeper into nested code. Similar to VS Code's sticky scroll

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
Replace the single generic file icon with distinct icons per extension (or extension group). Ship a small SVG icon set: `.js/.ts`, `.py`, `.rs`, `.json`, `.md`, `.html/.css`, `.svg/.png`, `.toml/.yaml`, `.go`, `.java`, `.c/.cpp`, folder-open variant. Map via `getFileIcon(filename)` utility

### 2.4 Git Status Decorations
Show colored dot or letter badge on each file/folder in the tree:
- **M** (modified, yellow) — **A** (added, green) — **D** (deleted, red) — **U** (untracked, grey)
- Folder badges aggregate child statuses
Wire to the existing `gitStore` data

### 2.5 File Filtering & Search
Filter input at the top of the explorer to narrow visible files by name pattern. Separate from workspace-wide content search

### 2.6 Collapse All Button
Header action to recursively collapse every expanded folder
Status: `COMPLETE` - Explorer header now includes Collapse All action that closes expanded tree nodes recursively.
Validation: `npm run lint` + `npm run check` + targeted Vitest suite

---

## 3. Workspace-Wide Search (P0)

### 3.1 Find in Files (`Ctrl+Shift+F`)
New sidebar panel with:
- Search input with regex toggle, case-sensitivity toggle, whole-word toggle
- Replace input with replace-one / replace-all
- File include/exclude glob filters
- Results grouped by file, with line previews and click-to-open

Backend: add `search_workspace` Tauri command using `grep`/`ripgrep` subprocess or Rust `ignore` + `regex` crates for speed. Stream results back via Tauri events for large workspaces

### 3.2 Search Result Highlighting
When navigating from a search result into the editor, highlight all matches in the viewport with a distinct background color and scroll to the first match

---

### Shelved Product Work

- [ ] Terminal panel integration
- [ ] Workspace-wide search (`Ctrl+Shift+F`) with results panel
- [ ] Split-editor shared tab-state strategy (linked vs independent mode)
- [ ] Medium/long-term roadmap features from shelved planning docs
- [ ] Production signer operations policy (key distribution, rotation, revocation governance) after cryptographic signature verification implementation
- [ ] Full plugin API/frontend parity for all documented extension surfaces
- [ ] Full-featured git plugin architecture beyond minimal sandbox scripts

---
