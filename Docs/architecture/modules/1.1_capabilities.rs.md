# src-tauri/src/plugin_system/capabilities.rs

1. FilesystemCapability - Controls file system access (None, WorkspaceRead, WorkspaceReadWrite, Scoped)
2. NetworkCapability - Controls network access (None, DomainAllowlist, Unrestricted)
3. CommandCapability - Controls shell command execution with allowlists
4. UiCapability - Controls UI modification permissions
5. PluginCapabilities - Complete capability set with merge/subset operations
6. Comprehensive test suite
