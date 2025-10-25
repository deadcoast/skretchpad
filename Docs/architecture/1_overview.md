# skretchpad - a minimal notepad with powerful features

## PROBLEM

- ObsidianMD is a great note taking application. It solves any issue i have except one; simplicity
- Notepad++ is simple, and fast because of its framework, it has good features for plugins, but it is very, very ugly, and intrusive on the eyes. its old, and dated.
- Most text apps ui are big and bulky, its hard to keep the text window 'on screen' because of how intrusive their ui and ux is.

## SOLUTION

`skretchpad`

- sleek, minimal, modern, developer targeted features to allow the text window to be on screen, without the clutter.

---

Designed to be a minimal, modern, feature complete text application for developers. It is designed specifically for developers, to fill the niche of something thats not so heavy like obsidian, and modern which notepad++ lacks.

## FEATURES

- Basic Build System: Frontend and backend compile successfully
- Minimal App Structure: Basic Svelte + Tauri setup
- Simple Editor: CodeMirror 6 with basic syntax highlighting
- Basic UI: Simple chrome, editor, and status bar components
- Development Environment: Tauri dev server runs
- Theme System: Basic CSS variables, but theme engine removed
- Window Management: Rust modules exist but not connected
- Language Support: Basic CodeMirror languages, but custom system removed
- Plugin System: Completely removed (sandbox.rs, api.rs, etc.)
- Advanced Theme Engine: Removed complex theme loading
- File Operations: No file open/save functionality
- Diff View: Not implemented
- Command Palette: Not implemented
- Git Integration: Not implemented
- Keybinding System: Not implemented
- Language Definition System: Simplified to basic CodeMirror
- Advanced Window Controls: Backend exists but not connected

NOTES:

- The design should be minimal at its base. The ui should toggle, on or off. It should be a dark themed, sleek ui, similar to the direction apple is going in with 'liquid glass'
- The text window should support:
- syntax highlighting:[markdown, python, css, html, js, react, rust, yaml, toml, json]
- modulated system, should be easy to add new language support for syntax highlighting
- diff
- Structured plugin system for future additions
- structured styling for themes to integrate easy visual modification and changes
- 'pinning' the window (always on top)
