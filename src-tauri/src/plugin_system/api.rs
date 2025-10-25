// src-tauri/src/plugin_system/api.rs

use crate::plugin_system::{
    capabilities::{
        CommandCapability, FilesystemCapability, NetworkCapability, PluginCapabilities,
        UiCapability,
    },
    manager::PluginManager,
    sandbox::{PluginSandbox, SandboxRegistry},
};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::time::SystemTime;
use tauri::{AppHandle, Manager, State, Window};
use tokio::sync::RwLock;

// ============================================================================
// AUDIT LOGGING
// ============================================================================

/// Audit event for tracking plugin operations
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuditEvent {
    pub plugin_id: String,
    pub operation: String,
    pub resource: String,
    pub timestamp: SystemTime,
    pub success: bool,
    pub error: Option<String>,
}

/// Audit logger for tracking plugin operations
pub struct AuditLogger {
    events: Arc<RwLock<Vec<AuditEvent>>>,
    max_events: usize,
}

impl AuditLogger {
    pub fn new(max_events: usize) -> Self {
        Self {
            events: Arc::new(RwLock::new(Vec::new())),
            max_events,
        }
    }

    pub async fn log(&self, event: AuditEvent) {
        let mut events = self.events.write().await;
        
        // Rotate logs if exceeding max
        if events.len() >= self.max_events {
            events.remove(0);
        }
        
        events.push(event.clone());
        
        // Also log to console in debug mode
        #[cfg(debug_assertions)]
        println!(
            "[AUDIT] Plugin: {}, Op: {}, Resource: {}, Success: {}",
            event.plugin_id, event.operation, event.resource, event.success
        );
    }

    pub async fn get_events(&self) -> Vec<AuditEvent> {
        self.events.read().await.clone()
    }

    pub async fn get_events_for_plugin(&self, plugin_id: &str) -> Vec<AuditEvent> {
        self.events
            .read()
            .await
            .iter()
            .filter(|e| e.plugin_id == plugin_id)
            .cloned()
            .collect()
    }

    pub async fn clear(&self) {
        self.events.write().await.clear();
    }
}

// ============================================================================
// ERROR TYPES
// ============================================================================

#[derive(Debug, Clone, Serialize, thiserror::Error)]
pub enum ApiError {
    #[error("Permission denied: {operation} requires {capability}")]
    PermissionDenied {
        operation: String,
        capability: String,
    },

    #[error("Invalid path: {path}")]
    InvalidPath { path: String },

    #[error("Path not allowed: {path}")]
    PathNotAllowed { path: String },

    #[error("Domain not allowed: {domain}")]
    DomainNotAllowed { domain: String },

    #[error("Command not allowed: {command}")]
    CommandNotAllowed { command: String },

    #[error("Plugin not found: {plugin_id}")]
    PluginNotFound { plugin_id: String },

    #[error("File operation failed: {0}")]
    FileError(String),

    #[error("Network operation failed: {0}")]
    NetworkError(String),

    #[error("Command execution failed: {0}")]
    CommandError(String),

    #[error("UI operation failed: {0}")]
    UiError(String),

    #[error("Serialization failed: {0}")]
    SerializationError(String),

    #[error("Internal error: {0}")]
    InternalError(String),
}

impl From<std::io::Error> for ApiError {
    fn from(err: std::io::Error) -> Self {
        ApiError::FileError(err.to_string())
    }
}

impl From<serde_json::Error> for ApiError {
    fn from(err: serde_json::Error) -> Self {
        ApiError::SerializationError(err.to_string())
    }
}

// ============================================================================
// CAPABILITY VALIDATION HELPERS
// ============================================================================

/// Get plugin capabilities
async fn get_plugin_capabilities(
    plugin_id: &str,
    manager: &State<'_, Arc<RwLock<PluginManager>>>,
) -> Result<PluginCapabilities, ApiError> {
    let manager = manager.read().await;
    manager
        .get_plugin_capabilities(plugin_id)
        .ok_or_else(|| ApiError::PluginNotFound {
            plugin_id: plugin_id.to_string(),
        })
}

