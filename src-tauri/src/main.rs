// src-tauri/src/main.rs

// Prevent console window on Windows in release mode
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

#[allow(dead_code)]
mod plugin_system;

use plugin_system::{
    api::{
        AuditLogger, FileWatcherRegistry, clear_audit_logs, get_audit_logs,
        plugin_add_status_bar_item, plugin_emit_event, plugin_execute_command,
        plugin_execute_hook, plugin_fetch, plugin_get_active_file,
        plugin_get_editor_content, plugin_hide_panel, plugin_list_directory,
        plugin_read_file, plugin_register_event, plugin_remove_status_bar_item,
        plugin_set_editor_content, plugin_show_notification, plugin_show_panel,
        plugin_unwatch_path, plugin_watch_path, plugin_write_file,
    },
    manager::PluginManager,
    sandbox::SandboxRegistry,
};
use std::sync::Arc;
use tauri::{AppHandle, Emitter, Manager, State};
use tokio::sync::RwLock;

// ============================================================================
// STATE INITIALIZATION
// ============================================================================

// AppState will be used when we add app-level state beyond Tauri managed state
#[allow(dead_code)]
struct AppState {
    plugin_manager: Arc<RwLock<PluginManager>>,
    sandbox_registry: Arc<SandboxRegistry>,
    audit_logger: Arc<AuditLogger>,
}

// ============================================================================
// PLUGIN MANAGEMENT COMMANDS
// ============================================================================

#[tauri::command]
async fn discover_plugins(
    state: State<'_, Arc<RwLock<PluginManager>>>,
) -> Result<Vec<String>, String> {
    let mut manager = state.write().await;
    manager.discover().map_err(|e| e.to_string())
}

