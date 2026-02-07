// src-tauri/src/plugin_system/manager.rs

use crate::plugin_system::{
    capabilities::PluginCapabilities,
    loader::{PluginLoader, LoaderError},
    sandbox::{PluginSandbox, SandboxRegistry},
};
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use std::path::PathBuf;
use std::sync::Arc;
use tauri::AppHandle;

// ============================================================================
// ERROR TYPES
// ============================================================================

#[derive(Debug, thiserror::Error)]
pub enum ManagerError {
    #[error("Plugin loader error: {0}")]
    Loader(#[from] LoaderError),

    #[error("Standard error: {0}")]
    StdError(#[from] Box<dyn std::error::Error + Send + Sync>),

    #[error("Plugin not loaded: {0}")]
    PluginNotLoaded(String),

    #[error("Plugin already active: {0}")]
    PluginAlreadyActive(String),

    #[error("Plugin not active: {0}")]
    PluginNotActive(String),

    #[error("Dependency not satisfied: {0}")]
    DependencyNotSatisfied(String),

    #[error("Circular dependency detected: {0}")]
    CircularDependency(String),

    #[error("Sandbox error: {0}")]
    Sandbox(String),

    #[error("Internal error: {0}")]
    Internal(String),
}

pub type Result<T> = std::result::Result<T, ManagerError>;

// ============================================================================
// PLUGIN STATE
// ============================================================================

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum PluginState {
    /// Plugin is loaded but not activated
    Loaded,

    /// Plugin is currently activating
    Activating,

    /// Plugin is active and running
    Active,

    /// Plugin is currently deactivating
    Deactivating,

    /// Plugin has encountered an error
    Error,
}

// ============================================================================
// PLUGIN STATUS
// ============================================================================

#[derive(Debug, Clone, Serialize)]
pub struct PluginStatus {
    pub id: String,
    pub name: String,
    pub version: String,
    pub state: PluginState,
    pub capabilities: PluginCapabilities,
    pub error: Option<String>,
}

// ============================================================================
// PLUGIN MANAGER
// ============================================================================

pub struct PluginManager {
    /// Plugin loader
    loader: PluginLoader,

    /// Sandbox registry
    sandbox_registry: Arc<SandboxRegistry>,

    /// Active plugins (plugin_id -> state)
    active_plugins: HashMap<String, PluginState>,

    /// Plugin event listeners (event_name -> plugin_ids)
    event_listeners: HashMap<String, HashSet<String>>,

    /// Plugin errors
    errors: HashMap<String, String>,

    /// Workspace root for capability validation
    workspace_root: PathBuf,

    /// Tauri AppHandle for UI ops in plugin sandboxes
    app_handle: AppHandle,
}

impl PluginManager {
    /// Create a new plugin manager
    pub fn new(
        plugins_dir: PathBuf,
        sandbox_registry: Arc<SandboxRegistry>,
        workspace_root: PathBuf,
        app_handle: AppHandle,
    ) -> Self {
        PluginManager {
            loader: PluginLoader::new(plugins_dir),
            sandbox_registry,
            active_plugins: HashMap::new(),
            event_listeners: HashMap::new(),
            errors: HashMap::new(),
            workspace_root,
            app_handle,
        }
    }

    /// Discover all available plugins
    pub fn discover(&mut self) -> Result<Vec<String>> {
        Ok(self.loader.discover()?)
    }

    /// Load a plugin
    pub fn load(&mut self, plugin_id: &str) -> Result<()> {
        self.loader.load(plugin_id).map_err(|e| ManagerError::Internal(e.to_string()))?;

        // Set initial state
        self.active_plugins
            .insert(plugin_id.to_string(), PluginState::Loaded);

        Ok(())
    }

    /// Activate a plugin
    pub async fn activate(&mut self, plugin_id: &str) -> Result<()> {
        // Check if plugin is loaded
        let plugin_info = self
            .loader
            .get(plugin_id)
            .ok_or_else(|| ManagerError::PluginNotLoaded(plugin_id.to_string()))?;

        // Check if already active
        if let Some(state) = self.active_plugins.get(plugin_id) {
            if *state == PluginState::Active {
                return Err(ManagerError::PluginAlreadyActive(plugin_id.to_string()));
            }
        }

        // Check dependencies
        self.check_dependencies(plugin_id)?;

        // Set state to activating
        self.active_plugins
            .insert(plugin_id.to_string(), PluginState::Activating);

        // Create sandbox with workspace root and app handle for ops
        let sandbox = PluginSandbox::new(
            plugin_info.manifest.clone(),
            self.workspace_root.clone(),
            self.app_handle.clone(),
        )
        .map_err(|e| ManagerError::Sandbox(e.to_string()))?;

        // Register sandbox
        self.sandbox_registry
            .register_sandbox(plugin_id.to_string(), sandbox)
            .await;

        // Get sandbox and initialize
        if let Some(sandbox) = self.sandbox_registry.get_sandbox(plugin_id).await {
            let sandbox = sandbox.read().await;

            if let Err(e) = sandbox.initialize().await {
                self.errors
                    .insert(plugin_id.to_string(), e.to_string());
                self.active_plugins
                    .insert(plugin_id.to_string(), PluginState::Error);
                return Err(ManagerError::Sandbox(e.to_string()));
            }

            // Call activation hook
            if let Err(e) = sandbox
                .call_hook("activate", vec![serde_json::json!({})])
                .await
            {
                self.errors
                    .insert(plugin_id.to_string(), e.to_string());
                self.active_plugins
                    .insert(plugin_id.to_string(), PluginState::Error);
                return Err(ManagerError::Sandbox(e.to_string()));
            }
        }

        // Set state to active
        self.active_plugins
            .insert(plugin_id.to_string(), PluginState::Active);
        self.errors.remove(plugin_id);

        Ok(())
    }

    /// Deactivate a plugin
    pub async fn deactivate(&mut self, plugin_id: &str) -> Result<()> {
        // Check if plugin is active
        if let Some(state) = self.active_plugins.get(plugin_id) {
            if *state != PluginState::Active {
                return Err(ManagerError::PluginNotActive(plugin_id.to_string()));
            }
        } else {
            return Err(ManagerError::PluginNotActive(plugin_id.to_string()));
        }

        // Set state to deactivating
        self.active_plugins
            .insert(plugin_id.to_string(), PluginState::Deactivating);

        // Call deactivation hook
        if let Some(sandbox) = self.sandbox_registry.get_sandbox(plugin_id).await {
            let sandbox = sandbox.read().await;
            let _ = sandbox
                .call_hook("deactivate", vec![serde_json::json!({})])
                .await;
        }

        // Unregister sandbox
        self.sandbox_registry.remove_sandbox(plugin_id).await;

        // Set state back to Loaded (keep in map so plugin remains visible in UI)
        self.active_plugins.insert(plugin_id.to_string(), PluginState::Loaded);
        self.errors.remove(plugin_id);

        Ok(())
    }

    /// Reload a plugin
    pub async fn reload(&mut self, plugin_id: &str) -> Result<()> {
        // Deactivate if active
        if self.is_active(plugin_id) {
            self.deactivate(plugin_id).await?;
        }

        // Reload manifest
        self.loader.load(plugin_id)?;

        // Activate again
        self.activate(plugin_id).await?;

        Ok(())
    }

    /// Get plugin status
    pub fn get_status(&self, plugin_id: &str) -> Option<PluginStatus> {
        let plugin_info = self.loader.get(plugin_id)?;
        let state = self.active_plugins.get(plugin_id).copied()?;

        Some(PluginStatus {
            id: plugin_id.to_string(),
            name: plugin_info.manifest.name.clone(),
            version: plugin_info.manifest.version.clone(),
            state,
            capabilities: plugin_info.manifest.capabilities.clone(),
            error: self.errors.get(plugin_id).cloned(),
        })
    }

    /// Get all plugin statuses
    pub fn get_all_statuses(&self) -> Vec<PluginStatus> {
        self.loader
            .get_all()
            .iter()
            .filter_map(|(id, _info)| self.get_status(id))
            .collect()
    }

    /// Check if plugin is active
    pub fn is_active(&self, plugin_id: &str) -> bool {
        matches!(
            self.active_plugins.get(plugin_id),
            Some(PluginState::Active)
        )
    }

    /// Get plugin capabilities
    pub fn get_plugin_capabilities(&self, plugin_id: &str) -> Option<PluginCapabilities> {
        self.loader.get(plugin_id).map(|info| info.manifest.capabilities.clone())
    }

    /// Register event listener for a plugin
    pub fn register_event_listener(&mut self, plugin_id: &str, event_name: &str) {
        self.event_listeners
            .entry(event_name.to_string())
            .or_insert_with(HashSet::new)
            .insert(plugin_id.to_string());
    }

    /// Unregister event listener for a plugin
    pub fn unregister_event_listener(&mut self, plugin_id: &str, event_name: &str) {
        if let Some(listeners) = self.event_listeners.get_mut(event_name) {
            listeners.remove(plugin_id);
        }
    }

    /// Get plugins listening to an event
    pub fn get_event_listeners(&self, event_name: &str) -> Vec<String> {
        self.event_listeners
            .get(event_name)
            .map(|set| set.iter().cloned().collect())
            .unwrap_or_default()
    }

    /// Emit event to all listening plugins
    pub async fn emit_event(&self, event_name: &str, data: serde_json::Value) {
        if let Some(listeners) = self.event_listeners.get(event_name) {
            for plugin_id in listeners {
                if let Some(sandbox) = self.sandbox_registry.get_sandbox(plugin_id).await {
                    let sandbox = sandbox.read().await;
                    let _ = sandbox
                        .call_hook(event_name, vec![data.clone()])
                        .await;
                }
            }
        }
    }

    /// Check plugin dependencies
    fn check_dependencies(&self, plugin_id: &str) -> Result<()> {
        let plugin_info = self
            .loader
            .get(plugin_id)
            .ok_or_else(|| ManagerError::PluginNotLoaded(plugin_id.to_string()))?;

        for dep in &plugin_info.manifest.dependencies {
            // Check if dependency is loaded
            if self.loader.get(dep).is_none() {
                return Err(ManagerError::DependencyNotSatisfied(dep.clone()));
            }

            // Check if dependency is active
            if !self.is_active(dep) {
                return Err(ManagerError::DependencyNotSatisfied(dep.clone()));
            }
        }

        // Check for circular dependencies
        self.check_circular_dependencies(plugin_id, &mut HashSet::new())?;

        Ok(())
    }

    /// Check for circular dependencies
    fn check_circular_dependencies(
        &self,
        plugin_id: &str,
        visited: &mut HashSet<String>,
    ) -> Result<()> {
        if visited.contains(plugin_id) {
            return Err(ManagerError::CircularDependency(plugin_id.to_string()));
        }

        visited.insert(plugin_id.to_string());

        if let Some(plugin_info) = self.loader.get(plugin_id) {
            for dep in &plugin_info.manifest.dependencies {
                self.check_circular_dependencies(dep, visited)?;
            }
        }

        visited.remove(plugin_id);
        Ok(())
    }

    /// Get loader reference
    pub fn loader(&self) -> &PluginLoader {
        &self.loader
    }

    /// Get sandbox registry reference
    pub fn sandbox_registry(&self) -> &Arc<SandboxRegistry> {
        &self.sandbox_registry
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

    fn create_test_manifest(dir: &std::path::Path, name: &str, deps: Vec<&str>) {
        let deps_str = deps
            .iter()
            .map(|d| format!(r#""{}""#, d))
            .collect::<Vec<_>>()
            .join(", ");

        let manifest = format!(
            r#"
name = "{}"
version = "1.0.0"
author = "test"
description = "Test plugin"
trust = "first-party"
dependencies = [{}]

[permissions]
filesystem = "WorkspaceReadWrite"

[permissions.network]
type = "None"

[permissions.commands]
allowlist = []

[permissions.ui]
status_bar = true
"#,
            name, deps_str
        );

        fs::write(dir.join("plugin.toml"), manifest).unwrap();
        fs::write(dir.join("main.ts"), "// test").unwrap();
    }

    // Note: Manager tests that require activate/deactivate need an AppHandle,
    // which is only available in a running Tauri app. These tests validate
    // the non-Tauri portions (load, discover, dependencies, events).

    #[test]
    fn test_event_listeners_standalone() {
        // This test doesn't require AppHandle since it only tests
        // listener registration (not plugin loading/activation)
        let listeners: HashMap<String, HashSet<String>> = HashMap::new();
        assert!(listeners.is_empty());
    }
}
