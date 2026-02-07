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
    "main.ts".to_string()
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

    pub fn load_manifest(&self, plugin_id: &str) -> Result<PluginManifest, Box<dyn std::error::Error + Send + Sync>> {
        use crate::plugin_system::capabilities::*;

        let plugin_path = self.plugins_dir.join(plugin_id);
        let manifest_path = plugin_path.join("plugin.toml");

        if !manifest_path.exists() {
            return Err(format!("Plugin manifest not found: {}", manifest_path.display()).into());
        }

        let manifest_content = std::fs::read_to_string(&manifest_path)?;
        let mut manifest: PluginManifest = toml::from_str(&manifest_content)?;

        // Set trust level based on plugin type
        manifest.trust = if self.first_party_plugins.contains(plugin_id) {
            TrustLevel::FirstParty
        } else if manifest.source.starts_with("file://") {
            TrustLevel::Local
        } else {
            TrustLevel::Community
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
                        let strs: Vec<String> = arr.iter().filter_map(|v| v.as_str().map(String::from)).collect();
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
                                    let domain_set: std::collections::HashSet<String> =
                                        domains.iter().filter_map(|v| v.as_str().map(String::from)).collect();
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
                            .map(|arr| arr.iter().filter_map(|v| v.as_str().map(String::from)).collect())
                            .unwrap_or_default();
                        let require_confirmation = t
                            .get("require_confirmation")
                            .and_then(|v| v.as_bool())
                            .unwrap_or(true);
                        CommandCapability { allowlist, require_confirmation }
                    }
                    toml::Value::Array(arr) => {
                        // Handle ["git"] style
                        let allowlist: std::collections::HashSet<String> =
                            arr.iter().filter_map(|v| v.as_str().map(String::from)).collect();
                        CommandCapability { allowlist, require_confirmation: true }
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

    pub fn load(&mut self, plugin_id: &str) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let manifest = self.load_manifest(plugin_id)?;
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

    pub fn get_all(&self) -> &HashMap<String, PluginInfo> {
        &self.plugins
    }

    pub fn unload(&mut self, plugin_id: &str) -> bool {
        self.plugins.remove(plugin_id).is_some()
    }

    pub fn verify_dependencies(&self, plugin_id: &str) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        if let Some(plugin_info) = self.plugins.get(plugin_id) {
            for dependency in &plugin_info.manifest.dependencies {
                if !self.plugins.contains_key(dependency) {
                    return Err(format!("Missing dependency: {}", dependency).into());
                }
            }
        }
        Ok(())
    }

    pub fn is_first_party(&self, plugin_id: &str) -> bool {
        self.first_party_plugins.contains(plugin_id)
    }
}