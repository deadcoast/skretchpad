# main.rs Architecture

> **Source File**: [`src-tauri/src/main.rs`](../../../src-tauri/src/main.rs)
> **Status**: ✅ Implemented
> **Component Type**: Tauri Application Entry Point
> **Lines of Code**: 212

---

## Table of Contents

- [Overview](#overview)
- [State Management](#state-management)
- [Plugin Management Commands](#plugin-management-commands)
- [Application Setup](#application-setup)
- [Command Registration](#command-registration)
- [Auto-Discovery Flow](#auto-discovery-flow)
- [Related Documentation](#related-documentation)

---

## Overview

`main.rs` is the Rust backend entry point for Skretchpad. It initializes the Tauri application, sets up the plugin system, and registers all Tauri commands for frontend-backend communication.

### Key Responsibilities

- **Plugin System Initialization**: Creates `PluginManager`, `SandboxRegistry`, `AuditLogger`
- **State Management**: Manages application state via Tauri's `State` system
- **Command Registration**: Registers 25+ Tauri commands for plugin operations
- **Auto-Discovery**: Discovers and loads plugins on startup
- **Auto-Activation**: Activates first-party plugins automatically

---

## State Management

### AppState Structure

```rust
struct AppState {
    plugin_manager: Arc<RwLock<PluginManager>>,
    sandbox_registry: Arc<SandboxRegistry>,
    audit_logger: Arc<AuditLogger>,
}
```

**Source**: Lines 29-33

### Managed State

Application state is managed via `tauri::State`:

| State              | Type                         | Purpose                     |
|--------------------|------------------------------|-----------------------------|
| `plugin_manager`   | `Arc<RwLock<PluginManager>>` | Plugin lifecycle management |
| `sandbox_registry` | `Arc<SandboxRegistry>`       | JavaScript sandbox registry |
| `audit_logger`     | `Arc<AuditLogger>`           | Security audit logging      |

**Initialization**: Lines 138-140

---

## Plugin Management Commands

### discover_plugins

```rust
#[tauri::command]
async fn discover_plugins(
    state: State<'_, Arc<RwLock<PluginManager>>>,
) -> Result<Vec<String>, String>
```

Discovers all plugins in the plugins directory.

**Source**: Lines 40-45

### load_plugin

```rust
#[tauri::command]
async fn load_plugin(
    plugin_id: String,
    state: State<'_, Arc<RwLock<PluginManager>>>,
) -> Result<(), String>
```

Loads a plugin by ID (parses manifest, validates capabilities).

**Source**: Lines 47-55

### activate_plugin

```rust
#[tauri::command]
async fn activate_plugin(
    plugin_id: String,
    state: State<'_, Arc<RwLock<PluginManager>>>,
) -> Result<(), String>
```

Activates a plugin (creates sandbox, executes entry point).

**Source**: Lines 57-64

### deactivate_plugin

```rust
#[tauri::command]
async fn deactivate_plugin(
    plugin_id: String,
    state: State<'_, Arc<RwLock<PluginManager>>>,
) -> Result<(), String>
```

Deactivates a running plugin (cleanup, remove sandbox).

**Source**: Lines 66-76

### reload_plugin

```rust
#[tauri::command]
async fn reload_plugin(
    plugin_id: String,
    state: State<'_, Arc<RwLock<PluginManager>>>,
) -> Result<(), String>
```

Reloads a plugin (deactivate → load → activate).

**Source**: Lines 78-85

### get_plugin_status

```rust
#[tauri::command]
async fn get_plugin_status(
    plugin_id: String,
    state: State<'_, Arc<RwLock<PluginManager>>>,
) -> Result<serde_json::Value, String>
```

Returns status of a single plugin.

**Source**: Lines 87-97

### get_all_plugin_statuses

```rust
#[tauri::command]
async fn get_all_plugin_statuses(
    state: State<'_, Arc<RwLock<PluginManager>>>,
) -> Result<Vec<serde_json::Value>, String>
```

Returns statuses of all plugins.

**Source**: Lines 99-109

---

## Application Setup

### Main Function

```rust
fn main() {
    tauri::Builder::default()
        .setup(|app| {
            // Setup logic
        })
        .invoke_handler(tauri::generate_handler![
            // Command list
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

**Source**: Lines 115-212

### Setup Phase

#### 1. Directory Initialization

```rust
// Get app data directory
let app_dir = app.path().app_data_dir()
    .expect("Failed to get app data directory");

// Create plugins directory
let plugins_dir = app_dir.join("plugins");
std::fs::create_dir_all(&plugins_dir)
    .expect("Failed to create plugins directory");
```

**Source**: Lines 118-127

#### 2. Plugin System Initialization

```rust
let sandbox_registry = Arc::new(SandboxRegistry::new());
let plugin_manager = Arc::new(RwLock::new(PluginManager::new(
    plugins_dir,
    sandbox_registry.clone(),
)));
let audit_logger = Arc::new(AuditLogger::new(10000));
```

**Source**: Lines 130-135

- **SandboxRegistry**: Manages V8 isolates for plugins
- **PluginManager**: Coordinates plugin lifecycle
- **AuditLogger**: Logs plugin actions (capacity: 10,000 entries)

#### 3. State Management

```rust
app.manage(plugin_manager.clone());
app.manage(sandbox_registry.clone());
app.manage(audit_logger.clone());
```

**Source**: Lines 138-140

---

## Auto-Discovery Flow

### Startup Plugin Discovery

```rust
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
```

**Source**: Lines 143-169

### Auto-Activation Logic

Only **first-party plugins** are automatically activated:

```rust
if matches!(
    info.manifest.trust,
    plugin_system::trust::TrustLevel::FirstParty
)
```

- **FirstParty**: Auto-activated
- **Verified**: Manual activation required
- **Unverified**: Manual activation with warnings

See [`capabilities.rs`](03_capabilities.rs.md) for trust level definitions.

---

## Command Registration

### Complete Command List (25 commands)

```rust
.invoke_handler(tauri::generate_handler![
    // Plugin management (7)
    discover_plugins,
    load_plugin,
    activate_plugin,
    deactivate_plugin,
    reload_plugin,
    get_plugin_status,
    get_all_plugin_statuses,

    // Filesystem operations (4)
    plugin_read_file,
    plugin_write_file,
    plugin_list_directory,
    plugin_watch_path,

    // Network operations (1)
    plugin_fetch,

    // Command execution (1)
    plugin_execute_command,

    // UI operations (5)
    plugin_show_notification,
    plugin_add_status_bar_item,
    plugin_remove_status_bar_item,
    plugin_show_panel,
    plugin_hide_panel,

    // Editor operations (3)
    plugin_get_editor_content,
    plugin_set_editor_content,
    plugin_get_active_file,

    // Event system (2)
    plugin_register_event,
    plugin_emit_event,

    // Plugin hooks (1)
    plugin_execute_hook,

    // Audit logs (2)
    get_audit_logs,
    clear_audit_logs,
])
```

**Source**: Lines 173-209

### Command Categories

| Category              | Commands | Defined In              |
|-----------------------|----------|-------------------------|
| **Plugin Management** | 7        | main.rs (this file)     |
| **Filesystem**        | 4        | [`api.rs`](05_api.rs.md) |
| **Network**           | 1        | [`api.rs`](05_api.rs.md) |
| **Command Execution** | 1        | [`api.rs`](05_api.rs.md) |
| **UI Operations**     | 5        | [`api.rs`](05_api.rs.md) |
| **Editor Operations** | 3        | [`api.rs`](05_api.rs.md) |
| **Event System**      | 2        | [`api.rs`](05_api.rs.md) |
| **Plugin Hooks**      | 1        | [`api.rs`](05_api.rs.md) |
| **Audit Logs**        | 2        | [`api.rs`](05_api.rs.md) |

---

## Related Documentation

### Plugin System Architecture

- **[sandbox.rs](02_sandbox.rs.md)** - JavaScript sandboxing with V8
- **[capabilities.rs](03_capabilities.rs.md)** - Permission system and trust levels
- **[api.rs](05_api.rs.md)** - Plugin API commands (18 commands)
- **[loader.rs](10_loader.rs.md)** - Plugin manifest loading
- **[manager.rs](11_manager.rs.md)** - Plugin lifecycle management

### Frontend Integration

- **[plugin-api.ts](09_plugin-api.ts.md)** - TypeScript plugin API
- **[plugins.ts](14_plugins.ts.md)** - Frontend plugin store
- **[StatusBar.svelte](17_StatusBar.svelte.md)** - Plugin UI integration

### Configuration

- **[Cargo.toml](../core/03_configs.md#cargo-configuration)** - Rust dependencies
- **[tauri.conf.json](../core/03_configs.md#tauri-configuration)** - Tauri configuration

### Project Status

- **[STATUS.md](../../reports/STATUS_2026-02-10.md)** - Development progress
- **[TODO.md](../../TODO.md)** - Implementation tasks
- **[Technical Details](../core/02_technical-details.md)** - Implementation deep-dive

---

## Implementation Notes

### Thread Safety

All shared state uses `Arc` (atomic reference counting) and `RwLock` (read-write lock):

```rust
Arc<RwLock<PluginManager>>  // Multiple readers OR single writer
Arc<SandboxRegistry>        // Immutable after creation
Arc<AuditLogger>            // Thread-safe internal mutability
```

### Error Handling

All commands return `Result<T, String>`:
- **Ok(T)**: Success with data
- **Err(String)**: Error message for frontend display

Frontend receives errors via Tauri's promise rejection:

```typescript
try {
  await invoke('load_plugin', { pluginId: 'foo' });
} catch (error) {
  console.error('Plugin load failed:', error);
}
```

### Async Runtime

Uses Tokio for async operations:

```rust
tauri::async_runtime::spawn(async move {
    // Async plugin discovery
});
```

Tauri provides `tauri::async_runtime` which wraps Tokio.

---

## Startup Sequence

```plaintext
1. main() entry point
    ↓
2. tauri::Builder::default()
    ↓
3. .setup() callback
    ├─> Create app data directory
    ├─> Create plugins directory
    ├─> Initialize SandboxRegistry
    ├─> Initialize PluginManager
    ├─> Initialize AuditLogger
    ├─> Register managed state
    └─> Spawn auto-discovery task
         ├─> Discover plugins
         ├─> Load all discovered plugins
         └─> Auto-activate first-party plugins
    ↓
4. .invoke_handler() - Register commands
    ↓
5. .run() - Start Tauri event loop
```

---

**Documentation Version**: 2.0.0
**Component Version**: 0.1.0
**Accuracy**: Verified against source code 2025-10-28
