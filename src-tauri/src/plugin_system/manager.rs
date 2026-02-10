// src-tauri/src/plugin_system/manager.rs

use crate::plugin_system::{
    capabilities::PluginCapabilities,
    loader::{LoaderError, PluginLoader},
    ops::EditorStateHandle,
    sandbox::{PluginSandbox, SandboxRegistry},
    trust::TrustLevel,
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
    pub trust: TrustLevel,
    pub loaded_at: Option<u64>,
    pub auto_approve: bool,
    pub capability_tier: String,
    pub commands: Vec<PluginCommandStatus>,
}

#[derive(Debug, Clone, Serialize)]
pub struct PluginCommandStatus {
    pub id: String,
    pub plugin_id: String,
    pub label: String,
    pub keybinding: Option<String>,
    pub category: Option<String>,
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

    /// Shared editor state for plugin ops
    editor_state: EditorStateHandle,
}

impl PluginManager {
    /// Create a new plugin manager
    pub fn new(
        plugins_dir: PathBuf,
        sandbox_registry: Arc<SandboxRegistry>,
        workspace_root: PathBuf,
        app_handle: AppHandle,
        editor_state: EditorStateHandle,
    ) -> Self {
        PluginManager {
            loader: PluginLoader::new(plugins_dir),
            sandbox_registry,
            active_plugins: HashMap::new(),
            event_listeners: HashMap::new(),
            errors: HashMap::new(),
            workspace_root,
            app_handle,
            editor_state,
        }
    }

    /// Discover all available plugins
    pub fn discover(&mut self) -> Result<Vec<String>> {
        Ok(self.loader.discover()?)
    }

