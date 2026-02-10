// src-tauri/src/plugin_system/loader.rs

use crate::plugin_system::trust::TrustLevel;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use std::time::SystemTime;

#[derive(Debug, thiserror::Error)]
pub enum LoaderError {
    #[error("Plugin manifest not found: {0}")]
    ManifestNotFound(String),

    #[error("Invalid plugin manifest: {0}")]
    InvalidManifest(String),

    #[error("Plugin already loaded: {0}")]
    AlreadyLoaded(String),

    #[error("Plugin not found: {0}")]
    PluginNotFound(String),

    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("TOML parsing error: {0}")]
    Toml(#[from] toml::de::Error),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PluginManifest {
    pub name: String,
    pub version: String,
    #[serde(default)]
    pub description: String,
    #[serde(default)]
    pub author: String,
    #[serde(default)]
    pub license: String,
    #[serde(default = "default_main")]
    pub main: String,
    /// Plugin capabilities — parsed from [permissions] + [ui] sections in TOML
    #[serde(skip)]
    pub capabilities: crate::plugin_system::capabilities::PluginCapabilities,
    /// Raw permissions section from TOML
    #[serde(default)]
    pub permissions: Option<TomlPermissions>,
    /// Raw UI section from TOML
    #[serde(default)]
    pub ui: Option<TomlUi>,
    #[serde(default)]
    pub dependencies: Vec<String>,
    #[serde(default)]
    pub source: String,
    pub signature: Option<PluginSignature>,
    #[serde(default)]
    pub trust: TrustLevel,
    /// Hook definitions from TOML
    #[serde(default)]
    pub hooks: Option<std::collections::HashMap<String, String>>,
    /// Command definitions from TOML
    #[serde(default)]
    pub commands: Option<toml::Value>,
}

fn default_main() -> String {
    "main.js".to_string()
}

/// Raw permissions section as it appears in plugin.toml
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TomlPermissions {
    #[serde(default)]
    pub filesystem: Option<toml::Value>,
    #[serde(default)]
    pub network: Option<toml::Value>,
    #[serde(default)]
    pub commands: Option<toml::Value>,
}

/// Raw UI section as it appears in plugin.toml
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TomlUi {
    #[serde(default)]
    pub status_bar: bool,
    #[serde(default)]
    pub sidebar: bool,
    #[serde(default)]
    pub notifications: bool,
    #[serde(default)]
    pub webview: bool,
}

// Re-export PluginSignature from trust module
pub use crate::plugin_system::trust::PluginSignature;

#[derive(Debug, Clone)]
pub struct PluginInfo {
    pub manifest: PluginManifest,
    pub path: PathBuf,
    pub loaded_at: SystemTime,
}

pub struct PluginLoader {
    plugins_dir: PathBuf,
    plugins: HashMap<String, PluginInfo>,
    first_party_plugins: std::collections::HashSet<String>,
}

impl PluginLoader {
    pub fn new(plugins_dir: PathBuf) -> Self {
        let mut first_party_plugins = std::collections::HashSet::new();
        first_party_plugins.insert("git".to_string());
        first_party_plugins.insert("git-status".to_string());

        Self {
            plugins_dir,
            plugins: HashMap::new(),
            first_party_plugins,
        }
    }

    pub fn discover(&self) -> Result<Vec<String>, Box<dyn std::error::Error + Send + Sync>> {
        let mut plugin_ids = Vec::new();

        if !self.plugins_dir.exists() {
            return Ok(plugin_ids);
        }

        for entry in std::fs::read_dir(&self.plugins_dir)? {
            let entry = entry?;
            let path = entry.path();

            if path.is_dir() {
                let plugin_toml = path.join("plugin.toml");
                if plugin_toml.exists() {
                    if let Some(plugin_id) = path.file_name().and_then(|n| n.to_str()) {
                        plugin_ids.push(plugin_id.to_string());
                    }
                }
            }
        }

        Ok(plugin_ids)
    }

