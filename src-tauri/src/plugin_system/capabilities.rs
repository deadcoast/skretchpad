// src-tauri/src/plugin_system/capabilities.rs

use serde::{Deserialize, Serialize};
use std::collections::HashSet;

// ============================================================================
// FILESYSTEM CAPABILITIES
// ============================================================================

/// Filesystem access capabilities for plugins
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum FilesystemCapability {
    /// No filesystem access
    None,
    
    /// Read-only access to workspace files
    WorkspaceRead,
    
    /// Read and write access to workspace files
    WorkspaceReadWrite,
    
    /// Scoped access to specific paths
    Scoped {
        /// Paths that can be read
        read: HashSet<String>,
        /// Paths that can be written
        write: HashSet<String>,
    },
}

impl Default for FilesystemCapability {
    fn default() -> Self {
        FilesystemCapability::None
    }
}

impl FilesystemCapability {
    /// Check if capability allows reading from a path
    pub fn can_read(&self, path: &str, workspace_root: &str) -> bool {
        match self {
            FilesystemCapability::None => false,
            FilesystemCapability::WorkspaceRead | FilesystemCapability::WorkspaceReadWrite => {
                path.starts_with(workspace_root)
            }
            FilesystemCapability::Scoped { read, .. } => {
                read.iter().any(|allowed| path.starts_with(allowed))
            }
        }
    }

    /// Check if capability allows writing to a path
    pub fn can_write(&self, path: &str, workspace_root: &str) -> bool {
        match self {
            FilesystemCapability::None | FilesystemCapability::WorkspaceRead => false,
            FilesystemCapability::WorkspaceReadWrite => path.starts_with(workspace_root),
            FilesystemCapability::Scoped { write, .. } => {
                write.iter().any(|allowed| path.starts_with(allowed))
            }
        }
    }
}

// ============================================================================
// NETWORK CAPABILITIES
// ============================================================================

/// Network access capabilities for plugins
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum NetworkCapability {
    /// No network access
    None,
    
    /// Access to specific domains only
    DomainAllowlist(HashSet<String>),
    
    /// Unrestricted network access (use with caution)
    Unrestricted,
}

impl Default for NetworkCapability {
    fn default() -> Self {
        NetworkCapability::None
    }
}

impl NetworkCapability {
    /// Check if capability allows access to a domain
    pub fn can_access(&self, domain: &str) -> bool {
        match self {
            NetworkCapability::None => false,
            NetworkCapability::DomainAllowlist(domains) => domains.contains(domain),
            NetworkCapability::Unrestricted => true,
        }
    }

    /// Add a domain to the allowlist
    pub fn add_domain(&mut self, domain: String) {
        match self {
            NetworkCapability::DomainAllowlist(domains) => {
                domains.insert(domain);
            }
            NetworkCapability::None => {
                *self = NetworkCapability::DomainAllowlist(
                    vec![domain].into_iter().collect(),
                );
            }
            NetworkCapability::Unrestricted => {}
        }
    }
}

// ============================================================================
// COMMAND CAPABILITIES
// ============================================================================

/// Command execution capabilities for plugins
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct CommandCapability {
    /// List of allowed commands
    pub allowlist: HashSet<String>,
    
    /// Whether to require user confirmation before execution
    pub require_confirmation: bool,
}

impl Default for CommandCapability {
    fn default() -> Self {
        CommandCapability {
            allowlist: HashSet::new(),
            require_confirmation: true,
        }
    }
}

impl CommandCapability {
    /// Create a new command capability with an allowlist
    pub fn new(allowlist: Vec<String>) -> Self {
        CommandCapability {
            allowlist: allowlist.into_iter().collect(),
            require_confirmation: false,
        }
    }

    /// Check if a command is allowed
    pub fn can_execute(&self, command: &str) -> bool {
        self.allowlist.contains(command)
    }

