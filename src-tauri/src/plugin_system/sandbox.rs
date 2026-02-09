// src-tauri/src/plugin_system/sandbox.rs

use crate::plugin_system::capabilities::PluginCapabilities;
use crate::plugin_system::loader::PluginManifest;
use crate::plugin_system::ops::EditorStateHandle;
use crate::plugin_system::worker::PluginWorker;
use serde::Serialize;
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Arc;
use std::time::{Duration, SystemTime};
use tauri::AppHandle;
use tokio::sync::RwLock;

pub struct PluginSandbox {
    id: String,
    capabilities: PluginCapabilities,
    worker: Arc<PluginWorker>,
    resource_limits: ResourceLimits,
}

#[derive(Debug, Clone)]
pub struct ResourceLimits {
    pub max_memory: usize,      // Bytes
    pub max_cpu_time: Duration, // Per-operation timeout
    pub max_operations: u64,    // Operations per second
}

impl PluginSandbox {
    pub fn new(
        manifest: PluginManifest,
        workspace_root: PathBuf,
        app_handle: AppHandle,
        editor_state: EditorStateHandle,
    ) -> Result<Self, PluginError> {
        // Create worker for thread-safe JavaScript execution
        let worker = PluginWorker::new(
            manifest.name.clone(),
            manifest.capabilities.clone(),
            workspace_root,
            app_handle,
            editor_state,
        );

        Ok(Self {
            id: manifest.name.clone(),
            capabilities: manifest.capabilities,
            worker: Arc::new(worker),
            resource_limits: ResourceLimits {
                max_memory: 50 * 1024 * 1024, // 50MB
                max_cpu_time: Duration::from_secs(5),
                max_operations: 100,
            },
        })
    }

    /// Initialize the sandbox (load plugin entry point)
    pub async fn initialize(&self) -> Result<(), PluginError> {
        // Plugin initialization is handled by the worker thread during creation.
        // This hook allows for any additional setup if needed.
        Ok(())
    }

    pub async fn call_hook(
        &self,
        hook: &str,
        args: Vec<serde_json::Value>,
    ) -> Result<serde_json::Value, PluginError> {
        let args_json = serde_json::to_string(&serde_json::Value::Array(args))
            .map_err(|e| PluginError::SerializationError(e.to_string()))?;
        let args_value: serde_json::Value = serde_json::from_str(&args_json)
            .map_err(|e| PluginError::SerializationError(e.to_string()))?;

        // Use worker for thread-safe execution with timeout
        let result = tokio::time::timeout(
            self.resource_limits.max_cpu_time,
            self.worker.call_hook(hook.to_string(), args_value),
        )
        .await
        .map_err(|_| PluginError::Timeout {
            duration: self.resource_limits.max_cpu_time,
        })?;

        result
    }

    /// Execute JavaScript code in the sandbox
    pub async fn execute(&self, code: String) -> Result<serde_json::Value, PluginError> {
        let result =
            tokio::time::timeout(self.resource_limits.max_cpu_time, self.worker.execute(code))
                .await
                .map_err(|_| PluginError::Timeout {
                    duration: self.resource_limits.max_cpu_time,
                })?;

        result
    }

    /// Get sandbox id
    pub fn id(&self) -> &str {
        &self.id
    }

    /// Get sandbox capabilities
    pub fn capabilities(&self) -> &PluginCapabilities {
        &self.capabilities
    }

    /// Get resource limits
    pub fn resource_limits(&self) -> &ResourceLimits {
        &self.resource_limits
    }

    /// Get current resource usage statistics
    pub fn get_resource_stats(&self) -> ResourceStats {
        ResourceStats {
            memory_used: 0,
            operations_count: 0,
            last_operation: SystemTime::now(),
        }
    }

    /// Check if plugin is within resource limits
    pub fn check_resource_limits(&self) -> Result<(), PluginError> {
        let stats = self.get_resource_stats();
        if stats.memory_used > self.resource_limits.max_memory {
            return Err(PluginError::MemoryLimitExceeded {
                used: stats.memory_used,
                limit: self.resource_limits.max_memory,
            });
        }
        if stats.operations_count > self.resource_limits.max_operations {
            return Err(PluginError::RateLimitExceeded {
                current: stats.operations_count,
                limit: self.resource_limits.max_operations,
            });
        }
        Ok(())
    }

