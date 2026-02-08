// src-tauri/src/plugin_system/mod.rs

pub mod api;
pub mod capabilities;
pub mod loader;
pub mod manager;
pub mod ops;
pub mod sandbox;
pub mod trust;
pub mod worker;

// Re-export commonly used types for external consumers
#[allow(unused_imports)]
pub use api::{AuditEvent, AuditLogger};
#[allow(unused_imports)]
pub use capabilities::{
    CommandCapability, FilesystemCapability, NetworkCapability, PluginCapabilities, UiCapability,
};
#[allow(unused_imports)]
pub use loader::{PluginInfo, PluginLoader, PluginManifest};
#[allow(unused_imports)]
pub use manager::{PluginManager, PluginState, PluginStatus};
#[allow(unused_imports)]
pub use ops::{EditorStateHandle, SharedEditorState};
#[allow(unused_imports)]
pub use sandbox::{PluginSandbox, ResourceLimits, ResourceStats, SandboxRegistry};
#[allow(unused_imports)]
pub use trust::{PluginSignature, TrustLevel};

// Note: Tauri commands are defined in main.rs, not in the api module

// ============================================================================
// Cross-module integration tests
// ============================================================================

#[cfg(test)]
mod integration_tests {
    use super::*;
    use std::collections::HashSet;

    #[test]
    fn test_sanitize_args_with_capability_workflow() {
        // Plugin has command capability with allowlisted "git"
        let caps = PluginCapabilities {
            filesystem: FilesystemCapability::None,
            network: NetworkCapability::None,
            commands: CommandCapability::new(vec!["git".to_string()]),
            ui: UiCapability::none(),
        };

        // Verify command is allowlisted
        assert!(caps.commands.can_execute("git"));
        assert!(!caps.commands.can_execute("rm"));

        // Sanitize arguments that might contain injection
        let args = vec![
            "commit".to_string(),
            "-m".to_string(),
            "fix bug; rm -rf /".to_string(),
        ];
        let sanitized = ops::sanitize_args(&args);
        assert_eq!(sanitized[0], "commit");
        assert_eq!(sanitized[1], "-m");
        assert_eq!(sanitized[2], "fix bug rm -rf /"); // semicolon stripped
    }

    #[test]
    fn test_capability_escalation_prevention() {
        let caps = PluginCapabilities::default();
        assert!(matches!(caps.filesystem, FilesystemCapability::None));
        assert!(matches!(caps.network, NetworkCapability::None));
        assert!(caps.commands.allowlist.is_empty());
        assert!(!caps.ui.status_bar);
        assert!(!caps.ui.notifications);
    }

    #[test]
    fn test_full_capability_chain() {
        let caps = PluginCapabilities {
            filesystem: FilesystemCapability::WorkspaceRead,
            network: NetworkCapability::None,
            commands: CommandCapability::new(vec!["git".to_string()]),
            ui: UiCapability {
                status_bar: true,
                sidebar: false,
                notifications: true,
                webview: false,
            },
        };

        assert!(matches!(
            caps.filesystem,
            FilesystemCapability::WorkspaceRead
        ));
        assert!(matches!(caps.network, NetworkCapability::None));
        assert!(caps.ui.status_bar);
        assert!(caps.ui.notifications);
        assert!(!caps.ui.sidebar);
    }

    #[test]
    fn test_scoped_filesystem_path_validation() {
        let caps = PluginCapabilities {
            filesystem: FilesystemCapability::Scoped {
                read: vec!["/project/src".to_string(), "/project/config".to_string()]
                    .into_iter()
                    .collect(),
                write: HashSet::new(),
            },
            network: NetworkCapability::None,
            commands: CommandCapability::default(),
            ui: UiCapability::none(),
        };

        match &caps.filesystem {
            FilesystemCapability::Scoped { read, write } => {
                assert!(read.contains("/project/src"));
                assert!(read.contains("/project/config"));
                assert!(!read.contains("/etc"));
                assert!(write.is_empty());
            }
            _ => panic!("Expected Scoped"),
        }
    }

    #[test]
    fn test_sanitize_all_injection_vectors() {
        let args = vec![
            "safe_arg".to_string(),
            "; echo pwned".to_string(),
            "| cat /etc/passwd".to_string(),
            "&& rm -rf /".to_string(),
            "> /tmp/out".to_string(),
            "< /etc/shadow".to_string(),
            "`whoami`".to_string(),
            "$HOME".to_string(),
            "line1\nline2".to_string(),
            "line1\rline2".to_string(),
        ];

        let sanitized = ops::sanitize_args(&args);
        assert_eq!(sanitized[0], "safe_arg");
        assert!(!sanitized[1].contains(';'));
        assert!(!sanitized[2].contains('|'));
        assert!(!sanitized[3].contains('&'));
        assert!(!sanitized[4].contains('>'));
        assert!(!sanitized[5].contains('<'));
        assert!(!sanitized[6].contains('`'));
        assert!(!sanitized[7].contains('$'));
        assert!(!sanitized[8].contains('\n'));
        assert!(!sanitized[9].contains('\r'));
    }

    #[tokio::test]
    async fn test_audit_logger_cross_module() {
        let logger = AuditLogger::new(100);

        logger
            .log(AuditEvent {
                plugin_id: "first-party-git".to_string(),
                operation: "fs_read".to_string(),
                resource: "/workspace/src/main.rs".to_string(),
                success: true,
                error: None,
                timestamp: std::time::SystemTime::now(),
            })
            .await;

        logger
            .log(AuditEvent {
                plugin_id: "community-plugin".to_string(),
                operation: "network_fetch".to_string(),
                resource: "https://evil.com".to_string(),
                success: false,
                error: Some("Permission denied".to_string()),
                timestamp: std::time::SystemTime::now(),
            })
            .await;

        let all = logger.get_events().await;
        assert_eq!(all.len(), 2);

        let community = logger.get_events_for_plugin("community-plugin").await;
        assert_eq!(community.len(), 1);
        assert!(!community[0].success);
        assert!(community[0].error.is_some());
    }
}
