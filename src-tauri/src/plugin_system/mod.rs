// src-tauri/src/plugin_system/mod.rs

pub mod api;
pub mod capabilities;
pub mod loader;
pub mod manager;
pub mod sandbox;
pub mod trust;
pub mod worker;

// Re-export commonly used types for external consumers
#[allow(unused_imports)]
pub use api::{AuditLogger, AuditEvent};
#[allow(unused_imports)]
pub use capabilities::{PluginCapabilities, FilesystemCapability, NetworkCapability, CommandCapability, UiCapability};
#[allow(unused_imports)]
pub use loader::{PluginLoader, PluginManifest, PluginInfo};
#[allow(unused_imports)]
pub use manager::{PluginManager, PluginState, PluginStatus};
#[allow(unused_imports)]
pub use sandbox::{PluginSandbox, SandboxRegistry, ResourceLimits, ResourceStats};
#[allow(unused_imports)]
pub use trust::{TrustLevel, PluginSignature};

// Note: Tauri commands are defined in main.rs, not in the api module
