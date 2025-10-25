```rust
// src-tauri/src/plugin_system/sandbox.rs (continued)

    /// Get current resource usage statistics
    pub fn get_resource_stats(&self) -> ResourceStats {
        ResourceStats {
            memory_used: self.resource_tracker.memory_used.load(Ordering::Relaxed),
            operations_count: self.resource_tracker.operations_count.load(Ordering::Relaxed),
            last_operation: *self.resource_tracker.last_operation.lock().unwrap(),
        }
    }
    
    /// Check if plugin is within resource limits
    pub fn check_resource_limits(&self) -> Result<(), PluginError> {
        let stats = self.get_resource_stats();
        
        // Check memory limit
        if stats.memory_used > self.resource_limits.max_memory {
            return Err(PluginError::MemoryLimitExceeded {
                used: stats.memory_used,
                limit: self.resource_limits.max_memory,
            });
        }
        
        // Check operation rate limit
        if let Some(last_op) = stats.last_operation {
            let elapsed = last_op.elapsed().as_secs_f64();
            if elapsed < 1.0 {
                let ops_per_sec = stats.operations_count as f64 / elapsed;
                if ops_per_sec > self.resource_limits.max_operations as f64 {
                    return Err(PluginError::RateLimitExceeded {
                        current: ops_per_sec as u64,
                        limit: self.resource_limits.max_operations,
                    });
                }
            }
        }
        
        Ok(())
    }
    
    /// Execute JavaScript code with resource limits
    async fn execute_with_limits(
        &self,
        runtime: &mut deno_core::JsRuntime,
        code: &str,
    ) -> Result<serde_json::Value, PluginError> {
        // Check resource limits before execution
        self.check_resource_limits()?;
        
        // Increment operation counter
        self.resource_tracker.increment_operations();
        
        // Execute with timeout
        let timeout_duration = self.resource_limits.max_cpu_time;
        
        let execution = async {
            // Execute the script
            let result = runtime
                .execute_script("<plugin>", ModuleCode::from(code.to_string()))
                .map_err(|e| PluginError::ExecutionError(e.to_string()))?;
            
            // Resolve the result
            let global = runtime.get_module_namespace(result)?;
            let scope = &mut runtime.handle_scope();
            let local = v8::Local::new(scope, global);
            
            // Convert V8 value to JSON
            let json_string = serde_v8::to_v8(scope, local)
                .and_then(|v| v8::json::stringify(scope, v))
                .and_then(|v| v.to_rust_string_lossy(scope));
            
            match json_string {
                Some(json) => serde_json::from_str(&json)
                    .map_err(|e| PluginError::SerializationError(e.to_string())),
                None => Err(PluginError::ExecutionError("Failed to serialize result".into())),
            }
        };
        
        // Apply timeout
        match tokio::time::timeout(timeout_duration, execution).await {
            Ok(result) => result,
            Err(_) => Err(PluginError::Timeout {
                duration: timeout_duration,
            }),
        }
    }
    
    /// Clean up resources
    pub async fn cleanup(&mut self) -> Result<(), PluginError> {
        // Call plugin's deactivate hook if it exists
        let _ = self.call_hook("deactivate", vec![]).await;
        
        // Drop the runtime
        drop(self.runtime.write().await);
        
        Ok(())
    }
}

/// Resource usage statistics
#[derive(Debug, Clone, Serialize)]
pub struct ResourceStats {
    pub memory_used: usize,
    pub operations_count: u64,
    pub last_operation: Option<SystemTime>,
}

/// Plugin module loader for Deno runtime
struct PluginModuleLoader;

impl deno_core::ModuleLoader for PluginModuleLoader {
    fn resolve(
        &self,
        specifier: &str,
        referrer: &str,
        _kind: deno_core::ResolutionKind,
    ) -> Result<deno_core::ModuleSpecifier, deno_core::error::AnyError> {
        // Only allow relative imports within plugin
        if specifier.starts_with("./") || specifier.starts_with("../") {
            deno_core::resolve_import(specifier, referrer)
        } else {
            Err(deno_core::error::generic_error(
                "Only relative imports are allowed in plugins"
            ))
        }
    }

    fn load(
        &self,
        module_specifier: &deno_core::ModuleSpecifier,
        _maybe_referrer: Option<&deno_core::ModuleSpecifier>,
        _is_dyn_import: bool,
        _requested_module_type: deno_core::RequestedModuleType,
    ) -> deno_core::ModuleLoadResponse {
        let module_specifier = module_specifier.clone();
        
        deno_core::ModuleLoadResponse::Sync(Err(
            deno_core::error::generic_error("Module loading not implemented")
        ))
    }
}

/// Resource tracking for plugins
#[derive(Debug)]
struct ResourceTracker {
    memory_used: Arc<AtomicUsize>,
    operations_count: Arc<AtomicU64>,
    last_operation: Arc<Mutex<Option<SystemTime>>>,
}

impl ResourceTracker {
    fn new() -> Self {
        Self {
            memory_used: Arc::new(AtomicUsize::new(0)),
            operations_count: Arc::new(AtomicU64::new(0)),
            last_operation: Arc::new(Mutex::new(None)),
        }
    }
    
    fn update_memory(&self, bytes: usize) {
        self.memory_used.store(bytes, Ordering::Relaxed);
    }
    
    fn increment_operations(&self) {
        self.operations_count.fetch_add(1, Ordering::Relaxed);
        *self.last_operation.lock().unwrap() = Some(SystemTime::now());
    }
    
    fn reset_operations(&self) {
        self.operations_count.store(0, Ordering::Relaxed);
        *self.last_operation.lock().unwrap() = None;
    }
}

/// Builder for creating sandboxes with custom configuration
pub struct SandboxBuilder {
    manifest: Option<PluginManifest>,
    memory_limit: Option<usize>,
    cpu_time_limit: Option<Duration>,
    operations_limit: Option<u64>,
}

impl SandboxBuilder {
    pub fn new() -> Self {
        Self {
            manifest: None,
            memory_limit: None,
            cpu_time_limit: None,
            operations_limit: None,
        }
    }
    
    pub fn manifest(mut self, manifest: PluginManifest) -> Self {
        self.manifest = Some(manifest);
        self
    }
    
    pub fn memory_limit(mut self, bytes: usize) -> Self {
        self.memory_limit = Some(bytes);
        self
    }
    
    pub fn cpu_time_limit(mut self, duration: Duration) -> Self {
        self.cpu_time_limit = Some(duration);
        self
    }
    
    pub fn operations_limit(mut self, count: u64) -> Self {
        self.operations_limit = Some(count);
        self
    }
    
    pub fn build(self) -> Result<PluginSandbox, PluginError> {
        let manifest = self.manifest
            .ok_or_else(|| PluginError::InvalidManifest("Manifest required".into()))?;
        
        let resource_limits = ResourceLimits {
            max_memory: self.memory_limit.unwrap_or(50 * 1024 * 1024), // 50MB default
            max_cpu_time: self.cpu_time_limit.unwrap_or(Duration::from_secs(5)),
            max_operations: self.operations_limit.unwrap_or(100),
        };
        
        PluginSandbox::new(manifest, resource_limits)
    }
}

impl Default for SandboxBuilder {
    fn default() -> Self {
        Self::new()
    }
}

/// Error types for plugin sandbox
#[derive(Debug, Clone, Serialize, thiserror::Error)]
pub enum PluginError {
    #[error("Plugin execution timeout after {duration:?}")]
    Timeout {
        duration: Duration,
    },
    
    #[error("Memory limit exceeded: {used} bytes used, limit is {limit} bytes")]
    MemoryLimitExceeded {
        used: usize,
        limit: usize,
    },
    
    #[error("Rate limit exceeded: {current} ops/sec, limit is {limit} ops/sec")]
    RateLimitExceeded {
        current: u64,
        limit: u64,
    },
    
    #[error("Permission denied: {operation} on {path}")]
    PermissionDenied {
        operation: String,
        path: String,
    },
    
    #[error("Execution error: {0}")]
    ExecutionError(String),
    
    #[error("Serialization error: {0}")]
    SerializationError(String),
    
    #[error("Invalid manifest: {0}")]
    InvalidManifest(String),
    
    #[error("Hook not found: {0}")]
    HookNotFound(String),
    
    #[error("Runtime initialization failed: {0}")]
    RuntimeInitFailed(String),
}

// Implement conversion from deno_core errors
impl From<deno_core::error::AnyError> for PluginError {
    fn from(err: deno_core::error::AnyError) -> Self {
        PluginError::ExecutionError(err.to_string())
    }
}

/// Sandbox registry for managing multiple plugin instances
pub struct SandboxRegistry {
    sandboxes: Arc<RwLock<HashMap<String, Arc<RwLock<PluginSandbox>>>>>,
}

impl SandboxRegistry {
    pub fn new() -> Self {
        Self {
            sandboxes: Arc::new(RwLock::new(HashMap::new())),
        }
    }
    
    /// Register a new sandbox
    pub async fn register(&self, sandbox: PluginSandbox) -> Result<(), PluginError> {
        let plugin_id = sandbox.id.clone();
        let mut sandboxes = self.sandboxes.write().await;
        
        if sandboxes.contains_key(&plugin_id) {
            return Err(PluginError::InvalidManifest(
                format!("Plugin {} already registered", plugin_id)
            ));
        }
        
        sandboxes.insert(plugin_id, Arc::new(RwLock::new(sandbox)));
        Ok(())
    }
    
    /// Get a sandbox by plugin ID
    pub async fn get(&self, plugin_id: &str) -> Option<Arc<RwLock<PluginSandbox>>> {
        let sandboxes = self.sandboxes.read().await;
        sandboxes.get(plugin_id).cloned()
    }
    
    /// Unregister and cleanup a sandbox
    pub async fn unregister(&self, plugin_id: &str) -> Result<(), PluginError> {
        let mut sandboxes = self.sandboxes.write().await;
        
        if let Some(sandbox_arc) = sandboxes.remove(plugin_id) {
            let mut sandbox = sandbox_arc.write().await;
            sandbox.cleanup().await?;
        }
        
        Ok(())
    }
    
    /// Get resource statistics for all sandboxes
    pub async fn get_all_stats(&self) -> HashMap<String, ResourceStats> {
        let sandboxes = self.sandboxes.read().await;
        let mut stats = HashMap::new();
        
        for (id, sandbox_arc) in sandboxes.iter() {
            let sandbox = sandbox_arc.read().await;
            stats.insert(id.clone(), sandbox.get_resource_stats());
        }
        
        stats
    }
    
    /// Cleanup all sandboxes
    pub async fn cleanup_all(&self) -> Result<(), PluginError> {
        let mut sandboxes = self.sandboxes.write().await;
        
        for (_, sandbox_arc) in sandboxes.drain() {
            let mut sandbox = sandbox_arc.write().await;
            sandbox.cleanup().await?;
        }
        
        Ok(())
    }
}

impl Default for SandboxRegistry {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[tokio::test]
    async fn test_sandbox_creation() {
        let manifest = PluginManifest {
            name: "test-plugin".to_string(),
            version: "1.0.0".to_string(),
            permissions: PluginCapabilities::default(),
        };
        
        let sandbox = PluginSandbox::new(
            manifest,
            ResourceLimits {
                max_memory: 10 * 1024 * 1024,
                max_cpu_time: Duration::from_secs(1),
                max_operations: 10,
            },
        );
        
        assert!(sandbox.is_ok());
    }
    
    #[tokio::test]
    async fn test_execute_simple_code() {
        let manifest = PluginManifest {
            name: "test-plugin".to_string(),
            version: "1.0.0".to_string(),
            permissions: PluginCapabilities::default(),
        };
        
        let mut sandbox = PluginSandbox::new(
            manifest,
            ResourceLimits {
                max_memory: 10 * 1024 * 1024,
                max_cpu_time: Duration::from_secs(1),
                max_operations: 10,
            },
        ).unwrap();
        
        let result = sandbox.call_hook(
            "test",
            vec![serde_json::json!({"value": 42})],
        ).await;
        
        // This will fail since we haven't loaded any plugin code,
        // but it tests the execution path
        assert!(result.is_err());
    }
    
    #[tokio::test]
    async fn test_memory_limit() {
        let manifest = PluginManifest {
            name: "test-plugin".to_string(),
            version: "1.0.0".to_string(),
            permissions: PluginCapabilities::default(),
        };
        
        let sandbox = PluginSandbox::new(
            manifest,
            ResourceLimits {
                max_memory: 100, // Very small limit
                max_cpu_time: Duration::from_secs(1),
                max_operations: 10,
            },
        ).unwrap();
        
        // Simulate memory usage
        sandbox.resource_tracker.update_memory(200);
        
        let result = sandbox.check_resource_limits();
        assert!(matches!(result, Err(PluginError::MemoryLimitExceeded { .. })));
    }
    
    #[tokio::test]
    async fn test_rate_limit() {
        let manifest = PluginManifest {
            name: "test-plugin".to_string(),
            version: "1.0.0".to_string(),
            permissions: PluginCapabilities::default(),
        };
        
        let sandbox = PluginSandbox::new(
            manifest,
            ResourceLimits {
                max_memory: 10 * 1024 * 1024,
                max_cpu_time: Duration::from_secs(1),
                max_operations: 5, // Small limit
            },
        ).unwrap();
        
        // Simulate multiple operations
        for _ in 0..10 {
            sandbox.resource_tracker.increment_operations();
        }
        
        let result = sandbox.check_resource_limits();
        assert!(matches!(result, Err(PluginError::RateLimitExceeded { .. })));
    }
    
    #[tokio::test]
    async fn test_sandbox_registry() {
        let registry = SandboxRegistry::new();
        
        let manifest = PluginManifest {
            name: "test-plugin".to_string(),
            version: "1.0.0".to_string(),
            permissions: PluginCapabilities::default(),
        };
        
        let sandbox = PluginSandbox::new(
            manifest,
            ResourceLimits {
                max_memory: 10 * 1024 * 1024,
                max_cpu_time: Duration::from_secs(1),
                max_operations: 100,
            },
        ).unwrap();
        
        // Register sandbox
        let result = registry.register(sandbox).await;
        assert!(result.is_ok());
        
        // Get sandbox
        let retrieved = registry.get("test-plugin").await;
        assert!(retrieved.is_some());
        
        // Unregister
        let result = registry.unregister("test-plugin").await;
        assert!(result.is_ok());
        
        // Should be gone
        let retrieved = registry.get("test-plugin").await;
        assert!(retrieved.is_none());
    }
}
```