    pub fn load_manifest(
        &self,
        plugin_id: &str,
    ) -> Result<PluginManifest, Box<dyn std::error::Error + Send + Sync>> {
        use crate::plugin_system::capabilities::*;

        let plugin_path = self.plugins_dir.join(plugin_id);
        let manifest_path = plugin_path.join("plugin.toml");

        if !manifest_path.exists() {
            return Err(LoaderError::ManifestNotFound(plugin_id.to_string()).into());
        }

        let manifest_content = std::fs::read_to_string(&manifest_path)?;
        let mut manifest: PluginManifest = toml::from_str(&manifest_content)
            .map_err(|e| LoaderError::InvalidManifest(e.to_string()))?;

        // Set trust level based on plugin type
        manifest.trust = if self.first_party_plugins.contains(plugin_id) {
            TrustLevel::FirstParty
        } else if manifest.source.starts_with("file://") {
            TrustLevel::Local
        } else {
            match manifest.trust {
                // Prevent third-party manifests from self-asserting first-party trust.
                TrustLevel::FirstParty => TrustLevel::Community,
                TrustLevel::Verified => TrustLevel::Verified,
                TrustLevel::Community => TrustLevel::Community,
                TrustLevel::Local => TrustLevel::Local,
            }
        };

        // Build PluginCapabilities from raw TOML permissions + ui sections
        let mut capabilities = PluginCapabilities::default();

        if let Some(ref perms) = manifest.permissions {
            // Parse filesystem capability
            if let Some(ref fs_val) = perms.filesystem {
                capabilities.filesystem = match fs_val {
                    toml::Value::String(s) => match s.as_str() {
                        "WorkspaceRead" => FilesystemCapability::WorkspaceRead,
                        "WorkspaceReadWrite" => FilesystemCapability::WorkspaceReadWrite,
                        "None" => FilesystemCapability::None,
                        _ => FilesystemCapability::None,
                    },
                    toml::Value::Array(arr) => {
                        // Handle ["read"] or ["read", "write"] style
                        let strs: Vec<String> = arr
                            .iter()
                            .filter_map(|v| v.as_str().map(String::from))
                            .collect();
                        if strs.iter().any(|s| s == "write") {
                            FilesystemCapability::WorkspaceReadWrite
                        } else if strs.iter().any(|s| s == "read") {
                            FilesystemCapability::WorkspaceRead
                        } else {
                            FilesystemCapability::None
                        }
                    }
                    _ => FilesystemCapability::None,
                };
            }

            // Parse network capability
            if let Some(ref net_val) = perms.network {
                capabilities.network = match net_val {
                    toml::Value::String(s) => match s.as_str() {
                        "Unrestricted" => NetworkCapability::Unrestricted,
                        "None" => NetworkCapability::None,
                        _ => NetworkCapability::None,
                    },
                    toml::Value::Table(t) => {
                        if let Some(toml::Value::String(ntype)) = t.get("type") {
                            if ntype == "DomainAllowlist" {
                                if let Some(toml::Value::Array(domains)) = t.get("domains") {
                                    let domain_set: std::collections::HashSet<String> = domains
                                        .iter()
                                        .filter_map(|v| v.as_str().map(String::from))
                                        .collect();
                                    NetworkCapability::DomainAllowlist(domain_set)
                                } else {
                                    NetworkCapability::None
                                }
                            } else {
                                NetworkCapability::None
                            }
                        } else {
                            NetworkCapability::None
                        }
                    }
                    _ => NetworkCapability::None,
                };
            }

            // Parse command capability
            if let Some(ref cmd_val) = perms.commands {
                capabilities.commands = match cmd_val {
                    toml::Value::Table(t) => {
                        let allowlist: std::collections::HashSet<String> = t
                            .get("allowlist")
                            .and_then(|v| v.as_array())
                            .map(|arr| {
                                arr.iter()
                                    .filter_map(|v| v.as_str().map(String::from))
                                    .collect()
                            })
                            .unwrap_or_default();
                        let require_confirmation = t
                            .get("require_confirmation")
                            .and_then(|v| v.as_bool())
                            .unwrap_or(true);
                        CommandCapability {
                            allowlist,
                            require_confirmation,
                        }
                    }
                    toml::Value::Array(arr) => {
                        // Handle ["git"] style
                        let allowlist: std::collections::HashSet<String> = arr
                            .iter()
                            .filter_map(|v| v.as_str().map(String::from))
                            .collect();
                        CommandCapability {
                            allowlist,
                            require_confirmation: true,
                        }
                    }
                    _ => CommandCapability::default(),
                };
            }
        }

        // Parse UI capability
        if let Some(ref ui) = manifest.ui {
            capabilities.ui = UiCapability {
                status_bar: ui.status_bar,
                sidebar: ui.sidebar,
                notifications: ui.notifications,
                webview: ui.webview,
            };
        }

        manifest.capabilities = capabilities;

        Ok(manifest)
    }

