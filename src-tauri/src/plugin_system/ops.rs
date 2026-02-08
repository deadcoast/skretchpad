// src-tauri/src/plugin_system/ops.rs
//
// deno_core ops that bridge plugin JavaScript API calls to actual Rust operations.
// Each op validates plugin capabilities before performing the operation.
// Ops run synchronously on the worker thread.

use crate::plugin_system::capabilities::PluginCapabilities;
use deno_core::op2;
use deno_core::OpState;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use tauri::{AppHandle, Emitter};

/// State injected into deno_core OpState for each plugin worker.
pub struct PluginOpState {
    pub plugin_id: String,
    pub capabilities: PluginCapabilities,
    pub workspace_root: PathBuf,
    pub app_handle: AppHandle,
}

// ============================================================================
// EXTENSION DEFINITION
// ============================================================================

deno_core::extension!(
    skretchpad_plugin_ops,
    ops = [
        op_plugin_read_file,
        op_plugin_write_file,
        op_plugin_list_files,
        op_plugin_fetch,
        op_plugin_execute_command,
        op_plugin_show_notification,
        op_plugin_set_status_bar,
        op_plugin_get_editor_content,
        op_plugin_get_active_file,
    ],
);

// ============================================================================
// FILESYSTEM OPS
// ============================================================================

#[op2]
#[string]
pub fn op_plugin_read_file(
    state: &mut OpState,
    #[string] path: String,
) -> Result<String, deno_core::error::AnyError> {
    let plugin_state = state.borrow::<PluginOpState>();
    let workspace = plugin_state.workspace_root.to_string_lossy().to_string();

    // Canonicalize path for security
    let canonical = std::fs::canonicalize(&path)
        .map_err(|e| deno_core::error::generic_error(format!("Invalid path '{}': {}", path, e)))?;
    let canonical_str = canonical.to_string_lossy().to_string();

    // Validate capability
    if !plugin_state
        .capabilities
        .filesystem
        .can_read(&canonical_str, &workspace)
    {
        return Err(deno_core::error::generic_error(format!(
            "Permission denied: plugin '{}' cannot read '{}'",
            plugin_state.plugin_id, path
        )));
    }

    std::fs::read_to_string(&canonical)
        .map_err(|e| deno_core::error::generic_error(format!("Failed to read '{}': {}", path, e)))
}

#[op2(fast)]
pub fn op_plugin_write_file(
    state: &mut OpState,
    #[string] path: String,
    #[string] content: String,
) -> Result<(), deno_core::error::AnyError> {
    let plugin_state = state.borrow::<PluginOpState>();
    let workspace = plugin_state.workspace_root.to_string_lossy().to_string();

    // For new files, canonicalize the parent directory
    let raw_path = PathBuf::from(&path);
    let canonical = if raw_path.exists() {
        std::fs::canonicalize(&raw_path).map_err(|e| {
            deno_core::error::generic_error(format!("Invalid path '{}': {}", path, e))
        })?
    } else {
        let parent = raw_path
            .parent()
            .ok_or_else(|| deno_core::error::generic_error(format!("Invalid path: {}", path)))?;
        if !parent.exists() {
            return Err(deno_core::error::generic_error(format!(
                "Parent directory does not exist: {}",
                parent.display()
            )));
        }
        let canonical_parent = std::fs::canonicalize(parent)
            .map_err(|e| deno_core::error::generic_error(format!("Invalid parent path: {}", e)))?;
        canonical_parent.join(raw_path.file_name().ok_or_else(|| {
            deno_core::error::generic_error(format!("Invalid filename in path: {}", path))
        })?)
    };
    let canonical_str = canonical.to_string_lossy().to_string();

    // Validate capability
    if !plugin_state
        .capabilities
        .filesystem
        .can_write(&canonical_str, &workspace)
    {
        return Err(deno_core::error::generic_error(format!(
            "Permission denied: plugin '{}' cannot write to '{}'",
            plugin_state.plugin_id, path
        )));
    }

    std::fs::write(&canonical, &content)
        .map_err(|e| deno_core::error::generic_error(format!("Failed to write '{}': {}", path, e)))
}