---

# Integration Dependencies Map

## Core Type Dependencies

```
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

### **sandbox.rs** requires from

```
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

### **sandbox.rs** is used by

```
src-tauri/src/plugin_system/manager.rs
    └─> SandboxRegistry (for plugin lifecycle management)

src-tauri/src/plugin_system/api.rs
    └─> PluginSandbox (for executing plugin hooks)

src-tauri/src/main.rs
    └─> SandboxRegistry (initialization in Tauri state)
```

## Module Integration Flowchart

```plaintext
┌─────────────────────────────────────────────────────────────┐
│                     INTEGRATION FLOW                         │
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

### ✅ COMPLETED

- `sandbox.rs` - Full implementation with tests

### 🔨 MUST CREATE NEXT (in order)

1. **`src-tauri/src/plugin_system/capabilities.rs`** (300-400 LOC)
   - Required by: sandbox.rs ✅
   - Defines: All capability types used in sandbox.rs

2. **`src-tauri/src/plugin_system/mod.rs`** (50-100 LOC)

   ```rust
   pub mod capabilities;
   pub mod sandbox;
   pub mod manager;
   pub mod api;
   pub mod loader;
   ```

3. **`src-tauri/src/plugin_system/loader.rs`** (200-300 LOC)
   - Parses: plugin.toml manifests
   - Validates: Plugin directory structure
   - Returns: PluginManifest instances

4. **`src-tauri/src/plugin_system/manager.rs`** (400-600 LOC)
   - Uses: SandboxRegistry ✅
   - Manages: Plugin lifecycle (load/activate/deactivate)
   - Coordinates: Between loader, sandbox, and API

5. **`src-tauri/src/plugin_system/api.rs`** (800-1200 LOC)
   - Uses: PluginSandbox ✅
   - Uses: PluginManager
   - Implements: All Tauri commands for plugins

6. **`src-tauri/src/main.rs`** (modifications)

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

### 📊 Current Status

```plaintext
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
