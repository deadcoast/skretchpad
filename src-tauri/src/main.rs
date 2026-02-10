// src-tauri/src/main.rs

// Prevent console window on Windows in release mode
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

#[allow(dead_code)]
mod git;
mod plugin_system;
mod theme_engine;

use plugin_system::{
    api::{
        clear_audit_logs, get_audit_logs, plugin_add_status_bar_item, plugin_emit_event,
        plugin_execute_command, plugin_execute_hook, plugin_fetch, plugin_get_active_file,
        plugin_get_editor_content, plugin_hide_panel, plugin_list_directory, plugin_read_file,
        plugin_register_event, plugin_remove_status_bar_item, plugin_set_editor_content,
        plugin_show_notification, plugin_show_panel, plugin_unwatch_path, plugin_watch_path,
        plugin_write_file, AuditLogger, FileWatcherRegistry,
    },
    capabilities::PluginCapabilities,
    manager::PluginManager,
    ops::EditorStateHandle,
    sandbox::SandboxRegistry,
    trust::TrustVerifier,
    worker::WorkerRegistry,
};
use std::collections::HashMap;
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
    verifier: State<'_, Arc<RwLock<TrustVerifier>>>,
    worker_registry: State<'_, Arc<RwLock<WorkerRegistry>>>,
) -> Result<(), String> {
    // Trust verification before activation
    {
        let manager = state.read().await;
        if let Some(info) = manager.loader().get(&plugin_id) {
            if info.manifest.trust.requires_signature() {
                if let Some(ref sig) = info.manifest.signature {
                    let v = verifier.read().await;
                    if !v.verify_signature(sig) {
                        return Err(format!(
                            "Plugin '{}' requires a trusted signature but verification failed",
                            plugin_id
                        ));
                    }
                } else {
                    return Err(format!(
                        "Plugin '{}' requires a signature but none was provided",
                        plugin_id
                    ));
                }
            }
        } else {
            return Err(format!("Plugin not loaded: {}", plugin_id));
        }
    }

    // Clean up old worker if exists (from previous activation)
    {
        let mut wr = worker_registry.write().await;
        let _ = wr.remove_worker(&plugin_id);
    }

    let mut manager = state.write().await;
    manager
        .activate(&plugin_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn deactivate_plugin(
    plugin_id: String,
    state: State<'_, Arc<RwLock<PluginManager>>>,
    worker_registry: State<'_, Arc<RwLock<WorkerRegistry>>>,
) -> Result<(), String> {
    let mut manager = state.write().await;
    manager
        .deactivate(&plugin_id)
        .await
        .map_err(|e| e.to_string())?;

    // Clean up worker tracking
    let mut wr = worker_registry.write().await;
    let _ = wr.remove_worker(&plugin_id);

    Ok(())
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
    // Cross-check with sandbox registry for active sandbox count
    let active_sandboxes = manager.sandbox_registry().list_sandboxes().await;
    println!(
        "[plugin] Status check: {} active sandboxes",
        active_sandboxes.len()
    );

    let statuses = manager.get_all_statuses();
    statuses
        .into_iter()
        .map(|s| serde_json::to_value(s).map_err(|e| e.to_string()))
        .collect()
}

// ============================================================================
// NEW PLUGIN SYSTEM COMMANDS (v0.0.11)
// ============================================================================

#[tauri::command]
async fn unload_plugin(
    plugin_id: String,
    state: State<'_, Arc<RwLock<PluginManager>>>,
) -> Result<(), String> {
    let mut manager = state.write().await;
    manager.unload(&plugin_id).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_plugin_event_listeners(
    event_name: String,
    state: State<'_, Arc<RwLock<PluginManager>>>,
) -> Result<Vec<String>, String> {
    let manager = state.read().await;
    Ok(manager.get_event_listeners(&event_name))
}

#[tauri::command]
async fn get_file_watcher_count(
    watcher_registry: State<'_, Arc<FileWatcherRegistry>>,
) -> Result<usize, String> {
    Ok(watcher_registry.count().await)
}

#[tauri::command]
async fn list_active_sandboxes(
    registry: State<'_, Arc<SandboxRegistry>>,
) -> Result<Vec<String>, String> {
    Ok(registry.list_sandboxes().await)
}

#[tauri::command]
async fn get_plugin_resource_stats(
    plugin_id: String,
    registry: State<'_, Arc<SandboxRegistry>>,
) -> Result<serde_json::Value, String> {
    let sandbox = registry
        .get_sandbox(&plugin_id)
        .await
        .ok_or_else(|| format!("No active sandbox for plugin: {}", plugin_id))?;

    let sandbox = sandbox.read().await;

    // Use sandbox getters for metadata
    let sandbox_id = sandbox.id().to_string();
    let caps = sandbox.capabilities().clone();
    let limits = sandbox.resource_limits().clone();

    // Check limits (will error if exceeded)
    sandbox.check_resource_limits().map_err(|e| e.to_string())?;

    let stats = sandbox.get_resource_stats();
    serde_json::to_value(serde_json::json!({
        "sandbox_id": sandbox_id,
        "capabilities": caps,
        "limits": {
            "max_memory": limits.max_memory,
            "max_cpu_time_ms": limits.max_cpu_time.as_millis() as u64,
            "max_operations": limits.max_operations,
        },
        "stats": stats,
    }))
    .map_err(|e| e.to_string())
}

#[tauri::command]
async fn grant_plugin_capability(
    plugin_id: String,
    domain: Option<String>,
    allow_command: Option<String>,
    disallow_command: Option<String>,
    ui_preset: Option<String>,
    state: State<'_, Arc<RwLock<PluginManager>>>,
) -> Result<serde_json::Value, String> {
    let mut manager = state.write().await;
    let mut caps = manager
        .get_plugin_capabilities(&plugin_id)
        .ok_or_else(|| format!("Plugin not found: {}", plugin_id))?;

    // Apply domain addition
    if let Some(d) = domain {
        caps.network.add_domain(d);
    }

    // Apply command changes
    if let Some(cmd) = allow_command {
        // Use CommandCapability::new for fresh construction when needed
        if caps.commands.allowlist.is_empty() {
            caps.commands = crate::plugin_system::capabilities::CommandCapability::new(vec![cmd]);
        } else {
            caps.commands.allow_command(cmd);
        }
    }
    if let Some(cmd) = disallow_command {
        caps.commands.disallow_command(&cmd);
    }

    // Apply UI preset
    if let Some(preset) = ui_preset {
        use crate::plugin_system::capabilities::UiCapability;
        let ui = match preset.as_str() {
            "all" => UiCapability::all(),
            "basic" => UiCapability::basic(),
            _ => UiCapability::default(),
        };
        caps.ui = ui;
    }

    // Merge with existing capabilities (most permissive)
    let existing = manager
        .get_plugin_capabilities(&plugin_id)
        .unwrap_or_default();
    let merged = existing.merge(&caps);

    manager
        .set_plugin_capabilities(&plugin_id, merged.clone())
        .map_err(|e| e.to_string())?;

    // Compute tier for response
    let tier = if merged.is_subset_of(&PluginCapabilities::none()) {
        "sandboxed"
    } else if merged.is_subset_of(&PluginCapabilities::workspace_read()) {
        "read-only"
    } else if merged.is_subset_of(&PluginCapabilities::workspace_read_write()) {
        "read-write"
    } else {
        "full"
    };

    // Also check first_party preset for reference
    let _first_party_caps = PluginCapabilities::first_party();

    serde_json::to_value(serde_json::json!({
        "plugin_id": plugin_id,
        "capabilities": merged,
        "tier": tier,
    }))
    .map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_worker_info(
    plugin_id: String,
    worker_registry: State<'_, Arc<RwLock<WorkerRegistry>>>,
) -> Result<serde_json::Value, String> {
    let mut registry = worker_registry.write().await;

    // Use get_worker_mut for mutable access (e.g. future resource tracking)
    if let Some(worker) = registry.get_worker_mut(&plugin_id) {
        let info = serde_json::json!({
            "id": worker.id(),
            "capabilities": worker.capabilities(),
            "limits": {
                "max_memory": worker.resource_limits().max_memory,
                "max_cpu_time_ms": worker.resource_limits().max_cpu_time.as_millis() as u64,
                "max_operations": worker.resource_limits().max_operations,
            },
        });
        Ok(info)
    } else if let Some(worker) = registry.get_worker(&plugin_id) {
        // Fallback to read-only access
        Ok(serde_json::json!({
            "id": worker.id(),
            "capabilities": worker.capabilities(),
            "limits": {
                "max_memory": worker.resource_limits().max_memory,
                "max_cpu_time_ms": worker.resource_limits().max_cpu_time.as_millis() as u64,
                "max_operations": worker.resource_limits().max_operations,
            },
        }))
    } else {
        Err(format!("No worker found for plugin: {}", plugin_id))
    }
}

#[tauri::command]
async fn register_plugin_worker(
    plugin_id: String,
    state: State<'_, Arc<RwLock<PluginManager>>>,
    worker_registry: State<'_, Arc<RwLock<WorkerRegistry>>>,
    app_handle: AppHandle,
    editor_state_handle: State<'_, EditorStateHandle>,
) -> Result<(), String> {
    let manager = state.read().await;
    let info = manager
        .loader()
        .get(&plugin_id)
        .ok_or_else(|| format!("Plugin not loaded: {}", plugin_id))?;

    let workspace_root = if cfg!(debug_assertions) {
        let manifest_dir = std::path::PathBuf::from(env!("CARGO_MANIFEST_DIR"));
        manifest_dir.parent().unwrap().to_path_buf()
    } else {
        app_handle
            .path()
            .app_data_dir()
            .expect("Failed to get app data directory")
    };

    let mut wr = worker_registry.write().await;
    wr.create_worker(
        plugin_id.clone(),
        info.manifest.capabilities.clone(),
        workspace_root,
        app_handle.clone(),
        editor_state_handle.inner().clone(),
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
async fn add_trusted_key(
    key: String,
    verifier: State<'_, Arc<RwLock<TrustVerifier>>>,
) -> Result<(), String> {
    let mut v = verifier.write().await;
    v.add_trusted_key(key);
    Ok(())
}

#[tauri::command]
async fn remove_trusted_key(
    key: String,
    verifier: State<'_, Arc<RwLock<TrustVerifier>>>,
) -> Result<bool, String> {
    let mut v = verifier.write().await;
    Ok(v.remove_trusted_key(&key))
}

// ============================================================================
// PLUGIN HOT-RELOAD
// ============================================================================

/// Registry for hot-reload file watchers (one per plugin)
struct HotReloadRegistry {
    watchers: tokio::sync::Mutex<HashMap<String, notify::RecommendedWatcher>>,
}

impl HotReloadRegistry {
    fn new() -> Self {
        Self {
            watchers: tokio::sync::Mutex::new(HashMap::new()),
        }
    }
}

#[tauri::command]
async fn enable_plugin_hot_reload(
    plugin_id: String,
    plugin_manager: State<'_, Arc<RwLock<PluginManager>>>,
    hot_reload: State<'_, Arc<HotReloadRegistry>>,
    app_handle: AppHandle,
) -> Result<(), String> {
    use notify::{Event, RecursiveMode, Watcher};

    // Get plugin path from loader
    let plugin_dir = {
        let manager = plugin_manager.read().await;
        let info = manager
            .loader()
            .get(&plugin_id)
            .ok_or_else(|| format!("Plugin not found: {}", plugin_id))?;
        info.path.clone()
    };

    // Check if already watching
    {
        let watchers = hot_reload.watchers.lock().await;
        if watchers.contains_key(&plugin_id) {
            return Ok(()); // Already watching
        }
    }

    let pid = plugin_id.clone();
    let pm = plugin_manager.inner().clone();
    let handle = app_handle.clone();

    // Debounce: track last reload time
    let last_reload = Arc::new(tokio::sync::Mutex::new(std::time::Instant::now()));

    let (tx, mut rx) = tokio::sync::mpsc::channel::<Event>(32);

    // Spawn debounced reload handler
    let reload_pid = pid.clone();
    let reload_last = last_reload.clone();
    tokio::spawn(async move {
        while let Some(_event) = rx.recv().await {
            // Debounce: skip if last reload was < 500ms ago
            let mut last = reload_last.lock().await;
            let elapsed = last.elapsed();
            if elapsed < std::time::Duration::from_millis(500) {
                continue;
            }
            *last = std::time::Instant::now();
            drop(last);

            // Small delay to let file writes complete
            tokio::time::sleep(std::time::Duration::from_millis(200)).await;

            let mut manager = pm.write().await;
            match manager.reload(&reload_pid).await {
                Ok(()) => {
                    println!("[hot-reload] Reloaded plugin: {}", reload_pid);
                    let _ = handle.emit(
                        "plugin:hot-reload",
                        serde_json::json!({
                            "plugin_id": reload_pid,
                            "status": "reloaded",
                        }),
                    );
                }
                Err(e) => {
                    eprintln!("[hot-reload] Failed to reload {}: {}", reload_pid, e);
                    let _ = handle.emit(
                        "plugin:hot-reload",
                        serde_json::json!({
                            "plugin_id": reload_pid,
                            "status": "error",
                            "error": e.to_string(),
                        }),
                    );
                }
            }
        }
    });

    // Create file watcher
    let watcher_tx = tx.clone();
    let mut watcher = notify::recommended_watcher(move |res: Result<Event, notify::Error>| {
        if let Ok(event) = res {
            // Only reload on content changes (modify, create)
            match event.kind {
                notify::EventKind::Modify(_) | notify::EventKind::Create(_) => {
                    let _ = watcher_tx.blocking_send(event);
                }
                _ => {}
            }
        }
    })
    .map_err(|e| format!("Failed to create watcher: {}", e))?;

    watcher
        .watch(plugin_dir.as_ref(), RecursiveMode::Recursive)
        .map_err(|e| format!("Failed to watch plugin dir: {}", e))?;

    // Store watcher
    {
        let mut watchers = hot_reload.watchers.lock().await;
        watchers.insert(pid.clone(), watcher);
    }

    println!(
        "[hot-reload] Watching plugin: {} at {}",
        pid,
        plugin_dir.display()
    );
    Ok(())
}

#[tauri::command]
async fn disable_plugin_hot_reload(
    plugin_id: String,
    hot_reload: State<'_, Arc<HotReloadRegistry>>,
) -> Result<(), String> {
    let mut watchers = hot_reload.watchers.lock().await;
    if watchers.remove(&plugin_id).is_some() {
        println!("[hot-reload] Stopped watching plugin: {}", plugin_id);
    }
    Ok(())
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

// ============================================================================
// EDITOR STATE SYNC (frontend pushes state for plugin ops)
// ============================================================================

#[tauri::command]
async fn update_editor_state(
    content: String,
    active_file: Option<String>,
    state: State<'_, EditorStateHandle>,
) -> Result<(), String> {
    let mut editor_state = state
        .lock()
        .map_err(|e| format!("Failed to lock editor state: {}", e))?;
    editor_state.content = content;
    editor_state.active_file = active_file;
    Ok(())
}

#[derive(serde::Serialize)]
struct FileMetadata {
    modified: u64,
    size: u64,
    is_file: bool,
    is_dir: bool,
}

#[derive(serde::Serialize)]
struct DirectoryEntry {
    name: String,
    path: String,
    is_dir: bool,
    is_symlink: bool,
    size: u64,
}

#[tauri::command]
async fn list_directory(path: String) -> Result<Vec<DirectoryEntry>, String> {
    let mut entries = Vec::new();
    let mut read_dir = tokio::fs::read_dir(&path)
        .await
        .map_err(|e| format!("Failed to read directory '{}': {}", path, e))?;

    while let Some(entry) = read_dir.next_entry().await.map_err(|e| e.to_string())? {
        let path = entry.path();
        let symlink_meta = tokio::fs::symlink_metadata(&path)
            .await
            .map_err(|e| e.to_string())?;
        let is_symlink = symlink_meta.file_type().is_symlink();
        let (is_dir, size) = match entry.metadata().await {
            Ok(target_meta) => (target_meta.is_dir(), target_meta.len()),
            Err(_) => (false, symlink_meta.len()),
        };
        let name = entry.file_name().to_string_lossy().to_string();
        entries.push(DirectoryEntry {
            name,
            path: path.to_string_lossy().replace('\\', "/"),
            is_dir,
            is_symlink,
            size,
        });
    }

    // Sort: directories first, then alphabetically
    entries.sort_by(|a, b| {
        b.is_dir
            .cmp(&a.is_dir)
            .then(a.name.to_lowercase().cmp(&b.name.to_lowercase()))
    });

    Ok(entries)
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
            std::fs::create_dir_all(&plugins_dir).expect("Failed to create plugins directory");

            // Determine workspace root (project root in dev, app data in release)
            let workspace_root = if cfg!(debug_assertions) {
                let manifest_dir = std::path::PathBuf::from(env!("CARGO_MANIFEST_DIR"));
                manifest_dir.parent().unwrap().to_path_buf()
            } else {
                app.path()
                    .app_data_dir()
                    .expect("Failed to get app data directory")
            };

            // Initialize shared editor state
            let editor_state: EditorStateHandle =
                Arc::new(std::sync::Mutex::new(Default::default()));

            // Initialize plugin system
            let sandbox_registry = Arc::new(SandboxRegistry::new());
            let plugin_manager = Arc::new(RwLock::new(PluginManager::new(
                plugins_dir,
                sandbox_registry.clone(),
                workspace_root,
                app.handle().clone(),
                editor_state.clone(),
            )));
            let audit_logger = Arc::new(AuditLogger::new(10000));
            let watcher_registry = Arc::new(FileWatcherRegistry::new());
            let hot_reload_registry = Arc::new(HotReloadRegistry::new());
            let trust_verifier = Arc::new(RwLock::new(TrustVerifier::new()));
            let worker_registry = Arc::new(RwLock::new(WorkerRegistry::new()));

            // Store state
            app.manage(plugin_manager.clone());
            app.manage(sandbox_registry.clone());
            app.manage(audit_logger.clone());
            app.manage(watcher_registry.clone());
            app.manage(editor_state.clone());
            app.manage(hot_reload_registry.clone());
            app.manage(trust_verifier.clone());
            app.manage(worker_registry.clone());

            // Auto-discover and load plugins
            let hr_registry = hot_reload_registry.clone();
            let app_handle_for_hr = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                let mut manager = plugin_manager.write().await;

                if let Ok(plugins) = manager.discover() {
                    println!("Discovered {} plugins", plugins.len());

                    // Collect plugin IDs for hot-reload setup
                    let mut activated_plugins = Vec::new();

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
                                    Ok(()) => {
                                        println!("  Activated plugin: {} (first-party)", plugin_id);
                                        activated_plugins.push(plugin_id.clone());
                                    }
                                    Err(e) => eprintln!(
                                        "  Failed to activate plugin {}: {}",
                                        plugin_id, e
                                    ),
                                }
                            }
                        }
                    }

                    // Enable hot-reload for all activated plugins in dev mode
                    if cfg!(debug_assertions) {
                        for plugin_id in &activated_plugins {
                            if let Some(info) = manager.loader().get(plugin_id) {
                                let plugin_dir = info.path.clone();

                                use notify::{Event, RecursiveMode, Watcher};

                                let pm = plugin_manager.clone();
                                let pid = plugin_id.clone();
                                let handle = app_handle_for_hr.clone();
                                let last_reload =
                                    Arc::new(tokio::sync::Mutex::new(std::time::Instant::now()));

                                let (tx, mut rx) = tokio::sync::mpsc::channel::<Event>(32);
                                let reload_pid = pid.clone();
                                let reload_last = last_reload.clone();

                                tokio::spawn(async move {
                                    while let Some(_event) = rx.recv().await {
                                        let mut last = reload_last.lock().await;
                                        if last.elapsed() < std::time::Duration::from_millis(500) {
                                            continue;
                                        }
                                        *last = std::time::Instant::now();
                                        drop(last);
                                        tokio::time::sleep(std::time::Duration::from_millis(200))
                                            .await;
                                        let mut mgr = pm.write().await;
                                        match mgr.reload(&reload_pid).await {
                                            Ok(()) => {
                                                println!(
                                                    "[hot-reload] Reloaded plugin: {}",
                                                    reload_pid
                                                );
                                                let _ = handle.emit(
                                                    "plugin:hot-reload",
                                                    serde_json::json!({
                                                        "plugin_id": reload_pid,
                                                        "status": "reloaded",
                                                    }),
                                                );
                                            }
                                            Err(e) => {
                                                eprintln!(
                                                    "[hot-reload] Failed to reload {}: {}",
                                                    reload_pid, e
                                                );
                                            }
                                        }
                                    }
                                });

                                let watcher_tx = tx.clone();
                                if let Ok(mut watcher) = notify::recommended_watcher(
                                    move |res: Result<Event, notify::Error>| {
                                        if let Ok(event) = res {
                                            match event.kind {
                                                notify::EventKind::Modify(_)
                                                | notify::EventKind::Create(_) => {
                                                    let _ = watcher_tx.blocking_send(event);
                                                }
                                                _ => {}
                                            }
                                        }
                                    },
                                ) {
                                    if watcher
                                        .watch(plugin_dir.as_ref(), RecursiveMode::Recursive)
                                        .is_ok()
                                    {
                                        let mut watchers = hr_registry.watchers.lock().await;
                                        watchers.insert(pid.clone(), watcher);
                                        println!("[hot-reload] Auto-watching plugin: {}", pid);
                                    }
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
            list_directory,
            emit_editor_event,
            // Plugin management
            discover_plugins,
            load_plugin,
            activate_plugin,
            deactivate_plugin,
            reload_plugin,
            unload_plugin,
            get_plugin_status,
            get_all_plugin_statuses,
            enable_plugin_hot_reload,
            disable_plugin_hot_reload,
            // Plugin system (v0.0.11)
            get_plugin_event_listeners,
            get_file_watcher_count,
            list_active_sandboxes,
            get_plugin_resource_stats,
            grant_plugin_capability,
            add_trusted_key,
            remove_trusted_key,
            get_worker_info,
            register_plugin_worker,
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
            update_editor_state,
            // Event system
            plugin_register_event,
            plugin_emit_event,
            // Plugin hooks
            plugin_execute_hook,
            // Audit logs
            get_audit_logs,
            clear_audit_logs,
            // Theme engine
            theme_engine::load_theme,
            theme_engine::load_theme_data,
            theme_engine::apply_theme,
            theme_engine::get_theme_metadata,
            theme_engine::list_themes,
            // Git operations
            git::git_is_repo,
            git::git_status,
            git::git_diff_file_content,
            git::git_stage,
            git::git_unstage,
            git::git_discard_changes,
            git::git_commit,
            git::git_log,
            git::git_branches,
            git::git_checkout,
            git::git_push,
            git::git_pull,
            git::git_fetch,
            git::git_stash,
            git::get_workspace_root,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