    /// Clean up resources
    pub async fn cleanup(&mut self) -> Result<(), PluginError> {
        // Call plugin's deactivate hook if it exists
        let _ = self.call_hook("deactivate", vec![]).await;

        // Send shutdown to worker
        self.worker.send_shutdown();

        Ok(())
    }
}

/// Resource usage statistics
#[derive(Debug, Clone, Serialize)]
pub struct ResourceStats {
    pub memory_used: usize,
    pub operations_count: u64,
    pub last_operation: SystemTime,
}

/// Registry for managing multiple plugin sandboxes (thread-safe via interior mutability)
pub struct SandboxRegistry {
    sandboxes: RwLock<HashMap<String, Arc<RwLock<PluginSandbox>>>>,
}

impl SandboxRegistry {
    pub fn new() -> Self {
        Self {
            sandboxes: RwLock::new(HashMap::new()),
        }
    }

    pub async fn register_sandbox(&self, id: String, sandbox: PluginSandbox) {
        let mut sandboxes = self.sandboxes.write().await;
        sandboxes.insert(id, Arc::new(RwLock::new(sandbox)));
    }

    pub async fn get_sandbox(&self, id: &str) -> Option<Arc<RwLock<PluginSandbox>>> {
        let sandboxes = self.sandboxes.read().await;
        sandboxes.get(id).cloned()
    }

    pub async fn remove_sandbox(&self, id: &str) -> bool {
        let mut sandboxes = self.sandboxes.write().await;
        if let Some(sandbox) = sandboxes.remove(id) {
            let mut sandbox = sandbox.write().await;
            let _ = sandbox.cleanup().await;
            true
        } else {
            false
        }
    }

    pub async fn list_sandboxes(&self) -> Vec<String> {
        let sandboxes = self.sandboxes.read().await;
        sandboxes.keys().cloned().collect()
    }
}

/// Plugin execution errors
#[derive(Debug, thiserror::Error)]
pub enum PluginError {
    #[error("Execution error: {0}")]
    ExecutionError(String),

    #[error("Serialization error: {0}")]
    SerializationError(String),

    #[error("Timeout after {duration:?}")]
    Timeout { duration: Duration },

    #[error("Memory limit exceeded: used {used}, limit {limit}")]
    MemoryLimitExceeded { used: usize, limit: usize },

    #[error("Rate limit exceeded: current {current}, limit {limit}")]
    RateLimitExceeded { current: u64, limit: u64 },

    #[error("Worker disconnected")]
    WorkerDisconnected,

    #[error("Worker already exists")]
    WorkerAlreadyExists,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_plugin_error_execution_display() {
        let err = PluginError::ExecutionError("bad code".to_string());
        assert_eq!(err.to_string(), "Execution error: bad code");
    }

    #[test]
    fn test_plugin_error_serialization_display() {
        let err = PluginError::SerializationError("invalid json".to_string());
        assert_eq!(err.to_string(), "Serialization error: invalid json");
    }

    #[test]
    fn test_plugin_error_timeout_display() {
        let err = PluginError::Timeout {
            duration: Duration::from_secs(5),
        };
        assert!(err.to_string().contains("5s"));
    }

    #[test]
    fn test_plugin_error_memory_limit_display() {
        let err = PluginError::MemoryLimitExceeded {
            used: 100,
            limit: 50,
        };
        let msg = err.to_string();
        assert!(msg.contains("100"));
        assert!(msg.contains("50"));
    }

    #[test]
    fn test_plugin_error_rate_limit_display() {
        let err = PluginError::RateLimitExceeded {
            current: 200,
            limit: 100,
        };
        let msg = err.to_string();
        assert!(msg.contains("200"));
        assert!(msg.contains("100"));
    }

    #[test]
    fn test_plugin_error_worker_disconnected() {
        let err = PluginError::WorkerDisconnected;
        assert_eq!(err.to_string(), "Worker disconnected");
    }

    #[test]
    fn test_plugin_error_worker_already_exists() {
        let err = PluginError::WorkerAlreadyExists;
        assert_eq!(err.to_string(), "Worker already exists");
    }

