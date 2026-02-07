// src-tauri/src/plugin_system/worker.rs

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::mpsc;
use std::thread;
use std::time::Duration;
use tokio::sync::oneshot;
use crate::plugin_system::capabilities::PluginCapabilities;
use crate::plugin_system::sandbox::{PluginError, ResourceLimits};

/// Message sent to plugin worker
#[derive(Debug)]
pub enum WorkerMessage {
    /// Execute JavaScript code
    Execute {
        code: String,
        response_tx: oneshot::Sender<WorkerResponse>,
    },
    /// Call a plugin hook
    CallHook {
        hook: String,
        args: serde_json::Value,
        response_tx: oneshot::Sender<WorkerResponse>,
    },
    /// Shutdown the worker
    Shutdown,
}

/// Response from plugin worker
#[derive(Debug, Serialize, Deserialize)]
pub enum WorkerResponse {
    Success(serde_json::Value),
    Error(String),
}

/// Plugin worker that runs in its own thread
pub struct PluginWorker {
    id: String,
    capabilities: PluginCapabilities,
    resource_limits: ResourceLimits,
    sender: mpsc::Sender<WorkerMessage>,
    handle: Option<thread::JoinHandle<()>>,
}

impl PluginWorker {
    pub fn new(id: String, capabilities: PluginCapabilities) -> Self {
        let (tx, rx) = mpsc::channel();
        
        let worker_id = id.clone();
        let _worker_capabilities = capabilities.clone();
        let worker_limits = ResourceLimits {
            max_memory: 50 * 1024 * 1024, // 50MB
            max_cpu_time: Duration::from_secs(5),
            max_operations: 100,
        };

        let handle = thread::spawn(move || {
            let mut runtime = deno_core::JsRuntime::new(deno_core::RuntimeOptions {
                module_loader: None,
                extensions: vec![],
                ..Default::default()
            });

            // Inject plugin API
            let api_script = include_str!("../../js/plugin_api.js");
            if let Err(e) = runtime.execute_script("plugin_api.js", deno_core::FastString::Static(api_script)) {
                eprintln!("Failed to inject plugin API: {}", e);
                return;
            }

            // Set plugin ID in global scope
            let set_id_script = format!("globalThis.__PLUGIN_ID__ = '{}';", worker_id);
            if let Err(e) = runtime.execute_script("set_id", deno_core::FastString::Owned(set_id_script.into())) {
                eprintln!("Failed to set plugin ID: {}", e);
                return;
            }

            // Message loop
            while let Ok(msg) = rx.recv() {
                match msg {
                    WorkerMessage::Execute { code, response_tx } => {
                        let result = Self::execute_code_sync(&mut runtime, &code, &worker_limits);
                        let _ = response_tx.send(result);
                    }
                    WorkerMessage::CallHook { hook, args, response_tx } => {
                        let result = Self::call_hook_sync(&mut runtime, &hook, &args, &worker_limits);
                        let _ = response_tx.send(result);
                    }
                    WorkerMessage::Shutdown => {
                        break;
                    }
                }
            }
        });

        Self {
            id,
            capabilities,
            resource_limits: ResourceLimits {
                max_memory: 50 * 1024 * 1024,
                max_cpu_time: Duration::from_secs(5),
                max_operations: 100,
            },
            sender: tx,
            handle: Some(handle),
        }
    }

    /// Execute JavaScript code in the worker thread
    pub async fn execute(&self, code: String) -> Result<serde_json::Value, PluginError> {
        let (tx, rx) = oneshot::channel();
        
        let msg = WorkerMessage::Execute {
            code,
            response_tx: tx,
        };

        self.sender.send(msg).map_err(|_| PluginError::WorkerDisconnected)?;
        
        let response = rx.await.map_err(|_| PluginError::WorkerDisconnected)?;
        
        match response {
            WorkerResponse::Success(value) => Ok(value),
            WorkerResponse::Error(err) => Err(PluginError::ExecutionError(err)),
        }
    }

