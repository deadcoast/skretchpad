# 3. main.rs Integration

```rust
// src-tauri/src/main.rs
```

---

## Integration Dependencies Map

### Module Dependencies

```text
BACKEND RUST FILES (Complete Plugin System)
├─> loader.rs (THIS FILE #1 - 600 lines)
│   ├─> capabilities.rs ✅
│   ├─> std::fs, std::path
│   ├─> serde, toml
│   └─> thiserror
│
├─> manager.rs (THIS FILE #2 - 550 lines)
│   ├─> loader.rs (THIS FILE #1)
│   ├─> capabilities.rs ✅
│   ├─> sandbox.rs ✅
│   ├─> tokio::sync::RwLock
│   └─> serde_json
│
└─> main.rs (THIS FILE #3 - 200 lines modified)
    ├─> manager.rs (THIS FILE #2)
    ├─> sandbox.rs ✅
    ├─> api.rs ✅
    ├─> tauri
    └─> tokio
```

### File-Level Integration Diagram

```text
┌────────────────────────────────────────────────────────────────┐
│              BACKEND PLUGIN SYSTEM INTEGRATION                 │
└────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│   loader.rs      │ (THIS FILE #1 - 600 lines)
└────────┬─────────┘
         │
         ├─> Reads plugin.toml files
         ├─> Parses manifests
         ├─> Validates plugin structure
         ├─> Builds PluginCapabilities
         └─> Manages PluginInfo cache
         │
         ▼
┌──────────────────┐
│   manager.rs     │ (THIS FILE #2 - 550 lines)
└────────┬─────────┘
         │
         ├─> Uses PluginLoader
         ├─> Manages plugin lifecycle
         ├─> Coordinates with SandboxRegistry
         ├─> Handles dependencies
         ├─> Manages event system
         └─> Tracks plugin states
         │
         ▼
┌──────────────────────────────────────────────────────────────┐
│   main.rs integration    │ (THIS FILE #3 - 200 lines)        │
└──────────────────────────────────────────────────────────────┘
         │
         ├─> Initializes PluginManager
         ├─> Initializes SandboxRegistry
         ├─> Initializes AuditLogger
         ├─> Registers 25+ Tauri commands
         ├─> Auto-discovers plugins on startup
         └─> Auto-activates first-party plugins
         │
         ▼
┌──────────────────────────────────────────────────────────────┐
│                  TAURI APPLICATION                           │
├──────────────────────────────────────────────────────────────┤
│  Available Commands:                                         │
│  ├─> Plugin Management (7 commands)                          │
│  │   ├─> discover_plugins                                    │
│  │   ├─> load_plugin                                         │
│  │   ├─> activate_plugin                                     │
│  │   ├─> deactivate_plugin                                   │
│  │   ├─> reload_plugin                                       │
│  │   ├─> get_plugin_status                                   │
│  │   └─> get_all_plugin_statuses                             │
│  │                                                           │
│  ├─> Plugin API (18 commands from api.rs)                    │
│  │   ├─> Filesystem (4)                                      │
│  │   ├─> Network (1)                                         │
│  │   ├─> Commands (1)                                        │
│  │   ├─> UI (5)                                              │
│  │   ├─> Editor (3)                                          │
│  │   ├─> Events (2)                                          │
│  │   └─> Audit (2)                                           │
│  │                                                           │
│  └─> Frontend calls via @tauri-apps/api                      │
└──────────────────────────────────────────────────────────────┘
```
