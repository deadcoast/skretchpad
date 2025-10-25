# skretchpad

A minimal, modern text editor for developers built with Tauri 2.0, Svelte, and CodeMirror 6.

## Features

- **Liquid Glass UI**: Modern glass theme with backdrop blur effects
- **Minimal Design**: Clean, unobtrusive interface that stays out of your way
- **Syntax Highlighting**: Support for Python, Rust, Markdown, JavaScript, and JSON
- **Always on Top**: Pin the window to stay visible while working
- **Chrome Toggle**: Hide/show UI elements for distraction-free editing
- **Theme System**: Customizable themes with hot-reload support

## Current Status

### ✅ Minimal Working Version
- Basic application architecture (Tauri 2.0 + Svelte + CodeMirror 6)
- Simple UI components (Editor, Chrome, StatusBar)
- Basic syntax highlighting for multiple languages
- Working build system and development environment

### ❌ Features Removed/Not Implemented
- **Plugin System**: Completely removed to get build working
- **File Operations**: No file open/save functionality
- **Advanced Theme System**: Removed complex theme loading
- **Window Management**: Backend exists but not connected
- **Diff View**: Not implemented
- **Command Palette**: Not implemented
- **Git Integration**: Not implemented
- **Keybinding System**: Not implemented

### 📋 Still Needed
- File operations (open/save)
- Plugin system implementation
- Advanced theme features
- Window management integration
- Diff view integration
- Command palette
- Git integration
- Custom keybinding system

## Quick Start

### Prerequisites
- Node.js 18+
- Rust 1.70+
- Tauri CLI

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run tauri:dev
```

### Building

```bash
# Build for development
npm run build

# Build for production
npm run tauri:build
```

## Architecture

- **Frontend**: Svelte 4 with TypeScript
- **Backend**: Rust with Tauri 2.0
- **Editor**: CodeMirror 6 with modular extensions
- **Theme**: TOML-based theme system with CSS variables
- **Languages**: JSON-based language definitions

## Documentation

- [Architecture Overview](Docs/architecture/1_overview.md)
- [Technical Details](Docs/architecture/3_technical-details.md)
- [Configuration Guide](Docs/architecture/4_configs.md)
- [Directory Structure](Docs/directory_tree.md)

## Contributing

This project is in active development. See [CHANGELOG.md](CHANGELOG.md) for recent changes and [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.

## License

MIT License - see [LICENSE](LICENSE) for details.
