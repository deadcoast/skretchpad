// src-tauri/src/theme_engine/color_utils.rs
use palette::{Hsv, IntoColor, Srgb};

pub struct ColorScheme {
    base_hue: f32,
    saturation: f32,
    lightness: f32,
}

impl ColorScheme {
    /// Generate complementary color scheme from base color
    pub fn from_base(base: &str) -> Result<Self> {
        let rgb = parse_css_color(base)?;
        let hsv: Hsv = rgb.into_color();
        
        Ok(Self {
            base_hue: hsv.hue.to_positive_degrees(),
            saturation: hsv.saturation,
            lightness: hsv.value,
        })
    }
    
    /// Generate syntax colors using color theory
    pub fn generate_syntax_palette(&self) -> HashMap<String, String> {
        let mut palette = HashMap::new();
        
        // Keyword: Complementary color
        let keyword_hue = (self.base_hue + 180.0) % 360.0;
        palette.insert(
            "keyword".to_string(),
            self.hsv_to_css(keyword_hue, 0.7, 0.8),
        );
        
        // String: Triadic color (120° offset)
        let string_hue = (self.base_hue + 120.0) % 360.0;
        palette.insert(
            "string".to_string(),
            self.hsv_to_css(string_hue, 0.6, 0.7),
        );
        
        // Function: Analogous color (30° offset)
        let function_hue = (self.base_hue + 30.0) % 360.0;
        palette.insert(
            "function".to_string(),
            self.hsv_to_css(function_hue, 0.7, 0.8),
        );
        
        // Comment: Desaturated base color
        palette.insert(
            "comment".to_string(),
            self.hsv_to_css(self.base_hue, 0.2, 0.5),
        );
        
        palette
    }
    
    fn hsv_to_css(&self, hue: f32, sat: f32, val: f32) -> String {
        let hsv = Hsv::new(hue, sat, val);
        let rgb: Srgb = hsv.into_color();
        
        format!(
            "#{:02x}{:02x}{:02x}",
            (rgb.red * 255.0) as u8,
            (rgb.green * 255.0) as u8,
            (rgb.blue * 255.0) as u8
        )
    }
}

// Theme CLI tool for generating themes
#[tauri::command]
pub async fn generate_theme_from_color(base_color: String, name: String) -> Result<Theme> {
    let scheme = ColorScheme::from_base(&base_color)?;
    let syntax_palette = scheme.generate_syntax_palette();
    
    // Create theme from generated palette
    let theme = Theme {
        metadata: ThemeMetadata {
            name,
            author: "Generated".to_string(),
            version: "1.0.0".to_string(),
            base: ThemeBase::Dark,
        },
        syntax: SyntaxTheme {
            tokens: syntax_palette,
        },
        // ... other fields with defaults
    };
    
    Ok(theme)
}