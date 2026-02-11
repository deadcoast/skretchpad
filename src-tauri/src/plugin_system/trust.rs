// src-tauri/src/plugin_system/trust.rs

use base64::Engine;
use ed25519_dalek::{Signature, Verifier, VerifyingKey};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::collections::HashSet;
use std::path::Path;
use std::time::SystemTime;

#[derive(Debug, Clone, Default, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "kebab-case")]
pub enum TrustLevel {
    /// Official plugins (shipped with skretchpad)
    FirstParty,

    /// Verified by maintainers (signature check)
    Verified,

    /// Community plugins (user discretion)
    #[default]
    Community,

    /// Local development plugins
    Local,
}

impl TrustLevel {
    pub fn auto_grant_permissions(&self) -> bool {
        matches!(self, TrustLevel::FirstParty)
    }

    pub fn requires_signature(&self) -> bool {
        matches!(self, TrustLevel::Verified)
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
    #[allow(dead_code)]
    pub fn new(public_key: String, signature: Vec<u8>) -> Self {
        Self {
            public_key,
            signature,
            timestamp: SystemTime::now(),
        }
    }

    pub fn is_valid(&self) -> bool {
        // Structural checks only; cryptographic verification is handled by TrustVerifier.
        if self.public_key.trim().is_empty() {
            return false;
        }
        if self.signature.len() != 64 {
            return false;
        }
        self.timestamp <= SystemTime::now()
    }
}

#[derive(Serialize)]
struct SignaturePayload<'a> {
    version: u8,
    plugin_id: &'a str,
    name: &'a str,
    plugin_version: &'a str,
    main: &'a str,
    source: &'a str,
    trust: &'a TrustLevel,
    timestamp_secs: u64,
    plugin_toml_sha256: String,
    entrypoint_sha256: String,
}

pub fn build_plugin_signature_payload(
    plugin_id: &str,
    plugin_root: &Path,
    manifest: &crate::plugin_system::loader::PluginManifest,
    timestamp: SystemTime,
) -> Result<Vec<u8>, String> {
    let plugin_toml_path = plugin_root.join("plugin.toml");
    let entrypoint_path = plugin_root.join(&manifest.main);

    let plugin_toml_bytes = std::fs::read(&plugin_toml_path).map_err(|e| {
        format!(
            "Failed to read plugin manifest for signature payload '{}': {}",
            plugin_toml_path.display(),
            e
        )
    })?;
    let entrypoint_bytes = std::fs::read(&entrypoint_path).map_err(|e| {
        format!(
            "Failed to read plugin entrypoint for signature payload '{}': {}",
            entrypoint_path.display(),
            e
        )
    })?;

    let payload = SignaturePayload {
        version: 1,
        plugin_id,
        name: &manifest.name,
        plugin_version: &manifest.version,
        main: &manifest.main,
        source: &manifest.source,
        trust: &manifest.trust,
        timestamp_secs: timestamp
            .duration_since(SystemTime::UNIX_EPOCH)
            .map_err(|e| format!("Invalid signature timestamp: {}", e))?
            .as_secs(),
        plugin_toml_sha256: hex_sha256(&plugin_toml_bytes),
        entrypoint_sha256: hex_sha256(&entrypoint_bytes),
    };

    serde_json::to_vec(&payload)
        .map_err(|e| format!("Failed to serialize signature payload: {}", e))
}

pub struct TrustVerifier {
    trusted_keys: HashSet<String>,
}

impl TrustVerifier {
    pub fn new() -> Self {
        Self {
            trusted_keys: HashSet::new(),
        }
    }

    pub fn verify_signature(&self, signature: &PluginSignature, payload: &[u8]) -> bool {
        if !self.trusted_keys.contains(&signature.public_key) {
            return false;
        }
        if !signature.is_valid() {
            return false;
        }

        let public_key_bytes = match decode_public_key(&signature.public_key) {
            Some(bytes) => bytes,
            None => return false,
        };

        let verifying_key = match VerifyingKey::from_bytes(&public_key_bytes) {
            Ok(key) => key,
            Err(_) => return false,
        };

        let signature_bytes: [u8; 64] = match signature.signature.clone().try_into() {
            Ok(bytes) => bytes,
            Err(_) => return false,
        };

        let parsed_signature = Signature::from_bytes(&signature_bytes);
        verifying_key.verify(payload, &parsed_signature).is_ok()
    }

