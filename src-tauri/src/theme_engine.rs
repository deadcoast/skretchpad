use serde::{Deserialize, Deserializer, Serialize};
use tauri::{Emitter, WebviewWindow};

// ============================================================================
// THEME DATA STRUCTURES
// ============================================================================

/// Top-level theme struct.
/// TOML files use snake_case keys; JSON serialization produces camelCase.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all(deserialize = "snake_case", serialize = "camelCase"))]
pub struct Theme {
    pub metadata: ThemeMetadata,
    #[serde(default)]
    pub palette: Option<PaletteTheme>,
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
#[serde(rename_all(deserialize = "snake_case", serialize = "camelCase"))]
pub struct ThemeMetadata {
    pub name: String,
    pub author: String,
    pub version: String,
    pub base: String,
}

/// Full 16-color ANSI palette + foreground/background/cursor/selection
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all(deserialize = "snake_case", serialize = "camelCase"))]
pub struct PaletteTheme {
    pub background: String,
    pub foreground: String,
    pub cursor_color: String,
    pub selection_background: String,
    #[serde(default)]
    pub selection_foreground: Option<String>,
    pub black: String,
    pub red: String,
    pub green: String,
    pub yellow: String,
    pub blue: String,
    pub purple: String,
    pub cyan: String,
    pub white: String,
    pub bright_black: String,
    pub bright_red: String,
    pub bright_green: String,
    pub bright_yellow: String,
    pub bright_blue: String,
    pub bright_purple: String,
    pub bright_cyan: String,
    pub bright_white: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all(deserialize = "snake_case", serialize = "camelCase"))]
pub struct WindowTheme {
    pub background: BackgroundTheme,
    pub border: BorderTheme,
    #[serde(default)]
    pub shadow: Option<WindowShadow>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all(deserialize = "snake_case", serialize = "camelCase"))]
pub struct BackgroundTheme {
    pub base: String,
    pub blur: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all(deserialize = "snake_case", serialize = "camelCase"))]
pub struct BorderTheme {
    pub radius: u32,
    pub width: u32,
    pub color: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all(deserialize = "snake_case", serialize = "camelCase"))]
pub struct WindowShadow {
    pub color: String,
    pub blur: u32,
    pub offset: [i32; 2],
}

/// Chrome (title bar) theme.
/// In TOML, `background` can be either a sub-table `{ color = "...", blur = 10 }` or
/// we keep the old nested form for backward compat. We use a custom deserializer.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all(deserialize = "snake_case", serialize = "camelCase"))]
pub struct ChromeTheme {
    pub background: ChromeBackground,
    pub foreground: String,
    pub height: u32,
    #[serde(default)]
    pub border: Option<String>,
    #[serde(default)]
    pub menu_background: Option<String>,
    #[serde(default)]
    pub menu_hover: Option<String>,
    #[serde(default)]
    pub menu_foreground: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all(deserialize = "snake_case", serialize = "camelCase"))]
pub struct ChromeBackground {
    pub color: String,
    pub blur: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all(deserialize = "snake_case", serialize = "camelCase"))]
pub struct EditorTheme {
    pub background: String,
    pub foreground: String,
    pub cursor: CursorTheme,
    pub selection: SelectionTheme,
    #[serde(default)]
    pub line: Option<EditorLineTheme>,
    #[serde(default)]
    pub gutter: Option<EditorGutterTheme>,
    #[serde(default)]
    pub font_family: Option<String>,
    #[serde(default)]
    pub font_size: Option<u32>,
    #[serde(default)]
    pub line_height: Option<f32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all(deserialize = "snake_case", serialize = "camelCase"))]
pub struct CursorTheme {
    pub color: String,
    pub width: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all(deserialize = "snake_case", serialize = "camelCase"))]
pub struct SelectionTheme {
    pub background: String,
    #[serde(default)]
    pub foreground: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all(deserialize = "snake_case", serialize = "camelCase"))]
pub struct EditorLineTheme {
    pub active: String,
    pub number: String,
    pub number_active: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all(deserialize = "snake_case", serialize = "camelCase"))]
pub struct EditorGutterTheme {
    pub background: String,
    #[serde(default)]
    pub border: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all(deserialize = "snake_case", serialize = "camelCase"))]
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
    #[serde(default)]
    pub tag: Option<TokenStyle>,
    #[serde(default)]
    pub attribute: Option<TokenStyle>,
    #[serde(default)]
    pub property: Option<TokenStyle>,
    #[serde(default)]
    pub punctuation: Option<TokenStyle>,
    #[serde(default)]
    pub regexp: Option<TokenStyle>,
    #[serde(default)]
    pub heading: Option<TokenStyle>,
    #[serde(default)]
    pub link: Option<TokenStyle>,
    #[serde(default)]
    pub meta: Option<TokenStyle>,
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