    /// Add a command to the allowlist
    pub fn allow_command(&mut self, command: String) {
        self.allowlist.insert(command);
    }

    /// Remove a command from the allowlist
    pub fn disallow_command(&mut self, command: &str) {
        self.allowlist.remove(command);
    }
}

// ============================================================================
// UI CAPABILITIES
// ============================================================================

/// UI modification capabilities for plugins
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct UiCapability {
    /// Can modify status bar
    pub status_bar: bool,
    
    /// Can create sidebar panels
    pub sidebar: bool,
    
    /// Can show notifications
    pub notifications: bool,
    
    /// Can create webview panels
    pub webview: bool,
}

impl Default for UiCapability {
    fn default() -> Self {
        UiCapability {
            status_bar: false,
            sidebar: false,
            notifications: false,
            webview: false,
        }
    }
}

impl UiCapability {
    /// Create UI capability with all permissions
    pub fn all() -> Self {
        UiCapability {
            status_bar: true,
            sidebar: true,
            notifications: true,
            webview: true,
        }
    }

    /// Create UI capability with no permissions
    pub fn none() -> Self {
        UiCapability::default()
    }

    /// Create UI capability with basic permissions
    pub fn basic() -> Self {
        UiCapability {
            status_bar: true,
            sidebar: false,
            notifications: true,
            webview: false,
        }
    }
}

// ============================================================================
// PLUGIN CAPABILITIES
// ============================================================================

/// Complete set of capabilities for a plugin
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct PluginCapabilities {
    /// Filesystem access capabilities
    pub filesystem: FilesystemCapability,
    
    /// Network access capabilities
    pub network: NetworkCapability,
    
    /// Command execution capabilities
    pub commands: CommandCapability,
    
    /// UI modification capabilities
    pub ui: UiCapability,
}

impl Default for PluginCapabilities {
    fn default() -> Self {
        PluginCapabilities {
            filesystem: FilesystemCapability::None,
            network: NetworkCapability::None,
            commands: CommandCapability::default(),
            ui: UiCapability::none(),
        }
    }
}

impl PluginCapabilities {
    /// Create capabilities with no permissions (sandbox)
    pub fn none() -> Self {
        PluginCapabilities::default()
    }

    /// Create capabilities with read-only workspace access
    pub fn workspace_read() -> Self {
        PluginCapabilities {
            filesystem: FilesystemCapability::WorkspaceRead,
            network: NetworkCapability::None,
            commands: CommandCapability::default(),
            ui: UiCapability::basic(),
        }
    }

    /// Create capabilities with read-write workspace access
    pub fn workspace_read_write() -> Self {
        PluginCapabilities {
            filesystem: FilesystemCapability::WorkspaceReadWrite,
            network: NetworkCapability::None,
            commands: CommandCapability::default(),
            ui: UiCapability::basic(),
        }
    }

    /// Create capabilities for a trusted first-party plugin
    pub fn first_party() -> Self {
        PluginCapabilities {
            filesystem: FilesystemCapability::WorkspaceReadWrite,
            network: NetworkCapability::Unrestricted,
            commands: CommandCapability {
                allowlist: vec![
                    "git".to_string(),
                    "cargo".to_string(),
                    "npm".to_string(),
                    "node".to_string(),
                ]
                .into_iter()
                .collect(),
                require_confirmation: false,
            },
            ui: UiCapability::all(),
        }
    }