    pub fn load(
        &mut self,
        plugin_id: &str,
    ) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        // Log if already loaded (reload path calls this intentionally)
        if self.plugins.contains_key(plugin_id) {
            println!(
                "[loader] Re-loading plugin: {} (was already loaded, AlreadyLoaded={})",
                plugin_id,
                LoaderError::AlreadyLoaded(plugin_id.to_string())
            );
        }

        let manifest = self.load_manifest(plugin_id)?;

        // Validate signature format if present.
        if let Some(ref sig) = manifest.signature {
            if !sig.is_valid() {
                return Err(LoaderError::InvalidManifest(format!(
                    "Invalid signature for plugin: {}",
                    plugin_id
                ))
                .into());
            }
        }

        let plugin_path = self.plugins_dir.join(plugin_id);

        let plugin_info = PluginInfo {
            manifest,
            path: plugin_path,
            loaded_at: SystemTime::now(),
        };

        self.plugins.insert(plugin_id.to_string(), plugin_info);
        Ok(())
    }

    pub fn get(&self, plugin_id: &str) -> Option<&PluginInfo> {
        self.plugins.get(plugin_id)
    }

    pub fn get_or_error(&self, plugin_id: &str) -> Result<&PluginInfo, LoaderError> {
        self.plugins
            .get(plugin_id)
            .ok_or_else(|| LoaderError::PluginNotFound(plugin_id.to_string()))
    }

    pub fn set_capabilities(
        &mut self,
        plugin_id: &str,
        capabilities: crate::plugin_system::capabilities::PluginCapabilities,
    ) -> Result<(), LoaderError> {
        let info = self
            .plugins
            .get_mut(plugin_id)
            .ok_or_else(|| LoaderError::PluginNotFound(plugin_id.to_string()))?;
        info.manifest.capabilities = capabilities;
        Ok(())
    }

    pub fn get_all(&self) -> &HashMap<String, PluginInfo> {
        &self.plugins
    }

    pub fn unload(&mut self, plugin_id: &str) -> bool {
        self.plugins.remove(plugin_id).is_some()
    }

    pub fn verify_dependencies(
        &self,
        plugin_id: &str,
    ) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let plugin_info = self.get_or_error(plugin_id)?;
        for dependency in &plugin_info.manifest.dependencies {
            if !self.plugins.contains_key(dependency) {
                return Err(LoaderError::PluginNotFound(format!(
                    "Missing dependency '{}' for plugin '{}'",
                    dependency, plugin_id
                ))
                .into());
            }
        }
        Ok(())
    }

    pub fn is_first_party(&self, plugin_id: &str) -> bool {
        self.first_party_plugins.contains(plugin_id)
    }
}