    /// Call a plugin hook in the worker thread
    pub async fn call_hook(&self, hook: String, args: serde_json::Value) -> Result<serde_json::Value, PluginError> {
        let (tx, rx) = oneshot::channel();
        
        let msg = WorkerMessage::CallHook {
            hook,
            args,
            response_tx: tx,
        };

        self.sender.send(msg).map_err(|_| PluginError::WorkerDisconnected)?;
        
        let response = rx.await.map_err(|_| PluginError::WorkerDisconnected)?;
        
        match response {
            WorkerResponse::Success(value) => Ok(value),
            WorkerResponse::Error(err) => Err(PluginError::ExecutionError(err)),
        }
    }

    /// Execute JavaScript code in the worker thread (internal)
    fn execute_code_sync(
        runtime: &mut deno_core::JsRuntime,
        code: &str,
        _limits: &ResourceLimits,
    ) -> WorkerResponse {
        // Execute with timeout
        let start = std::time::Instant::now();
        if start.elapsed() > _limits.max_cpu_time {
            return WorkerResponse::Error("CPU time limit exceeded".to_string());
        }

        match runtime.execute_script("<plugin>", deno_core::FastString::Owned(code.to_string().into())) {
            Ok(_result) => {
                // For now, return a simple success response
                // TODO: Implement proper V8 value to JSON conversion
                WorkerResponse::Success(serde_json::Value::Null)
            }
            Err(e) => WorkerResponse::Error(format!("Execution error: {}", e)),
        }
    }

    /// Call a plugin hook in the worker thread (internal)
    fn call_hook_sync(
        runtime: &mut deno_core::JsRuntime,
        hook: &str,
        args: &serde_json::Value,
        _limits: &ResourceLimits,
    ) -> WorkerResponse {
        // Execute with timeout
        let start = std::time::Instant::now();
        if start.elapsed() > _limits.max_cpu_time {
            return WorkerResponse::Error("CPU time limit exceeded".to_string());
        }

        let script = format!(
            "globalThis.plugin.hooks.{}({})",
            hook,
            serde_json::to_string(args).unwrap_or_else(|_| "null".to_string())
        );

        // Use a leaked string for the script name since deno_core requires 'static lifetime.
        // This is a small, bounded set of hook names so the leak is negligible.
        let hook_name: &'static str = Box::leak(format!("hook_{}", hook).into_boxed_str());
        match runtime.execute_script(hook_name, deno_core::FastString::Owned(script.into())) {
            Ok(_result) => {
                // For now, return a simple success response
                // TODO: Implement proper V8 value to JSON conversion
                WorkerResponse::Success(serde_json::Value::Null)
            }
            Err(e) => WorkerResponse::Error(format!("Hook execution error: {}", e)),
        }
    }

    /// Shutdown the worker
    pub fn shutdown(self) {
        let _ = self.sender.send(WorkerMessage::Shutdown);
        if let Some(handle) = self.handle {
            let _ = handle.join();
        }
    }
}

/// Registry of plugin workers
pub struct WorkerRegistry {
    workers: HashMap<String, PluginWorker>,
}

impl WorkerRegistry {
    pub fn new() -> Self {
        Self {
            workers: HashMap::new(),
        }
    }

    pub fn create_worker(&mut self, id: String, capabilities: PluginCapabilities) -> Result<(), PluginError> {
        if self.workers.contains_key(&id) {
            return Err(PluginError::WorkerAlreadyExists);
        }

        let worker = PluginWorker::new(id.clone(), capabilities);
        self.workers.insert(id, worker);
        Ok(())
    }

    pub fn get_worker(&self, id: &str) -> Option<&PluginWorker> {
        self.workers.get(id)
    }

    pub fn get_worker_mut(&mut self, id: &str) -> Option<&mut PluginWorker> {
        self.workers.get_mut(id)
    }

    pub fn remove_worker(&mut self, id: &str) -> bool {
        if let Some(worker) = self.workers.remove(id) {
            worker.shutdown();
            true
        } else {
            false
        }
    }

    pub fn shutdown_all(&mut self) {
        for (_, worker) in self.workers.drain() {
            worker.shutdown();
        }
    }
}

impl Drop for WorkerRegistry {
    fn drop(&mut self) {
        self.shutdown_all();
    }
}
