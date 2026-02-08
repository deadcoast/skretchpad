use serde::{Deserialize, Deserializer, Serialize};
use tauri::{Emitter, WebviewWindow};

// ============================================================================
// THEME DATA STRUCTURES
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Theme {
    pub metadata: ThemeMetadata,
    pub window: WindowTheme,
    pub chrome: ChromeTheme,
    pub editor: EditorTheme,
    pub syntax: SyntaxTheme,
    #[serde(default)]
    pub ui: Option<UiTheme>,
    #[serde(default)]
    pub transitions: Option<TransitionsTheme>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ThemeMetadata {
    pub name: String,
    pub author: String,
    pub version: String,
    pub base: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WindowTheme {
    pub background: BackgroundTheme,
    pub border: BorderTheme,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BackgroundTheme {
    pub base: String,
    pub blur: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BorderTheme {
    pub radius: u32,
    pub width: u32,
    pub color: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChromeTheme {
    pub background: ChromeBackground,
    pub foreground: String,
    pub height: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChromeBackground {
    pub color: String,
    pub blur: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EditorTheme {
    pub background: String,
    pub foreground: String,
    pub cursor: CursorTheme,
    pub selection: SelectionTheme,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CursorTheme {
    pub color: String,
    pub width: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SelectionTheme {
    pub background: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyntaxTheme {
    pub comment: TokenStyle,
    pub keyword: TokenStyle,
    pub string: TokenStyle,
    pub number: TokenStyle,
    pub operator: TokenStyle,
    pub function: TokenStyle,
    pub variable: TokenStyle,
    pub r#type: TokenStyle,
    pub constant: TokenStyle,
}

/// Token style that can be deserialized from either a plain string ("#FF0000")
/// or an object ({ color = "#FF0000", style = "italic" }).
#[derive(Debug, Clone, Serialize)]
pub struct TokenStyle {
    pub color: String,
    #[serde(default)]
    pub style: Option<String>,
}

impl<'de> Deserialize<'de> for TokenStyle {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        #[derive(Deserialize)]
        #[serde(untagged)]
        enum TokenStyleRaw {
            Plain(String),
            Full {
                color: String,
                style: Option<String>,
            },
        }

        match TokenStyleRaw::deserialize(deserializer)? {
            TokenStyleRaw::Plain(color) => Ok(TokenStyle { color, style: None }),
            TokenStyleRaw::Full { color, style } => Ok(TokenStyle { color, style }),
        }
    }
}

/// UI section from theme TOML (status bar, sidebar, etc.)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UiTheme {
    #[serde(default)]
    pub status_bar: Option<UiStatusBarTheme>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UiStatusBarTheme {
    pub background: String,
    pub foreground: String,
    #[serde(default)]
    pub height: Option<u32>,
}

/// Transitions section from theme TOML (animation timing)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransitionsTheme {
    #[serde(default)]
    pub chrome_toggle: Option<u32>,
    #[serde(default)]
    pub theme_switch: Option<u32>,
    #[serde(default)]
    pub hover: Option<u32>,
    #[serde(default)]
    pub easing: Option<String>,
}

// ============================================================================
// THEME INFO (returned to frontend)
// ============================================================================

#[derive(Debug, Clone, Serialize)]
pub struct ThemeInfo {
    pub name: String,
    pub author: String,
    pub version: String,
    pub base: String,
    pub file: String,
}

// ============================================================================
// CSS VARIABLE GENERATION
// ============================================================================

impl Theme {
    pub fn to_css_vars(&self) -> String {
        let mut css = String::from(":root {\n");

        // Theme metadata as CSS custom properties
        css.push_str(&format!("  --theme-name: \"{}\";\n", self.metadata.name));
        css.push_str(&format!("  --theme-base: \"{}\";\n", self.metadata.base));

        // Window variables
        css.push_str(&format!(
            "  --window-bg: {};\n",
            self.window.background.base
        ));
        css.push_str(&format!(
            "  --window-blur: {}px;\n",
            self.window.background.blur
        ));
        css.push_str(&format!(
            "  --window-border-radius: {}px;\n",
            self.window.border.radius
        ));
        css.push_str(&format!(
            "  --window-border-width: {}px;\n",
            self.window.border.width
        ));
        css.push_str(&format!(
            "  --window-border-color: {};\n",
            self.window.border.color
        ));

        // Chrome variables
        css.push_str(&format!(
            "  --chrome-bg: {};\n",
            self.chrome.background.color
        ));
        css.push_str(&format!(
            "  --chrome-blur: {}px;\n",
            self.chrome.background.blur
        ));
        css.push_str(&format!("  --chrome-fg: {};\n", self.chrome.foreground));
        css.push_str(&format!("  --chrome-height: {}px;\n", self.chrome.height));

        // Editor variables
        css.push_str(&format!("  --editor-bg: {};\n", self.editor.background));
        css.push_str(&format!("  --editor-fg: {};\n", self.editor.foreground));
        css.push_str(&format!(
            "  --cursor-color: {};\n",
            self.editor.cursor.color
        ));
        css.push_str(&format!(
            "  --cursor-width: {}px;\n",
            self.editor.cursor.width
        ));
        css.push_str(&format!(
            "  --selection-bg: {};\n",
            self.editor.selection.background
        ));

        // Syntax colors
        css.push_str(&format!(
            "  --syntax-comment: {};\n",
            self.syntax.comment.color
        ));
        css.push_str(&format!(
            "  --syntax-keyword: {};\n",
            self.syntax.keyword.color
        ));
        css.push_str(&format!(
            "  --syntax-string: {};\n",
            self.syntax.string.color
        ));
        css.push_str(&format!(
            "  --syntax-number: {};\n",
            self.syntax.number.color
        ));
        css.push_str(&format!(
            "  --syntax-operator: {};\n",
            self.syntax.operator.color
        ));
        css.push_str(&format!(
            "  --syntax-function: {};\n",
            self.syntax.function.color
        ));
        css.push_str(&format!(
            "  --syntax-variable: {};\n",
            self.syntax.variable.color
        ));
        css.push_str(&format!("  --syntax-type: {};\n", self.syntax.r#type.color));
        css.push_str(&format!(
            "  --syntax-constant: {};\n",
            self.syntax.constant.color
        ));

        // Token styles (italic/bold if specified)
        for (name, token) in [
            ("comment", &self.syntax.comment),
            ("keyword", &self.syntax.keyword),
            ("string", &self.syntax.string),
            ("number", &self.syntax.number),
            ("operator", &self.syntax.operator),
            ("function", &self.syntax.function),
            ("variable", &self.syntax.variable),
            ("type", &self.syntax.r#type),
            ("constant", &self.syntax.constant),
        ] {
            if let Some(ref style) = token.style {
                css.push_str(&format!("  --syntax-{}-style: {};\n", name, style));
            }
        }

        // UI variables (if present)
        if let Some(ref ui) = self.ui {
            if let Some(ref sb) = ui.status_bar {
                css.push_str(&format!("  --status-bar-bg: {};\n", sb.background));
                css.push_str(&format!("  --status-bar-fg: {};\n", sb.foreground));
                if let Some(height) = sb.height {
                    css.push_str(&format!("  --status-bar-height: {}px;\n", height));
                }
            }
        }

        // Transition variables (if present)
        if let Some(ref tr) = self.transitions {
            if let Some(ms) = tr.chrome_toggle {
                css.push_str(&format!("  --transition-chrome-toggle: {}ms;\n", ms));
            }
            if let Some(ms) = tr.theme_switch {
                css.push_str(&format!("  --transition-theme-switch: {}ms;\n", ms));
            }
            if let Some(ms) = tr.hover {
                css.push_str(&format!("  --transition-hover: {}ms;\n", ms));
            }
            if let Some(ref easing) = tr.easing {
                css.push_str(&format!("  --transition-easing: {};\n", easing));
            }
        }

        css.push_str("}\n");
        css
    }
}

// ============================================================================
// TAURI COMMANDS
// ============================================================================

/// Resolve the themes directory path.
/// In dev mode: project_root/themes/
/// In production: would use app resource dir
fn themes_dir() -> std::path::PathBuf {
    // TODO: In production, use app resource dir instead of CARGO_MANIFEST_DIR
    let manifest_dir = std::path::PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    manifest_dir.parent().unwrap().join("themes")
}

/// Load a theme by name and return its CSS variables string.
#[tauri::command]
pub async fn load_theme(theme_name: String) -> Result<String, String> {
    let theme_path = themes_dir().join(format!("{}.toml", theme_name));

    match std::fs::read_to_string(&theme_path) {
        Ok(content) => match toml::from_str::<Theme>(&content) {
            Ok(theme) => Ok(theme.to_css_vars()),
            Err(e) => Err(format!("Failed to parse theme '{}': {}", theme_name, e)),
        },
        Err(e) => Err(format!(
            "Failed to read theme file '{}': {}",
            theme_path.display(),
            e
        )),
    }
}

/// Load a theme and emit the CSS variables to the frontend for application.
#[tauri::command]
pub async fn apply_theme(window: WebviewWindow, theme_name: String) -> Result<(), String> {
    match load_theme(theme_name).await {
        Ok(css_vars) => {
            window
                .emit("theme:apply", css_vars)
                .map_err(|e| e.to_string())?;
            Ok(())
        }
        Err(e) => Err(e),
    }
}

/// Get metadata for a specific theme without loading the full CSS.
#[tauri::command]
pub async fn get_theme_metadata(theme_name: String) -> Result<ThemeInfo, String> {
    let theme_path = themes_dir().join(format!("{}.toml", theme_name));

    let content = std::fs::read_to_string(&theme_path)
        .map_err(|e| format!("Failed to read theme '{}': {}", theme_name, e))?;

    let theme: Theme = toml::from_str(&content)
        .map_err(|e| format!("Failed to parse theme '{}': {}", theme_name, e))?;

    Ok(ThemeInfo {
        name: theme.metadata.name,
        author: theme.metadata.author,
        version: theme.metadata.version,
        base: theme.metadata.base,
        file: format!("{}.toml", theme_name),
    })
}

/// List all available themes in the themes directory.
#[tauri::command]
pub async fn list_themes() -> Result<Vec<ThemeInfo>, String> {
    let dir = themes_dir();

    let entries =
        std::fs::read_dir(&dir).map_err(|e| format!("Failed to read themes directory: {}", e))?;

    let mut themes = Vec::new();

    for entry in entries {
        let entry = entry.map_err(|e| format!("Failed to read directory entry: {}", e))?;
        let path = entry.path();

        if path.extension().and_then(|e| e.to_str()) == Some("toml") {
            let content = match std::fs::read_to_string(&path) {
                Ok(c) => c,
                Err(_) => continue,
            };

            if let Ok(theme) = toml::from_str::<Theme>(&content) {
                let file_stem = path
                    .file_stem()
                    .and_then(|s| s.to_str())
                    .unwrap_or("unknown");

                themes.push(ThemeInfo {
                    name: theme.metadata.name,
                    author: theme.metadata.author,
                    version: theme.metadata.version,
                    base: theme.metadata.base,
                    file: format!("{}.toml", file_stem),
                });
            }
        }
    }

    Ok(themes)
}

// ============================================================================
// TESTS
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    const MILKYTEXT_STYLE: &str = r##"
[metadata]
name = "MilkyText"
author = "heat"
version = "1.0.0"
base = "light"

[window]
background.base = "#030304"
background.blur = 20
border.radius = 12
border.width = 1
border.color = "rgba(0, 0, 0, 0.1)"

[chrome]
background.color = "#363941"
background.blur = 10
height = 32
foreground = "#FFFFFF"

[editor]
background = "transparent"
foreground = "#FFFFFF"
cursor.color = "#FFCCD5"
cursor.width = 2
selection.background = "#FFFFFF"

[syntax]
comment = "#8875FF"
keyword = "#FF75C6"
string = "#75FFCF"
number = "#BAF3DD"
operator = "#FF758F"
function = "#F3F3B0"
variable = "#FFCCD5"
type = "#C4AEF5"
constant = "#FFAED8"

[ui]
status_bar.background = "#363941"
status_bar.foreground = "#FFFFFF"
status_bar.height = 24

[transitions]
chrome_toggle = 200
theme_switch = 300
hover = 100
easing = "cubic-bezier(0.4, 0.0, 0.2, 1)"
"##;

    const GLASS_DARK_STYLE: &str = r##"
[metadata]
name = "Liquid Glass Dark"
author = "heat"
version = "1.0.0"
base = "dark"

[window]
background.base = "rgba(18, 18, 18, 0.85)"
background.blur = 20
border.radius = 12
border.width = 1
border.color = "rgba(255, 255, 255, 0.1)"

[chrome]
background.color = "rgba(28, 28, 28, 0.95)"
background.blur = 10
height = 32
foreground = "rgba(228, 228, 228, 0.9)"

[editor]
background = "transparent"
foreground = "#e4e4e4"
cursor.color = "#00d9ff"
cursor.width = 2
selection.background = "rgba(0, 217, 255, 0.2)"

[syntax]
comment = { color = "#6a737d", style = "italic" }
keyword = { color = "#ff79c6", style = "bold" }
string = { color = "#50fa7b" }
number = { color = "#bd93f9" }
operator = { color = "#ff79c6" }
function = { color = "#8be9fd" }
variable = { color = "#f8f8f2" }
type = { color = "#8be9fd", style = "italic" }
constant = { color = "#bd93f9", style = "bold" }

[ui]
status_bar.background = "rgba(28, 28, 28, 0.95)"
status_bar.foreground = "rgba(228, 228, 228, 0.7)"
status_bar.height = 24

[transitions]
chrome_toggle = 200
theme_switch = 300
hover = 100
easing = "cubic-bezier(0.4, 0.0, 0.2, 1)"
"##;

    #[test]
    fn test_parse_milkytext_plain_strings() {
        let theme: Theme = toml::from_str(MILKYTEXT_STYLE).expect("Failed to parse milkytext");
        assert_eq!(theme.metadata.name, "MilkyText");
        assert_eq!(theme.metadata.author, "heat");
        assert_eq!(theme.metadata.version, "1.0.0");
        assert_eq!(theme.metadata.base, "light");
        assert_eq!(theme.syntax.comment.color, "#8875FF");
        assert!(theme.syntax.comment.style.is_none());
        assert_eq!(theme.chrome.foreground, "#FFFFFF");
        assert_eq!(theme.chrome.height, 32);
        assert_eq!(theme.window.border.width, 1);
        assert_eq!(theme.window.border.color, "rgba(0, 0, 0, 0.1)");
        assert_eq!(theme.editor.cursor.width, 2);
    }

    #[test]
    fn test_parse_glass_dark_objects() {
        let theme: Theme = toml::from_str(GLASS_DARK_STYLE).expect("Failed to parse glass-dark");
        assert_eq!(theme.metadata.name, "Liquid Glass Dark");
        assert_eq!(theme.metadata.base, "dark");
        assert_eq!(theme.syntax.comment.color, "#6a737d");
        assert_eq!(theme.syntax.comment.style.as_deref(), Some("italic"));
        assert_eq!(theme.syntax.keyword.color, "#ff79c6");
        assert_eq!(theme.syntax.keyword.style.as_deref(), Some("bold"));
        assert_eq!(theme.syntax.string.color, "#50fa7b");
        assert!(theme.syntax.string.style.is_none());
    }

    #[test]
    fn test_ui_section_parsed() {
        let theme: Theme = toml::from_str(MILKYTEXT_STYLE).expect("Failed to parse");
        let ui = theme.ui.expect("UI section should be present");
        let sb = ui.status_bar.expect("Status bar should be present");
        assert_eq!(sb.background, "#363941");
        assert_eq!(sb.foreground, "#FFFFFF");
        assert_eq!(sb.height, Some(24));
    }

    #[test]
    fn test_transitions_section_parsed() {
        let theme: Theme = toml::from_str(MILKYTEXT_STYLE).expect("Failed to parse");
        let tr = theme
            .transitions
            .expect("Transitions section should be present");
        assert_eq!(tr.chrome_toggle, Some(200));
        assert_eq!(tr.theme_switch, Some(300));
        assert_eq!(tr.hover, Some(100));
        assert_eq!(tr.easing.as_deref(), Some("cubic-bezier(0.4, 0.0, 0.2, 1)"));
    }

    #[test]
    fn test_css_vars_include_metadata() {
        let theme: Theme = toml::from_str(MILKYTEXT_STYLE).expect("Failed to parse");
        let css = theme.to_css_vars();
        assert!(css.contains("--theme-name: \"MilkyText\""));
        assert!(css.contains("--theme-base: \"light\""));
    }

    #[test]
    fn test_css_vars_include_all_fields() {
        let theme: Theme = toml::from_str(MILKYTEXT_STYLE).expect("Failed to parse");
        let css = theme.to_css_vars();

        // Window
        assert!(css.contains("--window-bg:"));
        assert!(css.contains("--window-blur:"));
        assert!(css.contains("--window-border-radius:"));
        assert!(css.contains("--window-border-width:"));
        assert!(css.contains("--window-border-color:"));

        // Chrome
        assert!(css.contains("--chrome-bg:"));
        assert!(css.contains("--chrome-blur:"));
        assert!(css.contains("--chrome-fg:"));
        assert!(css.contains("--chrome-height:"));

        // Editor
        assert!(css.contains("--editor-bg:"));
        assert!(css.contains("--editor-fg:"));
        assert!(css.contains("--cursor-color:"));
        assert!(css.contains("--cursor-width:"));
        assert!(css.contains("--selection-bg:"));

        // Syntax
        assert!(css.contains("--syntax-comment:"));
        assert!(css.contains("--syntax-number:"));
        assert!(css.contains("--syntax-operator:"));
        assert!(css.contains("--syntax-variable:"));
        assert!(css.contains("--syntax-type:"));
        assert!(css.contains("--syntax-constant:"));

        // UI
        assert!(css.contains("--status-bar-bg:"));
        assert!(css.contains("--status-bar-fg:"));
        assert!(css.contains("--status-bar-height:"));

        // Transitions
        assert!(css.contains("--transition-chrome-toggle:"));
        assert!(css.contains("--transition-theme-switch:"));
        assert!(css.contains("--transition-hover:"));
        assert!(css.contains("--transition-easing:"));
    }

    #[test]
    fn test_css_vars_include_token_styles() {
        let theme: Theme = toml::from_str(GLASS_DARK_STYLE).expect("Failed to parse");
        let css = theme.to_css_vars();
        assert!(css.contains("--syntax-comment-style: italic"));
        assert!(css.contains("--syntax-keyword-style: bold"));
    }

    #[test]
    fn test_theme_without_optional_sections() {
        let minimal = r##"
[metadata]
name = "Minimal"
author = "test"
version = "0.1.0"
base = "dark"

[window]
background.base = "#000"
background.blur = 0
border.radius = 0
border.width = 0
border.color = "#000"

[chrome]
background.color = "#111"
background.blur = 0
height = 30
foreground = "#fff"

[editor]
background = "#000"
foreground = "#fff"
cursor.color = "#fff"
cursor.width = 2
selection.background = "#333"

[syntax]
comment = "#666"
keyword = "#f00"
string = "#0f0"
number = "#00f"
operator = "#ff0"
function = "#0ff"
variable = "#f0f"
type = "#fff"
constant = "#888"
"##;
        let theme: Theme = toml::from_str(minimal).expect("Failed to parse minimal theme");
        assert!(theme.ui.is_none());
        assert!(theme.transitions.is_none());
        // CSS should still generate without errors
        let css = theme.to_css_vars();
        assert!(css.contains("--theme-name: \"Minimal\""));
        assert!(!css.contains("--status-bar-bg:"));
        assert!(!css.contains("--transition-hover:"));
    }
}
