// src-tauri/src/main.rs

// Prevent console window on Windows in release mode
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod plugin_system;

use plugin_system::{
    api::{
        AuditLogger, clear_audit_logs, get_audit_logs, plugin_add_status_bar_item,
        plugin_emit_event, plugin_execute_command, plugin_execute_hook, plugin_fetch,
        plugin_get_active_file, plugin_get_editor_content, plugin_hide_panel,
        plugin_list_directory, plugin_read_file, plugin_register_event,
        plugin_remove_status_bar_item, plugin_set_editor_content, plugin_show_notification,
        plugin_show_panel, plugin_watch_path, plugin_write_file,
    },
    manager::PluginManager,
    sandbox::SandboxRegistry,
};
use std::path::PathBuf;
use std::sync::Arc;
use tauri::{Manager, State};
use tokio::sync::RwLock;

// ============================================================================
// STATE INITIALIZATION
// ============================================================================

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
// MAIN FUNCTION
// ============================================================================

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            // Get app data directory
            let app_dir = app
                .path()
                .app_data_dir()
                .expect("Failed to get app data directory");

            // Create plugins directory
            let plugins_dir = app_dir.join("plugins");
            std::fs::create_dir_all(&plugins_dir)
                .expect("Failed to create plugins directory");

            // Initialize plugin system
            let sandbox_registry = Arc::new(SandboxRegistry::new());
            let plugin_manager = Arc::new(RwLock::new(PluginManager::new(
                plugins_dir,
                sandbox_registry.clone(),
            )));
            let audit_logger = Arc::new(AuditLogger::new(10000));

            // Store state
            app.manage(plugin_manager.clone());
            app.manage(sandbox_registry.clone());
            app.manage(audit_logger.clone());

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

                        // Auto-activate first-party plugins
                        if let Some(info) = manager.loader().get(&plugin_id) {
                            if matches!(
                                info.manifest.trust,
                                plugin_system::trust::TrustLevel::FirstParty
                            ) {
                                if let Err(e) = manager.activate(&plugin_id).await {
                                    eprintln!("Failed to activate plugin {}: {}", plugin_id, e);
                                }
                            }
                        }
                    }
                }
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
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