/// Directory entry returned by list_files
#[derive(Debug, Serialize, Deserialize)]
pub struct OpDirectoryEntry {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    pub size: u64,
}

#[op2]
#[serde]
pub fn op_plugin_list_files(
    state: &mut OpState,
    #[string] directory: String,
) -> Result<Vec<OpDirectoryEntry>, deno_core::error::AnyError> {
    let plugin_state = state.borrow::<PluginOpState>();
    let workspace = plugin_state.workspace_root.to_string_lossy().to_string();

    let canonical = std::fs::canonicalize(&directory).map_err(|e| {
        deno_core::error::generic_error(format!("Invalid path '{}': {}", directory, e))
    })?;
    let canonical_str = canonical.to_string_lossy().to_string();

    if !plugin_state
        .capabilities
        .filesystem
        .can_read(&canonical_str, &workspace)
    {
        return Err(deno_core::error::generic_error(format!(
            "Permission denied: plugin '{}' cannot read '{}'",
            plugin_state.plugin_id, directory
        )));
    }

    let mut entries = Vec::new();
    for entry in std::fs::read_dir(&canonical).map_err(|e| {
        deno_core::error::generic_error(format!("Failed to list '{}': {}", directory, e))
    })? {
        let entry = entry.map_err(|e| deno_core::error::generic_error(e.to_string()))?;
        let metadata = entry
            .metadata()
            .map_err(|e| deno_core::error::generic_error(e.to_string()))?;
        entries.push(OpDirectoryEntry {
            name: entry.file_name().to_string_lossy().to_string(),
            path: entry.path().display().to_string(),
            is_dir: metadata.is_dir(),
            size: metadata.len(),
        });
    }

    Ok(entries)
}

// ============================================================================
// NETWORK OPS
// ============================================================================

/// Fetch response returned to JavaScript
#[derive(Debug, Serialize, Deserialize)]
pub struct OpFetchResponse {
    pub status: u16,
    pub headers: HashMap<String, String>,
    pub body: String,
}

/// Fetch request params from JavaScript
#[derive(Debug, Deserialize)]
pub struct OpFetchParams {
    pub url: String,
    #[serde(default)]
    pub method: Option<String>,
    #[serde(default)]
    pub headers: Option<HashMap<String, String>>,
    #[serde(default)]
    pub body: Option<String>,
}

#[op2]
#[serde]
pub fn op_plugin_fetch(
    state: &mut OpState,
    #[serde] params: OpFetchParams,
) -> Result<OpFetchResponse, deno_core::error::AnyError> {
    let plugin_state = state.borrow::<PluginOpState>();

    // Parse URL and validate domain
    let url_parsed = url::Url::parse(&params.url).map_err(|e| {
        deno_core::error::generic_error(format!("Invalid URL '{}': {}", params.url, e))
    })?;
    let domain = url_parsed.host_str().ok_or_else(|| {
        deno_core::error::generic_error(format!("No host in URL: {}", params.url))
    })?;

    if !plugin_state.capabilities.network.can_access(domain) {
        return Err(deno_core::error::generic_error(format!(
            "Permission denied: plugin '{}' cannot access domain '{}'",
            plugin_state.plugin_id, domain
        )));
    }

    // Build and execute request using blocking client
    let client = reqwest::blocking::Client::new();
    let method = params
        .method
        .as_deref()
        .unwrap_or("GET")
        .parse::<reqwest::Method>()
        .map_err(|e| deno_core::error::generic_error(format!("Invalid method: {}", e)))?;

    let mut request = client.request(method, &params.url);

    if let Some(headers) = params.headers {
        for (key, value) in headers {
            request = request.header(&key, &value);
        }
    }

    if let Some(body) = params.body {
        request = request.body(body);
    }

    let response = request
        .send()
        .map_err(|e| deno_core::error::generic_error(format!("Fetch failed: {}", e)))?;

    let status = response.status().as_u16();
    let headers: HashMap<String, String> = response
        .headers()
        .iter()
        .map(|(k, v)| (k.to_string(), v.to_str().unwrap_or("").to_string()))
        .collect();
    let body = response.text().map_err(|e| {
        deno_core::error::generic_error(format!("Failed to read response body: {}", e))
    })?;

    Ok(OpFetchResponse {
        status,
        headers,
        body,
    })
}