#[tauri::command]
async fn load_plugin(
    plugin_id: String,
    state: State<'_, Arc<RwLock<PluginManager>>>,
) -> Result<(), String> {
    let mut manager = state.write().await;
    manager.load(&plugin_id).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
async fn activate_plugin(
    plugin_id: String,
    state: State<'_, Arc<RwLock<PluginManager>>>,
) -> Result<(), String> {
    let mut manager = state.write().await;
    manager.activate(&plugin_id).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn deactivate_plugin(
    plugin_id: String,
    state: State<'_, Arc<RwLock<PluginManager>>>,
) -> Result<(), String> {
    let mut manager = state.write().await;
    manager
        .deactivate(&plugin_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn reload_plugin(
    plugin_id: String,
    state: State<'_, Arc<RwLock<PluginManager>>>,
) -> Result<(), String> {
    let mut manager = state.write().await;
    manager.reload(&plugin_id).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_plugin_status(
    plugin_id: String,
    state: State<'_, Arc<RwLock<PluginManager>>>,
) -> Result<serde_json::Value, String> {
    let manager = state.read().await;
    let status = manager
        .get_status(&plugin_id)
        .ok_or_else(|| format!("Plugin not found: {}", plugin_id))?;
    serde_json::to_value(status).map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_all_plugin_statuses(
    state: State<'_, Arc<RwLock<PluginManager>>>,
) -> Result<Vec<serde_json::Value>, String> {
    let manager = state.read().await;
    let statuses = manager.get_all_statuses();
    statuses
        .into_iter()
        .map(|s| serde_json::to_value(s).map_err(|e| e.to_string()))
        .collect()
}

// ============================================================================
// NATIVE FILE OPERATIONS
// ============================================================================

#[tauri::command]
async fn read_file(path: String) -> Result<String, String> {
    tokio::fs::read_to_string(&path)
        .await
        .map_err(|e| format!("Failed to read '{}': {}", path, e))
}

#[tauri::command]
async fn write_file(path: String, content: String) -> Result<(), String> {
    // Ensure parent directory exists
    if let Some(parent) = std::path::Path::new(&path).parent() {
        tokio::fs::create_dir_all(parent)
            .await
            .map_err(|e| format!("Failed to create directory: {}", e))?;
    }
    tokio::fs::write(&path, &content)
        .await
        .map_err(|e| format!("Failed to write '{}': {}", path, e))
}

#[tauri::command]
async fn save_file(path: String, content: String) -> Result<(), String> {
    write_file(path, content).await
}

#[tauri::command]
async fn emit_editor_event(
    event: String,
    data: serde_json::Value,
    app: AppHandle,
) -> Result<(), String> {
    app.emit(&event, data)
        .map_err(|e| format!("Failed to emit event '{}': {}", event, e))
}

#[derive(serde::Serialize)]
struct FileMetadata {
    modified: u64,
    size: u64,
    is_file: bool,
    is_dir: bool,
}

#[tauri::command]
async fn get_file_metadata(path: String) -> Result<FileMetadata, String> {
    let metadata = tokio::fs::metadata(&path)
        .await
        .map_err(|e| format!("Failed to get metadata for '{}': {}", path, e))?;

    let modified = metadata
        .modified()
        .map_err(|e| format!("Failed to get modification time: {}", e))?
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();

    Ok(FileMetadata {
        modified,
        size: metadata.len(),
        is_file: metadata.is_file(),
        is_dir: metadata.is_dir(),
    })
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            // Resolve plugins directory:
            // In development, use project root's plugins/ directory
            // In production, use resource_dir or app_data_dir
            let plugins_dir = if cfg!(debug_assertions) {
                // Development: project root is parent of src-tauri/
                let manifest_dir = std::path::PathBuf::from(env!("CARGO_MANIFEST_DIR"));
                manifest_dir.parent().unwrap().join("plugins")
            } else {
                // Production: use app data directory
                let app_dir = app
                    .path()
                    .app_data_dir()
                    .expect("Failed to get app data directory");
                app_dir.join("plugins")
            };
            std::fs::create_dir_all(&plugins_dir)
                .expect("Failed to create plugins directory");

            // Determine workspace root (project root in dev, app data in release)
            let workspace_root = if cfg!(debug_assertions) {
                let manifest_dir = std::path::PathBuf::from(env!("CARGO_MANIFEST_DIR"));
                manifest_dir.parent().unwrap().to_path_buf()
            } else {
                app.path()
                    .app_data_dir()
                    .expect("Failed to get app data directory")
            };

            // Initialize plugin system
            let sandbox_registry = Arc::new(SandboxRegistry::new());
            let plugin_manager = Arc::new(RwLock::new(PluginManager::new(
                plugins_dir,
                sandbox_registry.clone(),
                workspace_root,
                app.handle().clone(),
            )));
            let audit_logger = Arc::new(AuditLogger::new(10000));
            let watcher_registry = Arc::new(FileWatcherRegistry::new());

            // Store state
            app.manage(plugin_manager.clone());
            app.manage(sandbox_registry.clone());
            app.manage(audit_logger.clone());
            app.manage(watcher_registry.clone());

            // Auto-discover and load plugins
            tauri::async_runtime::spawn(async move {
                let mut manager = plugin_manager.write().await;
                
                if let Ok(plugins) = manager.discover() {
                    println!("Discovered {} plugins", plugins.len());
                    
                    for plugin_id in plugins {
                        // Load plugin
                        if let Err(e) = manager.load(&plugin_id) {
                            eprintln!("Failed to load plugin {}: {}", plugin_id, e);
                            continue;
                        }
                        println!("  Loaded plugin: {}", plugin_id);

                        // Auto-activate first-party plugins
                        if let Some(info) = manager.loader().get(&plugin_id) {
                            if matches!(
                                info.manifest.trust,
                                plugin_system::trust::TrustLevel::FirstParty
                            ) {
                                match manager.activate(&plugin_id).await {
                                    Ok(()) => println!("  Activated plugin: {} (first-party)", plugin_id),
                                    Err(e) => eprintln!("  Failed to activate plugin {}: {}", plugin_id, e),
                                }
                            }
                        }
                    }
                }
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Native file operations
            read_file,
            write_file,
            save_file,
            get_file_metadata,
            emit_editor_event,
            // Plugin management
            discover_plugins,
            load_plugin,
            activate_plugin,
            deactivate_plugin,
            reload_plugin,
            get_plugin_status,
            get_all_plugin_statuses,
            // Filesystem operations
            plugin_read_file,
            plugin_write_file,
            plugin_list_directory,
            plugin_watch_path,
            plugin_unwatch_path,
            // Network operations
            plugin_fetch,
            // Command execution
            plugin_execute_command,
            // UI operations
            plugin_show_notification,
            plugin_add_status_bar_item,
            plugin_remove_status_bar_item,
            plugin_show_panel,
            plugin_hide_panel,
            // Editor operations
            plugin_get_editor_content,
            plugin_set_editor_content,
            plugin_get_active_file,
            // Event system
            plugin_register_event,
            plugin_emit_event,
            // Plugin hooks
            plugin_execute_hook,
            // Audit logs
            get_audit_logs,
            clear_audit_logs,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}