// ============================================================================
// TESTS
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;
    use crate::plugin_system::capabilities::*;
    use tempfile::TempDir;

    fn write_plugin(dir: &std::path::Path, name: &str, toml_content: &str) {
        let plugin_dir = dir.join(name);
        std::fs::create_dir_all(&plugin_dir).unwrap();
        std::fs::write(plugin_dir.join("plugin.toml"), toml_content).unwrap();
        std::fs::write(plugin_dir.join("main.js"), "// test plugin\n").unwrap();
    }

    #[test]
    fn test_discover_plugins() {
        let tmp = TempDir::new().unwrap();
        write_plugin(
            tmp.path(),
            "my-plugin",
            r#"
name = "my-plugin"
version = "1.0.0"
author = "test"
"#,
        );
        write_plugin(
            tmp.path(),
            "another",
            r#"
name = "another"
version = "0.1.0"
author = "test"
"#,
        );

        let loader = PluginLoader::new(tmp.path().to_path_buf());
        let mut found = loader.discover().unwrap();
        found.sort();
        assert_eq!(found, vec!["another", "my-plugin"]);
    }

    #[test]
    fn test_discover_ignores_non_plugin_dirs() {
        let tmp = TempDir::new().unwrap();
        // Directory without plugin.toml
        std::fs::create_dir_all(tmp.path().join("not-a-plugin")).unwrap();
        // File (not a directory)
        std::fs::write(tmp.path().join("random.txt"), "hi").unwrap();
        // Valid plugin
        write_plugin(
            tmp.path(),
            "valid",
            r#"
name = "valid"
version = "1.0.0"
author = "test"
"#,
        );

        let loader = PluginLoader::new(tmp.path().to_path_buf());
        let found = loader.discover().unwrap();
        assert_eq!(found, vec!["valid"]);
    }

    #[test]
    fn test_load_and_get_plugin() {
        let tmp = TempDir::new().unwrap();
        write_plugin(
            tmp.path(),
            "test-plugin",
            r#"
name = "test-plugin"
version = "2.0.0"
author = "tester"
description = "A test plugin"
"#,
        );

        let mut loader = PluginLoader::new(tmp.path().to_path_buf());
        loader.load("test-plugin").unwrap();

        let info = loader.get("test-plugin").unwrap();
        assert_eq!(info.manifest.name, "test-plugin");
        assert_eq!(info.manifest.version, "2.0.0");
        assert_eq!(info.manifest.author, "tester");
        assert_eq!(info.manifest.description, "A test plugin");
        assert_eq!(info.manifest.main, "main.js"); // default
    }

    #[test]
    fn test_manifest_default_main_is_js() {
        let tmp = TempDir::new().unwrap();
        write_plugin(
            tmp.path(),
            "p",
            r#"
name = "p"
version = "1.0.0"
author = "test"
"#,
        );

        let loader = PluginLoader::new(tmp.path().to_path_buf());
        let manifest = loader.load_manifest("p").unwrap();
        assert_eq!(manifest.main, "main.js");
    }

    #[test]
    fn test_manifest_custom_main() {
        let tmp = TempDir::new().unwrap();
        write_plugin(
            tmp.path(),
            "p",
            r#"
name = "p"
version = "1.0.0"
author = "test"
main = "index.js"
"#,
        );

        let loader = PluginLoader::new(tmp.path().to_path_buf());
        let manifest = loader.load_manifest("p").unwrap();
        assert_eq!(manifest.main, "index.js");
    }

    #[test]
    fn test_capabilities_from_workspace_read() {
        let tmp = TempDir::new().unwrap();
        write_plugin(
            tmp.path(),
            "p",
            r#"
name = "p"
version = "1.0.0"
author = "test"

[permissions]
filesystem = "WorkspaceRead"
"#,
        );

        let loader = PluginLoader::new(tmp.path().to_path_buf());
        let manifest = loader.load_manifest("p").unwrap();
        assert_eq!(
            manifest.capabilities.filesystem,
            FilesystemCapability::WorkspaceRead
        );
    }

    #[test]
    fn test_capabilities_from_workspace_read_write() {
        let tmp = TempDir::new().unwrap();
        write_plugin(
            tmp.path(),
            "p",
            r#"
name = "p"
version = "1.0.0"
author = "test"

[permissions]
filesystem = "WorkspaceReadWrite"
"#,
        );

        let loader = PluginLoader::new(tmp.path().to_path_buf());
        let manifest = loader.load_manifest("p").unwrap();
        assert_eq!(
            manifest.capabilities.filesystem,
            FilesystemCapability::WorkspaceReadWrite
        );
    }

    #[test]
    fn test_capabilities_from_command_allowlist() {
        let tmp = TempDir::new().unwrap();
        write_plugin(
            tmp.path(),
            "p",
            r#"
name = "p"
version = "1.0.0"
author = "test"

[permissions]
commands = { allowlist = ["git", "npm"], require_confirmation = false }
"#,
        );

        let loader = PluginLoader::new(tmp.path().to_path_buf());
        let manifest = loader.load_manifest("p").unwrap();
        assert!(manifest.capabilities.commands.can_execute("git"));
        assert!(manifest.capabilities.commands.can_execute("npm"));
        assert!(!manifest.capabilities.commands.can_execute("rm"));
        assert!(!manifest.capabilities.commands.require_confirmation);
    }

    #[test]
    fn test_capabilities_from_network_domain_allowlist() {
        let tmp = TempDir::new().unwrap();
        write_plugin(
            tmp.path(),
            "p",
            r#"
name = "p"
version = "1.0.0"
author = "test"

[permissions.network]
type = "DomainAllowlist"
domains = ["api.github.com", "registry.npmjs.org"]
"#,
        );

        let loader = PluginLoader::new(tmp.path().to_path_buf());
        let manifest = loader.load_manifest("p").unwrap();
        assert!(manifest.capabilities.network.can_access("api.github.com"));
        assert!(manifest
            .capabilities
            .network
            .can_access("registry.npmjs.org"));
        assert!(!manifest.capabilities.network.can_access("evil.com"));
    }

    #[test]
    fn test_capabilities_from_ui_section() {
        let tmp = TempDir::new().unwrap();
        write_plugin(
            tmp.path(),
            "p",
            r#"
name = "p"
version = "1.0.0"
author = "test"

[ui]
status_bar = true
sidebar = false
notifications = true
"#,
        );

        let loader = PluginLoader::new(tmp.path().to_path_buf());
        let manifest = loader.load_manifest("p").unwrap();
        assert!(manifest.capabilities.ui.status_bar);
        assert!(!manifest.capabilities.ui.sidebar);
        assert!(manifest.capabilities.ui.notifications);
        assert!(!manifest.capabilities.ui.webview);
    }

    #[test]
    fn test_capabilities_default_when_no_permissions() {
        let tmp = TempDir::new().unwrap();
        write_plugin(
            tmp.path(),
            "p",
            r#"
name = "p"
version = "1.0.0"
author = "test"
"#,
        );

        let loader = PluginLoader::new(tmp.path().to_path_buf());
        let manifest = loader.load_manifest("p").unwrap();
        assert_eq!(manifest.capabilities.filesystem, FilesystemCapability::None);
        assert!(!manifest.capabilities.network.can_access("anything.com"));
        assert!(!manifest.capabilities.commands.can_execute("anything"));
        assert!(!manifest.capabilities.ui.status_bar);
    }

    #[test]
    fn test_trust_level_first_party() {
        let tmp = TempDir::new().unwrap();
        write_plugin(
            tmp.path(),
            "git",
            r#"
name = "git"
version = "1.0.0"
author = "skretchpad"
trust = "first-party"
"#,
        );

        let loader = PluginLoader::new(tmp.path().to_path_buf());
        let manifest = loader.load_manifest("git").unwrap();
        // Loader overrides trust for known first-party plugins
        assert_eq!(manifest.trust, TrustLevel::FirstParty);
    }

    #[test]
    fn test_trust_level_community_default() {
        let tmp = TempDir::new().unwrap();
        write_plugin(
            tmp.path(),
            "third-party",
            r#"
name = "third-party"
version = "1.0.0"
author = "someone"
"#,
        );

        let loader = PluginLoader::new(tmp.path().to_path_buf());
        let manifest = loader.load_manifest("third-party").unwrap();
        assert_eq!(manifest.trust, TrustLevel::Community);
    }

    #[test]
    fn test_trust_level_verified_preserved_for_non_first_party() {
        let tmp = TempDir::new().unwrap();
        write_plugin(
            tmp.path(),
            "verified-plugin",
            r#"
name = "verified-plugin"
version = "1.0.0"
author = "someone"
trust = "verified"
"#,
        );

        let loader = PluginLoader::new(tmp.path().to_path_buf());
        let manifest = loader.load_manifest("verified-plugin").unwrap();
        assert_eq!(manifest.trust, TrustLevel::Verified);
    }

    #[test]
    fn test_dependencies_empty() {
        let tmp = TempDir::new().unwrap();
        write_plugin(
            tmp.path(),
            "p",
            r#"
name = "p"
version = "1.0.0"
author = "test"
"#,
        );

        let loader = PluginLoader::new(tmp.path().to_path_buf());
        let manifest = loader.load_manifest("p").unwrap();
        assert!(manifest.dependencies.is_empty());
    }

    #[test]
    fn test_dependencies_listed() {
        let tmp = TempDir::new().unwrap();
        write_plugin(
            tmp.path(),
            "p",
            r#"
name = "p"
version = "1.0.0"
author = "test"
dependencies = ["git", "git-status"]
"#,
        );

        let loader = PluginLoader::new(tmp.path().to_path_buf());
        let manifest = loader.load_manifest("p").unwrap();
        assert_eq!(manifest.dependencies, vec!["git", "git-status"]);
    }

    #[test]
    fn test_unload_plugin() {
        let tmp = TempDir::new().unwrap();
        write_plugin(
            tmp.path(),
            "p",
            r#"
name = "p"
version = "1.0.0"
author = "test"
"#,
        );

        let mut loader = PluginLoader::new(tmp.path().to_path_buf());
        loader.load("p").unwrap();
        assert!(loader.get("p").is_some());
        assert!(loader.unload("p"));
        assert!(loader.get("p").is_none());
    }

    #[test]
    fn test_load_nonexistent_plugin() {
        let tmp = TempDir::new().unwrap();
        let mut loader = PluginLoader::new(tmp.path().to_path_buf());
        let result = loader.load("nonexistent");
        assert!(result.is_err());
    }

    #[test]
    fn test_actual_git_plugin_manifest() {
        // Test against the actual git plugin manifest in the repo
        let plugins_dir = std::path::PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .parent()
            .unwrap()
            .join("plugins");

        if !plugins_dir.exists() {
            return; // Skip if plugins dir doesn't exist
        }

        let loader = PluginLoader::new(plugins_dir);
        let manifest = loader.load_manifest("git").unwrap();
        assert_eq!(manifest.name, "git");
        assert_eq!(manifest.main, "main.js");
        assert_eq!(manifest.trust, TrustLevel::FirstParty);
        assert!(manifest.capabilities.commands.can_execute("git"));
        assert!(manifest.capabilities.ui.status_bar);
        assert!(manifest.capabilities.ui.notifications);
        assert_eq!(
            manifest.capabilities.filesystem,
            FilesystemCapability::WorkspaceReadWrite
        );
    }

    #[test]
    fn test_actual_git_status_plugin_manifest() {
        let plugins_dir = std::path::PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .parent()
            .unwrap()
            .join("plugins");

        if !plugins_dir.exists() {
            return;
        }

        let loader = PluginLoader::new(plugins_dir);
        let manifest = loader.load_manifest("git-status").unwrap();
        assert_eq!(manifest.name, "git-status");
        assert_eq!(manifest.main, "main.js");
        assert_eq!(manifest.trust, TrustLevel::FirstParty);
        assert!(manifest.capabilities.commands.can_execute("git"));
        assert!(manifest.capabilities.ui.status_bar);
        assert!(!manifest.capabilities.ui.notifications);
        assert_eq!(
            manifest.capabilities.filesystem,
            FilesystemCapability::WorkspaceRead
        );
    }
}
