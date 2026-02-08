// src-tauri/src/plugin_system/worker.rs

use crate::plugin_system::capabilities::PluginCapabilities;
use crate::plugin_system::ops::{EditorStateHandle, PluginOpState};
use crate::plugin_system::sandbox::{PluginError, ResourceLimits};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::mpsc;
use std::thread;
use std::time::Duration;
use tauri::AppHandle;
use tokio::sync::oneshot;

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
    pub fn new(
        id: String,
        capabilities: PluginCapabilities,
        workspace_root: PathBuf,
        app_handle: AppHandle,
        editor_state: EditorStateHandle,
    ) -> Self {
        let (tx, rx) = mpsc::channel();

        let worker_id = id.clone();
        let worker_capabilities = capabilities.clone();
        let worker_limits = ResourceLimits {
            max_memory: 50 * 1024 * 1024, // 50MB
            max_cpu_time: Duration::from_secs(5),
            max_operations: 100,
        };

        let handle = thread::spawn(move || {
            // Create the plugin ops extension
            let ext = crate::plugin_system::ops::skretchpad_plugin_ops::init_ops_and_esm();

            let mut runtime = deno_core::JsRuntime::new(deno_core::RuntimeOptions {
                module_loader: None,
                extensions: vec![ext],
                ..Default::default()
            });

            // Inject per-plugin state into OpState
            {
                let op_state = runtime.op_state();
                let mut state = op_state.borrow_mut();
                state.put(PluginOpState {
                    plugin_id: worker_id.clone(),
                    capabilities: worker_capabilities,
                    workspace_root,
                    app_handle,
                    editor_state,
                });
            }

            // Inject plugin API
            let api_script = include_str!("../../js/plugin_api.js");
            if let Err(e) =
                runtime.execute_script("plugin_api.js", deno_core::FastString::Static(api_script))
            {
                eprintln!("Failed to inject plugin API: {}", e);
                return;
            }

            // Set plugin ID in global scope
            let set_id_script = format!("globalThis.__PLUGIN_ID__ = '{}';", worker_id);
            if let Err(e) =
                runtime.execute_script("set_id", deno_core::FastString::Owned(set_id_script.into()))
            {
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
                    WorkerMessage::CallHook {
                        hook,
                        args,
                        response_tx,
                    } => {
                        let result =
                            Self::call_hook_sync(&mut runtime, &hook, &args, &worker_limits);
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

        self.sender
            .send(msg)
            .map_err(|_| PluginError::WorkerDisconnected)?;

        let response = rx.await.map_err(|_| PluginError::WorkerDisconnected)?;

        match response {
            WorkerResponse::Success(value) => Ok(value),
            WorkerResponse::Error(err) => Err(PluginError::ExecutionError(err)),
        }
    }

    /// Call a plugin hook in the worker thread
    pub async fn call_hook(
        &self,
        hook: String,
        args: serde_json::Value,
    ) -> Result<serde_json::Value, PluginError> {
        let (tx, rx) = oneshot::channel();

        let msg = WorkerMessage::CallHook {
            hook,
            args,
            response_tx: tx,
        };

        self.sender
            .send(msg)
            .map_err(|_| PluginError::WorkerDisconnected)?;

        let response = rx.await.map_err(|_| PluginError::WorkerDisconnected)?;

        match response {
            WorkerResponse::Success(value) => Ok(value),
            WorkerResponse::Error(err) => Err(PluginError::ExecutionError(err)),
        }
    }

    /// Pump the deno_core event loop to resolve pending promises/microtasks.
    /// Runs with a timeout to prevent runaway async operations.
    fn pump_event_loop(runtime: &mut deno_core::JsRuntime, timeout: Duration) {
        let rt = tokio::runtime::Builder::new_current_thread()
            .enable_all()
            .build();

        if let Ok(rt) = rt {
            let _ = rt.block_on(async {
                tokio::time::timeout(
                    timeout,
                    // deno_core 0.230: run_event_loop takes a bool (false = don't wait for inspector)
                    runtime.run_event_loop(false),
                )
                .await
            });
        }
    }

    /// Execute JavaScript code in the worker thread (internal)
    fn execute_code_sync(
        runtime: &mut deno_core::JsRuntime,
        code: &str,
        _limits: &ResourceLimits,
    ) -> WorkerResponse {
        let start = std::time::Instant::now();

        match runtime.execute_script(
            "<plugin>",
            deno_core::FastString::Owned(code.to_string().into()),
        ) {
            Ok(_result) => {
                // Pump event loop to resolve any pending promises/microtasks
                Self::pump_event_loop(runtime, Duration::from_secs(5));

                // Check elapsed time after execution
                if start.elapsed() > _limits.max_cpu_time {
                    return WorkerResponse::Error("CPU time limit exceeded".to_string());
                }
                WorkerResponse::Success(serde_json::Value::Null)
            }
            Err(e) => WorkerResponse::Error(format!("Execution error: {}", e)),
        }
    }

    /// Get or create a cached static hook script name
    fn cached_hook_name(hook: &str) -> &'static str {
        use std::collections::HashMap as StdHashMap;
        use std::sync::LazyLock;
        use std::sync::Mutex;

        static HOOK_NAMES: LazyLock<Mutex<StdHashMap<String, &'static str>>> =
            LazyLock::new(|| Mutex::new(StdHashMap::new()));

        let mut cache = HOOK_NAMES.lock().unwrap();
        if let Some(&name) = cache.get(hook) {
            return name;
        }
        let leaked: &'static str = Box::leak(format!("hook_{}", hook).into_boxed_str());
        cache.insert(hook.to_string(), leaked);
        leaked
    }

    /// Call a plugin hook in the worker thread (internal)
    fn call_hook_sync(
        runtime: &mut deno_core::JsRuntime,
        hook: &str,
        args: &serde_json::Value,
        _limits: &ResourceLimits,
    ) -> WorkerResponse {
        let start = std::time::Instant::now();

        // Call hooks registered on globalThis.__hooks__ (set up by plugin code)
        // Falls back gracefully if hook is not registered
        let script = format!(
            "(function() {{ \
                if (typeof globalThis.__hooks__ !== 'undefined' && typeof globalThis.__hooks__.{hook} === 'function') {{ \
                    return globalThis.__hooks__.{hook}({args}); \
                }} \
                return null; \
            }})()",
            hook = hook,
            args = serde_json::to_string(args).unwrap_or_else(|_| "null".to_string())
        );

        let hook_name = Self::cached_hook_name(hook);
        match runtime.execute_script(hook_name, deno_core::FastString::Owned(script.into())) {
            Ok(_result) => {
                // Pump event loop to resolve any pending promises/microtasks
                Self::pump_event_loop(runtime, Duration::from_secs(5));

                if start.elapsed() > _limits.max_cpu_time {
                    return WorkerResponse::Error("CPU time limit exceeded".to_string());
                }
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

    pub fn create_worker(
        &mut self,
        id: String,
        capabilities: PluginCapabilities,
        workspace_root: PathBuf,
        app_handle: AppHandle,
        editor_state: EditorStateHandle,
    ) -> Result<(), PluginError> {
        if self.workers.contains_key(&id) {
            return Err(PluginError::WorkerAlreadyExists);
        }

        let worker = PluginWorker::new(
            id.clone(),
            capabilities,
            workspace_root,
            app_handle,
            editor_state,
        );
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_worker_response_success_serialization() {
        let response = WorkerResponse::Success(serde_json::json!({"result": 42}));
        let json = serde_json::to_string(&response).unwrap();
        assert!(json.contains("Success"));
        assert!(json.contains("42"));
    }

    #[test]
    fn test_worker_response_error_serialization() {
        let response = WorkerResponse::Error("something went wrong".to_string());
        let json = serde_json::to_string(&response).unwrap();
        assert!(json.contains("Error"));
        assert!(json.contains("something went wrong"));
    }

    #[test]
    fn test_worker_response_success_null() {
        let response = WorkerResponse::Success(serde_json::Value::Null);
        let json = serde_json::to_string(&response).unwrap();
        let deserialized: WorkerResponse = serde_json::from_str(&json).unwrap();
        match deserialized {
            WorkerResponse::Success(v) => assert!(v.is_null()),
            _ => panic!("Expected Success"),
        }
    }

    #[test]
    fn test_worker_response_roundtrip() {
        let original = WorkerResponse::Success(serde_json::json!({"key": "value"}));
        let json = serde_json::to_string(&original).unwrap();
        let deserialized: WorkerResponse = serde_json::from_str(&json).unwrap();
        match deserialized {
            WorkerResponse::Success(v) => assert_eq!(v["key"], "value"),
            _ => panic!("Expected Success"),
        }
    }

    #[test]
    fn test_cached_hook_name_returns_static_str() {
        let name = PluginWorker::cached_hook_name("activate");
        assert_eq!(name, "hook_activate");
    }

    #[test]
    fn test_cached_hook_name_different_hooks() {
        let name1 = PluginWorker::cached_hook_name("activate");
        let name2 = PluginWorker::cached_hook_name("deactivate");
        assert_ne!(name1, name2);
        assert_eq!(name1, "hook_activate");
        assert_eq!(name2, "hook_deactivate");
    }

    #[test]
    fn test_cached_hook_name_same_hook_returns_same_pointer() {
        let name1 = PluginWorker::cached_hook_name("on_save");
        let name2 = PluginWorker::cached_hook_name("on_save");
        // Same &'static str pointer
        assert!(std::ptr::eq(name1, name2));
    }

    #[test]
    fn test_worker_registry_new() {
        let registry = WorkerRegistry::new();
        assert!(registry.workers.is_empty());
    }
}
