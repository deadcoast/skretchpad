// src-tauri/src/plugin_system/trust.rs

use serde::{Deserialize, Serialize};
use std::time::SystemTime;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "kebab-case")]
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

impl Default for TrustLevel {
    fn default() -> Self {
        TrustLevel::Community
    }
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

// ============================================================================
// TESTS
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_trust_level_serde_kebab_case() {
        // Serialize
        assert_eq!(
            serde_json::to_string(&TrustLevel::FirstParty).unwrap(),
            r#""first-party""#
        );
        assert_eq!(
            serde_json::to_string(&TrustLevel::Community).unwrap(),
            r#""community""#
        );
        assert_eq!(
            serde_json::to_string(&TrustLevel::Local).unwrap(),
            r#""local""#
        );
        assert_eq!(
            serde_json::to_string(&TrustLevel::Verified).unwrap(),
            r#""verified""#
        );
    }

    #[test]
    fn test_trust_level_deserialize_kebab_case() {
        assert_eq!(
            serde_json::from_str::<TrustLevel>(r#""first-party""#).unwrap(),
            TrustLevel::FirstParty
        );
        assert_eq!(
            serde_json::from_str::<TrustLevel>(r#""community""#).unwrap(),
            TrustLevel::Community
        );
        assert_eq!(
            serde_json::from_str::<TrustLevel>(r#""local""#).unwrap(),
            TrustLevel::Local
        );
        assert_eq!(
            serde_json::from_str::<TrustLevel>(r#""verified""#).unwrap(),
            TrustLevel::Verified
        );
    }

    #[test]
    fn test_trust_level_toml_round_trip() {
        #[derive(serde::Serialize, serde::Deserialize)]
        struct Wrapper {
            trust: TrustLevel,
        }

        let toml_str = r#"trust = "first-party""#;
        let w: Wrapper = toml::from_str(toml_str).unwrap();
        assert_eq!(w.trust, TrustLevel::FirstParty);

        let toml_str = r#"trust = "community""#;
        let w: Wrapper = toml::from_str(toml_str).unwrap();
        assert_eq!(w.trust, TrustLevel::Community);
    }

    #[test]
    fn test_trust_level_default() {
        assert_eq!(TrustLevel::default(), TrustLevel::Community);
    }

    #[test]
    fn test_trust_level_auto_grant() {
        assert!(TrustLevel::FirstParty.auto_grant_permissions());
        assert!(!TrustLevel::Verified.auto_grant_permissions());
        assert!(!TrustLevel::Community.auto_grant_permissions());
        assert!(!TrustLevel::Local.auto_grant_permissions());
    }

    #[test]
    fn test_trust_level_is_trusted() {
        assert!(TrustLevel::FirstParty.is_trusted());
        assert!(TrustLevel::Verified.is_trusted());
        assert!(!TrustLevel::Community.is_trusted());
        assert!(!TrustLevel::Local.is_trusted());
    }

    #[test]
    fn test_trust_verifier() {
        let verifier = TrustVerifier::new();
        let sig = PluginSignature::new("skretchpad-official".to_string(), vec![1, 2, 3]);
        assert!(verifier.verify_signature(&sig));

        let bad_sig = PluginSignature::new("unknown-key".to_string(), vec![1, 2, 3]);
        assert!(!verifier.verify_signature(&bad_sig));
    }
}