# worker.rs

## 1.1 [worker-rs](src-tauri/src/plugin_system/worker.rs)

**NEW MODULE** - Thread-safe JavaScript execution for plugins

### Why This Module Exists

- **Solves thread safety issues** - `deno_core::JsRuntime` is not `Send + Sync`
- **Enables Tauri command compatibility** - Workers run in separate threads
- **Provides plugin isolation** - Each plugin has its own JavaScript runtime
- **Message passing architecture** - Clean communication between main thread and workers
- **Resource management** - Workers handle their own resource limits

### Architecture

```rust
// Main Thread (Tauri Commands)
PluginSandbox
    ↓ (message passing via mpsc::channel)
PluginWorker (Dedicated Thread)
    ├─> deno_core::JsRuntime
    ├─> Resource limits enforcement
    ├─> JavaScript execution
    └─> Response via oneshot::Sender
```

### Key Components

#### 1. **WorkerMessage** - Communication Protocol

```rust
pub enum WorkerMessage {
    Execute { code: String, response_tx: oneshot::Sender<WorkerResponse> },
    CallHook { hook: String, args: serde_json::Value, response_tx: oneshot::Sender<WorkerResponse> },
    Shutdown,
}
```

#### 2. **PluginWorker** - Thread-Safe JavaScript Runtime

```rust
pub struct PluginWorker {
    id: String,
    capabilities: PluginCapabilities,
    sender: mpsc::Sender<WorkerMessage>,
    handle: Option<thread::JoinHandle<()>>,
}
```

#### 3. **WorkerRegistry** - Worker Management

```rust
pub struct WorkerRegistry {
    workers: HashMap<String, PluginWorker>,
}
```

### Integration Points

- **PluginSandbox** - Uses workers for JavaScript execution
- **Message passing** - `mpsc::channel` for communication
- **Resource limits** - Enforced in worker threads
- **Thread management** - Spawning and cleanup of worker threads

### Thread Safety Solution

**Problem**: `deno_core::JsRuntime` is not `Send + Sync`, making it incompatible with Tauri's async command system.

**Solution**:

1. **Dedicated worker threads** - Each plugin runs in its own thread
2. **Message passing** - Main thread communicates with workers via channels
3. **No shared state** - Each worker has its own `JsRuntime` instance
4. **Clean shutdown** - Workers can be safely terminated

### Usage Example

```rust
// Create a worker for a plugin
let worker = PluginWorker::new(plugin_id, capabilities);

// Execute JavaScript code
let result = worker.execute("console.log('Hello from plugin!')").await?;

// Call a plugin hook
let result = worker.call_hook("onActivate", serde_json::Value::Null).await?;

// Shutdown the worker
worker.shutdown();
```

### Benefits

1. **Thread Safety** - No more `Send + Sync` issues with Tauri commands
2. **Plugin Isolation** - Each plugin runs in complete isolation
3. **Resource Management** - Workers handle their own resource limits
4. **Scalability** - Can run multiple plugins concurrently
5. **Clean Architecture** - Clear separation between main thread and workers

### Dependencies

```toml
[dependencies]
deno_core = "0.230"  # JavaScript runtime
tokio = { version = "1", features = ["full"] }  # Async runtime
serde = { version = "1.0", features = ["derive"] }  # Serialization
```

### Status: ✅ **COMPLETE**

This module provides the thread-safe foundation for the entire plugin system, solving the fundamental architectural issue that prevented plugins from working with Tauri commands.
