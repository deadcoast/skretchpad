use serde::Deserialize;
use tauri::{Emitter, WebviewWindow};

#[allow(dead_code)]
#[derive(Debug, Clone, Deserialize)]
pub struct Theme {
    pub metadata: ThemeMetadata,
    pub window: WindowTheme,
    pub chrome: ChromeTheme,
    pub editor: EditorTheme,
    pub syntax: SyntaxTheme,
}

#[allow(dead_code)]
#[derive(Debug, Clone, Deserialize)]
pub struct ThemeMetadata {
    pub name: String,
    pub author: String,
    pub version: String,
    pub base: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct WindowTheme {
    pub background: BackgroundTheme,
    pub border: BorderTheme,
}

#[derive(Debug, Clone, Deserialize)]
pub struct BackgroundTheme {
    pub base: String,
    pub blur: u32,
}

#[derive(Debug, Clone, Deserialize)]
pub struct BorderTheme {
    pub radius: u32,
    pub width: u32,
    pub color: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct ChromeTheme {
    pub background: ChromeBackground,
    pub foreground: String,
    pub height: u32,
}

#[derive(Debug, Clone, Deserialize)]
pub struct ChromeBackground {
    pub color: String,
    pub blur: u32,
}

#[derive(Debug, Clone, Deserialize)]
pub struct EditorTheme {
    pub background: String,
    pub foreground: String,
    pub cursor: CursorTheme,
    pub selection: SelectionTheme,
}

#[derive(Debug, Clone, Deserialize)]
pub struct CursorTheme {
    pub color: String,
    pub width: u32,
}

#[derive(Debug, Clone, Deserialize)]
pub struct SelectionTheme {
    pub background: String,
}

#[derive(Debug, Clone, Deserialize)]
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

#[derive(Debug, Clone, Deserialize)]
pub struct TokenStyle {
    pub color: String,
    #[serde(default)]
    pub style: Option<String>,
}

#[tauri::command]
pub async fn load_theme(theme_name: String) -> Result<String, String> {
    let theme_path = format!("themes/{}.toml", theme_name);

    match std::fs::read_to_string(&theme_path) {
        Ok(content) => match toml::from_str::<Theme>(&content) {
            Ok(theme) => Ok(theme.to_css_vars()),
            Err(e) => Err(format!("Failed to parse theme: {}", e)),
        },
        Err(e) => Err(format!("Failed to read theme file: {}", e)),
    }
}

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

impl Theme {
    pub fn to_css_vars(&self) -> String {
        let mut css = String::from(":root {\n");

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
        css.push_str(&format!(
            "  --chrome-fg: {};\n",
            self.chrome.foreground
        ));
        css.push_str(&format!(
            "  --chrome-height: {}px;\n",
            self.chrome.height
        ));

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
        css.push_str(&format!(
            "  --syntax-type: {};\n",
            self.syntax.r#type.color
        ));
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
                css.push_str(&format!(
                    "  --syntax-{}-style: {};\n",
                    name, style
                ));
            }
        }

        css.push_str("}\n");
        css
    }
}
