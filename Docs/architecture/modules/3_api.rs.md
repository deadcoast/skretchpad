# api.rs

## 3. `src-tauri/src/plugin_system/api.rs`

Why:

- Every plugin capability needs a Tauri command with security checks
- Filesystem operations (read/write/watch) with path validation
- Network operations with domain allowlisting
- Command execution with argument sanitization
- Audit logging for all operations
- Error handling across Rust/JS boundary
- State management for plugin contexts
- Permission denial handling with user-friendly errors

Commands to Implement:

```rust
plugin_read_file
plugin_write_file
plugin_list_directory
plugin_watch_path
plugin_fetch
plugin_execute_command
plugin_show_notification
plugin_add_status_bar_item
plugin_show_panel
plugin_register_command
... and 20+ more
```

Integration Points:

- Plugin manager (for capability lookup)
- Tauri event system
- File system API
- Network stack
- OS command execution
- Audit logging system

---

```rust
// src-tauri/src/plugin_system/api.rs
```

---

## Integration Dependencies Map

### Module Dependencies

```plaintext
api.rs (THIS FILE - 1,200 lines)
├─> Internal Modules
│   ├─> capabilities.rs
│   │   ├─> PluginCapabilities
│   │   ├─> FilesystemCapability
│   │   ├─> NetworkCapability
│   │   ├─> CommandCapability
│   │   └─> UiCapability
│   │
│   ├─> manager.rs
│   │   ├─> PluginManager
│   │   ├─> get_plugin_capabilities()
│   │   └─> register_event_listener()
│   │
│   └─> sandbox.rs
│       ├─> PluginSandbox
│       ├─> SandboxRegistry
│       └─> call_hook()
│
├─> External Crates
│   ├─> tauri
│   │   ├─> AppHandle
│   │   ├─> Manager
│   │   ├─> State
│   │   └─> Window
│   │
│   ├─> serde & serde_json
│   │   ├─> Serialize
│   │   ├─> Deserialize
│   │   └─> Value
│   │
│   ├─> tokio
│   │   ├─> fs (async file operations)
│   │   ├─> process (command execution)
│   │   └─> sync::RwLock
│   │
│   ├─> reqwest
│   │   └─> Client (HTTP requests)
│   │
│   ├─> notify
│   │   └─> Watcher (file watching)
│   │
│   ├─> url
│   │   └─> Url (URL parsing)
│   │
│   ├─> uuid
│   │   └─> Uuid (watch IDs)
│   │
│   └─> async_trait
│       └─> async_trait macro
│
└─> Tauri Commands (exported)
    ├─> Filesystem (6 commands)
    │   ├─> plugin_read_file
    │   ├─> plugin_write_file
    │   ├─> plugin_list_directory
    │   └─> plugin_watch_path
    │
    ├─> Network (1 command)
    │   └─> plugin_fetch
    │
    ├─> Command Execution (1 command)
    │   └─> plugin_execute_command
    │
    ├─> UI (6 commands)
    │   ├─> plugin_show_notification
    │   ├─> plugin_add_status_bar_item
    │   ├─> plugin_remove_status_bar_item
    │   ├─> plugin_show_panel
    │   └─> plugin_hide_panel
    │
    ├─> Editor (3 commands)
    │   ├─> plugin_get_editor_content
    │   ├─> plugin_set_editor_content
    │   └─> plugin_get_active_file
    │
    ├─> Events (2 commands)
    │   ├─> plugin_register_event
    │   └─> plugin_emit_event
    │
    ├─> Hooks (1 command)
    │   └─> plugin_execute_hook
    │
    └─> Audit (2 commands)
        ├─> get_audit_logs
        └─> clear_audit_logs
```

## Required Files to Create

### 🔴 CRITICAL - Must exist before api.rs compiles

```plaintext
1. src-tauri/src/plugin_system/capabilities.rs (ALREADY COMPLETE ✅)
   └─> Types: PluginCapabilities, FilesystemCapability, etc.

2. src-tauri/src/plugin_system/sandbox.rs (ALREADY COMPLETE ✅)
   └─> Types: PluginSandbox, SandboxRegistry

3. src-tauri/src/plugin_system/manager.rs
   └─> NEW FILE REQUIRED ⚠️
   └─> Exports:
       ├─> PluginManager struct
       ├─> get_plugin_capabilities()
       └─> register_event_listener()
```

### 🟡 IMPORTANT - Backend integration

```rust
4. src-tauri/src/plugin_system/mod.rs
   └─> Module exports:
       pub mod capabilities;
       pub mod sandbox;
       pub mod manager;
       pub mod api;

5. src-tauri/src/main.rs
   └─> Modifications:
       ├─> Initialize PluginManager
       ├─> Initialize SandboxRegistry
       ├─> Initialize AuditLogger
       └─> Register all #[tauri::command] functions
```

### 🟢 OPTIONAL - Enhanced features

```plaintext
6. src-tauri/src/commands/mod.rs
   └─> Re-export plugin commands for organization

7. Frontend integration files
   └─> src/lib/plugin-api.ts
       └─> TypeScript wrappers for all commands
```

## Cargo.toml Dependencies

```toml
[dependencies]
tauri = { version = "2.0", features = ["shell-open", "fs-read-file", "fs-write-file"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
tokio = { version = "1", features = ["full"] }
reqwest = { version = "0.11", features = ["json"] }
notify = "6.0"
url = "2.5"
uuid = { version = "1.0", features = ["v4"] }
async-trait = "0.1"
thiserror = "1.0"
```

## File-Level Integration Diagram