/// Validate filesystem read permission
fn validate_fs_read(
    capabilities: &PluginCapabilities,
    path: &Path,
    workspace_root: &Path,
) -> Result<(), ApiError> {
    match &capabilities.filesystem {
        FilesystemCapability::None => Err(ApiError::PermissionDenied {
            operation: "read".to_string(),
            capability: "filesystem read".to_string(),
        }),
        FilesystemCapability::WorkspaceRead | FilesystemCapability::WorkspaceReadWrite => {
            if path.starts_with(workspace_root) {
                Ok(())
            } else {
                Err(ApiError::PathNotAllowed {
                    path: path.display().to_string(),
                })
            }
        }
        FilesystemCapability::Scoped { read, .. } => {
            if read.iter().any(|allowed| path.starts_with(allowed)) {
                Ok(())
            } else {
                Err(ApiError::PathNotAllowed {
                    path: path.display().to_string(),
                })
            }
        }
    }
}

/// Validate filesystem write permission
fn validate_fs_write(
    capabilities: &PluginCapabilities,
    path: &Path,
    workspace_root: &Path,
) -> Result<(), ApiError> {
    match &capabilities.filesystem {
        FilesystemCapability::None | FilesystemCapability::WorkspaceRead => {
            Err(ApiError::PermissionDenied {
                operation: "write".to_string(),
                capability: "filesystem write".to_string(),
            })
        }
        FilesystemCapability::WorkspaceReadWrite => {
            if path.starts_with(workspace_root) {
                Ok(())
            } else {
                Err(ApiError::PathNotAllowed {
                    path: path.display().to_string(),
                })
            }
        }
        FilesystemCapability::Scoped { write, .. } => {
            if write.iter().any(|allowed| path.starts_with(allowed)) {
                Ok(())
            } else {
                Err(ApiError::PathNotAllowed {
                    path: path.display().to_string(),
                })
            }
        }
    }
}

/// Validate network permission
fn validate_network(
    capabilities: &PluginCapabilities,
    url: &str,
) -> Result<(), ApiError> {
    match &capabilities.network {
        NetworkCapability::None => Err(ApiError::PermissionDenied {
            operation: "network request".to_string(),
            capability: "network access".to_string(),
        }),
        NetworkCapability::DomainAllowlist(domains) => {
            let url_parsed = url::Url::parse(url).map_err(|e| ApiError::NetworkError(e.to_string()))?;
            let domain = url_parsed
                .host_str()
                .ok_or_else(|| ApiError::NetworkError("Invalid URL".to_string()))?;

            if domains.contains(domain) {
                Ok(())
            } else {
                Err(ApiError::DomainNotAllowed {
                    domain: domain.to_string(),
                })
            }
        }
        NetworkCapability::Unrestricted => Ok(()),
    }
}

/// Validate command execution permission
fn validate_command(
    capabilities: &PluginCapabilities,
    command: &str,
) -> Result<(), ApiError> {
    if capabilities.commands.allowlist.contains(command) {
        Ok(())
    } else {
        Err(ApiError::CommandNotAllowed {
            command: command.to_string(),
        })
    }
}

/// Validate UI permission
fn validate_ui(capabilities: &PluginCapabilities, operation: &str) -> Result<(), ApiError> {
    let allowed = match operation {
        "status_bar" => capabilities.ui.status_bar,
        "sidebar" => capabilities.ui.sidebar,
        "notification" => capabilities.ui.notifications,
        "webview" => capabilities.ui.webview,
        _ => false,
    };

    if allowed {
        Ok(())
    } else {
        Err(ApiError::PermissionDenied {
            operation: operation.to_string(),
            capability: format!("UI {}", operation),
        })
    }
}

// ============================================================================
// FILESYSTEM COMMANDS
// ============================================================================

#[derive(Debug, Deserialize)]
pub struct ReadFileParams {
    plugin_id: String,
    path: String,
}