    pub fn add_trusted_key(&mut self, key: String) -> Result<(), String> {
        if decode_public_key(&key).is_none() {
            return Err(
                "Trusted key must be a valid Ed25519 public key (base64 or hex)".to_string(),
            );
        }
        self.trusted_keys.insert(key);
        Ok(())
    }

    pub fn remove_trusted_key(&mut self, key: &str) -> bool {
        self.trusted_keys.remove(key)
    }

    pub fn set_trusted_keys(&mut self, keys: Vec<String>) -> Result<(), String> {
        let mut next = HashSet::new();
        for key in keys {
            if decode_public_key(&key).is_none() {
                return Err(
                    "Trusted key list contains an invalid Ed25519 public key (base64 or hex)"
                        .to_string(),
                );
            }
            next.insert(key);
        }
        self.trusted_keys = next;
        Ok(())
    }

    pub fn trusted_keys(&self) -> Vec<String> {
        let mut keys: Vec<String> = self.trusted_keys.iter().cloned().collect();
        keys.sort();
        keys
    }

    pub fn load_from_file(&mut self, path: &Path) -> Result<(), String> {
        if !path.exists() {
            return Ok(());
        }
        let content = std::fs::read_to_string(path)
            .map_err(|e| format!("Failed to read trusted keys '{}': {}", path.display(), e))?;
        let keys: Vec<String> = serde_json::from_str(&content)
            .map_err(|e| format!("Failed to parse trusted keys '{}': {}", path.display(), e))?;

        let mut validated = HashSet::new();
        for key in keys {
            if decode_public_key(&key).is_none() {
                return Err(format!(
                    "Trusted key file '{}' contains an invalid Ed25519 key",
                    path.display()
                ));
            }
            validated.insert(key);
        }
        self.trusted_keys = validated;
        Ok(())
    }

    pub fn save_to_file(&self, path: &Path) -> Result<(), String> {
        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent).map_err(|e| {
                format!(
                    "Failed to create trusted key directory '{}': {}",
                    parent.display(),
                    e
                )
            })?;
        }
        let content = serde_json::to_string_pretty(&self.trusted_keys())
            .map_err(|e| format!("Failed to serialize trusted keys: {}", e))?;
        std::fs::write(path, content)
            .map_err(|e| format!("Failed to write trusted keys '{}': {}", path.display(), e))
    }
}

fn hex_sha256(input: &[u8]) -> String {
    let digest = Sha256::digest(input);
    digest.iter().map(|b| format!("{:02x}", b)).collect()
}

fn decode_public_key(input: &str) -> Option<[u8; 32]> {
    let key = input.trim();
    if key.is_empty() {
        return None;
    }

    let hex_candidate = key.strip_prefix("0x").unwrap_or(key);
    if hex_candidate.len() == 64 {
        if let Some(bytes) = decode_hex_32(hex_candidate) {
            return Some(bytes);
        }
    }

    let decoded = base64::engine::general_purpose::STANDARD.decode(key).ok()?;
    decoded.try_into().ok()
}

fn decode_hex_32(hex: &str) -> Option<[u8; 32]> {
    if hex.len() != 64 {
        return None;
    }
    let mut out = [0u8; 32];
    for (i, chunk) in hex.as_bytes().chunks_exact(2).enumerate() {
        let as_str = std::str::from_utf8(chunk).ok()?;
        let byte = u8::from_str_radix(as_str, 16).ok()?;
        out[i] = byte;
    }
    Some(out)
}

