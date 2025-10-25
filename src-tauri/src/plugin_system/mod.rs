// src-tauri/src/plugin_system/mod.rs

pub mod api;
pub mod capabilities;
pub mod loader;
pub mod manager;
pub mod sandbox;
pub mod trust;
pub mod worker;

// Re-export commonly used types
pub use api::{AuditLogger, AuditEvent};
pub use capabilities::{PluginCapabilities, FilesystemCapability, NetworkCapability, CommandCapability, UiCapability};
pub use loader::{PluginLoader, PluginManifest, PluginInfo};
pub use manager::{PluginManager, PluginState, PluginStatus};
pub use sandbox::{PluginSandbox, SandboxRegistry, ResourceLimits, ResourceStats};
pub use trust::{TrustLevel, PluginSignature};

// Note: Tauri commands are defined in main.rs, not in the api module