#[tauri::command]
pub async fn plugin_read_file(
    params: ReadFileParams,
    manager: State<'_, Arc<RwLock<PluginManager>>>,
    audit: State<'_, Arc<AuditLogger>>,
    app: AppHandle,
) -> Result<String, ApiError> {
    let start_time = SystemTime::now();
    let path = PathBuf::from(&params.path)
        .canonicalize()
        .map_err(|_| ApiError::InvalidPath {
            path: params.path.clone(),
        })?;

    // Get workspace root
    let workspace_root = app
        .path_resolver()
        .app_data_dir()
        .ok_or_else(|| ApiError::InternalError("Failed to get workspace root".to_string()))?;

    // Get capabilities
    let capabilities = get_plugin_capabilities(&params.plugin_id, &manager).await?;

    // Validate permission
    validate_fs_read(&capabilities, &path, &workspace_root)?;

    // Perform operation
    let result = tokio::fs::read_to_string(&path).await;

    // Audit log
    audit
        .log(AuditEvent {
            plugin_id: params.plugin_id.clone(),
            operation: "fs.read".to_string(),
            resource: path.display().to_string(),
            timestamp: start_time,
            success: result.is_ok(),
            error: result.as_ref().err().map(|e| e.to_string()),
        })
        .await;

    result.map_err(|e| ApiError::FileError(e.to_string()))
}

#[derive(Debug, Deserialize)]
pub struct WriteFileParams {
    plugin_id: String,
    path: String,
    content: String,
}

#[tauri::command]
pub async fn plugin_write_file(
    params: WriteFileParams,
    manager: State<'_, Arc<RwLock<PluginManager>>>,
    audit: State<'_, Arc<AuditLogger>>,
    app: AppHandle,
) -> Result<(), ApiError> {
    let start_time = SystemTime::now();
    let path = PathBuf::from(&params.path);

    // Get workspace root
    let workspace_root = app
        .path_resolver()
        .app_data_dir()
        .ok_or_else(|| ApiError::InternalError("Failed to get workspace root".to_string()))?;

    // Get capabilities
    let capabilities = get_plugin_capabilities(&params.plugin_id, &manager).await?;

    // Validate permission
    validate_fs_write(&capabilities, &path, &workspace_root)?;

    // Perform operation
    let result = tokio::fs::write(&path, &params.content).await;

    // Audit log
    audit
        .log(AuditEvent {
            plugin_id: params.plugin_id.clone(),
            operation: "fs.write".to_string(),
            resource: path.display().to_string(),
            timestamp: start_time,
            success: result.is_ok(),
            error: result.as_ref().err().map(|e| e.to_string()),
        })
        .await;

    result.map_err(|e| ApiError::FileError(e.to_string()))
}

#[derive(Debug, Deserialize)]
pub struct ListDirectoryParams {
    plugin_id: String,
    path: String,
}

#[derive(Debug, Serialize)]
pub struct DirectoryEntry {
    name: String,
    path: String,
    is_dir: bool,
    size: u64,
    modified: Option<u64>,
}

#[tauri::command]
pub async fn plugin_list_directory(
    params: ListDirectoryParams,
    manager: State<'_, Arc<RwLock<PluginManager>>>,
    audit: State<'_, Arc<AuditLogger>>,
    app: AppHandle,
) -> Result<Vec<DirectoryEntry>, ApiError> {
    let start_time = SystemTime::now();
    let path = PathBuf::from(&params.path)
        .canonicalize()
        .map_err(|_| ApiError::InvalidPath {
            path: params.path.clone(),
        })?;

    // Get workspace root
    let workspace_root = app
        .path_resolver()
        .app_data_dir()
        .ok_or_else(|| ApiError::InternalError("Failed to get workspace root".to_string()))?;

    // Get capabilities
    let capabilities = get_plugin_capabilities(&params.plugin_id, &manager).await?;

    // Validate permission
    validate_fs_read(&capabilities, &path, &workspace_root)?;

    // Perform operation
    let mut entries = Vec::new();
    let mut read_dir = tokio::fs::read_dir(&path).await?;

    while let Some(entry) = read_dir.next_entry().await? {
        let metadata = entry.metadata().await?;
        let modified = metadata
            .modified()
            .ok()
            .and_then(|t| t.duration_since(SystemTime::UNIX_EPOCH).ok())
            .map(|d| d.as_secs());

        entries.push(DirectoryEntry {
            name: entry.file_name().to_string_lossy().to_string(),
            path: entry.path().display().to_string(),
            is_dir: metadata.is_dir(),
            size: metadata.len(),
            modified,
        });
    }

    // Audit log
    audit
        .log(AuditEvent {
            plugin_id: params.plugin_id.clone(),
            operation: "fs.list".to_string(),
            resource: path.display().to_string(),
            timestamp: start_time,
            success: true,
            error: None,
        })
        .await;

    Ok(entries)
}