// ============================================================================
// ARGUMENT SANITIZATION
// ============================================================================

/// Sanitize command arguments by removing shell metacharacters
pub(crate) fn sanitize_args(args: &[String]) -> Vec<String> {
    args.iter()
        .map(|arg| arg.replace(&['|', '&', ';', '>', '<', '`', '$', '\n', '\r'][..], ""))
        .collect()
}

// ============================================================================
// COMMAND EXECUTION OPS
// ============================================================================

/// Command output returned to JavaScript
#[derive(Debug, Serialize, Deserialize)]
pub struct OpCommandOutput {
    pub stdout: String,
    pub stderr: String,
    pub status: i32,
}

#[op2]
#[serde]
pub fn op_plugin_execute_command(
    state: &mut OpState,
    #[string] command: String,
    #[serde] args: Vec<String>,
) -> Result<OpCommandOutput, deno_core::error::AnyError> {
    let plugin_state = state.borrow::<PluginOpState>();

    // Validate command is in allowlist
    if !plugin_state.capabilities.commands.can_execute(&command) {
        return Err(deno_core::error::generic_error(format!(
            "Permission denied: plugin '{}' cannot execute command '{}'",
            plugin_state.plugin_id, command
        )));
    }

    // Sanitize arguments (prevent injection)
    let sanitized_args = sanitize_args(&args);

    let output = std::process::Command::new(&command)
        .args(&sanitized_args)
        .output()
        .map_err(|e| {
            deno_core::error::generic_error(format!("Failed to execute '{}': {}", command, e))
        })?;

    Ok(OpCommandOutput {
        stdout: String::from_utf8_lossy(&output.stdout).to_string(),
        stderr: String::from_utf8_lossy(&output.stderr).to_string(),
        status: output.status.code().unwrap_or(-1),
    })
}

// ============================================================================
// UI OPS (fire-and-forget via AppHandle.emit)
// ============================================================================

#[op2(fast)]
pub fn op_plugin_show_notification(
    state: &mut OpState,
    #[string] message: String,
    #[string] level: String,
) -> Result<(), deno_core::error::AnyError> {
    let plugin_state = state.borrow::<PluginOpState>();

    if !plugin_state.capabilities.ui.notifications {
        return Err(deno_core::error::generic_error(format!(
            "Permission denied: plugin '{}' does not have notification capability",
            plugin_state.plugin_id
        )));
    }

    plugin_state
        .app_handle
        .emit(
            "plugin:notification",
            serde_json::json!({
                "plugin_id": plugin_state.plugin_id,
                "title": plugin_state.plugin_id,
                "message": message,
                "level": level,
            }),
        )
        .map_err(|e| {
            deno_core::error::generic_error(format!("Failed to emit notification: {}", e))
        })?;

    Ok(())
}

#[op2(fast)]
pub fn op_plugin_set_status_bar(
    state: &mut OpState,
    #[string] id: String,
    #[string] text: String,
    #[string] tooltip: String,
) -> Result<(), deno_core::error::AnyError> {
    let plugin_state = state.borrow::<PluginOpState>();

    if !plugin_state.capabilities.ui.status_bar {
        return Err(deno_core::error::generic_error(format!(
            "Permission denied: plugin '{}' does not have status_bar capability",
            plugin_state.plugin_id
        )));
    }

    plugin_state
        .app_handle
        .emit(
            "plugin:status_bar:add",
            serde_json::json!({
                "plugin_id": plugin_state.plugin_id,
                "id": id,
                "text": text,
                "tooltip": tooltip,
                "priority": 0,
            }),
        )
        .map_err(|e| {
            deno_core::error::generic_error(format!("Failed to emit status bar update: {}", e))
        })?;

    Ok(())
}

// ============================================================================
// EDITOR OPS (fire-and-forget -- emit request, no sync return)
// ============================================================================

#[op2]
#[serde]
pub fn op_plugin_get_editor_content(
    state: &mut OpState,
) -> Result<serde_json::Value, deno_core::error::AnyError> {
    let plugin_state = state.borrow::<PluginOpState>();

    // Emit request to frontend; result cannot be returned synchronously
    let _ = plugin_state
        .app_handle
        .emit("plugin:editor:get_content", ());

    Ok(serde_json::Value::Null)
}

