// src-tauri/src/plugin_system/trust.rs
#[derive(Debug, Clone, Serialize, Deserialize)]
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
}

pub struct PluginSignature {
    public_key: String,
    signature: Vec<u8>,
    timestamp: SystemTime,
}

impl PluginManager {
    pub fn verify_plugin(&self, manifest: &PluginManifest) -> Result<TrustLevel> {
        // Check if plugin is first-party
        if self.first_party_plugins.contains(&manifest.name) {
            return Ok(TrustLevel::FirstParty);
        }
        
        // Verify signature if present
        if let Some(signature) = &manifest.signature {
            if self.verify_signature(manifest, signature)? {
                return Ok(TrustLevel::Verified);
            }
        }
        
        // Check if plugin is local (in user's plugins directory)
        if manifest.source.starts_with("file://") {
            return Ok(TrustLevel::Local);
        }
        
        Ok(TrustLevel::Community)
    }
}