/// UI section from theme TOML
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all(deserialize = "snake_case", serialize = "camelCase"))]
pub struct UiTheme {
    #[serde(default)]
    pub status_bar: Option<UiStatusBarTheme>,
    #[serde(default)]
    pub primary: Option<String>,
    #[serde(default)]
    pub border: Option<String>,
    #[serde(default)]
    pub border_subtle: Option<String>,
    #[serde(default)]
    pub text_primary: Option<String>,
    #[serde(default)]
    pub text_secondary: Option<String>,
    #[serde(default)]
    pub text_disabled: Option<String>,
    #[serde(default)]
    pub button_background: Option<String>,
    #[serde(default)]
    pub button_hover: Option<String>,
    #[serde(default)]
    pub button_active: Option<String>,
    #[serde(default)]
    pub input_background: Option<String>,
    #[serde(default)]
    pub input_border: Option<String>,
    #[serde(default)]
    pub input_focus: Option<String>,
    #[serde(default)]
    pub tooltip_background: Option<String>,
    #[serde(default)]
    pub scrollbar_thumb: Option<String>,
    #[serde(default)]
    pub scrollbar_thumb_hover: Option<String>,
    #[serde(default)]
    pub error: Option<String>,
    #[serde(default)]
    pub warning: Option<String>,
    #[serde(default)]
    pub success: Option<String>,
    #[serde(default)]
    pub info: Option<String>,
    #[serde(default)]
    pub search_match: Option<String>,
    #[serde(default)]
    pub search_match_selected: Option<String>,
    #[serde(default)]
    pub selection_match: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all(deserialize = "snake_case", serialize = "camelCase"))]
pub struct UiStatusBarTheme {
    pub background: String,
    pub foreground: String,
    #[serde(default)]
    pub height: Option<u32>,
}