#[op2]
#[serde]
pub fn op_plugin_get_active_file(
    state: &mut OpState,
) -> Result<serde_json::Value, deno_core::error::AnyError> {
    let plugin_state = state.borrow::<PluginOpState>();

    // Emit request to frontend; result cannot be returned synchronously
    let _ = plugin_state
        .app_handle
        .emit("plugin:editor:get_active_file", ());

    Ok(serde_json::Value::Null)
}

// ============================================================================
// TESTS
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    // ---- sanitize_args tests ----

    #[test]
    fn sanitize_strips_pipe() {
        let args = vec!["git|rm".to_string()];
        assert_eq!(sanitize_args(&args), vec!["gitrm"]);
    }

    #[test]
    fn sanitize_strips_semicolon() {
        let args = vec!["git; rm -rf /".to_string()];
        assert_eq!(sanitize_args(&args), vec!["git rm -rf /"]);
    }

    #[test]
    fn sanitize_strips_ampersand() {
        let args = vec!["cmd && evil".to_string()];
        assert_eq!(sanitize_args(&args), vec!["cmd  evil"]);
    }

    #[test]
    fn sanitize_strips_redirect_gt() {
        let args = vec!["echo > /etc/passwd".to_string()];
        assert_eq!(sanitize_args(&args), vec!["echo  /etc/passwd"]);
    }

    #[test]
    fn sanitize_strips_redirect_lt() {
        let args = vec!["cmd < input".to_string()];
        assert_eq!(sanitize_args(&args), vec!["cmd  input"]);
    }

    #[test]
    fn sanitize_strips_backtick() {
        let args = vec!["`whoami`".to_string()];
        assert_eq!(sanitize_args(&args), vec!["whoami"]);
    }

    #[test]
    fn sanitize_strips_dollar() {
        let args = vec!["$HOME".to_string()];
        assert_eq!(sanitize_args(&args), vec!["HOME"]);
    }

    #[test]
    fn sanitize_strips_newlines() {
        let args = vec!["line1\nline2\rline3".to_string()];
        assert_eq!(sanitize_args(&args), vec!["line1line2line3"]);
    }

    #[test]
    fn sanitize_preserves_clean_arguments() {
        let args = vec!["--branch".to_string(), "main".to_string(), "-v".to_string()];
        assert_eq!(sanitize_args(&args), vec!["--branch", "main", "-v"]);
    }

    #[test]
    fn sanitize_combined_injection() {
        let args = vec!["git; rm -rf /".to_string()];
        let sanitized = sanitize_args(&args);
        assert!(!sanitized[0].contains(';'));
        assert_eq!(sanitized[0], "git rm -rf /");
    }

    #[test]
    fn sanitize_empty_args() {
        let args: Vec<String> = vec![];
        assert_eq!(sanitize_args(&args), Vec::<String>::new());
    }

    // ---- OpDirectoryEntry tests ----

    #[test]
    fn op_directory_entry_serialization() {
        let entry = OpDirectoryEntry {
            name: "file.txt".to_string(),
            path: "/workspace/file.txt".to_string(),
            is_dir: false,
            size: 1024,
        };
        let json = serde_json::to_value(&entry).unwrap();
        assert_eq!(json["name"], "file.txt");
        assert_eq!(json["is_dir"], false);
        assert_eq!(json["size"], 1024);
    }

    #[test]
    fn op_fetch_response_serialization() {
        let response = OpFetchResponse {
            status: 200,
            headers: HashMap::from([("content-type".to_string(), "application/json".to_string())]),
            body: r#"{"ok":true}"#.to_string(),
        };
        let json = serde_json::to_value(&response).unwrap();
        assert_eq!(json["status"], 200);
        assert_eq!(json["headers"]["content-type"], "application/json");
    }

    #[test]
    fn op_command_output_serialization() {
        let output = OpCommandOutput {
            stdout: "hello\n".to_string(),
            stderr: "".to_string(),
            status: 0,
        };
        let json = serde_json::to_value(&output).unwrap();
        assert_eq!(json["status"], 0);
        assert_eq!(json["stdout"], "hello\n");
    }
}