    /// Merge two capability sets (takes the more permissive option)
    pub fn merge(&self, other: &PluginCapabilities) -> PluginCapabilities {
        PluginCapabilities {
            filesystem: match (&self.filesystem, &other.filesystem) {
                (FilesystemCapability::None, other) | (other, FilesystemCapability::None) => {
                    other.clone()
                }
                (
                    FilesystemCapability::WorkspaceReadWrite,
                    _,
                ) | (
                    _,
                    FilesystemCapability::WorkspaceReadWrite,
                ) => FilesystemCapability::WorkspaceReadWrite,
                (FilesystemCapability::WorkspaceRead, _) | (_, FilesystemCapability::WorkspaceRead) => {
                    FilesystemCapability::WorkspaceRead
                }
                (FilesystemCapability::Scoped { read: r1, write: w1 }, FilesystemCapability::Scoped { read: r2, write: w2 }) => {
                    FilesystemCapability::Scoped {
                        read: r1.union(r2).cloned().collect(),
                        write: w1.union(w2).cloned().collect(),
                    }
                }
            },
            network: match (&self.network, &other.network) {
                (NetworkCapability::Unrestricted, _) | (_, NetworkCapability::Unrestricted) => {
                    NetworkCapability::Unrestricted
                }
                (NetworkCapability::None, other) | (other, NetworkCapability::None) => {
                    other.clone()
                }
                (NetworkCapability::DomainAllowlist(d1), NetworkCapability::DomainAllowlist(d2)) => {
                    NetworkCapability::DomainAllowlist(d1.union(d2).cloned().collect())
                }
            },
            commands: CommandCapability {
                allowlist: self
                    .commands
                    .allowlist
                    .union(&other.commands.allowlist)
                    .cloned()
                    .collect(),
                require_confirmation: self.commands.require_confirmation
                    && other.commands.require_confirmation,
            },
            ui: UiCapability {
                status_bar: self.ui.status_bar || other.ui.status_bar,
                sidebar: self.ui.sidebar || other.ui.sidebar,
                notifications: self.ui.notifications || other.ui.notifications,
                webview: self.ui.webview || other.ui.webview,
            },
        }
    }

    /// Check if capabilities are a subset of another
    pub fn is_subset_of(&self, other: &PluginCapabilities) -> bool {
        // Filesystem check
        let fs_ok = match (&self.filesystem, &other.filesystem) {
            (FilesystemCapability::None, _) => true,
            (_, FilesystemCapability::None) => false,
            (FilesystemCapability::WorkspaceRead, FilesystemCapability::WorkspaceReadWrite) => true,
            (FilesystemCapability::WorkspaceRead, FilesystemCapability::WorkspaceRead) => true,
            (FilesystemCapability::WorkspaceReadWrite, FilesystemCapability::WorkspaceReadWrite) => {
                true
            }
            (FilesystemCapability::Scoped { read: r1, write: w1 }, FilesystemCapability::Scoped { read: r2, write: w2 }) => {
                r1.is_subset(r2) && w1.is_subset(w2)
            }
            _ => false,
        };

        // Network check
        let net_ok = match (&self.network, &other.network) {
            (NetworkCapability::None, _) => true,
            (_, NetworkCapability::Unrestricted) => true,
            (NetworkCapability::DomainAllowlist(d1), NetworkCapability::DomainAllowlist(d2)) => {
                d1.is_subset(d2)
            }
            _ => false,
        };

        // Commands check
        let cmd_ok = self.commands.allowlist.is_subset(&other.commands.allowlist);

        // UI check
        let ui_ok = (!self.ui.status_bar || other.ui.status_bar)
            && (!self.ui.sidebar || other.ui.sidebar)
            && (!self.ui.notifications || other.ui.notifications)
            && (!self.ui.webview || other.ui.webview);

        fs_ok && net_ok && cmd_ok && ui_ok
    }
}