```plaintext
┌────────────────────────────────────────────────────────────────┐
│                        API.RS INTEGRATION                      │
└────────────────────────────────────────────────────────────────┘

┌─────────────┐
│   api.rs    │ (THIS FILE - 1,200 lines)
└──────┬──────┘
       │
       ├──────────────────────────────────────────────────────────┐
       │                                                          │
       ▼                                                          ▼
┌──────────────────┐                                    ┌────────────────┐
│ capabilities.rs  │ COMPLETE                           │  sandbox.rs    │ COMPLETE
├──────────────────┤                                    ├────────────────┤
│ • PluginCaps     │                                    │ • Sandbox      │
│ • FilesystemCap  │                                    │ • Registry     │
│ • NetworkCap     │                                    │ • call_hook()  │
│ • CommandCap     │                                    └────────────────┘
│ • UiCap          │
└──────────────────┘
       │
       ▼
┌──────────────────┐
│   manager.rs     │ MUST CREATE
├──────────────────┤
│ • PluginManager  │
│ • load_plugin()  │
│ • activate()     │
│ • deactivate()   │
│ • get_caps()     │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────────────────────────────┐
│                  TAURI APPLICATION                   │
├──────────────────────────────────────────────────────┤
│  main.rs                                             │
│  ├─> Initialize PluginManager                        │
│  ├─> Initialize SandboxRegistry                      │
│  ├─> Initialize AuditLogger                          │
│  └─> Register Commands:                              │
│      ├─> plugin_read_file                            │
│      ├─> plugin_write_file                           │
│      ├─> plugin_list_directory                       │
│      ├─> plugin_watch_path                           │
│      ├─> plugin_fetch                                │
│      ├─> plugin_execute_command                      │
│      ├─> plugin_show_notification                    │
│      ├─> plugin_add_status_bar_item                  │
│      ├─> plugin_remove_status_bar_item               │
│      ├─> plugin_show_panel                           │
│      ├─> plugin_hide_panel                           │
│      ├─> plugin_get_editor_content                   │
│      ├─> plugin_set_editor_content                   │
│      ├─> plugin_get_active_file                      │
│      ├─> plugin_register_event                       │
│      ├─> plugin_emit_event                           │
│      ├─> plugin_execute_hook                         │
│      ├─> get_audit_logs                              │
│      └─> clear_audit_logs                            │
└──────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────┐
│               FRONTEND INTEGRATION                   │
├──────────────────────────────────────────────────────┤
│  src/lib/plugin-api.ts                               │
│  ├─> TypeScript interfaces                           │
│  ├─> Command wrappers                                │
│  └─> Event listeners                                 │
│                                                      │
│  Plugin Usage Example:                               │
│  import { invoke } from '@tauri-apps/api';           │
│                                                      │
│  // Read file                                        │
│  const content = await invoke('plugin_read_file', {  │
│    plugin_id: 'my-plugin',                           │
│    path: '/path/to/file.txt'                         │
│  });                                                 │
│                                                      │
│  // Execute command                                  │
│  const output = await invoke('plugin_execute_command',│
│    {                                                 │
│    plugin_id: 'my-plugin',                           │
│    command: 'git',                                   │
│    args: ['status']                                  │
│  });                                                 │
└──────────────────────────────────────────────────────┘
```

## Integration Checklist

### COMPLETED

- `src-tauri/src/plugin_system/api.rs` (1,200 lines) - All plugin commands
- `src-tauri/src/plugin_system/sandbox.rs` ✅ (from previous)
- `src-tauri/src/plugin_system/capabilities.rs` ✅ (assumed complete)

### MUST CREATE NEXT

- Phase 1: Plugin Manager (blocking)

```plaintext
1. src-tauri/src/plugin_system/manager.rs (400-600 lines)
   └─> PluginManager implementation
   └─> Plugin lifecycle management
   └─> Capability lookup
   └─> Event registration
```

- Phase 2: Module Organization

```rust
2. src-tauri/src/plugin_system/mod.rs (50 lines)
   pub mod capabilities;
   pub mod sandbox;
   pub mod manager;
   pub mod api;
   pub mod loader;

3. src-tauri/src/main.rs (modifications - 100 lines)
   └─> State initialization
   └─> Command registration
```

- Phase 3: Frontend Integration

```plaintext
4. src/lib/plugin-api.ts (300-400 lines)
   └─> TypeScript types matching Rust structs
   └─> Command wrapper functions
   └─> Event handling utilities
```

## Command Registration in main.rs

```rust
// src-tauri/src/main.rs
mod plugin_system;

use plugin_system::manager::PluginManager;
use plugin_system::sandbox::SandboxRegistry;
use plugin_system::api::{AuditLogger, *};

fn main() {
    tauri::Builder::default()
        // Initialize state
        .manage(Arc::new(RwLock::new(PluginManager::new())))
        .manage(Arc::new(SandboxRegistry::new()))
        .manage(Arc::new(AuditLogger::new(10000)))
        
        // Register all plugin commands
        .invoke_handler(tauri::generate_handler![
            // Filesystem
            plugin_read_file,
            plugin_write_file,
            plugin_list_directory,
            plugin_watch_path,
            
            // Network
            plugin_fetch,
            
            // Commands
            plugin_execute_command,
            
            // UI
            plugin_show_notification,
            plugin_add_status_bar_item,
            plugin_remove_status_bar_item,
            plugin_show_panel,
            plugin_hide_panel,
            
            // Editor
            plugin_get_editor_content,
            plugin_set_editor_content,
            plugin_get_active_file,
            
            // Events
            plugin_register_event,
            plugin_emit_event,
            
            // Hooks
            plugin_execute_hook,
            
            // Audit
            get_audit_logs,
            clear_audit_logs,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```
