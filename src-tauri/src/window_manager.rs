use tauri::{Window, Emitter};

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub enum ChromeVisibility {
    Hidden,
    Minimal,
    Full,
}

#[tauri::command]
pub async fn toggle_always_on_top(window: Window) -> Result<bool, String> {
    match window.is_always_on_top() {
        Ok(current) => {
            window.set_always_on_top(!current).map_err(|e| e.to_string())?;
            Ok(!current)
        }
        Err(e) => Err(e.to_string())
    }
}

#[tauri::command]
pub async fn set_chrome_visibility(window: Window, visibility: ChromeVisibility) -> Result<(), String> {
    match visibility {
        ChromeVisibility::Hidden => {
            window.set_decorations(false).map_err(|e| e.to_string())?;
            // Emit event to hide internal chrome
            window.emit("chrome:hide", ()).map_err(|e| e.to_string())?;
        }
        ChromeVisibility::Minimal => {
            window.set_decorations(true).map_err(|e| e.to_string())?;
            // Show minimal UI
            window.emit("chrome:minimal", ()).map_err(|e| e.to_string())?;
        }
        ChromeVisibility::Full => {
            window.set_decorations(true).map_err(|e| e.to_string())?;
            // Show all UI elements
            window.emit("chrome:full", ()).map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}