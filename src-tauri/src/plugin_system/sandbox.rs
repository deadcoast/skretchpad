// src-tauri/src/plugin_system/sandbox.rs

use serde::{Deserialize, Serialize};
use std::time::{Duration, SystemTime};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use crate::plugin_system::worker::PluginWorker;
use crate::plugin_system::loader::PluginManifest;
use crate::plugin_system::capabilities::PluginCapabilities;

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
    pub fn new(manifest: PluginManifest) -> Result<Self, PluginError> {
        // Create worker for thread-safe JavaScript execution
        let worker = PluginWorker::new(manifest.name.clone(), manifest.capabilities.clone());
        
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

    pub async fn call_hook(&self, hook: &str, args: Vec<serde_json::Value>) -> Result<serde_json::Value, PluginError> {
        // Use worker for thread-safe execution
        let args_json = serde_json::Value::Array(args);
        self.worker.call_hook(hook.to_string(), args_json).await
    }

    /// Execute JavaScript code in the sandbox
    pub async fn execute(&self, code: String) -> Result<serde_json::Value, PluginError> {
        self.worker.execute(code).await
    }

    /// Get current resource usage statistics
    pub fn get_resource_stats(&self) -> ResourceStats {
        // For now, return basic stats since workers handle their own resource management
        ResourceStats {
            memory_used: 0,
            operations_count: 0,
            last_operation: SystemTime::now(),
        }
    }
    
    /// Check if plugin is within resource limits
    pub fn check_resource_limits(&self) -> Result<(), PluginError> {
        // Resource limits are now handled by the worker thread
        // This is a placeholder for compatibility
        Ok(())
    }

    /// Clean up resources
    pub async fn cleanup(&mut self) -> Result<(), PluginError> {
        // Call plugin's deactivate hook if it exists
        let _ = self.call_hook("deactivate", vec![]).await;
        
        // Worker cleanup is handled by the worker itself
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

/// Registry for managing multiple plugin sandboxes
pub struct SandboxRegistry {
    sandboxes: HashMap<String, Arc<RwLock<PluginSandbox>>>,
}

impl SandboxRegistry {
    pub fn new() -> Self {
        Self {
            sandboxes: HashMap::new(),
        }
    }

    pub async fn create_sandbox(&mut self, manifest: PluginManifest) -> Result<(), PluginError> {
        let id = manifest.name.clone();
        let sandbox = PluginSandbox::new(manifest)?;
        self.sandboxes.insert(id, Arc::new(RwLock::new(sandbox)));
        Ok(())
    }

    pub fn get_sandbox(&self, id: &str) -> Option<&Arc<RwLock<PluginSandbox>>> {
        self.sandboxes.get(id)
    }

    pub async fn remove_sandbox(&mut self, id: &str) -> bool {
        if let Some(sandbox) = self.sandboxes.remove(id) {
            let mut sandbox = sandbox.write().await;
            let _ = sandbox.cleanup().await;
            true
        } else {
            false
        }
    }

    pub fn list_sandboxes(&self) -> Vec<String> {
        self.sandboxes.keys().cloned().collect()
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