    /// Load a plugin
    pub fn load(&mut self, plugin_id: &str) -> Result<()> {
        self.loader
            .load(plugin_id)
            .map_err(|e| ManagerError::Internal(e.to_string()))?;

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

        // Trust system checks
        let is_first_party = self.loader.is_first_party(plugin_id);
        let is_trusted = plugin_info.manifest.trust.is_trusted();
        println!(
            "[plugin] {} trust: {:?} (first-party={}, trusted={})",
            plugin_id, plugin_info.manifest.trust, is_first_party, is_trusted
        );

        if plugin_info.manifest.trust.auto_grant_permissions() {
            println!(
                "[plugin] {} auto-granted permissions (first-party)",
                plugin_id
            );
        }

        // Check dependencies (uses loader.verify_dependencies first)
        self.check_dependencies(plugin_id)?;

        // Set state to activating
        self.active_plugins
            .insert(plugin_id.to_string(), PluginState::Activating);

        // Create sandbox with workspace root and app handle for ops
        let sandbox = PluginSandbox::new(
            plugin_info.manifest.clone(),
            self.workspace_root.clone(),
            self.app_handle.clone(),
            self.editor_state.clone(),
        )
        .map_err(|e| ManagerError::Sandbox(e.to_string()))?;

        // Register sandbox
        self.sandbox_registry
            .register_sandbox(plugin_id.to_string(), sandbox)
            .await;

        // Get sandbox, load entry point, and activate
        if let Some(sandbox) = self.sandbox_registry.get_sandbox(plugin_id).await {
            let sandbox = sandbox.read().await;

            if let Err(e) = sandbox.initialize().await {
                self.errors.insert(plugin_id.to_string(), e.to_string());
                self.active_plugins
                    .insert(plugin_id.to_string(), PluginState::Error);
                return Err(ManagerError::Sandbox(e.to_string()));
            }

            // Load and execute the plugin's entry point script
            // This registers hooks (onActivate, onDeactivate, registerHook)
            let entry_point = &plugin_info.manifest.main;
            let plugin_root = plugin_info.path.canonicalize().map_err(|e| {
                ManagerError::Internal(format!(
                    "Failed to canonicalize plugin root '{}': {}",
                    plugin_info.path.display(),
                    e
                ))
            })?;
            let entry_path = plugin_info.path.join(entry_point);
            let canonical_entry = entry_path.canonicalize().map_err(|e| {
                ManagerError::Internal(format!(
                    "Failed to read plugin entry point '{}': {}",
                    entry_path.display(),
                    e
                ))
            })?;
            if !canonical_entry.starts_with(&plugin_root) {
                return Err(ManagerError::Internal(format!(
                    "Plugin entry point escapes plugin directory: '{}'",
                    entry_point
                )));
            }
            let script = std::fs::read_to_string(&canonical_entry).map_err(|e| {
                ManagerError::Internal(format!(
                    "Failed to read plugin entry point '{}': {}",
                    canonical_entry.display(),
                    e
                ))
            })?;

            if let Err(e) = sandbox.execute(script).await {
                self.errors.insert(plugin_id.to_string(), e.to_string());
                self.active_plugins
                    .insert(plugin_id.to_string(), PluginState::Error);
                return Err(ManagerError::Sandbox(format!(
                    "Failed to execute entry point '{}': {}",
                    entry_point, e
                )));
            }

            // Call activation hook (registered by the entry point script above)
            if let Err(e) = sandbox
                .call_hook("activate", vec![serde_json::json!({})])
                .await
            {
                self.errors.insert(plugin_id.to_string(), e.to_string());
                self.active_plugins
                    .insert(plugin_id.to_string(), PluginState::Error);
                return Err(ManagerError::Sandbox(e.to_string()));
            }
        }

        // Set state to active
        self.active_plugins
            .insert(plugin_id.to_string(), PluginState::Active);
        self.errors.remove(plugin_id);

        // Emit lifecycle event
        self.emit_event(
            "plugin:activated",
            serde_json::json!({"plugin_id": plugin_id}),
        )
        .await;

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

        // Clean up event listeners for this plugin
        let event_names: Vec<String> = self.event_listeners.keys().cloned().collect();
        for event_name in event_names {
            self.unregister_event_listener(plugin_id, &event_name);
        }

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
        self.active_plugins
            .insert(plugin_id.to_string(), PluginState::Loaded);
        self.errors.remove(plugin_id);

        // Emit lifecycle event
        self.emit_event(
            "plugin:deactivated",
            serde_json::json!({"plugin_id": plugin_id}),
        )
        .await;

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

        let caps = &plugin_info.manifest.capabilities;
        let capability_tier = if caps.is_subset_of(&PluginCapabilities::none()) {
            "sandboxed"
        } else if caps.is_subset_of(&PluginCapabilities::workspace_read()) {
            "read-only"
        } else if caps.is_subset_of(&PluginCapabilities::workspace_read_write()) {
            "read-write"
        } else {
            "full"
        };

        let loaded_at = plugin_info
            .loaded_at
            .duration_since(std::time::UNIX_EPOCH)
            .ok()
            .map(|d| d.as_millis() as u64);

        Some(PluginStatus {
            id: plugin_id.to_string(),
            name: plugin_info.manifest.name.clone(),
            version: plugin_info.manifest.version.clone(),
            state,
            capabilities: plugin_info.manifest.capabilities.clone(),
            error: self.errors.get(plugin_id).cloned(),
            trust: plugin_info.manifest.trust.clone(),
            loaded_at,
            auto_approve: plugin_info.manifest.trust.auto_grant_permissions(),
            capability_tier: capability_tier.to_string(),
            commands: parse_manifest_commands(&plugin_info.manifest.commands, plugin_id),
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
        self.loader
            .get(plugin_id)
            .map(|info| info.manifest.capabilities.clone())
    }

    /// Set plugin capabilities after dynamic permission grants.
    pub fn set_plugin_capabilities(
        &mut self,
        plugin_id: &str,
        capabilities: PluginCapabilities,
    ) -> Result<()> {
        self.loader
            .set_capabilities(plugin_id, capabilities)
            .map_err(ManagerError::Loader)
    }

    /// Register event listener for a plugin
    pub fn register_event_listener(&mut self, plugin_id: &str, event_name: &str) {
        self.event_listeners
            .entry(event_name.to_string())
            .or_default()
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
                    let _ = sandbox.call_hook(event_name, vec![data.clone()]).await;
                }
            }
        }
    }

    /// Check plugin dependencies
    fn check_dependencies(&self, plugin_id: &str) -> Result<()> {
        // First check that all dependencies are loaded (via loader)
        self.loader
            .verify_dependencies(plugin_id)
            .map_err(|e| ManagerError::DependencyNotSatisfied(e.to_string()))?;

        let plugin_info = self
            .loader
            .get(plugin_id)
            .ok_or_else(|| ManagerError::PluginNotLoaded(plugin_id.to_string()))?;

        // Then check that all dependencies are active
        for dep in &plugin_info.manifest.dependencies {
            if !self.is_active(dep) {
                return Err(ManagerError::DependencyNotSatisfied(format!(
                    "{} (not active)",
                    dep
                )));
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

    /// Unload a plugin (deactivate first if active, then remove from loader)
    pub async fn unload(&mut self, plugin_id: &str) -> Result<()> {
        // Deactivate if active
        if self.is_active(plugin_id) {
            self.deactivate(plugin_id).await?;
        }

        // Remove from loader
        if !self.loader.unload(plugin_id) {
            return Err(ManagerError::PluginNotLoaded(plugin_id.to_string()));
        }

        // Remove from active plugins map
        self.active_plugins.remove(plugin_id);
        self.errors.remove(plugin_id);

        println!("[plugin] Unloaded plugin: {}", plugin_id);
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

    /// Get workspace root for capability-bound APIs.
    pub fn workspace_root(&self) -> &std::path::Path {
        &self.workspace_root
    }
}

fn parse_manifest_commands(
    commands: &Option<toml::Value>,
    plugin_id: &str,
) -> Vec<PluginCommandStatus> {
    let Some(toml::Value::Table(table)) = commands else {
        return Vec::new();
    };

    table
        .iter()
        .map(|(id, config)| {
            let label = config
                .get("label")
                .and_then(|v| v.as_str())
                .unwrap_or(id)
                .to_string();
            let keybinding = config
                .get("key")
                .and_then(|v| v.as_str())
                .map(|s| s.to_string());
            let category = config
                .get("category")
                .and_then(|v| v.as_str())
                .map(|s| s.to_string())
                .or_else(|| id.split('.').next().map(|s| s.to_string()));

            PluginCommandStatus {
                id: id.to_string(),
                plugin_id: plugin_id.to_string(),
                label,
                keybinding,
                category,
            }
        })
        .collect()
}

// ============================================================================
// TESTS
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    // Note: Manager tests that require activate/deactivate need an AppHandle,
    // which is only available in a running Tauri app. Loader-level and
    // capabilities tests are in their respective modules.
    // These tests validate the non-Tauri portions (state, events).

    #[test]
    fn test_event_listeners_standalone() {
        let mut listeners: HashMap<String, HashSet<String>> = HashMap::new();
        assert!(listeners.is_empty());

        // Simulate register
        listeners
            .entry("on_file_save".to_string())
            .or_default()
            .insert("git".to_string());

        assert_eq!(listeners.get("on_file_save").unwrap().len(), 1);
        assert!(listeners.get("on_file_save").unwrap().contains("git"));
    }

    #[test]
    fn test_plugin_state_transitions() {
        // Verify state enum values serialize correctly
        assert_eq!(
            serde_json::to_string(&PluginState::Loaded).unwrap(),
            r#""loaded""#
        );
        assert_eq!(
            serde_json::to_string(&PluginState::Active).unwrap(),
            r#""active""#
        );
        assert_eq!(
            serde_json::to_string(&PluginState::Activating).unwrap(),
            r#""activating""#
        );
        assert_eq!(
            serde_json::to_string(&PluginState::Deactivating).unwrap(),
            r#""deactivating""#
        );
        assert_eq!(
            serde_json::to_string(&PluginState::Error).unwrap(),
            r#""error""#
        );
    }

    #[test]
    fn test_plugin_state_deserialize() {
        let loaded: PluginState = serde_json::from_str(r#""loaded""#).unwrap();
        assert_eq!(loaded, PluginState::Loaded);
        let active: PluginState = serde_json::from_str(r#""active""#).unwrap();
        assert_eq!(active, PluginState::Active);
        let error: PluginState = serde_json::from_str(r#""error""#).unwrap();
        assert_eq!(error, PluginState::Error);
    }

    #[test]
    fn test_plugin_state_equality() {
        assert_eq!(PluginState::Loaded, PluginState::Loaded);
        assert_ne!(PluginState::Loaded, PluginState::Active);
        assert_ne!(PluginState::Activating, PluginState::Deactivating);
    }

    #[test]
    fn test_manager_error_loader_display() {
        let err = ManagerError::PluginNotLoaded("test-plugin".to_string());
        assert_eq!(err.to_string(), "Plugin not loaded: test-plugin");
    }

    #[test]
    fn test_manager_error_already_active_display() {
        let err = ManagerError::PluginAlreadyActive("git".to_string());
        assert_eq!(err.to_string(), "Plugin already active: git");
    }

    #[test]
    fn test_manager_error_not_active_display() {
        let err = ManagerError::PluginNotActive("git".to_string());
        assert_eq!(err.to_string(), "Plugin not active: git");
    }

    #[test]
    fn test_manager_error_dependency_display() {
        let err = ManagerError::DependencyNotSatisfied("core-lib".to_string());
        assert_eq!(err.to_string(), "Dependency not satisfied: core-lib");
    }

    #[test]
    fn test_manager_error_circular_dependency_display() {
        let err = ManagerError::CircularDependency("a -> b -> a".to_string());
        assert_eq!(err.to_string(), "Circular dependency detected: a -> b -> a");
    }

    #[test]
    fn test_manager_error_sandbox_display() {
        let err = ManagerError::Sandbox("timeout".to_string());
        assert_eq!(err.to_string(), "Sandbox error: timeout");
    }

    #[test]
    fn test_manager_error_internal_display() {
        let err = ManagerError::Internal("unknown".to_string());
        assert_eq!(err.to_string(), "Internal error: unknown");
    }

    #[test]
    fn test_event_listeners_register_multiple() {
        let mut listeners: HashMap<String, HashSet<String>> = HashMap::new();

        // Register two plugins to same event
        listeners
            .entry("on_file_save".to_string())
            .or_default()
            .insert("git".to_string());
        listeners
            .entry("on_file_save".to_string())
            .or_default()
            .insert("git-status".to_string());

        assert_eq!(listeners.get("on_file_save").unwrap().len(), 2);
    }

    #[test]
    fn test_event_listeners_unregister() {
        let mut listeners: HashMap<String, HashSet<String>> = HashMap::new();

        listeners
            .entry("on_file_save".to_string())
            .or_default()
            .insert("git".to_string());
        listeners
            .entry("on_file_save".to_string())
            .or_default()
            .insert("git-status".to_string());

        // Unregister one
        if let Some(set) = listeners.get_mut("on_file_save") {
            set.remove("git");
        }

        assert_eq!(listeners.get("on_file_save").unwrap().len(), 1);
        assert!(listeners
            .get("on_file_save")
            .unwrap()
            .contains("git-status"));
        assert!(!listeners.get("on_file_save").unwrap().contains("git"));
    }

    #[test]
    fn test_event_listeners_different_events() {
        let mut listeners: HashMap<String, HashSet<String>> = HashMap::new();

        listeners
            .entry("on_file_save".to_string())
            .or_default()
            .insert("git".to_string());
        listeners
            .entry("on_file_open".to_string())
            .or_default()
            .insert("git-status".to_string());

        assert_eq!(listeners.get("on_file_save").unwrap().len(), 1);
        assert_eq!(listeners.get("on_file_open").unwrap().len(), 1);
    }

    #[test]
    fn test_plugin_status_serialization() {
        use crate::plugin_system::capabilities::*;
        use crate::plugin_system::trust::TrustLevel;
        let status = PluginStatus {
            id: "test".to_string(),
            name: "Test Plugin".to_string(),
            version: "1.0.0".to_string(),
            state: PluginState::Active,
            capabilities: PluginCapabilities::default(),
            error: None,
            trust: TrustLevel::Community,
            loaded_at: Some(1700000000000),
            auto_approve: false,
            capability_tier: "sandboxed".to_string(),
            commands: vec![],
        };
        let json = serde_json::to_string(&status).unwrap();
        assert!(json.contains("\"id\":\"test\""));
        assert!(json.contains("\"state\":\"active\""));
        assert!(json.contains("\"version\":\"1.0.0\""));
        assert!(json.contains("\"trust\":\"community\""));
        assert!(json.contains("\"capability_tier\":\"sandboxed\""));
    }

    #[test]
    fn test_plugin_status_with_error() {
        use crate::plugin_system::capabilities::*;
        use crate::plugin_system::trust::TrustLevel;
        let status = PluginStatus {
            id: "test".to_string(),
            name: "Test Plugin".to_string(),
            version: "1.0.0".to_string(),
            state: PluginState::Error,
            capabilities: PluginCapabilities::default(),
            error: Some("sandbox timeout".to_string()),
            trust: TrustLevel::Community,
            loaded_at: None,
            auto_approve: false,
            capability_tier: "sandboxed".to_string(),
            commands: vec![],
        };
        let json = serde_json::to_string(&status).unwrap();
        assert!(json.contains("\"state\":\"error\""));
        assert!(json.contains("sandbox timeout"));
    }

    #[test]
    fn test_plugin_status_first_party_trust() {
        use crate::plugin_system::capabilities::*;
        use crate::plugin_system::trust::TrustLevel;
        let status = PluginStatus {
            id: "git".to_string(),
            name: "Git Plugin".to_string(),
            version: "0.1.0".to_string(),
            state: PluginState::Active,
            capabilities: PluginCapabilities::first_party(),
            error: None,
            trust: TrustLevel::FirstParty,
            loaded_at: Some(1700000000000),
            auto_approve: true,
            capability_tier: "full".to_string(),
            commands: vec![],
        };
        let json = serde_json::to_string(&status).unwrap();
        assert!(json.contains("\"trust\":\"first-party\""));
        assert!(json.contains("\"auto_approve\":true"));
        assert!(json.contains("\"capability_tier\":\"full\""));
    }

    #[test]
    fn test_plugin_status_verified_trust() {
        use crate::plugin_system::capabilities::*;
        use crate::plugin_system::trust::TrustLevel;
        let status = PluginStatus {
            id: "ext".to_string(),
            name: "External Plugin".to_string(),
            version: "2.0.0".to_string(),
            state: PluginState::Loaded,
            capabilities: PluginCapabilities::workspace_read(),
            error: None,
            trust: TrustLevel::Verified,
            loaded_at: Some(1700000000000),
            auto_approve: false,
            capability_tier: "read-only".to_string(),
            commands: vec![],
        };
        let json = serde_json::to_string(&status).unwrap();
        assert!(json.contains("\"trust\":\"verified\""));
        assert!(json.contains("\"auto_approve\":false"));
        assert!(json.contains("\"capability_tier\":\"read-only\""));
    }

    #[test]
    fn test_capability_tier_sandboxed() {
        use crate::plugin_system::capabilities::*;
        let caps = PluginCapabilities::none();
        let tier = if caps.is_subset_of(&PluginCapabilities::none()) {
            "sandboxed"
        } else if caps.is_subset_of(&PluginCapabilities::workspace_read()) {
            "read-only"
        } else if caps.is_subset_of(&PluginCapabilities::workspace_read_write()) {
            "read-write"
        } else {
            "full"
        };
        assert_eq!(tier, "sandboxed");
    }

    #[test]
    fn test_capability_tier_read_only() {
        use crate::plugin_system::capabilities::*;
        let caps = PluginCapabilities::workspace_read();
        let tier = if caps.is_subset_of(&PluginCapabilities::none()) {
            "sandboxed"
        } else if caps.is_subset_of(&PluginCapabilities::workspace_read()) {
            "read-only"
        } else if caps.is_subset_of(&PluginCapabilities::workspace_read_write()) {
            "read-write"
        } else {
            "full"
        };
        assert_eq!(tier, "read-only");
    }

    #[test]
    fn test_capability_tier_read_write() {
        use crate::plugin_system::capabilities::*;
        let caps = PluginCapabilities::workspace_read_write();
        let tier = if caps.is_subset_of(&PluginCapabilities::none()) {
            "sandboxed"
        } else if caps.is_subset_of(&PluginCapabilities::workspace_read()) {
            "read-only"
        } else if caps.is_subset_of(&PluginCapabilities::workspace_read_write()) {
            "read-write"
        } else {
            "full"
        };
        assert_eq!(tier, "read-write");
    }

    #[test]
    fn test_capability_tier_full() {
        use crate::plugin_system::capabilities::*;
        let caps = PluginCapabilities::first_party();
        let tier = if caps.is_subset_of(&PluginCapabilities::none()) {
            "sandboxed"
        } else if caps.is_subset_of(&PluginCapabilities::workspace_read()) {
            "read-only"
        } else if caps.is_subset_of(&PluginCapabilities::workspace_read_write()) {
            "read-write"
        } else {
            "full"
        };
        assert_eq!(tier, "full");
    }

    #[test]
    fn test_plugin_status_local_trust_no_loaded_at() {
        use crate::plugin_system::capabilities::*;
        use crate::plugin_system::trust::TrustLevel;
        let status = PluginStatus {
            id: "dev-plugin".to_string(),
            name: "Dev Plugin".to_string(),
            version: "0.0.1".to_string(),
            state: PluginState::Loaded,
            capabilities: PluginCapabilities::default(),
            error: None,
            trust: TrustLevel::Local,
            loaded_at: None,
            auto_approve: false,
            capability_tier: "sandboxed".to_string(),
            commands: vec![],
        };
        let json = serde_json::to_string(&status).unwrap();
        assert!(json.contains("\"trust\":\"local\""));
        assert!(json.contains("\"loaded_at\":null"));
    }

    #[test]
    fn test_manager_error_plugin_not_loaded() {
        let err = ManagerError::PluginNotLoaded("missing-plugin".to_string());
        assert!(err.to_string().contains("missing-plugin"));
    }
}
