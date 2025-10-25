// src-tauri/src/plugin_system/loader.rs

use crate::plugin_system::trust::TrustLevel;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::{Path, PathBuf};
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
    pub description: String,
    pub author: String,
    pub license: String,
    pub main: String,
    pub capabilities: crate::plugin_system::capabilities::PluginCapabilities,
    pub dependencies: Vec<String>,
    pub source: String,
    pub signature: Option<PluginSignature>,
    pub trust: TrustLevel,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PluginSignature {
    pub public_key: String,
    pub signature: Vec<u8>,
    pub timestamp: SystemTime,
}

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

    pub fn discover(&self) -> Result<Vec<String>, Box<dyn std::error::Error>> {
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

    pub fn load_manifest(&self, plugin_id: &str) -> Result<PluginManifest, Box<dyn std::error::Error>> {
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
        
        Ok(manifest)
    }

    pub fn load(&mut self, plugin_id: &str) -> Result<(), Box<dyn std::error::Error>> {
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

    pub fn verify_dependencies(&self, plugin_id: &str) -> Result<(), Box<dyn std::error::Error>> {
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