#[derive(Debug, Deserialize)]
pub struct WatchPathParams {
    plugin_id: String,
    path: String,
}

#[tauri::command]
pub async fn plugin_watch_path(
    params: WatchPathParams,
    manager: State<'_, Arc<RwLock<PluginManager>>>,
    audit: State<'_, Arc<AuditLogger>>,
    app: AppHandle,
    window: Window,
) -> Result<String, ApiError> {
    let path = PathBuf::from(&params.path)
        .canonicalize()
        .map_err(|_| ApiError::InvalidPath {
            path: params.path.clone(),
        })?;

    // Get workspace root
    let workspace_root = app
        .path_resolver()
        .app_data_dir()
        .ok_or_else(|| ApiError::InternalError("Failed to get workspace root".to_string()))?;

    // Get capabilities
    let capabilities = get_plugin_capabilities(&params.plugin_id, &manager).await?;

    // Validate permission
    validate_fs_read(&capabilities, &path, &workspace_root)?;

    // Set up file watcher
    use notify::{RecommendedWatcher, RecursiveMode, Watcher};
    use std::sync::mpsc::channel;

    let (tx, rx) = channel();
    let mut watcher: RecommendedWatcher = Watcher::new(
        tx,
        notify::Config::default(),
    )
    .map_err(|e| ApiError::FileError(e.to_string()))?;

    watcher
        .watch(&path, RecursiveMode::Recursive)
        .map_err(|e| ApiError::FileError(e.to_string()))?;

    let watch_id = format!("watch_{}", uuid::Uuid::new_v4());
    let plugin_id_clone = params.plugin_id.clone();
    let window_clone = window.clone();

    // Spawn watcher task
    tokio::spawn(async move {
        while let Ok(event) = rx.recv() {
            if let Ok(event) = event {
                // Emit event to frontend
                let _ = window_clone.emit(
                    &format!("plugin:{}:file_change", plugin_id_clone),
                    event,
                );
            }
        }
    });

    // Audit log
    audit
        .log(AuditEvent {
            plugin_id: params.plugin_id.clone(),
            operation: "fs.watch".to_string(),
            resource: path.display().to_string(),
            timestamp: SystemTime::now(),
            success: true,
            error: None,
        })
        .await;

    Ok(watch_id)
}

// ============================================================================
// NETWORK COMMANDS
// ============================================================================

