// src-tauri/src/language_loader.rs
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Deserialize)]
pub struct LanguageDefinition {
    id: String,
    extensions: Vec<String>,
    tokenizer: String,
    config: LanguageConfig,
    theme_mapping: HashMap<String, String>,
}

pub struct LanguageRegistry {
    languages: HashMap<String, LanguageDefinition>,
}

impl LanguageRegistry {
    pub fn load_language(&mut self, path: &str) -> Result<()> {
        // Hot-reload language definitions
    }
    
    pub fn detect_language(&self, filename: &str) -> Option<&LanguageDefinition> {
        // Extension-based detection
    }
}