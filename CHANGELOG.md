# Changelog

All notable changes to skretchpad will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-10-24

### Added

- Basic Tauri 2.0 application setup
- Simple Svelte 4 frontend structure
- Basic CodeMirror 6 editor integration
- Simple UI components (chrome, editor, status bar)
- Working build pipeline for frontend and backend
- Development environment with Tauri dev server

### Silenced (Commented out)

- Plugin system (sandbox.rs, api.rs, capabilities.rs, trust.rs)
- Advanced theme engine and CSS generation
- File operations functionality
- Diff view implementation
- Command palette
- Git integration
- Keybinding system
- Advanced window controls integration
- Complex language definition system

### Changed

- Simplified from complex architecture to minimal working version
- Reduced dependencies to essential packages only
- Streamlined configuration files

### Technical Implementation

#### Frontend Stack

- **Svelte 4**: Modern reactive framework
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool and dev server
- **CodeMirror 6**: Modern text editor with modular architecture

#### Backend Stack

- **Rust**: Systems programming language for performance
- **Tauri 2.0**: Modern desktop app framework
- **Tokio**: Async runtime for Rust
- **Serde**: Serialization framework

#### Build System

- **npm**: Package management and scripts
- **Cargo**: Rust package manager
- **Vite**: Frontend bundling and development
- **Tauri CLI**: Desktop app building and development

### Development Environment

- **Hot Reload**: Development server with hot module replacement
- **Type Safety**: Full TypeScript integration
- **Linting**: ESLint and Prettier configuration
- **Build Pipeline**: Automated build process for development and production

### File Structure

```plaintext
skretchpad/
├── src/                         # Frontend (Svelte + TypeScript)
│   ├── components/              # UI Components
│   │   ├── App.svelte           # Main application
│   │   ├── Editor.svelte        # CodeMirror editor
│   │   ├── Chrome.svelte        # Title bar
│   │   └── StatusBar.svelte     # Status bar
│   └── main.ts                  # Entry point
├── src-tauri/                   # Backend (Rust + Tauri)
│   ├── src/                     # Rust source code
│   │   ├── main.rs              # Application entry point
│   │   ├── window_manager.rs    # Window controls
│   │   └── theme_engine.rs      # Theme system
│   └── tauri.conf.json          # Tauri configuration
├── themes/                      # Theme definitions
│   └── glass-dark.toml          # Glass dark theme
├── languages/                   # Language definitions
│   ├── python.lang.json         # Python language config
│   └── markdown.lang.json       # Markdown language config
└── Docs/                        # Documentation
    └── architecture/            # Architecture documentation
```

### Known Issues

- **File Operations**: Open/save functionality not yet implemented
- **Plugin System**: Plugin architecture planned but not implemented
- **Command Palette**: Command palette UI not yet implemented
- **Diff View**: Side-by-side diff viewer not yet implemented

### Next Steps

1. **File Operations**: Implement file open/save functionality
2. **Plugin System**: Complete plugin architecture implementation
3. **Command Palette**: Add command palette UI
4. **Diff View**: Implement side-by-side diff viewer
5. **Git Integration**: Add Git plugin functionality
6. **Keybinding System**: Implement custom keybinding support

### Development Notes

- Application successfully builds and runs in development mode
- Glass theme system provides modern, minimal UI
- CodeMirror 6 integration provides excellent text editing experience
- Tauri 2.0 provides native desktop app performance
- Modular architecture allows for easy feature extension

---

## Version History

- **0.1.0** - Initial implementation with core architecture and basic functionality

## Contributing

Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details on how to contribute to this project.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