#[derive(Debug, Deserialize)]
pub struct FetchParams {
    plugin_id: String,
    url: String,
    method: Option<String>,
    headers: Option<HashMap<String, String>>,
    body: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct FetchResponse {
    status: u16,
    headers: HashMap<String, String>,
    body: String,
}

#[tauri::command]
pub async fn plugin_fetch(
    params: FetchParams,
    manager: State<'_, Arc<RwLock<PluginManager>>>,
    audit: State<'_, Arc<AuditLogger>>,
) -> Result<FetchResponse, ApiError> {
    let start_time = SystemTime::now();

    // Get capabilities
    let capabilities = get_plugin_capabilities(&params.plugin_id, &manager).await?;

    // Validate permission
    validate_network(&capabilities, &params.url)?;

    // Build request
    let client = reqwest::Client::new();
    let method = params
        .method
        .as_deref()
        .unwrap_or("GET")
        .parse::<reqwest::Method>()
        .map_err(|e| ApiError::NetworkError(e.to_string()))?;

    let mut request = client.request(method, &params.url);

    // Add headers
    if let Some(headers) = params.headers {
        for (key, value) in headers {
            request = request.header(&key, &value);
        }
    }

    // Add body
    if let Some(body) = params.body {
        request = request.body(body);
    }

    // Execute request
    let response = request
        .send()
        .await
        .map_err(|e| ApiError::NetworkError(e.to_string()))?;

    let status = response.status().as_u16();
    let headers = response
        .headers()
        .iter()
        .map(|(k, v)| (k.to_string(), v.to_str().unwrap_or("").to_string()))
        .collect();
    let body = response
        .text()
        .await
        .map_err(|e| ApiError::NetworkError(e.to_string()))?;

    // Audit log
    audit
        .log(AuditEvent {
            plugin_id: params.plugin_id.clone(),
            operation: "network.fetch".to_string(),
            resource: params.url.clone(),
            timestamp: start_time,
            success: true,
            error: None,
        })
        .await;

    Ok(FetchResponse {
        status,
        headers,
        body,
    })
}

// ============================================================================
// COMMAND EXECUTION
// ============================================================================

#[derive(Debug, Deserialize)]
pub struct ExecuteCommandParams {
    plugin_id: String,
    command: String,
    args: Vec<String>,
    cwd: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct CommandOutput {
    stdout: String,
    stderr: String,
    status: i32,
}

#[tauri::command]
pub async fn plugin_execute_command(
    params: ExecuteCommandParams,
    manager: State<'_, Arc<RwLock<PluginManager>>>,
    audit: State<'_, Arc<AuditLogger>>,
) -> Result<CommandOutput, ApiError> {
    let start_time = SystemTime::now();

    // Get capabilities
    let capabilities = get_plugin_capabilities(&params.plugin_id, &manager).await?;

    // Validate permission
    validate_command(&capabilities, &params.command)?;

    // Sanitize arguments (prevent injection)
    let sanitized_args: Vec<String> = params
        .args
        .iter()
        .map(|arg| {
            // Remove any shell metacharacters
            arg.replace(&['|', '&', ';', '>', '<', '`', '$', '\n', '\r'][..], "")
        })
        .collect();

    // Execute command
    let mut cmd = tokio::process::Command::new(&params.command);
    cmd.args(&sanitized_args);

    if let Some(cwd) = params.cwd {
        cmd.current_dir(cwd);
    }

    // Require confirmation if specified
    if capabilities.commands.require_confirmation {
        // This would trigger a UI dialog
        // For now, we'll skip this in the implementation
    }

    let output = cmd
        .output()
        .await
        .map_err(|e| ApiError::CommandError(e.to_string()))?;

    let result = CommandOutput {
        stdout: String::from_utf8_lossy(&output.stdout).to_string(),
        stderr: String::from_utf8_lossy(&output.stderr).to_string(),
        status: output.status.code().unwrap_or(-1),
    };

    // Audit log
    audit
        .log(AuditEvent {
            plugin_id: params.plugin_id.clone(),
            operation: "command.execute".to_string(),
            resource: format!("{} {:?}", params.command, sanitized_args),
            timestamp: start_time,
            success: output.status.success(),
            error: if !output.status.success() {
                Some(result.stderr.clone())
            } else {
                None
            },
        })
        .await;

    Ok(result)
}

// ============================================================================
// UI COMMANDS
// ============================================================================

#[derive(Debug, Deserialize)]
pub struct ShowNotificationParams {
    plugin_id: String,
    title: String,
    message: String,
    level: Option<String>, // "info", "warning", "error", "success"
}

#[tauri::command]
pub async fn plugin_show_notification(
    params: ShowNotificationParams,
    manager: State<'_, Arc<RwLock<PluginManager>>>,
    window: Window,
) -> Result<(), ApiError> {
    // Get capabilities
    let capabilities = get_plugin_capabilities(&params.plugin_id, &manager).await?;

    // Validate permission
    validate_ui(&capabilities, "notification")?;

    // Emit notification event to frontend
    window
        .emit(
            "plugin:notification",
            serde_json::json!({
                "plugin_id": params.plugin_id,
                "title": params.title,
                "message": params.message,
                "level": params.level.unwrap_or_else(|| "info".to_string()),
            }),
        )
        .map_err(|e| ApiError::UiError(e.to_string()))?;

    Ok(())
}

#[derive(Debug, Deserialize)]
pub struct AddStatusBarItemParams {
    plugin_id: String,
    id: String,
    text: String,
    tooltip: Option<String>,
    priority: Option<i32>,
}

#[tauri::command]
pub async fn plugin_add_status_bar_item(
    params: AddStatusBarItemParams,
    manager: State<'_, Arc<RwLock<PluginManager>>>,
    window: Window,
) -> Result<String, ApiError> {
    // Get capabilities
    let capabilities = get_plugin_capabilities(&params.plugin_id, &manager).await?;

    // Validate permission
    validate_ui(&capabilities, "status_bar")?;

    // Emit event to frontend
    window
        .emit(
            "plugin:status_bar:add",
            serde_json::json!({
                "plugin_id": params.plugin_id,
                "id": params.id,
                "text": params.text,
                "tooltip": params.tooltip,
                "priority": params.priority.unwrap_or(0),
            }),
        )
        .map_err(|e| ApiError::UiError(e.to_string()))?;

    Ok(params.id)
}

#[derive(Debug, Deserialize)]
pub struct RemoveStatusBarItemParams {
    plugin_id: String,
    id: String,
}

#[tauri::command]
pub async fn plugin_remove_status_bar_item(
    params: RemoveStatusBarItemParams,
    manager: State<'_, Arc<RwLock<PluginManager>>>,
    window: Window,
) -> Result<(), ApiError> {
    // Get capabilities
    let capabilities = get_plugin_capabilities(&params.plugin_id, &manager).await?;

    // Validate permission
    validate_ui(&capabilities, "status_bar")?;

    // Emit event to frontend
    window
        .emit(
            "plugin:status_bar:remove",
            serde_json::json!({
                "plugin_id": params.plugin_id,
                "id": params.id,
            }),
        )
        .map_err(|e| ApiError::UiError(e.to_string()))?;

    Ok(())
}

#[derive(Debug, Deserialize)]
pub struct ShowPanelParams {
    plugin_id: String,
    id: String,
    title: String,
    content: String, // HTML content
    position: Option<String>, // "sidebar", "bottom", "modal"
}

#[tauri::command]
pub async fn plugin_show_panel(
    params: ShowPanelParams,
    manager: State<'_, Arc<RwLock<PluginManager>>>,
    window: Window,
) -> Result<(), ApiError> {
    // Get capabilities
    let capabilities = get_plugin_capabilities(&params.plugin_id, &manager).await?;

    // Validate permission
    validate_ui(&capabilities, "sidebar")?;

    // Emit event to frontend
    window
        .emit(
            "plugin:panel:show",
            serde_json::json!({
                "plugin_id": params.plugin_id,
                "id": params.id,
                "title": params.title,
                "content": params.content,
                "position": params.position.unwrap_or_else(|| "sidebar".to_string()),
            }),
        )
        .map_err(|e| ApiError::UiError(e.to_string()))?;

    Ok(())
}

#[derive(Debug, Deserialize)]
pub struct HidePanelParams {
    plugin_id: String,
    id: String,
}

#[tauri::command]
pub async fn plugin_hide_panel(
    params: HidePanelParams,
    manager: State<'_, Arc<RwLock<PluginManager>>>,
    window: Window,
) -> Result<(), ApiError> {
    // Get capabilities
    let capabilities = get_plugin_capabilities(&params.plugin_id, &manager).await?;

    // Validate permission
    validate_ui(&capabilities, "sidebar")?;

    // Emit event to frontend
    window
        .emit(
            "plugin:panel:hide",
            serde_json::json!({
                "plugin_id": params.plugin_id,
                "id": params.id,
            }),
        )
        .map_err(|e| ApiError::UiError(e.to_string()))?;

    Ok(())
}

// ============================================================================
// EDITOR COMMANDS
// ============================================================================

#[derive(Debug, Deserialize)]
pub struct GetEditorContentParams {
    plugin_id: String,
}

#[tauri::command]
pub async fn plugin_get_editor_content(
    params: GetEditorContentParams,
    manager: State<'_, Arc<RwLock<PluginManager>>>,
    window: Window,
) -> Result<String, ApiError> {
    // Get capabilities
    let _capabilities = get_plugin_capabilities(&params.plugin_id, &manager).await?;

    // Request content from frontend
    // This is a synchronous operation that waits for response
    let content = window
        .emit_and_wait("plugin:editor:get_content", ())
        .await
        .map_err(|e| ApiError::InternalError(e.to_string()))?;

    Ok(content)
}

#[derive(Debug, Deserialize)]
pub struct SetEditorContentParams {
    plugin_id: String,
    content: String,
}

#[tauri::command]
pub async fn plugin_set_editor_content(
    params: SetEditorContentParams,
    manager: State<'_, Arc<RwLock<PluginManager>>>,
    window: Window,
) -> Result<(), ApiError> {
    // Get capabilities
    let _capabilities = get_plugin_capabilities(&params.plugin_id, &manager).await?;

    // Send content to frontend
    window
        .emit(
            "plugin:editor:set_content",
            serde_json::json!({
                "content": params.content,
            }),
        )
        .map_err(|e| ApiError::UiError(e.to_string()))?;

    Ok(())
}

#[derive(Debug, Deserialize)]
pub struct GetActiveFileParams {
    plugin_id: String,
}

#[derive(Debug, Serialize)]
pub struct FileInfo {
    path: String,
    language: Option<String>,
    is_dirty: bool,
}

#[tauri::command]
pub async fn plugin_get_active_file(
    params: GetActiveFileParams,
    manager: State<'_, Arc<RwLock<PluginManager>>>,
    window: Window,
) -> Result<Option<FileInfo>, ApiError> {
    // Get capabilities
    let _capabilities = get_plugin_capabilities(&params.plugin_id, &manager).await?;

    // Request from frontend
    let file_info = window
        .emit_and_wait("plugin:editor:get_active_file", ())
        .await
        .map_err(|e| ApiError::InternalError(e.to_string()))?;

    Ok(file_info)
}

// ============================================================================
// EVENT COMMANDS
// ============================================================================

#[derive(Debug, Deserialize)]
pub struct RegisterEventParams {
    plugin_id: String,
    event_name: String,
}

#[tauri::command]
pub async fn plugin_register_event(
    params: RegisterEventParams,
    manager: State<'_, Arc<RwLock<PluginManager>>>,
) -> Result<(), ApiError> {
    // Get capabilities
    let _capabilities = get_plugin_capabilities(&params.plugin_id, &manager).await?;

    // Register event listener in plugin manager
    let mut manager = manager.write().await;
    manager.register_event_listener(&params.plugin_id, &params.event_name);

    Ok(())
}

#[derive(Debug, Deserialize)]
pub struct EmitEventParams {
    plugin_id: String,
    event_name: String,
    data: serde_json::Value,
}

#[tauri::command]
pub async fn plugin_emit_event(
    params: EmitEventParams,
    manager: State<'_, Arc<RwLock<PluginManager>>>,
    window: Window,
) -> Result<(), ApiError> {
    // Get capabilities
    let _capabilities = get_plugin_capabilities(&params.plugin_id, &manager).await?;

    // Emit event
    window
        .emit(
            &format!("plugin:{}:{}", params.plugin_id, params.event_name),
            params.data,
        )
        .map_err(|e| ApiError::InternalError(e.to_string()))?;

    Ok(())
}

// ============================================================================
// PLUGIN HOOK EXECUTION
// ============================================================================

#[derive(Debug, Deserialize)]
pub struct ExecuteHookParams {
    plugin_id: String,
    hook_name: String,
    data: serde_json::Value,
}

#[tauri::command]
pub async fn plugin_execute_hook(
    params: ExecuteHookParams,
    registry: State<'_, Arc<SandboxRegistry>>,
    audit: State<'_, Arc<AuditLogger>>,
) -> Result<serde_json::Value, ApiError> {
    let start_time = SystemTime::now();

    // Get sandbox
    let sandbox = registry
        .get(&params.plugin_id)
        .await
        .ok_or_else(|| ApiError::PluginNotFound {
            plugin_id: params.plugin_id.clone(),
        })?;

    // Execute hook
    let mut sandbox = sandbox.write().await;
    let result = sandbox
        .call_hook(&params.hook_name, vec![params.data.clone()])
        .await;

    // Audit log
    audit
        .log(AuditEvent {
            plugin_id: params.plugin_id.clone(),
            operation: format!("hook.{}", params.hook_name),
            resource: "plugin_hook".to_string(),
            timestamp: start_time,
            success: result.is_ok(),
            error: result.as_ref().err().map(|e| e.to_string()),
        })
        .await;

    result.map_err(|e| ApiError::InternalError(e.to_string()))
}

// ============================================================================
// AUDIT LOG COMMANDS
// ============================================================================

#[derive(Debug, Deserialize)]
pub struct GetAuditLogsParams {
    plugin_id: Option<String>,
}

#[tauri::command]
pub async fn get_audit_logs(
    params: GetAuditLogsParams,
    audit: State<'_, Arc<AuditLogger>>,
) -> Result<Vec<AuditEvent>, ApiError> {
    if let Some(plugin_id) = params.plugin_id {
        Ok(audit.get_events_for_plugin(&plugin_id).await)
    } else {
        Ok(audit.get_events().await)
    }
}

#[tauri::command]
pub async fn clear_audit_logs(audit: State<'_, Arc<AuditLogger>>) -> Result<(), ApiError> {
    audit.clear().await;
    Ok(())
}

// ============================================================================
// HELPER: Extension trait for Window to add emit_and_wait
// ============================================================================

use async_trait::async_trait;

#[async_trait]
trait WindowExt {
    async fn emit_and_wait<R: serde::de::DeserializeOwned>(
        &self,
        event: &str,
        payload: impl Serialize + Send,
    ) -> Result<R, tauri::Error>;
}

#[async_trait]
impl WindowExt for Window {
    async fn emit_and_wait<R: serde::de::DeserializeOwned>(
        &self,
        event: &str,
        payload: impl Serialize + Send,
    ) -> Result<R, tauri::Error> {
        // Create response channel
        let (tx, rx) = tokio::sync::oneshot::channel();
        let response_event = format!("{}_response", event);

        // Listen for response
        let unlisten = self.once(&response_event, move |event| {
            if let Some(payload) = event.payload() {
                let _ = tx.send(payload.to_string());
            }
        })?;

        // Emit request
        self.emit(event, payload)?;

        // Wait for response with timeout
        let response = tokio::time::timeout(std::time::Duration::from_secs(5), rx)
            .await
            .map_err(|_| tauri::Error::FailedToReceiveMessage)?
            .map_err(|_| tauri::Error::FailedToReceiveMessage)?;

        // Parse response
        serde_json::from_str(&response).map_err(|e| tauri::Error::InvalidArgs(e.to_string()))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_validate_fs_read() {
        let workspace = PathBuf::from("/workspace");
        let capabilities = PluginCapabilities {
            filesystem: FilesystemCapability::WorkspaceRead,
            ..Default::default()
        };

        // Should allow reading from workspace
        assert!(validate_fs_read(
            &capabilities,
            &workspace.join("file.txt"),
            &workspace
        )
        .is_ok());

        // Should deny reading from outside workspace
        assert!(validate_fs_read(&capabilities, &PathBuf::from("/etc/passwd"), &workspace).is_err());
    }

    #[test]
    fn test_validate_network() {
        let capabilities = PluginCapabilities {
            network: NetworkCapability::DomainAllowlist(
                vec!["api.example.com".to_string()].into_iter().collect()
            ),
            ..Default::default()
        };

        // Should allow allowlisted domain
        assert!(validate_network(&capabilities, "https://api.example.com/data").is_ok());

        // Should deny other domains
        assert!(validate_network(&capabilities, "https://evil.com/data").is_err());
    }

    #[test]
    fn test_validate_command() {
        let capabilities = PluginCapabilities {
            commands: CommandCapability {
                allowlist: vec!["git".to_string()].into_iter().collect(),
                require_confirmation: false,
            },
            ..Default::default()
        };

        // Should allow allowlisted command
        assert!(validate_command(&capabilities, "git").is_ok());

        // Should deny other commands
        assert!(validate_command(&capabilities, "rm").is_err());
    }
}