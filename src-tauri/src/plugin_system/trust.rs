// src-tauri/src/plugin_system/trust.rs

use serde::{Deserialize, Serialize};
use std::time::SystemTime;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum TrustLevel {
    /// Official plugins (shipped with skretchpad)
    FirstParty,
    
    /// Verified by maintainers (signature check)
    Verified,
    
    /// Community plugins (user discretion)
    Community,
    
    /// Local development plugins
    Local,
}

impl TrustLevel {
    pub fn auto_grant_permissions(&self) -> bool {
        matches!(self, TrustLevel::FirstParty)
    }
    
    pub fn requires_signature(&self) -> bool {
        matches!(self, TrustLevel::Verified | TrustLevel::FirstParty)
    }
    
    pub fn is_trusted(&self) -> bool {
        matches!(self, TrustLevel::FirstParty | TrustLevel::Verified)
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PluginSignature {
    pub public_key: String,
    pub signature: Vec<u8>,
    pub timestamp: SystemTime,
}

impl PluginSignature {
    pub fn new(public_key: String, signature: Vec<u8>) -> Self {
        Self {
            public_key,
            signature,
            timestamp: SystemTime::now(),
        }
    }
    
    pub fn is_valid(&self) -> bool {
        // Basic validation - in a real implementation, this would verify the signature
        !self.public_key.is_empty() && !self.signature.is_empty()
    }
}

pub struct TrustVerifier {
    trusted_keys: std::collections::HashSet<String>,
}

impl TrustVerifier {
    pub fn new() -> Self {
        let mut trusted_keys = std::collections::HashSet::new();
        // Add trusted public keys here
        // For now, we'll add a placeholder
        trusted_keys.insert("skretchpad-official".to_string());
        
        Self { trusted_keys }
    }
    
    pub fn verify_signature(&self, signature: &PluginSignature) -> bool {
        // In a real implementation, this would:
        // 1. Verify the signature against the public key
        // 2. Check if the public key is in our trusted keys
        // 3. Verify the timestamp is recent enough
        
        self.trusted_keys.contains(&signature.public_key) && signature.is_valid()
    }
    
    pub fn add_trusted_key(&mut self, key: String) {
        self.trusted_keys.insert(key);
    }
    
    pub fn remove_trusted_key(&mut self, key: &str) -> bool {
        self.trusted_keys.remove(key)
    }
}