// ============================================================================
// TESTS
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;
    use crate::plugin_system::capabilities::PluginCapabilities;
    use ed25519_dalek::{Signer, SigningKey};
    use tempfile::TempDir;

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
    fn test_requires_signature_only_for_verified() {
        assert!(!TrustLevel::FirstParty.requires_signature());
        assert!(TrustLevel::Verified.requires_signature());
        assert!(!TrustLevel::Community.requires_signature());
        assert!(!TrustLevel::Local.requires_signature());
    }

    #[test]
    fn test_trust_verifier() {
        let mut verifier = TrustVerifier::new();
        let signing_key = SigningKey::from_bytes(&[7u8; 32]);
        let verifying_key = signing_key.verifying_key();
        let public_key_b64 =
            base64::engine::general_purpose::STANDARD.encode(verifying_key.to_bytes());
        verifier.add_trusted_key(public_key_b64.clone()).unwrap();

        let payload = br#"{"scope":"test"}"#;
        let signature = signing_key.sign(payload);
        let sig = PluginSignature::new(public_key_b64.clone(), signature.to_bytes().to_vec());
        assert!(verifier.verify_signature(&sig, payload));

        let tampered_payload = br#"{"scope":"tampered"}"#;
        assert!(!verifier.verify_signature(&sig, tampered_payload));

        let bad_sig =
            PluginSignature::new("unknown-key".to_string(), signature.to_bytes().to_vec());
        assert!(!verifier.verify_signature(&bad_sig, payload));
    }

    #[test]
    fn test_build_plugin_signature_payload_binds_manifest_and_entrypoint() {
        let tmp = TempDir::new().unwrap();
        let plugin_dir = tmp.path().join("signed-plugin");
        std::fs::create_dir_all(&plugin_dir).unwrap();
        std::fs::write(
            plugin_dir.join("plugin.toml"),
            r#"
name = "signed-plugin"
version = "1.2.3"
main = "main.js"
source = "https://example.com/signed-plugin"
trust = "verified"
"#,
        )
        .unwrap();
        std::fs::write(plugin_dir.join("main.js"), "console.log('v1');").unwrap();

        let manifest = crate::plugin_system::loader::PluginManifest {
            name: "signed-plugin".to_string(),
            version: "1.2.3".to_string(),
            description: String::new(),
            author: String::new(),
            license: String::new(),
            main: "main.js".to_string(),
            capabilities: PluginCapabilities::default(),
            permissions: None,
            ui: None,
            dependencies: vec![],
            source: "https://example.com/signed-plugin".to_string(),
            signature: None,
            trust: TrustLevel::Verified,
            hooks: None,
            commands: None,
        };

        let payload_a = build_plugin_signature_payload(
            "signed-plugin",
            &plugin_dir,
            &manifest,
            SystemTime::UNIX_EPOCH + std::time::Duration::from_secs(123),
        )
        .unwrap();

        std::fs::write(plugin_dir.join("main.js"), "console.log('v2');").unwrap();

        let payload_b = build_plugin_signature_payload(
            "signed-plugin",
            &plugin_dir,
            &manifest,
            SystemTime::UNIX_EPOCH + std::time::Duration::from_secs(123),
        )
        .unwrap();

        assert_ne!(payload_a, payload_b);
    }

    #[test]
    fn test_trusted_keys_save_and_load_roundtrip() {
        let tmp = TempDir::new().unwrap();
        let path = tmp.path().join("trusted_keys.json");
        let mut verifier = TrustVerifier::new();
        let signing_key = SigningKey::from_bytes(&[9u8; 32]);
        let key = base64::engine::general_purpose::STANDARD
            .encode(signing_key.verifying_key().to_bytes());
        verifier.add_trusted_key(key.clone()).unwrap();
        verifier.save_to_file(&path).unwrap();

        let mut loaded = TrustVerifier::new();
        loaded.load_from_file(&path).unwrap();
        assert_eq!(loaded.trusted_keys(), vec![key]);
    }

    #[test]
    fn test_signed_plugin_fixture_verification_and_tamper() {
        let tmp = TempDir::new().unwrap();
        let plugin_dir = tmp.path().join("fixture-plugin");
        std::fs::create_dir_all(&plugin_dir).unwrap();
        std::fs::write(
            plugin_dir.join("plugin.toml"),
            r#"
name = "fixture-plugin"
version = "1.0.0"
main = "main.js"
source = "https://example.com/fixture-plugin"
trust = "verified"
"#,
        )
        .unwrap();
        std::fs::write(plugin_dir.join("main.js"), "console.log('fixture v1');").unwrap();

        let manifest = crate::plugin_system::loader::PluginManifest {
            name: "fixture-plugin".to_string(),
            version: "1.0.0".to_string(),
            description: String::new(),
            author: String::new(),
            license: String::new(),
            main: "main.js".to_string(),
            capabilities: PluginCapabilities::default(),
            permissions: None,
            ui: None,
            dependencies: vec![],
            source: "https://example.com/fixture-plugin".to_string(),
            signature: None,
            trust: TrustLevel::Verified,
            hooks: None,
            commands: None,
        };

        let timestamp = SystemTime::UNIX_EPOCH + std::time::Duration::from_secs(777);
        let payload =
            build_plugin_signature_payload("fixture-plugin", &plugin_dir, &manifest, timestamp)
                .unwrap();

        let signing_key = SigningKey::from_bytes(&[33u8; 32]);
        let verify_key = base64::engine::general_purpose::STANDARD
            .encode(signing_key.verifying_key().to_bytes());
        let signature = signing_key.sign(&payload);
        let sig = PluginSignature {
            public_key: verify_key.clone(),
            signature: signature.to_bytes().to_vec(),
            timestamp,
        };

        let mut verifier = TrustVerifier::new();
        verifier.add_trusted_key(verify_key).unwrap();
        assert!(verifier.verify_signature(&sig, &payload));

        std::fs::write(plugin_dir.join("main.js"), "console.log('fixture v2');").unwrap();
        let tampered_payload =
            build_plugin_signature_payload("fixture-plugin", &plugin_dir, &manifest, timestamp)
                .unwrap();
        assert!(!verifier.verify_signature(&sig, &tampered_payload));
    }

    #[test]
    fn test_key_revocation_blocks_existing_signature() {
        let signing_key = SigningKey::from_bytes(&[55u8; 32]);
        let public_key = base64::engine::general_purpose::STANDARD
            .encode(signing_key.verifying_key().to_bytes());
        let payload = br#"{"plugin":"revocation"}"#;
        let signature = signing_key.sign(payload);
        let sig = PluginSignature::new(public_key.clone(), signature.to_bytes().to_vec());

        let mut verifier = TrustVerifier::new();
        verifier.add_trusted_key(public_key.clone()).unwrap();
        assert!(verifier.verify_signature(&sig, payload));

        assert!(verifier.remove_trusted_key(&public_key));
        assert!(!verifier.verify_signature(&sig, payload));
    }

    #[test]
    fn test_load_trusted_keys_rejects_invalid_key_material() {
        let tmp = TempDir::new().unwrap();
        let path = tmp.path().join("trusted_keys.json");
        std::fs::write(&path, r#"["invalid-key-material"]"#).unwrap();

        let mut verifier = TrustVerifier::new();
        let err = verifier.load_from_file(&path).unwrap_err();
        assert!(err.contains("invalid Ed25519 key"));
    }

    #[test]
    fn test_set_trusted_keys_is_atomic_on_invalid_input() {
        let signing_key = SigningKey::from_bytes(&[77u8; 32]);
        let valid_key = base64::engine::general_purpose::STANDARD
            .encode(signing_key.verifying_key().to_bytes());
        let mut verifier = TrustVerifier::new();
        verifier.add_trusted_key(valid_key.clone()).unwrap();

        let previous = verifier.trusted_keys();
        let err = verifier
            .set_trusted_keys(vec!["invalid-key-material".to_string()])
            .unwrap_err();
        assert!(err.contains("invalid Ed25519 public key"));
        assert_eq!(verifier.trusted_keys(), previous);
    }
}