// ============================================================================
// TESTS
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_filesystem_workspace_read() {
        let cap = FilesystemCapability::WorkspaceRead;
        assert!(cap.can_read("/workspace/file.txt", "/workspace"));
        assert!(!cap.can_read("/other/file.txt", "/workspace"));
        assert!(!cap.can_write("/workspace/file.txt", "/workspace"));
    }

    #[test]
    fn test_filesystem_workspace_read_write() {
        let cap = FilesystemCapability::WorkspaceReadWrite;
        assert!(cap.can_read("/workspace/file.txt", "/workspace"));
        assert!(cap.can_write("/workspace/file.txt", "/workspace"));
        assert!(!cap.can_write("/other/file.txt", "/workspace"));
    }

    #[test]
    fn test_filesystem_scoped() {
        let cap = FilesystemCapability::Scoped {
            read: vec!["/workspace/read".to_string()].into_iter().collect(),
            write: vec!["/workspace/write".to_string()]
                .into_iter()
                .collect(),
        };

        assert!(cap.can_read("/workspace/read/file.txt", "/workspace"));
        assert!(!cap.can_read("/workspace/other/file.txt", "/workspace"));
        assert!(cap.can_write("/workspace/write/file.txt", "/workspace"));
        assert!(!cap.can_write("/workspace/read/file.txt", "/workspace"));
    }

    #[test]
    fn test_network_allowlist() {
        let mut cap = NetworkCapability::DomainAllowlist(HashSet::new());
        cap.add_domain("api.example.com".to_string());

        assert!(cap.can_access("api.example.com"));
        assert!(!cap.can_access("evil.com"));
    }

    #[test]
    fn test_command_allowlist() {
        let mut cap = CommandCapability::new(vec!["git".to_string()]);
        
        assert!(cap.can_execute("git"));
        assert!(!cap.can_execute("rm"));

        cap.allow_command("cargo".to_string());
        assert!(cap.can_execute("cargo"));
    }

    #[test]
    fn test_capabilities_merge() {
        let cap1 = PluginCapabilities {
            filesystem: FilesystemCapability::WorkspaceRead,
            network: NetworkCapability::None,
            commands: CommandCapability::new(vec!["git".to_string()]),
            ui: UiCapability {
                status_bar: true,
                sidebar: false,
                notifications: false,
                webview: false,
            },
        };

        let cap2 = PluginCapabilities {
            filesystem: FilesystemCapability::WorkspaceReadWrite,
            network: NetworkCapability::DomainAllowlist(
                vec!["api.example.com".to_string()].into_iter().collect(),
            ),
            commands: CommandCapability::new(vec!["npm".to_string()]),
            ui: UiCapability {
                status_bar: false,
                sidebar: true,
                notifications: true,
                webview: false,
            },
        };

        let merged = cap1.merge(&cap2);

        assert!(matches!(
            merged.filesystem,
            FilesystemCapability::WorkspaceReadWrite
        ));
        assert!(merged.commands.can_execute("git"));
        assert!(merged.commands.can_execute("npm"));
        assert!(merged.ui.status_bar);
        assert!(merged.ui.sidebar);
        assert!(merged.ui.notifications);
    }

    #[test]
    fn test_capabilities_subset() {
        let basic = PluginCapabilities::workspace_read();
        let advanced = PluginCapabilities::workspace_read_write();
        let full = PluginCapabilities::first_party();

        assert!(basic.is_subset_of(&advanced));
        assert!(basic.is_subset_of(&full));
        assert!(advanced.is_subset_of(&full));
        assert!(!full.is_subset_of(&basic));
    }

    #[test]
    fn test_default_capabilities() {
        let cap = PluginCapabilities::default();
        assert!(matches!(cap.filesystem, FilesystemCapability::None));
        assert!(matches!(cap.network, NetworkCapability::None));
        assert!(!cap.ui.status_bar);
        assert!(!cap.ui.sidebar);
    }

    #[test]
    fn test_first_party_capabilities() {
        let cap = PluginCapabilities::first_party();
        assert!(matches!(
            cap.filesystem,
            FilesystemCapability::WorkspaceReadWrite
        ));
        assert!(matches!(cap.network, NetworkCapability::Unrestricted));
        assert!(cap.ui.status_bar);
        assert!(cap.ui.sidebar);
        assert!(cap.ui.notifications);
        assert!(cap.ui.webview);
    }
}