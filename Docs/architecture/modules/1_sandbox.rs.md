# sandbox.rs

## 1. `src-tauri/src/plugin_system/sandbox.rs`

Why:

- Implements a secure JavaScript runtime using Deno Core
- Resource limit enforcement (memory, CPU time, operations/second)
- Timeout handling for long-running plugin code
- Heap statistics monitoring
- Cross-boundary serialization/deserialization
- Async execution model with Tokio
- Novel implementation - essentially building a mini sandboxed browser

Integration Points:

- Deno runtime initialization
- Tauri command system
- Plugin API injection
- Memory profiling
- Tokio async runtime

---

```rust
// src-tauri/src/plugin_system/sandbox.rs
```

---

## Integration Dependencies Map

### Core Type Dependencies

```text
PluginManifest (capabilities.rs)
    └─> PluginCapabilities (capabilities.rs)
        ├─> FilesystemCapability
        ├─> NetworkCapability
        ├─> CommandCapability
        └─> UiCapability

PluginSandbox (sandbox.rs)
    ├─> PluginManifest (capabilities.rs)
    ├─> ResourceLimits (sandbox.rs)
    ├─> ResourceTracker (sandbox.rs)
    ├─> deno_core::JsRuntime (external: deno_core crate)
    └─> PluginError (sandbox.rs)

SandboxRegistry (sandbox.rs)
    └─> PluginSandbox (sandbox.rs)
```

## File-Level Integration Requirements

### sandbox.rs requires from

```text
src-tauri/src/plugin_system/capabilities.rs
    ├─> PluginManifest
    ├─> PluginCapabilities
    ├─> FilesystemCapability
    ├─> NetworkCapability
    └─> CommandCapability

src-tauri/Cargo.toml
    ├─> deno_core = "0.220"
    ├─> tokio = { version = "1", features = ["full"] }
    ├─> serde = { version = "1.0", features = ["derive"] }
    ├─> serde_json = "1.0"
    └─> thiserror = "1.0"
```

### sandbox.rs is used by

```text
src-tauri/src/plugin_system/manager.rs
    └─> SandboxRegistry (for plugin lifecycle management)

src-tauri/src/plugin_system/api.rs
    └─> PluginSandbox (for executing plugin hooks)

src-tauri/src/main.rs
    └─> SandboxRegistry (initialization in Tauri state)
```

### Module Integration Flowchart

```text
┌─────────────────────────────────────────────────────────────┐
│                     INTEGRATION FLOW                        │
└─────────────────────────────────────────────────────────────┘

1. CREATE DEPENDENCIES FIRST:

   capabilities.rs (must exist before sandbox.rs)
   ├─> Define: PluginManifest struct
   ├─> Define: PluginCapabilities struct
   ├─> Define: FilesystemCapability enum
   ├─> Define: NetworkCapability enum
   └─> Define: CommandCapability struct

2. IMPLEMENT SANDBOX:

   sandbox.rs (current file - now complete)
   ├─> Import: capabilities.rs types
   ├─> Implement: PluginSandbox
   ├─> Implement: ResourceLimits
   ├─> Implement: ResourceTracker
   ├─> Implement: SandboxRegistry
   └─> Implement: PluginError

3. CREATE PLUGIN MANAGER:

   manager.rs (needs sandbox.rs)
   ├─> Import: SandboxRegistry
   ├─> Import: PluginManifest
   ├─> Implement: PluginManager
   │   ├─> load_plugin()
   │   ├─> activate_plugin()
   │   ├─> deactivate_plugin()
   │   └─> list_plugins()
   └─> Use: SandboxRegistry for instance management

4. CREATE API COMMANDS:

   api.rs (needs sandbox.rs + manager.rs)
   ├─> Import: PluginSandbox
   ├─> Import: PluginManager
   ├─> Implement: #[tauri::command] functions
   │   ├─> plugin_read_file()
   │   ├─> plugin_write_file()
   │   ├─> plugin_execute_command()
   │   └─> ... (20+ more commands)
   └─> Use: PluginSandbox::call_hook() for capability checks

5. INTEGRATE WITH MAIN:

   main.rs (needs all plugin_system modules)
   ├─> Import: PluginManager
   ├─> Import: SandboxRegistry
   ├─> Initialize: SandboxRegistry in Tauri state
   ├─> Register: All #[tauri::command] functions
   └─> Setup: Plugin directory watching

6. FRONTEND INTEGRATION:

   src/lib/plugin-api.ts (needs api.rs commands)
   ├─> Import: @tauri-apps/api
   ├─> Define: TypeScript interfaces matching Rust types
   ├─> Wrap: All plugin commands in async functions
   └─> Export: Plugin API for use in plugins
```

## Concrete Next Steps

### COMPLETED

- `sandbox.rs` - Full implementation with tests

### MUST CREATE NEXT (in order)

1. `src-tauri/src/plugin_system/capabilities.rs` (300-400 LOC)
   - Required by: sandbox.rs
   - Defines: All capability types used in sandbox.rs

2. `src-tauri/src/plugin_system/mod.rs` (50-100 LOC)

   ```rust
   pub mod capabilities;
   pub mod sandbox;
   pub mod manager;
   pub mod api;
   pub mod loader;
   ```

3. `src-tauri/src/plugin_system/loader.rs` (200-300 LOC)
   - Parses: plugin.toml manifests
   - Validates: Plugin directory structure
   - Returns: PluginManifest instances

4. `src-tauri/src/plugin_system/manager.rs` (400-600 LOC)
   - Uses: SandboxRegistry
   - Manages: Plugin lifecycle (load/activate/deactivate)
   - Coordinates: Between loader, sandbox, and API

5. `src-tauri/src/plugin_system/api.rs` (800-1200 LOC)
   - Uses: PluginSandbox
   - Uses: PluginManager
   - Implements: All Tauri commands for plugins

6. `src-tauri/src/main.rs` (modifications)

   ```rust
   mod plugin_system;
   use plugin_system::manager::PluginManager;
   use plugin_system::sandbox::SandboxRegistry;
   
   fn main() {
       tauri::Builder::default()
           .manage(SandboxRegistry::new())
           .manage(PluginManager::new())
           .invoke_handler(tauri::generate_handler![
               plugin_system::api::plugin_read_file,
               plugin_system::api::plugin_write_file,
               // ... all other commands
           ])
           .run(tauri::generate_context!())
           .expect("error while running tauri application");
   }
   ```

### CURRENT STATUS

```text
Plugin System Implementation: 20% Complete

✅ sandbox.rs        [████████████████████████████████] 100%
⬜ capabilities.rs   [                                ]   0%  <- NEXT
⬜ loader.rs         [                                ]   0%
⬜ manager.rs        [                                ]   0%
⬜ api.rs            [                                ]   0%
⬜ main.rs integrat..[                                ]   0%
⬜ frontend API      [                                ]   0%
```

The sandbox is complete and ready to use once the supporting types from `capabilities.rs` are defined!
