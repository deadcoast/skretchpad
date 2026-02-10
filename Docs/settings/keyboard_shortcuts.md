# Keyboard Shortcuts

This page lists shortcuts verified from current runtime wiring in `src/App.svelte`.

## Global Shortcuts (Implemented)

| Shortcut       | Action                     |
|----------------|----------------------------|
| `Ctrl+Shift+P` | Toggle command palette     |
| `Ctrl+Shift+H` | Toggle chrome/minimal mode |
| `Ctrl+Shift+G` | Open source control panel  |
| `Ctrl+B`       | Toggle sidebar             |
| `Ctrl+O`       | Open file                  |
| `Ctrl+N`       | New file                   |
| `Ctrl+S`       | Save file                  |
| `Ctrl+Shift+S` | Save file as               |
| `Ctrl+W`       | Close file                 |
| `Ctrl+\`       | Toggle split editor        |
| `Ctrl+,`       | Toggle settings            |

## Menu Actions

| Menu Path                | Action      |
|--------------------------|-------------|
| `File -> Open Folder...` | Open folder |

## Notes

- Additional bindings are defined in `src/configs/keybindings.toml` and `src/lib/stores/keybindings.ts`.
- Not every configured binding is globally wired yet; this file documents only behavior currently active in the app shell.