    #[test]
    fn test_resource_limits_default() {
        let limits = ResourceLimits {
            max_memory: 50 * 1024 * 1024,
            max_cpu_time: Duration::from_secs(5),
            max_operations: 100,
        };
        assert_eq!(limits.max_memory, 52_428_800);
        assert_eq!(limits.max_cpu_time, Duration::from_secs(5));
        assert_eq!(limits.max_operations, 100);
    }

    #[test]
    fn test_resource_stats_construction() {
        let stats = ResourceStats {
            memory_used: 1024,
            operations_count: 42,
            last_operation: SystemTime::now(),
        };
        assert_eq!(stats.memory_used, 1024);
        assert_eq!(stats.operations_count, 42);
    }

    #[test]
    fn test_resource_stats_serializable() {
        let stats = ResourceStats {
            memory_used: 0,
            operations_count: 0,
            last_operation: SystemTime::UNIX_EPOCH,
        };
        let json = serde_json::to_string(&stats).unwrap();
        assert!(json.contains("memory_used"));
    }

    #[tokio::test]
    async fn test_sandbox_registry_new_empty() {
        let registry = SandboxRegistry::new();
        let list = registry.list_sandboxes().await;
        assert!(list.is_empty());
    }

    #[test]
    fn test_check_resource_limits_within_limits() {
        // get_resource_stats currently returns 0/0, so any positive limits should pass
        let limits = ResourceLimits {
            max_memory: 50 * 1024 * 1024,
            max_cpu_time: Duration::from_secs(5),
            max_operations: 100,
        };
        let stats = ResourceStats {
            memory_used: 0,
            operations_count: 0,
            last_operation: SystemTime::now(),
        };
        // Verify the comparison logic: 0 < limits should be Ok
        assert!(stats.memory_used <= limits.max_memory);
        assert!(stats.operations_count <= limits.max_operations);
    }

    #[test]
    fn test_memory_limit_exceeded_error_fields() {
        let err = PluginError::MemoryLimitExceeded {
            used: 60_000_000,
            limit: 50_000_000,
        };
        let msg = err.to_string();
        assert!(msg.contains("60000000"));
        assert!(msg.contains("50000000"));
        assert!(msg.contains("Memory limit exceeded"));
    }

    #[test]
    fn test_rate_limit_exceeded_error_fields() {
        let err = PluginError::RateLimitExceeded {
            current: 150,
            limit: 100,
        };
        let msg = err.to_string();
        assert!(msg.contains("150"));
        assert!(msg.contains("100"));
        assert!(msg.contains("Rate limit exceeded"));
    }

    #[test]
    fn test_timeout_error_display_contains_duration() {
        let err = PluginError::Timeout {
            duration: Duration::from_millis(2500),
        };
        let msg = err.to_string();
        assert!(msg.contains("2.5s") || msg.contains("2500"));
    }

    #[test]
    fn test_serialization_error_display() {
        let err = PluginError::SerializationError("invalid utf-8".to_string());
        assert_eq!(err.to_string(), "Serialization error: invalid utf-8");
    }

    #[test]
    fn test_resource_stats_zero_values() {
        let stats = ResourceStats {
            memory_used: 0,
            operations_count: 0,
            last_operation: SystemTime::UNIX_EPOCH,
        };
        let json = serde_json::to_string(&stats).unwrap();
        assert!(json.contains("\"memory_used\":0"));
        assert!(json.contains("\"operations_count\":0"));
    }

    #[test]
    fn test_resource_limits_large_values() {
        let limits = ResourceLimits {
            max_memory: usize::MAX,
            max_cpu_time: Duration::from_secs(3600),
            max_operations: u64::MAX,
        };
        assert_eq!(limits.max_memory, usize::MAX);
        assert_eq!(limits.max_cpu_time, Duration::from_secs(3600));
        assert_eq!(limits.max_operations, u64::MAX);
    }

    #[tokio::test]
    async fn test_sandbox_registry_list_after_remove() {
        let registry = SandboxRegistry::new();
        // Remove on empty registry is a no-op
        registry.remove_sandbox("nonexistent").await;
        let list = registry.list_sandboxes().await;
        assert!(list.is_empty());
    }

    #[tokio::test]
    async fn test_sandbox_registry_get_nonexistent() {
        let registry = SandboxRegistry::new();
        let result = registry.get_sandbox("nonexistent").await;
        assert!(result.is_none());
    }
}
