// Security threat matrix
enum ThreatLevel {
    Critical,  // Can exfiltrate data, execute arbitrary code
    High,      // Can modify files without consent
    Medium,    // Can read sensitive files
    Low,       // UI-only access
}

struct Threat {
    vector: String,
    level: ThreatLevel,
    mitigation: String,
}

const THREATS: &[Threat] = &[
    Threat {
        vector: "Plugin reads ~/.ssh/id_rsa",
        level: ThreatLevel::Critical,
        mitigation: "Filesystem scope restriction + capability model",
    },
    Threat {
        vector: "Plugin makes network requests to exfiltrate data",
        level: ThreatLevel::Critical,
        mitigation: "Network capability gating + domain allowlist",
    },
    Threat {
        vector: "Plugin modifies files outside project directory",
        level: ThreatLevel::High,
        mitigation: "Scoped filesystem access + user confirmation",
    },
    Threat {
        vector: "Plugin executes shell commands",
        level: ThreatLevel::High,
        mitigation: "Command allowlist + sandboxed execution",
    },
];