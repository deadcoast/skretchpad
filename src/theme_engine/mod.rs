// src-tauri/src/theme_engine/mod.rs
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Deserialize)]
pub struct Theme {
    pub metadata: ThemeMetadata,
    pub window: WindowTheme,
    pub chrome: ChromeTheme,
    pub editor: EditorTheme,
    pub syntax: SyntaxTheme,
    pub ui: UiTheme,
    pub transitions: TransitionTheme,
}

#[derive(Debug, Clone, Deserialize)]
pub struct ThemeMetadata {
    pub name: String,
    pub author: String,
    pub version: String,
    pub base: ThemeBase,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ThemeBase {
    Dark,
    Light,
    HighContrast,
}

impl Theme {
    pub fn from_toml(path: &Path) -> Result<Self> {
        let content = std::fs::read_to_string(path)?;
        let theme: Theme = toml::from_str(&content)?;
        
        // Validate theme
        theme.validate()?;
        
        Ok(theme)
    }
    
    pub fn to_css_vars(&self) -> String {
        let mut css = String::from(":root {\n");
        
        // Window variables
        css.push_str(&format!("  --window-bg: {};\n", self.window.background.base));
        css.push_str(&format!("  --window-blur: {}px;\n", self.window.background.blur));
        css.push_str(&format!("  --window-border-radius: {}px;\n", self.window.border.radius));
        
        // Editor variables
        css.push_str(&format!("  --editor-bg: {};\n", self.editor.background));
        css.push_str(&format!("  --editor-fg: {};\n", self.editor.foreground));
        css.push_str(&format!("  --cursor-color: {};\n", self.editor.cursor.color));
        css.push_str(&format!("  --selection-bg: {};\n", self.editor.selection.background));
        
        // Syntax colors
        for (token, style) in &self.syntax.tokens {
            css.push_str(&format!("  --syntax-{}: {};\n", token, style.color));
            if let Some(bg) = &style.background {
                css.push_str(&format!("  --syntax-{}-bg: {};\n", token, bg));
            }
        }
        
        // Transitions
        css.push_str(&format!("  --transition-easing: {};\n", self.transitions.easing));
        css.push_str(&format!("  --transition-fast: {}ms;\n", self.transitions.hover));
        css.push_str(&format!("  --transition-medium: {}ms;\n", self.transitions.chrome_toggle));
        css.push_str(&format!("  --transition-slow: {}ms;\n", self.transitions.theme_switch));
        
        css.push_str("}\n");
        css
    }
    
    fn validate(&self) -> Result<()> {
        // Ensure all colors are valid CSS
        for (token, style) in &self.syntax.tokens {
            if !is_valid_css_color(&style.color) {
                return Err(ThemeError::InvalidColor {
                    token: token.clone(),
                    color: style.color.clone(),
                });
            }
        }
        
        // Ensure blur values are reasonable
        if self.window.background.blur > 100 {
            return Err(ThemeError::InvalidBlur(self.window.background.blur));
        }
        
        Ok(())
    }
}

#[tauri::command]
pub async fn load_theme(theme_name: String) -> Result<String> {
    let theme_path = get_theme_path(&theme_name)?;
    let theme = Theme::from_toml(&theme_path)?;
    
    // Generate CSS variables
    Ok(theme.to_css_vars())
}

#[tauri::command]
pub async fn hot_reload_theme(theme_name: String) -> Result<()> {
    // Watch theme file for changes
    let theme_path = get_theme_path(&theme_name)?;
    
    // Notify frontend to reload CSS
    emit_theme_reload_event(theme_name)?;
    
    Ok(())
}