/// Transitions section from theme TOML (animation timing)
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all(deserialize = "snake_case", serialize = "camelCase"))]
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

        // Palette variables (if present)
        if let Some(ref p) = self.palette {
            css.push_str(&format!("  --palette-bg: {};\n", p.background));
            css.push_str(&format!("  --palette-fg: {};\n", p.foreground));
            css.push_str(&format!("  --palette-cursor: {};\n", p.cursor_color));
            css.push_str(&format!(
                "  --palette-selection: {};\n",
                p.selection_background
            ));
            css.push_str(&format!("  --palette-black: {};\n", p.black));
            css.push_str(&format!("  --palette-red: {};\n", p.red));
            css.push_str(&format!("  --palette-green: {};\n", p.green));
            css.push_str(&format!("  --palette-yellow: {};\n", p.yellow));
            css.push_str(&format!("  --palette-blue: {};\n", p.blue));
            css.push_str(&format!("  --palette-purple: {};\n", p.purple));
            css.push_str(&format!("  --palette-cyan: {};\n", p.cyan));
            css.push_str(&format!("  --palette-white: {};\n", p.white));
            css.push_str(&format!("  --palette-bright-black: {};\n", p.bright_black));
            css.push_str(&format!("  --palette-bright-red: {};\n", p.bright_red));
            css.push_str(&format!("  --palette-bright-green: {};\n", p.bright_green));
            css.push_str(&format!(
                "  --palette-bright-yellow: {};\n",
                p.bright_yellow
            ));
            css.push_str(&format!("  --palette-bright-blue: {};\n", p.bright_blue));
            css.push_str(&format!(
                "  --palette-bright-purple: {};\n",
                p.bright_purple
            ));
            css.push_str(&format!("  --palette-bright-cyan: {};\n", p.bright_cyan));
            css.push_str(&format!("  --palette-bright-white: {};\n", p.bright_white));
        }

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
        if let Some(ref border) = self.chrome.border {
            css.push_str(&format!("  --chrome-border: {};\n", border));
        }
        if let Some(ref mb) = self.chrome.menu_background {
            css.push_str(&format!("  --chrome-menu-bg: {};\n", mb));
        }
        if let Some(ref mh) = self.chrome.menu_hover {
            css.push_str(&format!("  --chrome-menu-hover: {};\n", mh));
        }
        if let Some(ref mf) = self.chrome.menu_foreground {
            css.push_str(&format!("  --chrome-menu-fg: {};\n", mf));
        }

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
        if let Some(ref fg) = self.editor.selection.foreground {
            css.push_str(&format!("  --selection-fg: {};\n", fg));
        }
        if let Some(ref line) = self.editor.line {
            css.push_str(&format!("  --line-active: {};\n", line.active));
            css.push_str(&format!("  --line-number: {};\n", line.number));
            css.push_str(&format!(
                "  --line-number-active: {};\n",
                line.number_active
            ));
        }
        if let Some(ref gutter) = self.editor.gutter {
            css.push_str(&format!("  --gutter-bg: {};\n", gutter.background));
            if let Some(ref border) = gutter.border {
                css.push_str(&format!("  --gutter-border: {};\n", border));
            }
        }
        if let Some(ref ff) = self.editor.font_family {
            css.push_str(&format!("  --editor-font-family: {};\n", ff));
        }
        if let Some(fs) = self.editor.font_size {
            css.push_str(&format!("  --editor-font-size: {}px;\n", fs));
        }
        if let Some(lh) = self.editor.line_height {
            css.push_str(&format!("  --editor-line-height: {};\n", lh));
        }

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

        // Optional syntax tokens
        if let Some(ref t) = self.syntax.tag {
            css.push_str(&format!("  --syntax-tag: {};\n", t.color));
        }
        if let Some(ref t) = self.syntax.attribute {
            css.push_str(&format!("  --syntax-attribute: {};\n", t.color));
        }
        if let Some(ref t) = self.syntax.property {
            css.push_str(&format!("  --syntax-property: {};\n", t.color));
        }
        if let Some(ref t) = self.syntax.punctuation {
            css.push_str(&format!("  --syntax-punctuation: {};\n", t.color));
        }
        if let Some(ref t) = self.syntax.regexp {
            css.push_str(&format!("  --syntax-regexp: {};\n", t.color));
        }
        if let Some(ref t) = self.syntax.heading {
            css.push_str(&format!("  --syntax-heading: {};\n", t.color));
        }
        if let Some(ref t) = self.syntax.link {
            css.push_str(&format!("  --syntax-link: {};\n", t.color));
        }
        if let Some(ref t) = self.syntax.meta {
            css.push_str(&format!("  --syntax-meta: {};\n", t.color));
        }

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
            if let Some(ref v) = ui.primary {
                css.push_str(&format!("  --color-primary: {};\n", v));
            }
            if let Some(ref v) = ui.border {
                css.push_str(&format!("  --border-color: {};\n", v));
            }
            if let Some(ref v) = ui.border_subtle {
                css.push_str(&format!("  --border-subtle: {};\n", v));
            }
            if let Some(ref v) = ui.text_primary {
                css.push_str(&format!("  --text-primary: {};\n", v));
            }
            if let Some(ref v) = ui.text_secondary {
                css.push_str(&format!("  --text-secondary: {};\n", v));
            }
            if let Some(ref v) = ui.text_disabled {
                css.push_str(&format!("  --text-disabled: {};\n", v));
            }
            if let Some(ref v) = ui.button_background {
                css.push_str(&format!("  --button-bg: {};\n", v));
            }
            if let Some(ref v) = ui.button_hover {
                css.push_str(&format!("  --button-hover: {};\n", v));
            }
            if let Some(ref v) = ui.button_active {
                css.push_str(&format!("  --button-active: {};\n", v));
            }
            if let Some(ref v) = ui.input_background {
                css.push_str(&format!("  --input-bg: {};\n", v));
            }
            if let Some(ref v) = ui.input_border {
                css.push_str(&format!("  --input-border: {};\n", v));
            }
            if let Some(ref v) = ui.input_focus {
                css.push_str(&format!("  --input-focus: {};\n", v));
            }
            if let Some(ref v) = ui.tooltip_background {
                css.push_str(&format!("  --tooltip-bg: {};\n", v));
            }
            if let Some(ref v) = ui.scrollbar_thumb {
                css.push_str(&format!("  --scrollbar-thumb: {};\n", v));
            }
            if let Some(ref v) = ui.scrollbar_thumb_hover {
                css.push_str(&format!("  --scrollbar-thumb-hover: {};\n", v));
            }
            if let Some(ref v) = ui.error {
                css.push_str(&format!("  --color-error: {};\n", v));
            }
            if let Some(ref v) = ui.warning {
                css.push_str(&format!("  --color-warning: {};\n", v));
            }
            if let Some(ref v) = ui.success {
                css.push_str(&format!("  --color-success: {};\n", v));
            }
            if let Some(ref v) = ui.info {
                css.push_str(&format!("  --color-info: {};\n", v));
            }
            if let Some(ref v) = ui.search_match {
                css.push_str(&format!("  --search-match: {};\n", v));
            }
            if let Some(ref v) = ui.search_match_selected {
                css.push_str(&format!("  --search-match-selected: {};\n", v));
            }
            if let Some(ref v) = ui.selection_match {
                css.push_str(&format!("  --selection-match: {};\n", v));
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

    /// Build a frontend-compatible JSON value matching the TS `Theme` interface.
    /// This flattens chrome.background into a string, extracts just `.color` from
    /// TokenStyle fields for syntax, and provides defaults for optional sections.
    pub fn to_frontend_json(&self) -> serde_json::Value {
        use serde_json::json;

        let base = &self.metadata.base;

        // Helper: extract color from TokenStyle
        let tc = |t: &TokenStyle| -> serde_json::Value { json!(t.color) };
        let tc_opt = |t: &Option<TokenStyle>| -> serde_json::Value {
            t.as_ref()
                .map(|t| json!(t.color))
                .unwrap_or(serde_json::Value::Null)
        };

        // Palette — use theme palette or derive from editor/syntax
        let palette = if let Some(ref p) = self.palette {
            json!({
                "background": p.background,
                "foreground": p.foreground,
                "cursorColor": p.cursor_color,
                "selectionBackground": p.selection_background,
                "selectionForeground": p.selection_foreground,
                "black": p.black,
                "red": p.red,
                "green": p.green,
                "yellow": p.yellow,
                "blue": p.blue,
                "purple": p.purple,
                "cyan": p.cyan,
                "white": p.white,
                "brightBlack": p.bright_black,
                "brightRed": p.bright_red,
                "brightGreen": p.bright_green,
                "brightYellow": p.bright_yellow,
                "brightBlue": p.bright_blue,
                "brightPurple": p.bright_purple,
                "brightCyan": p.bright_cyan,
                "brightWhite": p.bright_white,
            })
        } else {
            // Derive minimal palette from editor colors
            json!({
                "background": self.editor.background,
                "foreground": self.editor.foreground,
                "cursorColor": self.editor.cursor.color,
                "selectionBackground": self.editor.selection.background,
                "black": "#000000",
                "red": "#ff0000",
                "green": "#00ff00",
                "yellow": "#ffff00",
                "blue": "#0000ff",
                "purple": "#ff00ff",
                "cyan": "#00ffff",
                "white": "#ffffff",
                "brightBlack": "#808080",
                "brightRed": "#ff0000",
                "brightGreen": "#00ff00",
                "brightYellow": "#ffff00",
                "brightBlue": "#0000ff",
                "brightPurple": "#ff00ff",
                "brightCyan": "#00ffff",
                "brightWhite": "#ffffff",
            })
        };

        // Window
        let window = {
            let mut w = json!({
                "background": { "base": self.window.background.base, "blur": self.window.background.blur },
                "border": { "radius": self.window.border.radius, "width": self.window.border.width, "color": self.window.border.color },
            });
            if let Some(ref shadow) = self.window.shadow {
                w["shadow"] =
                    json!({ "color": shadow.color, "blur": shadow.blur, "offset": shadow.offset });
            }
            w
        };

        // Chrome — flatten background to just a string (the color)
        let chrome = {
            let ui_border = self
                .ui
                .as_ref()
                .and_then(|u| u.border.as_deref())
                .unwrap_or("rgba(255, 255, 255, 0.1)");
            let ui_btn_hover = self
                .ui
                .as_ref()
                .and_then(|u| u.button_hover.as_deref())
                .unwrap_or("rgba(255, 255, 255, 0.15)");
            json!({
                "background": self.chrome.background.color,
                "foreground": self.chrome.foreground,
                "height": self.chrome.height,
                "blur": self.chrome.background.blur,
                "border": self.chrome.border.as_deref().unwrap_or(ui_border),
                "menuBackground": self.chrome.menu_background.as_deref().unwrap_or(&self.chrome.background.color),
                "menuHover": self.chrome.menu_hover.as_deref().unwrap_or(ui_btn_hover),
                "menuForeground": self.chrome.menu_foreground.as_deref().unwrap_or(&self.chrome.foreground),
            })
        };

        // Editor
        let is_dark = base == "dark";
        let default_line_active = if is_dark {
            "rgba(255, 255, 255, 0.05)"
        } else {
            "rgba(0, 0, 0, 0.04)"
        };
        let default_line_number = if is_dark {
            "rgba(228, 228, 228, 0.4)"
        } else {
            "rgba(0, 0, 0, 0.3)"
        };
        let default_line_number_active = &self.editor.cursor.color;
        let default_gutter_bg = if is_dark {
            "rgba(0, 0, 0, 0.2)"
        } else {
            "rgba(0, 0, 0, 0.05)"
        };

        let editor = json!({
            "background": self.editor.background,
            "foreground": self.editor.foreground,
            "cursor": { "color": self.editor.cursor.color, "width": self.editor.cursor.width },
            "selection": {
                "background": self.editor.selection.background,
                "foreground": self.editor.selection.foreground,
            },
            "line": {
                "active": self.editor.line.as_ref().map(|l| l.active.as_str()).unwrap_or(default_line_active),
                "number": self.editor.line.as_ref().map(|l| l.number.as_str()).unwrap_or(default_line_number),
                "numberActive": self.editor.line.as_ref().map(|l| l.number_active.as_str()).unwrap_or(default_line_number_active),
            },
            "gutter": {
                "background": self.editor.gutter.as_ref().map(|g| g.background.as_str()).unwrap_or(default_gutter_bg),
                "border": self.editor.gutter.as_ref().and_then(|g| g.border.as_deref()),
            },
            "fontFamily": self.editor.font_family,
            "fontSize": self.editor.font_size,
            "lineHeight": self.editor.line_height,
        });

        // Syntax — extract just color strings from TokenStyle
        let syntax = {
            let mut s = json!({
                "comment": tc(&self.syntax.comment),
                "keyword": tc(&self.syntax.keyword),
                "string": tc(&self.syntax.string),
                "number": tc(&self.syntax.number),
                "operator": tc(&self.syntax.operator),
                "function": tc(&self.syntax.function),
                "variable": tc(&self.syntax.variable),
                "type": tc(&self.syntax.r#type),
                "constant": tc(&self.syntax.constant),
            });
            let sv = tc_opt(&self.syntax.tag);
            if !sv.is_null() {
                s["tag"] = sv;
            }
            let sv = tc_opt(&self.syntax.attribute);
            if !sv.is_null() {
                s["attribute"] = sv;
            }
            let sv = tc_opt(&self.syntax.property);
            if !sv.is_null() {
                s["property"] = sv;
            }
            let sv = tc_opt(&self.syntax.punctuation);
            if !sv.is_null() {
                s["punctuation"] = sv;
            }
            let sv = tc_opt(&self.syntax.regexp);
            if !sv.is_null() {
                s["regexp"] = sv;
            }
            let sv = tc_opt(&self.syntax.heading);
            if !sv.is_null() {
                s["heading"] = sv;
            }
            let sv = tc_opt(&self.syntax.link);
            if !sv.is_null() {
                s["link"] = sv;
            }
            let sv = tc_opt(&self.syntax.meta);
            if !sv.is_null() {
                s["meta"] = sv;
            }
            s
        };

        // UI — build full UI object with defaults
        let default_fg = &self.editor.foreground;
        let ui = if let Some(ref u) = self.ui {
            let sb = u.status_bar.as_ref();
            json!({
                "statusBar": {
                    "background": sb.map(|s| s.background.as_str()).unwrap_or(&self.chrome.background.color),
                    "foreground": sb.map(|s| s.foreground.as_str()).unwrap_or(&self.chrome.foreground),
                    "height": sb.and_then(|s| s.height).unwrap_or(24),
                },
                "primary": u.primary.as_deref().unwrap_or(&self.editor.cursor.color),
                "border": u.border.as_deref().unwrap_or("rgba(255, 255, 255, 0.1)"),
                "borderSubtle": u.border_subtle.as_deref().unwrap_or("rgba(255, 255, 255, 0.06)"),
                "textPrimary": u.text_primary.as_deref().unwrap_or(default_fg),
                "textSecondary": u.text_secondary.as_deref().unwrap_or("rgba(228, 228, 228, 0.6)"),
                "textDisabled": u.text_disabled.as_deref().unwrap_or("rgba(228, 228, 228, 0.3)"),
                "buttonBackground": u.button_background.as_deref().unwrap_or("rgba(255, 255, 255, 0.1)"),
                "buttonHover": u.button_hover.as_deref().unwrap_or("rgba(255, 255, 255, 0.15)"),
                "buttonActive": u.button_active.as_deref().unwrap_or("rgba(0, 217, 255, 0.3)"),
                "inputBackground": u.input_background.as_deref().unwrap_or("rgba(0, 0, 0, 0.3)"),
                "inputBorder": u.input_border.as_deref().unwrap_or("rgba(255, 255, 255, 0.2)"),
                "inputFocus": u.input_focus.as_deref().unwrap_or("rgba(0, 217, 255, 0.5)"),
                "tooltipBackground": u.tooltip_background.as_deref().unwrap_or("rgba(28, 28, 28, 0.95)"),
                "scrollbarThumb": u.scrollbar_thumb.as_deref().unwrap_or("rgba(255, 255, 255, 0.12)"),
                "scrollbarThumbHover": u.scrollbar_thumb_hover.as_deref().unwrap_or("rgba(255, 255, 255, 0.25)"),
                "error": u.error.as_deref().unwrap_or("#ff5555"),
                "warning": u.warning.as_deref().unwrap_or("#f1fa8c"),
                "success": u.success.as_deref().unwrap_or("#50fa7b"),
                "info": u.info.as_deref().unwrap_or("#00d9ff"),
                "searchMatch": u.search_match.as_deref().unwrap_or("rgba(255, 193, 7, 0.3)"),
                "searchMatchSelected": u.search_match_selected.as_deref().unwrap_or("rgba(255, 193, 7, 0.5)"),
                "selectionMatch": u.selection_match.as_deref().unwrap_or("rgba(0, 217, 255, 0.1)"),
            })
        } else {
            json!({
                "statusBar": {
                    "background": self.chrome.background.color,
                    "foreground": self.chrome.foreground,
                    "height": 24,
                },
                "primary": self.editor.cursor.color,
                "border": "rgba(255, 255, 255, 0.1)",
                "borderSubtle": "rgba(255, 255, 255, 0.06)",
                "textPrimary": default_fg,
                "textSecondary": "rgba(228, 228, 228, 0.6)",
                "textDisabled": "rgba(228, 228, 228, 0.3)",
                "buttonBackground": "rgba(255, 255, 255, 0.1)",
                "buttonHover": "rgba(255, 255, 255, 0.15)",
                "buttonActive": "rgba(0, 217, 255, 0.3)",
                "inputBackground": "rgba(0, 0, 0, 0.3)",
                "inputBorder": "rgba(255, 255, 255, 0.2)",
                "inputFocus": "rgba(0, 217, 255, 0.5)",
                "tooltipBackground": "rgba(28, 28, 28, 0.95)",
                "scrollbarThumb": "rgba(255, 255, 255, 0.12)",
                "scrollbarThumbHover": "rgba(255, 255, 255, 0.25)",
                "error": "#ff5555",
                "warning": "#f1fa8c",
                "success": "#50fa7b",
                "info": "#00d9ff",
                "searchMatch": "rgba(255, 193, 7, 0.3)",
                "searchMatchSelected": "rgba(255, 193, 7, 0.5)",
                "selectionMatch": "rgba(0, 217, 255, 0.1)",
            })
        };

        // Transitions
        let transitions = if let Some(ref tr) = self.transitions {
            json!({
                "chromeToggle": tr.chrome_toggle.unwrap_or(200),
                "themeSwitch": tr.theme_switch.unwrap_or(300),
                "hover": tr.hover.unwrap_or(100),
                "easing": tr.easing.as_deref().unwrap_or("cubic-bezier(0.4, 0.0, 0.2, 1)"),
            })
        } else {
            json!({
                "chromeToggle": 200,
                "themeSwitch": 300,
                "hover": 100,
                "easing": "cubic-bezier(0.4, 0.0, 0.2, 1)",
            })
        };

        json!({
            "metadata": {
                "name": self.metadata.name,
                "author": self.metadata.author,
                "version": self.metadata.version,
                "base": self.metadata.base,
            },
            "palette": palette,
            "window": window,
            "chrome": chrome,
            "editor": editor,
            "syntax": syntax,
            "ui": ui,
            "transitions": transitions,
        })
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

/// Load a theme by name and return it as JSON matching the frontend's Theme interface.
#[tauri::command]
pub async fn load_theme_data(theme_name: String) -> Result<serde_json::Value, String> {
    let theme_path = themes_dir().join(format!("{}.toml", theme_name));

    let content = std::fs::read_to_string(&theme_path).map_err(|e| {
        format!(
            "Failed to read theme file '{}': {}",
            theme_path.display(),
            e
        )
    })?;

    let theme: Theme = toml::from_str(&content)
        .map_err(|e| format!("Failed to parse theme '{}': {}", theme_name, e))?;

    Ok(theme.to_frontend_json())
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
base = "dark"

[window]
background.base = "#030304"
background.blur = 20
border.radius = 12
border.width = 1
border.color = "rgba(255, 255, 255, 0.08)"

[window.shadow]
color = "rgba(0, 0, 0, 0.6)"
blur = 40
offset = [0, 10]

[chrome]
background.color = "#363941"
background.blur = 10
height = 32
foreground = "#FFFFFF"
border = "rgba(255, 255, 255, 0.06)"
menu_background = "rgba(54, 57, 65, 0.98)"
menu_hover = "rgba(255, 204, 213, 0.12)"
menu_foreground = "rgba(255, 255, 255, 0.85)"

[editor]
background = "transparent"
foreground = "#FFFFFF"
cursor.color = "#FFCCD5"
cursor.width = 2
selection.background = "rgba(255, 255, 255, 0.15)"
font_family = "'SF Mono', 'Cascadia Code', 'Fira Code', 'JetBrains Mono', 'Consolas', monospace"
font_size = 14
line_height = 1.6

[editor.line]
active = "rgba(255, 255, 255, 0.04)"
number = "rgba(255, 255, 255, 0.25)"
number_active = "#FFCCD5"

[editor.gutter]
background = "rgba(0, 0, 0, 0.15)"
border = "rgba(255, 255, 255, 0.06)"

[palette]
background = "#030304"
foreground = "#FFFFFF"
cursor_color = "#FFCCD5"
selection_background = "rgba(255, 255, 255, 0.15)"
black = "#363941"
red = "#FF758F"
green = "#E6FF75"
yellow = "#FBD58E"
blue = "#8875FF"
purple = "#FF75C6"
cyan = "#75FFCF"
white = "#FFCCD5"
bright_black = "#505664"
bright_red = "#FF8FA3"
bright_green = "#F3F3B0"
bright_yellow = "#FDDEBC"
bright_blue = "#C4AEF5"
bright_purple = "#FFAED8"
bright_cyan = "#BAF3DD"
bright_white = "#FFE6EA"

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
tag = "#FF75C6"
attribute = "#F3F3B0"
property = "#FFCCD5"
punctuation = "rgba(255, 255, 255, 0.5)"
regexp = "#75FFCF"
heading = "#FF75C6"
link = "#75FFCF"
meta = "#505664"

[ui]
status_bar.background = "#363941"
status_bar.foreground = "#FFFFFF"
status_bar.height = 24
primary = "#FFCCD5"
border = "rgba(255, 255, 255, 0.1)"
border_subtle = "rgba(255, 255, 255, 0.06)"
text_primary = "#FFFFFF"
text_secondary = "rgba(255, 255, 255, 0.55)"
text_disabled = "rgba(255, 255, 255, 0.25)"
button_background = "rgba(255, 255, 255, 0.08)"
button_hover = "rgba(255, 255, 255, 0.12)"
button_active = "rgba(255, 204, 213, 0.2)"
input_background = "rgba(0, 0, 0, 0.25)"
input_border = "rgba(255, 255, 255, 0.12)"
input_focus = "rgba(255, 204, 213, 0.4)"
tooltip_background = "rgba(54, 57, 65, 0.97)"
scrollbar_thumb = "rgba(255, 255, 255, 0.12)"
scrollbar_thumb_hover = "rgba(255, 255, 255, 0.25)"
error = "#FF758F"
warning = "#FBD58E"
success = "#75FFCF"
info = "#8875FF"
search_match = "rgba(251, 213, 142, 0.3)"
search_match_selected = "rgba(251, 213, 142, 0.5)"
selection_match = "rgba(255, 204, 213, 0.12)"

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
        assert_eq!(theme.metadata.base, "dark");
        assert_eq!(theme.syntax.comment.color, "#8875FF");
        assert!(theme.syntax.comment.style.is_none());
        assert_eq!(theme.chrome.foreground, "#FFFFFF");
        assert_eq!(theme.chrome.height, 32);
        assert_eq!(theme.window.border.width, 1);
        assert_eq!(theme.window.border.color, "rgba(255, 255, 255, 0.08)");
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
        assert_eq!(ui.primary.as_deref(), Some("#FFCCD5"));
        assert_eq!(ui.error.as_deref(), Some("#FF758F"));
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
    fn test_palette_parsed() {
        let theme: Theme = toml::from_str(MILKYTEXT_STYLE).expect("Failed to parse");
        let p = theme.palette.expect("Palette should be present");
        assert_eq!(p.background, "#030304");
        assert_eq!(p.cursor_color, "#FFCCD5");
        assert_eq!(p.black, "#363941");
        assert_eq!(p.bright_white, "#FFE6EA");
    }

    #[test]
    fn test_editor_line_gutter_parsed() {
        let theme: Theme = toml::from_str(MILKYTEXT_STYLE).expect("Failed to parse");
        let line = theme.editor.line.expect("Editor line should be present");
        assert_eq!(line.active, "rgba(255, 255, 255, 0.04)");
        assert_eq!(line.number_active, "#FFCCD5");
        let gutter = theme
            .editor
            .gutter
            .expect("Editor gutter should be present");
        assert_eq!(gutter.background, "rgba(0, 0, 0, 0.15)");
    }

    #[test]
    fn test_window_shadow_parsed() {
        let theme: Theme = toml::from_str(MILKYTEXT_STYLE).expect("Failed to parse");
        let shadow = theme
            .window
            .shadow
            .expect("Window shadow should be present");
        assert_eq!(shadow.color, "rgba(0, 0, 0, 0.6)");
        assert_eq!(shadow.blur, 40);
        assert_eq!(shadow.offset, [0, 10]);
    }

    #[test]
    fn test_optional_syntax_tokens_parsed() {
        let theme: Theme = toml::from_str(MILKYTEXT_STYLE).expect("Failed to parse");
        assert_eq!(theme.syntax.tag.as_ref().unwrap().color, "#FF75C6");
        assert_eq!(theme.syntax.property.as_ref().unwrap().color, "#FFCCD5");
        assert_eq!(theme.syntax.meta.as_ref().unwrap().color, "#505664");
    }

    #[test]
    fn test_css_vars_include_metadata() {
        let theme: Theme = toml::from_str(MILKYTEXT_STYLE).expect("Failed to parse");
        let css = theme.to_css_vars();
        assert!(css.contains("--theme-name: \"MilkyText\""));
        assert!(css.contains("--theme-base: \"dark\""));
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

        // Editor line/gutter
        assert!(css.contains("--line-active:"));
        assert!(css.contains("--line-number:"));
        assert!(css.contains("--line-number-active:"));
        assert!(css.contains("--gutter-bg:"));

        // Syntax
        assert!(css.contains("--syntax-comment:"));
        assert!(css.contains("--syntax-number:"));
        assert!(css.contains("--syntax-operator:"));
        assert!(css.contains("--syntax-variable:"));
        assert!(css.contains("--syntax-type:"));
        assert!(css.contains("--syntax-constant:"));
        assert!(css.contains("--syntax-tag:"));
        assert!(css.contains("--syntax-property:"));

        // UI
        assert!(css.contains("--status-bar-bg:"));
        assert!(css.contains("--status-bar-fg:"));
        assert!(css.contains("--status-bar-height:"));
        assert!(css.contains("--color-primary:"));
        assert!(css.contains("--border-color:"));
        assert!(css.contains("--color-error:"));

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
        assert!(theme.palette.is_none());
        assert!(theme.editor.line.is_none());
        assert!(theme.editor.gutter.is_none());
        assert!(theme.window.shadow.is_none());
        // CSS should still generate without errors
        let css = theme.to_css_vars();
        assert!(css.contains("--theme-name: \"Minimal\""));
        assert!(!css.contains("--status-bar-bg:"));
        assert!(!css.contains("--transition-hover:"));
    }

    #[test]
    fn test_to_frontend_json() {
        let theme: Theme = toml::from_str(MILKYTEXT_STYLE).expect("Failed to parse");
        let json = theme.to_frontend_json();

        // Verify top-level structure
        assert!(json["metadata"]["name"].is_string());
        assert_eq!(json["metadata"]["name"], "MilkyText");
        assert_eq!(json["metadata"]["base"], "dark");

        // Verify chrome is flattened (background is a string, not object)
        assert!(json["chrome"]["background"].is_string());
        assert_eq!(json["chrome"]["background"], "#363941");
        assert_eq!(json["chrome"]["blur"], 10);

        // Verify syntax tokens are plain strings
        assert!(json["syntax"]["comment"].is_string());
        assert_eq!(json["syntax"]["comment"], "#8875FF");

        // Verify UI has all required fields
        assert!(json["ui"]["statusBar"]["background"].is_string());
        assert!(json["ui"]["primary"].is_string());
        assert!(json["ui"]["error"].is_string());
        assert!(json["ui"]["scrollbarThumb"].is_string());

        // Verify palette
        assert_eq!(json["palette"]["background"], "#030304");
        assert_eq!(json["palette"]["cursorColor"], "#FFCCD5");

        // Verify transitions
        assert_eq!(json["transitions"]["chromeToggle"], 200);
        assert_eq!(json["transitions"]["hover"], 100);

        // Verify editor has line and gutter
        assert!(json["editor"]["line"]["active"].is_string());
        assert!(json["editor"]["gutter"]["background"].is_string());
    }

    #[test]
    fn test_to_frontend_json_minimal() {
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
        let theme: Theme = toml::from_str(minimal).expect("Failed to parse");
        let json = theme.to_frontend_json();

        // Should have defaults for missing sections
        assert!(json["ui"]["statusBar"]["background"].is_string());
        assert!(json["transitions"]["chromeToggle"].is_number());
        assert!(json["palette"]["background"].is_string());
        assert!(json["editor"]["line"]["active"].is_string());
    }
}
