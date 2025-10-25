# 1. loader.rs - Plugin Manifest Parser & Loader

```rust
// src-tauri/src/plugin_system/loader.rs

use crate::plugin_system::capabilities::{
    CommandCapability, FilesystemCapability, NetworkCapability, PluginCapabilities, UiCapability,
};
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use std::fs;
use std::path::{Path, PathBuf};
use thiserror::Error;

// ============================================================================
// ERROR TYPES
// ============================================================================

#[derive(Debug, Error)]
pub enum LoaderError {
    #[error("Failed to read plugin manifest: {0}")]
    ManifestRead(#[from] std::io::Error),

    #[error("Failed to parse plugin manifest: {0}")]
    ManifestParse(#[from] toml::de::Error),

    #[error("Invalid plugin manifest: {0}")]
    InvalidManifest(String),

    #[error("Plugin not found: {0}")]
    PluginNotFound(String),

    #[error("Plugin already loaded: {0}")]
    PluginAlreadyLoaded(String),

    #[error("Missing required field: {0}")]
    MissingField(String),

    #[error("Invalid capability configuration: {0}")]
    InvalidCapability(String),
}

pub type Result<T> = std::result::Result<T, LoaderError>;

// ============================================================================
// PLUGIN MANIFEST STRUCTURE
// ============================================================================

/// Plugin manifest structure (plugin.toml)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PluginManifest {
    /// Plugin metadata
    pub name: String,
    pub version: String,
    pub author: String,
    pub description: String,
    pub trust: TrustLevel,

    /// Entry point (relative to plugin directory)
    #[serde(default = "default_entry_point")]
    pub entry: String,

    /// Plugin permissions
    pub permissions: PermissionsConfig,

    /// Plugin hooks
    #[serde(default)]
    pub hooks: HashMap<String, String>,

    /// Plugin commands
    #[serde(default)]
    pub commands: HashMap<String, CommandConfig>,

    /// Plugin dependencies
    #[serde(default)]
    pub dependencies: Vec<String>,

    /// Plugin configuration schema
    #[serde(default)]
    pub configuration: Option<ConfigSchema>,
}

fn default_entry_point() -> String {
    "main.ts".to_string()
}

/// Plugin trust level
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "kebab-case")]
pub enum TrustLevel {
    /// First-party plugin (full access)
    FirstParty,
    
    /// Verified third-party plugin (restricted access)
    Verified,
    
    /// Unverified plugin (minimal access)
    Unverified,
}

impl TrustLevel {
    /// Get default capabilities for this trust level
    pub fn default_capabilities(&self) -> PluginCapabilities {
        match self {
            TrustLevel::FirstParty => PluginCapabilities::first_party(),
            TrustLevel::Verified => PluginCapabilities::workspace_read_write(),
            TrustLevel::Unverified => PluginCapabilities::workspace_read(),
        }
    }
}

// ============================================================================
// PERMISSIONS CONFIGURATION
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PermissionsConfig {
    /// Filesystem permissions
    #[serde(default)]
    pub filesystem: FilesystemPermission,

    /// Network permissions
    #[serde(default)]
    pub network: NetworkPermission,

    /// Command execution permissions
    #[serde(default)]
    pub commands: CommandsPermission,

    /// UI permissions
    #[serde(default)]
    pub ui: UiPermission,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "PascalCase")]
pub enum FilesystemPermission {
    None,
    WorkspaceRead,
    WorkspaceReadWrite,
    Scoped {
        read: Vec<String>,
        write: Vec<String>,
    },
}

impl Default for FilesystemPermission {
    fn default() -> Self {
        FilesystemPermission::None
    }
}

impl From<FilesystemPermission> for FilesystemCapability {
    fn from(perm: FilesystemPermission) -> Self {
        match perm {
            FilesystemPermission::None => FilesystemCapability::None,
            FilesystemPermission::WorkspaceRead => FilesystemCapability::WorkspaceRead,
            FilesystemPermission::WorkspaceReadWrite => FilesystemCapability::WorkspaceReadWrite,
            FilesystemPermission::Scoped { read, write } => FilesystemCapability::Scoped {
                read: read.into_iter().collect(),
                write: write.into_iter().collect(),
            },
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum NetworkPermission {
    None { r#type: String },
    DomainAllowlist { domains: Vec<String> },
    Unrestricted { r#type: String },
}

impl Default for NetworkPermission {
    fn default() -> Self {
        NetworkPermission::None {
            r#type: "None".to_string(),
        }
    }
}

impl From<NetworkPermission> for NetworkCapability {
    fn from(perm: NetworkPermission) -> Self {
        match perm {
            NetworkPermission::None { .. } => NetworkCapability::None,
            NetworkPermission::DomainAllowlist { domains } => {
                NetworkCapability::DomainAllowlist(domains.into_iter().collect())
            }
            NetworkPermission::Unrestricted { .. } => NetworkCapability::Unrestricted,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommandsPermission {
    pub allowlist: Vec<String>,
    
    #[serde(default)]
    pub require_confirmation: bool,
}

impl Default for CommandsPermission {
    fn default() -> Self {
        CommandsPermission {
            allowlist: Vec::new(),
            require_confirmation: true,
        }
    }
}

impl From<CommandsPermission> for CommandCapability {
    fn from(perm: CommandsPermission) -> Self {
        CommandCapability {
            allowlist: perm.allowlist.into_iter().collect(),
            require_confirmation: perm.require_confirmation,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UiPermission {
    #[serde(default)]
    pub status_bar: bool,
    
    #[serde(default)]
    pub sidebar: bool,
    
    #[serde(default)]
    pub notifications: bool,
    
    #[serde(default)]
    pub webview: bool,
}

impl Default for UiPermission {
    fn default() -> Self {
        UiPermission {
            status_bar: false,
            sidebar: false,
            notifications: false,
            webview: false,
        }
    }
}

impl From<UiPermission> for UiCapability {
    fn from(perm: UiPermission) -> Self {
        UiCapability {
            status_bar: perm.status_bar,
            sidebar: perm.sidebar,
            notifications: perm.notifications,
            webview: perm.webview,
        }
    }
}

// ============================================================================
// COMMAND CONFIGURATION
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommandConfig {
    /// Keyboard shortcut
    #[serde(default)]
    pub key: Option<String>,
    
    /// Command label
    pub label: String,
    
    /// Command category
    #[serde(default)]
    pub category: Option<String>,
    
    /// When condition for command availability
    #[serde(default)]
    pub when: Option<String>,
}

// ============================================================================
// CONFIGURATION SCHEMA
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConfigSchema {
    pub r#type: String,
    pub properties: HashMap<String, PropertySchema>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PropertySchema {
    pub r#type: String,
    #[serde(default)]
    pub default: Option<serde_json::Value>,
    #[serde(default)]
    pub description: Option<String>,
}

// ============================================================================
// PLUGIN INFO
// ============================================================================

/// Complete plugin information
#[derive(Debug, Clone, Serialize)]
pub struct PluginInfo {
    /// Plugin ID (directory name)
    pub id: String,
    
    /// Plugin manifest
    pub manifest: PluginManifest,
    
    /// Plugin directory path
    pub path: PathBuf,
    
    /// Plugin capabilities
    pub capabilities: PluginCapabilities,
    
    /// Plugin entry point path
    pub entry_path: PathBuf,
}

// ============================================================================
// PLUGIN LOADER
// ============================================================================

pub struct PluginLoader {
    /// Plugins directory
    plugins_dir: PathBuf,
    
    /// Loaded plugins cache
    plugins: HashMap<String, PluginInfo>,
}

impl PluginLoader {
    /// Create a new plugin loader
    pub fn new(plugins_dir: PathBuf) -> Self {
        PluginLoader {
            plugins_dir,
            plugins: HashMap::new(),
        }
    }

    /// Discover all plugins in the plugins directory
    pub fn discover(&mut self) -> Result<Vec<String>> {
        let mut plugin_ids = Vec::new();

        if !self.plugins_dir.exists() {
            fs::create_dir_all(&self.plugins_dir)?;
            return Ok(plugin_ids);
        }

        for entry in fs::read_dir(&self.plugins_dir)? {
            let entry = entry?;
            let path = entry.path();

            if path.is_dir() {
                let manifest_path = path.join("plugin.toml");
                if manifest_path.exists() {
                    let plugin_id = path
                        .file_name()
                        .and_then(|n| n.to_str())
                        .ok_or_else(|| LoaderError::InvalidManifest("Invalid plugin directory name".to_string()))?
                        .to_string();

                    plugin_ids.push(plugin_id);
                }
            }
        }

        Ok(plugin_ids)
    }

    /// Load a plugin by ID
    pub fn load(&mut self, plugin_id: &str) -> Result<&PluginInfo> {
        // Check if already loaded
        if self.plugins.contains_key(plugin_id) {
            return Err(LoaderError::PluginAlreadyLoaded(plugin_id.to_string()));
        }

        let plugin_dir = self.plugins_dir.join(plugin_id);
        if !plugin_dir.exists() {
            return Err(LoaderError::PluginNotFound(plugin_id.to_string()));
        }

        // Read and parse manifest
        let manifest_path = plugin_dir.join("plugin.toml");
        let manifest_content = fs::read_to_string(&manifest_path)?;
        let manifest: PluginManifest = toml::from_str(&manifest_content)?;

        // Validate manifest
        self.validate_manifest(&manifest)?;

        // Build capabilities from permissions
        let capabilities = self.build_capabilities(&manifest)?;

        // Get entry point path
        let entry_path = plugin_dir.join(&manifest.entry);
        if !entry_path.exists() {
            return Err(LoaderError::InvalidManifest(format!(
                "Entry point not found: {}",
                manifest.entry
            )));
        }

        // Create plugin info
        let plugin_info = PluginInfo {
            id: plugin_id.to_string(),
            manifest,
            path: plugin_dir,
            capabilities,
            entry_path,
        };

        self.plugins.insert(plugin_id.to_string(), plugin_info);

        Ok(self.plugins.get(plugin_id).unwrap())
    }

    /// Get plugin info by ID
    pub fn get(&self, plugin_id: &str) -> Option<&PluginInfo> {
        self.plugins.get(plugin_id)
    }

    /// Get all loaded plugins
    pub fn list(&self) -> Vec<&PluginInfo> {
        self.plugins.values().collect()
    }

    /// Unload a plugin
    pub fn unload(&mut self, plugin_id: &str) -> Result<()> {
        self.plugins
            .remove(plugin_id)
            .ok_or_else(|| LoaderError::PluginNotFound(plugin_id.to_string()))?;
        Ok(())
    }

    /// Reload a plugin
    pub fn reload(&mut self, plugin_id: &str) -> Result<&PluginInfo> {
        self.unload(plugin_id)?;
        self.load(plugin_id)
    }

    /// Validate plugin manifest
    fn validate_manifest(&self, manifest: &PluginManifest) -> Result<()> {
        // Check required fields
        if manifest.name.is_empty() {
            return Err(LoaderError::MissingField("name".to_string()));
        }

        if manifest.version.is_empty() {
            return Err(LoaderError::MissingField("version".to_string()));
        }

        if manifest.author.is_empty() {
            return Err(LoaderError::MissingField("author".to_string()));
        }

        // Validate version format (semver)
        if !Self::is_valid_semver(&manifest.version) {
            return Err(LoaderError::InvalidManifest(format!(
                "Invalid version format: {}",
                manifest.version
            )));
        }

        Ok(())
    }

    /// Check if version is valid semver
    fn is_valid_semver(version: &str) -> bool {
        let parts: Vec<&str> = version.split('.').collect();
        if parts.len() != 3 {
            return false;
        }

        parts.iter().all(|p| p.parse::<u32>().is_ok())
    }

    /// Build capabilities from manifest permissions
    fn build_capabilities(&self, manifest: &PluginManifest) -> Result<PluginCapabilities> {
        // Start with default capabilities for trust level
        let mut capabilities = manifest.trust.default_capabilities();

        // Override with manifest permissions
        capabilities.filesystem = manifest.permissions.filesystem.clone().into();
        capabilities.network = manifest.permissions.network.clone().into();
        capabilities.commands = manifest.permissions.commands.clone().into();
        capabilities.ui = manifest.permissions.ui.clone().into();

        Ok(capabilities)
    }

    /// Get plugins directory
    pub fn plugins_dir(&self) -> &Path {
        &self.plugins_dir
    }
}

// ============================================================================
// TESTS
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::TempDir;

    fn create_test_manifest(dir: &Path, name: &str) -> std::io::Result<()> {
        let manifest = format!(
            r#"
name = "{}"
version = "1.0.0"
author = "test"
description = "Test plugin"
trust = "first-party"

[permissions]
filesystem = "WorkspaceReadWrite"

[permissions.network]
type = "None"

[permissions.commands]
allowlist = ["git"]
require_confirmation = false

[permissions.ui]
status_bar = true
sidebar = true
notifications = true
webview = false
"#,
            name
        );

        fs::write(dir.join("plugin.toml"), manifest)?;
        fs::write(dir.join("main.ts"), "// test")?;
        Ok(())
    }

    #[test]
    fn test_plugin_discovery() {
        let temp_dir = TempDir::new().unwrap();
        let plugins_dir = temp_dir.path().join("plugins");
        fs::create_dir(&plugins_dir).unwrap();

        // Create test plugins
        let plugin1_dir = plugins_dir.join("plugin1");
        let plugin2_dir = plugins_dir.join("plugin2");
        fs::create_dir(&plugin1_dir).unwrap();
        fs::create_dir(&plugin2_dir).unwrap();

        create_test_manifest(&plugin1_dir, "Plugin 1").unwrap();
        create_test_manifest(&plugin2_dir, "Plugin 2").unwrap();

        let mut loader = PluginLoader::new(plugins_dir);
        let discovered = loader.discover().unwrap();

        assert_eq!(discovered.len(), 2);
        assert!(discovered.contains(&"plugin1".to_string()));
        assert!(discovered.contains(&"plugin2".to_string()));
    }

    #[test]
    fn test_plugin_load() {
        let temp_dir = TempDir::new().unwrap();
        let plugins_dir = temp_dir.path().join("plugins");
        fs::create_dir(&plugins_dir).unwrap();

        let plugin_dir = plugins_dir.join("test-plugin");
        fs::create_dir(&plugin_dir).unwrap();
        create_test_manifest(&plugin_dir, "Test Plugin").unwrap();

        let mut loader = PluginLoader::new(plugins_dir);
        let plugin_info = loader.load("test-plugin").unwrap();

        assert_eq!(plugin_info.id, "test-plugin");
        assert_eq!(plugin_info.manifest.name, "Test Plugin");
        assert_eq!(plugin_info.manifest.version, "1.0.0");
    }

    #[test]
    fn test_plugin_capabilities() {
        let temp_dir = TempDir::new().unwrap();
        let plugins_dir = temp_dir.path().join("plugins");
        fs::create_dir(&plugins_dir).unwrap();

        let plugin_dir = plugins_dir.join("test-plugin");
        fs::create_dir(&plugin_dir).unwrap();
        create_test_manifest(&plugin_dir, "Test Plugin").unwrap();

        let mut loader = PluginLoader::new(plugins_dir);
        let plugin_info = loader.load("test-plugin").unwrap();

        assert!(matches!(
            plugin_info.capabilities.filesystem,
            FilesystemCapability::WorkspaceReadWrite
        ));
        assert!(plugin_info.capabilities.commands.can_execute("git"));
        assert!(plugin_info.capabilities.ui.status_bar);
    }

    #[test]
    fn test_invalid_manifest() {
        let temp_dir = TempDir::new().unwrap();
        let plugins_dir = temp_dir.path().join("plugins");
        fs::create_dir(&plugins_dir).unwrap();

        let plugin_dir = plugins_dir.join("invalid-plugin");
        fs::create_dir(&plugin_dir).unwrap();

        // Create invalid manifest (missing required fields)
        fs::write(
            plugin_dir.join("plugin.toml"),
            r#"
version = "1.0.0"
"#,
        )
        .unwrap();

        let mut loader = PluginLoader::new(plugins_dir);
        let result = loader.load("invalid-plugin");

        assert!(result.is_err());
    }

    #[test]
    fn test_semver_validation() {
        assert!(PluginLoader::is_valid_semver("1.0.0"));
        assert!(PluginLoader::is_valid_semver("0.1.0"));
        assert!(PluginLoader::is_valid_semver("10.20.30"));
        
        assert!(!PluginLoader::is_valid_semver("1.0"));
        assert!(!PluginLoader::is_valid_semver("1.0.0.0"));
        assert!(!PluginLoader::is_valid_semver("invalid"));
    }
}
```
