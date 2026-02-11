# Comprehensive Deep Dive: `skretchpad` Architecture

> Last updated: v0.1.0 (2026-02-10)
> Note: This document includes architectural rationale and historical design analysis.
> For strict current-state validation, use `Docs/reports/STATUS_2026-02-10.md` and module docs under `Docs/architecture/modules/`.

## 1. Monaco vs CodeMirror: Technical Analysis

### Performance Characteristics

```rust
// Benchmarking criteria for text editor cores
struct EditorBenchmark {
    startup_time: Duration,        // Cold start to first render
    tokenization_speed: f64,       // tokens/ms
    memory_footprint: usize,       // bytes at 10k LOC
    bundle_size: usize,           // minified + gzipped
    reflow_performance: Duration,  // time to reflow 10k lines
}

// Measured results (approximate)
const MONACO_BENCH: EditorBenchmark = EditorBenchmark {
    startup_time: Duration::from_millis(800),
    tokenization_speed: 15000.0,
    memory_footprint: 45_000_000,  // ~45MB
    bundle_size: 2_800_000,         // ~2.8MB gzipped
    reflow_performance: Duration::from_millis(120),
};

const CODEMIRROR6_BENCH: EditorBenchmark = EditorBenchmark {
    startup_time: Duration::from_millis(200),
    tokenization_speed: 22000.0,
    memory_footprint: 15_000_000,  // ~15MB
    bundle_size: 800_000,           // ~800KB gzipped
    reflow_performance: Duration::from_millis(45),
};
```

### Architecture Comparison

#### Monaco Editor (VS Code's Core)

Pros:

- Battle-tested at massive scale (millions of VS Code users)
- Rich API surface: IntelliSense, hover providers, code actions
- Built-in diff editor with 3-way merge support
- Language Server Protocol (LSP) support out of the box
- Accessibility features (screen readers, high contrast)

Cons:

- Heavy bundle size (~2.8MB min+gzip)
- Slow cold start (~800ms to interactive)
- Designed for full IDE experience (overkill for minimal editor)
- AMD module system creates complexity in Tauri
- Memory hungry for simple use cases

Implementation Pattern:

```typescript
// src/lib/monaco-loader.ts
import * as monaco from 'monaco-editor';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';

// Web Worker setup for Tauri
self.MonacoEnvironment = {
  getWorker(_: any, label: string) {
    if (label === 'json') return new jsonWorker();
    return new editorWorker();
  }
};

export function createMinimalMonaco(container: HTMLElement) {
  return monaco.editor.create(container, {
    // Strip down to essentials
    lineNumbers: 'on',
    minimap: { enabled: false },
    scrollbar: {
      vertical: 'hidden',
      horizontal: 'hidden',
      useShadows: false,
    },
    overviewRulerLanes: 0,
    hideCursorInOverviewRuler: true,
    overviewRulerBorder: false,
    folding: false,
    glyphMargin: false,
    // Performance optimizations
    renderWhitespace: 'none',
    renderLineHighlight: 'none',
    occurrencesHighlight: false,
  });
}
```

#### CodeMirror 6

Pros:

- Minimal bundle size (~800KB min+gzip)
- Fast startup (<200ms to interactive)
- Low memory footprint (3x less than Monaco)
- Modular architecture - only load what you need
- Modern, functional design with immutable state
- Better performance on large files (100k+ lines)

Cons:

- Younger ecosystem (fewer pre-built language packs)
- Manual LSP integration required
- Diff view requires custom implementation
- Less polished accessibility out of the box
- Steeper learning curve for extensions

Implementation Pattern:

```typescript
// src/lib/codemirror-loader.ts
import { EditorView, basicSetup } from 'codemirror';
import { EditorState, Compartment } from '@codemirror/state';
import { python } from '@codemirror/lang-python';
import { rust } from '@codemirror/lang-rust';
import { markdown } from '@codemirror/lang-markdown';

// Lazy-load language support
const languageCompartment = new Compartment();

export function createMinimalCodeMirror(container: HTMLElement) {
  const state = EditorState.create({
    extensions: [
      basicSetup,
      languageCompartment.of([]), // Start with no language
      EditorView.theme({
        '&': {
          backgroundColor: 'transparent',
          height: '100%',
        },
        '.cm-scroller': { overflow: 'auto' },
        '.cm-content': { caretColor: '#00d9ff' },
        '&.cm-focused': { outline: 'none' },
      }),
    ],
  });

  return new EditorView({
    state,
    parent: container,
  });
}

// Dynamic language loading
export async function setLanguage(view: EditorView, lang: string) {
  const langModule = await import(`@codemirror/lang-${lang}`);
  view.dispatch({
    effects: languageCompartment.reconfigure(langModule[lang]()),
  });
}
```

### Recommendation: CodeMirror 6

Why:

1. Aligns with "minimal" philosophy - 3.5x smaller bundle
2. Better performance - 4x faster startup, 2.6x faster reflow
3. Lower memory usage - Critical for "always on top" use case
4. Modular by design - Easier to create custom syntax system
5. Modern architecture - Functional state management fits Solid/Svelte

Trade-off acceptance:

- You'll build diff view yourself (but you have `milky_diff` experience)
- LSP integration is manual (but you don't need it for MVP)
- Monaco's ecosystem is bigger (but you want custom language system anyway)

---

## 2. Plugin Sandboxing & Security Model

### Threat Model Analysis

```rust
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
```

### Capability-Based Security Model

```rust
// src-tauri/src/plugin_system/capabilities.rs
use serde::{Deserialize, Serialize};
use std::collections::HashSet;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PluginCapabilities {
    /// Filesystem access scope
    pub filesystem: FilesystemCapability,
    
    /// Network access permissions
    pub network: NetworkCapability,
    
    /// Command execution permissions
    pub commands: CommandCapability,
    
    /// UI modification permissions
    pub ui: UiCapability,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum FilesystemCapability {
    /// No filesystem access
    None,
    
    /// Read-only access to workspace directory
    WorkspaceRead,
    
    /// Read/write access to workspace directory
    WorkspaceReadWrite,
    
    /// Scoped access to specific paths
    Scoped {
        read: HashSet<PathBuf>,
        write: HashSet<PathBuf>,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum NetworkCapability {
    /// No network access
    None,
    
    /// Access to specific domains only
    DomainAllowlist(HashSet<String>),
    
    /// Full network access (requires explicit user consent)
    Unrestricted,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommandCapability {
    /// Allowlist of commands (e.g., ["git", "node"])
    pub allowlist: HashSet<String>,
    
    /// Whether to show command execution notifications
    pub require_confirmation: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UiCapability {
    pub status_bar: bool,
    pub sidebar: bool,
    pub notifications: bool,
    pub webview: bool,  // Can inject custom HTML panels
}
```

### Plugin Isolation Architecture

```rust
// src-tauri/src/plugin_system/sandbox.rs
use tokio::sync::RwLock;
use std::sync::Arc;

pub struct PluginSandbox {
    id: String,
    capabilities: PluginCapabilities,
    runtime: Arc<RwLock<deno_core::JsRuntime>>,
    resource_limits: ResourceLimits,
}

#[derive(Debug, Clone)]
pub struct ResourceLimits {
    max_memory: usize,      // Bytes
    max_cpu_time: Duration, // Per-operation timeout
    max_operations: u64,    // Operations per second
}

impl PluginSandbox {
    pub fn new(manifest: PluginManifest) -> Result<Self> {
        // Use Deno core for JavaScript isolation
        let mut runtime = deno_core::JsRuntime::new(deno_core::RuntimeOptions {
            module_loader: Some(Rc::new(PluginModuleLoader)),
            extensions: vec![],
            // No access to Deno APIs by default
            ..Default::default()
        });

        // Inject capability-gated API
        runtime.execute_script(
            "plugin_api.js",
            include_str!("../../js/plugin_api.js"),
        )?;

        Ok(Self {
            id: manifest.name.clone(),
            capabilities: manifest.permissions,
            runtime: Arc::new(RwLock::new(runtime)),
            resource_limits: ResourceLimits {
                max_memory: 50 * 1024 * 1024, // 50MB
                max_cpu_time: Duration::from_secs(5),
                max_operations: 100,
            },
        })
    }

    pub async fn call_hook(&self, hook: &str, args: Vec<Value>) -> Result<Value> {
        let runtime = self.runtime.write().await;
        
        // Set resource limit timeout
        let timeout = tokio::time::timeout(
            self.resource_limits.max_cpu_time,
            self.execute_with_limits(runtime, hook, args),
        );

        match timeout.await {
            Ok(result) => result,
            Err(_) => Err(PluginError::Timeout),
        }
    }

    async fn execute_with_limits(
        &self,
        runtime: &mut deno_core::JsRuntime,
        hook: &str,
        args: Vec<Value>,
    ) -> Result<Value> {
        // Memory limit check
        let heap_stats = runtime.heap_statistics();
        if heap_stats.used_heap_size > self.resource_limits.max_memory {
            return Err(PluginError::MemoryLimitExceeded);
        }

        // Execute plugin hook
        let result = runtime
            .execute_script(
                &format!("plugin_hook_{}", hook),
                &format!(
                    "globalThis.plugin.hooks.{}({})",
                    hook,
                    serde_json::to_string(&args)?
                ),
            )?;

        Ok(serde_json::from_str(&result)?)
    }
}
```

### Capability Checking at API Boundary

```typescript
// src-tauri/js/plugin_api.js (injected into sandbox)
globalThis.skretchpad = {
  fs: {
    async readFile(path) {
      // Rust-side capability check
      return await Tauri.invoke('plugin_read_file', {
        pluginId: __PLUGIN_ID__,
        path: path,
      });
    },
    
    async writeFile(path, content) {
      return await Tauri.invoke('plugin_write_file', {
        pluginId: __PLUGIN_ID__,
        path: path,
        content: content,
      });
    },
  },
  
  network: {
    async fetch(url, options) {
      return await Tauri.invoke('plugin_fetch', {
        pluginId: __PLUGIN_ID__,
        url: url,
        options: options,
      });
    },
  },
  
  commands: {
    async execute(command, args) {
      return await Tauri.invoke('plugin_execute_command', {
        pluginId: __PLUGIN_ID__,
        command: command,
        args: args,
      });
    },
  },
};
```

```rust
// src-tauri/src/plugin_system/api.rs
use tauri::State;

#[tauri::command]
pub async fn plugin_read_file(
    plugin_id: String,
    path: String,
    plugin_manager: State<'_, PluginManager>,
) -> Result<String> {
    let plugin = plugin_manager.get(&plugin_id)?;
    
    // Check filesystem capability
    if !plugin.can_read_path(&path)? {
        return Err(PluginError::PermissionDenied {
            operation: "read".into(),
            path: path.clone(),
        });
    }
    
    // Audit log
    plugin_manager.audit_log(AuditEvent {
        plugin_id: plugin_id.clone(),
        operation: "fs.read",
        path: path.clone(),
        timestamp: SystemTime::now(),
    });
    
    // Execute with resource limits
    tokio::fs::read_to_string(&path).await.map_err(Into::into)
}

impl Plugin {
    fn can_read_path(&self, path: &str) -> Result<bool> {
        let path = PathBuf::from(path).canonicalize()?;
        
        match &self.capabilities.filesystem {
            FilesystemCapability::None => Ok(false),
            
            FilesystemCapability::WorkspaceRead | FilesystemCapability::WorkspaceReadWrite => {
                // Check if path is within workspace
                Ok(path.starts_with(&self.workspace_root))
            }
            
            FilesystemCapability::Scoped { read, write: _ } => {
                Ok(read.iter().any(|allowed| path.starts_with(allowed)))
            }
        }
    }
}
```

### User Consent UI

```svelte
<!-- src/components/PluginPermissionDialog.svelte -->
<script lang="ts">
  import { invoke } from '@tauri-apps/api';
  
  export let plugin: PluginManifest;
  export let onApprove: () => void;
  export let onDeny: () => void;
  
  const riskLevels = {
    filesystem: 'high',
    network: 'critical',
    commands: 'critical',
    ui: 'low',
  };
  
  function getRiskColor(capability: string) {
    const level = riskLevels[capability];
    return level === 'critical' ? 'text-red-500' : 
           level === 'high' ? 'text-orange-500' : 
           'text-yellow-500';
  }
</script>

<div class="permission-dialog glass-panel">
  <h2>Plugin Permission Request</h2>
  <p class="plugin-name">{plugin.name} v{plugin.version}</p>
  
  <div class="permissions-list">
    <h3>Requested Permissions:</h3>
    
    {#if plugin.permissions.filesystem !== 'None'}
      <div class="permission-item">
        <span class={getRiskColor('filesystem')}>⚠</span>
        <span>Filesystem Access: {plugin.permissions.filesystem}</span>
      </div>
    {/if}
    
    {#if plugin.permissions.network !== 'None'}
      <div class="permission-item">
        <span class={getRiskColor('network')}>🔴</span>
        <span>Network Access</span>
        {#if plugin.permissions.network.DomainAllowlist}
          <ul class="domain-list">
            {#each plugin.permissions.network.DomainAllowlist as domain}
              <li>{domain}</li>
            {/each}
          </ul>
        {/if}
      </div>
    {/if}
    
    {#if plugin.permissions.commands.allowlist.length > 0}
      <div class="permission-item">
        <span class={getRiskColor('commands')}>🔴</span>
        <span>Command Execution:</span>
        <code>{plugin.permissions.commands.allowlist.join(', ')}</code>
      </div>
    {/if}
  </div>
  
  <div class="actions">
    <button class="deny" on:click={onDeny}>Deny</button>
    <button class="approve" on:click={onApprove}>Allow</button>
  </div>
</div>
```

### Plugin Trust Levels

```rust
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
```

---

## 3. Theme Engine with CSS Custom Properties

### Theme Definition Format

```toml
# themes/liquid-glass-dark.toml
[metadata]
name = "Liquid Glass Dark"
author = "heat"
version = "1.0.0"
base = "dark"  # dark | light | high-contrast

[window]
# Core window styling
background.base = "rgba(18, 18, 18, 0.85)"
background.blur = 20  # backdrop-filter blur radius

border.radius = 12
border.width = 1
border.color = "rgba(255, 255, 255, 0.1)"

# Window shadow (macOS-style)
shadow.color = "rgba(0, 0, 0, 0.5)"
shadow.blur = 40
shadow.offset = [0, 10]

[chrome]
# Top bar / title bar
background = "rgba(28, 28, 28, 0.95)"
background.blur = 10
height = 32

# Text color
foreground = "rgba(228, 228, 228, 0.9)"

# Active state
active.background = "rgba(40, 40, 40, 0.95)"
active.border = "rgba(0, 217, 255, 0.3)"

[editor]
# Text area
background = "transparent"  # Shows through to window background
foreground = "#e4e4e4"

# Cursor
cursor.color = "#00d9ff"
cursor.width = 2
cursor.blink_interval = 530  # milliseconds

# Selection
selection.background = "rgba(0, 217, 255, 0.2)"
selection.foreground = null  # null = use default foreground

# Line highlighting
line.active = "rgba(255, 255, 255, 0.05)"
line.number = "rgba(228, 228, 228, 0.4)"
line.number.active = "#00d9ff"

# Gutter
gutter.background = "rgba(0, 0, 0, 0.2)"
gutter.width = 50

[syntax]
# Base token types
comment = { color = "#6a737d", style = "italic" }
keyword = { color = "#ff79c6", style = "bold" }
string = { color = "#50fa7b" }
number = { color = "#bd93f9" }
operator = { color = "#ff79c6" }
function = { color = "#8be9fd" }
variable = { color = "#f8f8f2" }
type = { color = "#8be9fd", style = "italic" }
constant = { color = "#bd93f9", style = "bold" }

# Language-specific overrides
[syntax.python]
decorator = { color = "#50fa7b" }
magic_method = { color = "#ff79c6", style = "italic" }

[syntax.rust]
lifetime = { color = "#ff79c6", style = "italic" }
macro = { color = "#50fa7b" }
attribute = { color = "#f1fa8c" }

[syntax.markdown]
heading = { color = "#8be9fd", style = "bold" }
link = { color = "#50fa7b", style = "underline" }
code = { color = "#f1fa8c", background = "rgba(255, 255, 255, 0.05)" }

[ui]
# Status bar
status_bar.background = "rgba(28, 28, 28, 0.95)"
status_bar.foreground = "rgba(228, 228, 228, 0.7)"
status_bar.height = 24

# Buttons
button.background = "rgba(255, 255, 255, 0.1)"
button.hover = "rgba(255, 255, 255, 0.15)"
button.active = "rgba(0, 217, 255, 0.3)"

# Inputs
input.background = "rgba(0, 0, 0, 0.3)"
input.border = "rgba(255, 255, 255, 0.2)"
input.focus = "rgba(0, 217, 255, 0.5)"

[transitions]
# Animation timings (milliseconds)
chrome_toggle = 200
theme_switch = 300
hover = 100

# Easing functions
easing = "cubic-bezier(0.4, 0.0, 0.2, 1)"  # Material Design standard
```

### Theme Engine Implementation

```rust
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
```

### Frontend Theme Application

```typescript
// src/lib/theme-engine.ts
import { invoke } from '@tauri-apps/api';
import { listen } from '@tauri-apps/api/event';

export class ThemeEngine {
  private styleElement: HTMLStyleElement;
  private currentTheme: string = 'liquid-glass-dark';
  
  constructor() {
    // Create style element for theme CSS
    this.styleElement = document.createElement('style');
    this.styleElement.id = 'theme-variables';
    document.head.appendChild(this.styleElement);
    
    // Listen for hot-reload events
    listen('theme:reload', ({ payload }) => {
      this.applyTheme(payload.theme);
    });
  }
  
  async applyTheme(themeName: string) {
    try {
      // Get CSS variables from Rust backend
      const cssVars = await invoke<string>('load_theme', { 
        themeName 
      });
      
      // Apply with smooth transition
      this.transitionTheme(() => {
        this.styleElement.textContent = cssVars;
        this.currentTheme = themeName;
      });
      
      // Persist theme choice
      localStorage.setItem('theme', themeName);
      
    } catch (error) {
      console.error('Failed to apply theme:', error);
      throw error;
    }
  }
  
  private transitionTheme(applyFn: () => void) {
    // Get transition duration from CSS
    const duration = parseInt(
      getComputedStyle(document.documentElement)
        .getPropertyValue('--transition-slow')
    );
    
    // Add transition class
    document.body.classList.add('theme-transitioning');
    
    // Apply theme
    applyFn();
    
    // Remove transition class after animation
    setTimeout(() => {
      document.body.classList.remove('theme-transitioning');
    }, duration);
  }
  
  async listThemes(): Promise<string[]> {
    return await invoke('list_themes');
  }
  
  getCurrentTheme(): string {
    return this.currentTheme;
  }
}
```

### Theme Transition Styles

```css
/* src/styles/theme-transitions.css */
body {
  /* Smooth color transitions */
  transition: 
    background-color var(--transition-slow) var(--transition-easing),
    color var(--transition-slow) var(--transition-easing);
}

.theme-transitioning * {
  /* Apply transitions to all elements during theme switch */
  transition: 
    background-color var(--transition-slow) var(--transition-easing),
    color var(--transition-slow) var(--transition-easing),
    border-color var(--transition-slow) var(--transition-easing) !important;
}

/* Editor-specific transitions */
.cm-editor {
  transition: background-color var(--transition-slow) var(--transition-easing);
}

.cm-content,
.cm-line {
  transition: color var(--transition-slow) var(--transition-easing);
}

/* Syntax highlighting transitions */
.cm-keyword,
.cm-string,
.cm-function,
.cm-comment,
.cm-variable {
  transition: color var(--transition-slow) var(--transition-easing);
}

/* Glass effect */
.glass-panel {
  background: var(--window-bg);
  backdrop-filter: blur(var(--window-blur));
  border: var(--window-border-width, 1px) solid var(--window-border-color);
  border-radius: var(--window-border-radius);
  
  /* Smooth glass transitions */
  transition: 
    backdrop-filter var(--transition-medium) var(--transition-easing),
    background var(--transition-medium) var(--transition-easing);
}

/* Chrome toggle animation */
.chrome {
  transform-origin: top;
  transition: 
    transform var(--transition-medium) var(--transition-easing),
    opacity var(--transition-fast) var(--transition-easing);
}

.chrome.hidden {
  transform: scaleY(0);
  opacity: 0;
  pointer-events: none;
}
```

### Advanced: Color Scheme Derivation

```rust
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
```

---

## 4. Git Integration: First-Party Plugin Example

### Plugin Architecture

```toml
# plugins/git/plugin.toml
name = "git"
version = "1.0.0"
author = "skretchpad"
trust = "first-party"

[permissions]
filesystem = "WorkspaceReadWrite"
commands = { allowlist = ["git"], require_confirmation = false }

[hooks]
on_file_open = "check_git_status"
on_file_save = "update_git_status"
on_workspace_change = "refresh_repository"

[ui]
status_bar = true
sidebar = true
notifications = true

[commands]
"git.status" = { key = "Ctrl+G", label = "Git Status" }
"git.diff" = { key = "Ctrl+Shift+G", label = "Git Diff" }
"git.commit" = { key = "Ctrl+K", label = "Quick Commit" }
"git.push" = { key = "Ctrl+Shift+P", label = "Push" }
"git.pull" = { key = "Ctrl+Shift+L", label = "Pull" }
"git.branch" = { key = "Ctrl+B", label = "Branch Manager" }
```

### Git Plugin Implementation (Historical Design Reference)

The following TypeScript class is a historical design sketch from earlier planning.  
Current runtime plugin entrypoint is `plugins/git/main.js` and current-state behavior is documented in `Docs/architecture/modules/19_git-plugin-main.ts.md`.

```typescript
// historical sketch (planned): plugins/git/main.ts
import type { Plugin, PluginContext, StatusBarItem } from '@skretchpad/plugin-api';

interface GitStatus {
  branch: string;
  ahead: number;
  behind: number;
  staged: number;
  unstaged: number;
  untracked: number;
  conflicts: number;
}

interface FileDiff {
  path: string;
  status: 'added' | 'modified' | 'deleted' | 'renamed';
  additions: number;
  deletions: number;
  hunks: DiffHunk[];
}

interface DiffHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: string[];
}

export default class GitPlugin implements Plugin {
  private context: PluginContext;
  private statusBarItem: StatusBarItem;
  private repositoryRoot: string | null = null;
  private currentBranch: string = '';
  private watcherDispose: (() => void) | null = null;
  
  async activate(context: PluginContext) {
    this.context = context;
    
    // Initialize repository
    await this.initRepository();
    
    // Create status bar item
    this.statusBarItem = context.ui.addStatusBarItem({
      id: 'git-status',
      text: '$(git-branch) main',
      tooltip: 'Click for Git status',
      priority: 100,
      onClick: () => this.showStatus(),
    });
    
    // Register commands
    context.commands.register('git.status', () => this.showStatus());
    context.commands.register('git.diff', () => this.showDiff());
    context.commands.register('git.commit', () => this.quickCommit());
    context.commands.register('git.push', () => this.push());
    context.commands.register('git.pull', () => this.pull());
    context.commands.register('git.branch', () => this.showBranchManager());
    
    // Set up file watchers
    this.watchGitDirectory();
    
    // Hook into editor events
    context.on('file:save', (file) => this.onFileSave(file));
    context.on('file:open', (file) => this.onFileOpen(file));
    
    // Initial status update
    await this.updateStatus();
  }
  
  async deactivate() {
    this.statusBarItem?.dispose();
    this.watcherDispose?.();
  }
  
  private async initRepository() {
    // Find .git directory
    const workspace = this.context.workspace.getPath();
    this.repositoryRoot = await this.findGitRoot(workspace);
    
    if (this.repositoryRoot) {
      this.currentBranch = await this.getCurrentBranch();
    }
  }
  
  private async findGitRoot(startPath: string): Promise<string | null> {
    let currentPath = startPath;
    
    while (currentPath !== '/') {
      const gitPath = `${currentPath}/.git`;
      const exists = await this.context.fs.exists(gitPath);
      
      if (exists) {
        return currentPath;
      }
      
      // Go up one directory
      currentPath = currentPath.split('/').slice(0, -1).join('/');
    }
    
    return null;
  }
  
  private async getCurrentBranch(): Promise<string> {
    if (!this.repositoryRoot) return '';
    
    const result = await this.context.commands.execute('git', [
      '-C', this.repositoryRoot,
      'branch', '--show-current'
    ]);
    
    return result.stdout.trim();
  }
  
  private async getGitStatus(): Promise<GitStatus> {
    if (!this.repositoryRoot) {
      throw new Error('Not a git repository');
    }
    
    // Get detailed status
    const statusResult = await this.context.commands.execute('git', [
      '-C', this.repositoryRoot,
      'status', '--porcelain=v2', '--branch'
    ]);
    
    return this.parseGitStatus(statusResult.stdout);
  }
  
  private parseGitStatus(output: string): GitStatus {
    const lines = output.split('\n');
    const status: GitStatus = {
      branch: '',
      ahead: 0,
      behind: 0,
      staged: 0,
      unstaged: 0,
      untracked: 0,
      conflicts: 0,
    };
    
    for (const line of lines) {
      if (line.startsWith('# branch.head ')) {
        status.branch = line.slice(14);
      } else if (line.startsWith('# branch.ab ')) {
        const [ahead, behind] = line.slice(12).split(' ').map(Number);
        status.ahead = ahead;
        status.behind = behind;
      } else if (line.startsWith('1 ') || line.startsWith('2 ')) {
        // File status: 1 XY ... or 2 XY ... (renamed)
        const [, xy] = line.split(' ');
        const [staged_char, unstaged_char] = xy;
        
        if (staged_char !== '.') status.staged++;
        if (unstaged_char !== '.') status.unstaged++;
      } else if (line.startsWith('? ')) {
        status.untracked++;
      } else if (line.startsWith('u ')) {
        status.conflicts++;
      }
    }
    
    return status;
  }
  
  private async updateStatus() {
    if (!this.repositoryRoot) {
      this.statusBarItem.text = '$(git-branch) No repo';
      return;
    }
    
    try {
      const status = await this.getGitStatus();
      
      // Build status text
      let text = `$(git-branch) ${status.branch}`;
      
      if (status.ahead > 0) text += ` ↑${status.ahead}`;
      if (status.behind > 0) text += ` ↓${status.behind}`;
      
      const totalChanges = status.staged + status.unstaged + status.untracked;
      if (totalChanges > 0) {
        text += ` $(diff) ${totalChanges}`;
      }
      
      if (status.conflicts > 0) {
        text += ` $(alert) ${status.conflicts}`;
        this.statusBarItem.color = 'var(--color-error)';
      } else {
        this.statusBarItem.color = undefined;
      }
      
      this.statusBarItem.text = text;
      this.statusBarItem.tooltip = this.buildTooltip(status);
      
    } catch (error) {
      console.error('Failed to update git status:', error);
      this.statusBarItem.text = '$(git-branch) Error';
    }
  }
  
  private buildTooltip(status: GitStatus): string {
    const parts = [
      `Branch: ${status.branch}`,
    ];
    
    if (status.ahead > 0) {
      parts.push(`Ahead: ${status.ahead} commit${status.ahead > 1 ? 's' : ''}`);
    }
    if (status.behind > 0) {
      parts.push(`Behind: ${status.behind} commit${status.behind > 1 ? 's' : ''}`);
    }
    if (status.staged > 0) {
      parts.push(`Staged: ${status.staged}`);
    }
    if (status.unstaged > 0) {
      parts.push(`Unstaged: ${status.unstaged}`);
    }
    if (status.untracked > 0) {
      parts.push(`Untracked: ${status.untracked}`);
    }
    if (status.conflicts > 0) {
      parts.push(`Conflicts: ${status.conflicts}`);
    }
    
    parts.push('', 'Click for details');
    
    return parts.join('\n');
  }
  
  private async showStatus() {
    const status = await this.getGitStatus();
    
    // Get file list
    const filesResult = await this.context.commands.execute('git', [
      '-C', this.repositoryRoot!,
      'status', '--porcelain'
    ]);
    
    const files = this.parseFileList(filesResult.stdout);
    
    // Show in sidebar panel
    this.context.ui.showPanel({
      id: 'git-status',
      title: 'Git Status',
      content: this.renderStatusPanel(status, files),
    });
  }
  
  private parseFileList(output: string): Array<{ status: string; path: string }> {
    return output
      .split('\n')
      .filter(line => line.trim())
      .map(line => ({
        status: line.slice(0, 2),
        path: line.slice(3),
      }));
  }
  
  private async showDiff() {
    const editor = this.context.editor.getActiveEditor();
    if (!editor) {
      this.context.ui.showNotification({
        type: 'warning',
        message: 'No active file',
      });
      return;
    }
    
    const filePath = editor.getPath();
    const relativePath = filePath.replace(this.repositoryRoot! + '/', '');
    
    // Get diff for current file
    const diffResult = await this.context.commands.execute('git', [
      '-C', this.repositoryRoot!,
      'diff', '--', relativePath
    ]);
    
    if (!diffResult.stdout.trim()) {
      this.context.ui.showNotification({
        type: 'info',
        message: 'No changes in this file',
      });
      return;
    }
    
    const diff = this.parseDiff(diffResult.stdout);
    
    // Open diff view
    this.context.editor.openDiffView({
      original: await this.getFileAtHead(relativePath),
      modified: editor.getValue(),
      title: `${relativePath} (Working vs HEAD)`,
    });
  }
  
  private async getFileAtHead(relativePath: string): Promise<string> {
    const result = await this.context.commands.execute('git', [
      '-C', this.repositoryRoot!,
      'show', `HEAD:${relativePath}`
    ]);
    
    return result.stdout;
  }
  
  private parseDiff(output: string): FileDiff {
    const hunks: DiffHunk[] = [];
    let currentHunk: DiffHunk | null = null;
    let additions = 0;
    let deletions = 0;
    
    const lines = output.split('\n');
    
    for (const line of lines) {
      // Hunk header: @@ -1,4 +1,5 @@
      if (line.startsWith('@@')) {
        if (currentHunk) {
          hunks.push(currentHunk);
        }
        
        const match = line.match(/@@ -(\d+),?(\d+)? \+(\d+),?(\d+)? @@/);
        if (match) {
          currentHunk = {
            oldStart: parseInt(match[1]),
            oldLines: parseInt(match[2] || '1'),
            newStart: parseInt(match[3]),
            newLines: parseInt(match[4] || '1'),
            lines: [],
          };
        }
      } else if (currentHunk) {
        currentHunk.lines.push(line);
        
        if (line.startsWith('+') && !line.startsWith('+++')) {
          additions++;
        } else if (line.startsWith('-') && !line.startsWith('---')) {
          deletions++;
        }
      }
    }
    
    if (currentHunk) {
      hunks.push(currentHunk);
    }
    
    return {
      path: '', // Extracted from diff header
      status: 'modified',
      additions,
      deletions,
      hunks,
    };
  }
  
  private async quickCommit() {
    const message = await this.context.ui.showInputBox({
      prompt: 'Commit message:',
      placeholder: 'Fix bug in ...',
    });
    
    if (!message) return;
    
    try {
      // Stage all changes
      await this.context.commands.execute('git', [
        '-C', this.repositoryRoot!,
        'add', '-A'
      ]);
      
      // Commit
      await this.context.commands.execute('git', [
        '-C', this.repositoryRoot!,
        'commit', '-m', message
      ]);
      
      this.context.ui.showNotification({
        type: 'success',
        message: 'Committed successfully',
      });
      
      await this.updateStatus();
      
    } catch (error) {
      this.context.ui.showNotification({
        type: 'error',
        message: `Commit failed: ${error.message}`,
      });
    }
  }
  
  private async push() {
    try {
      this.context.ui.showNotification({
        type: 'info',
        message: 'Pushing...',
      });
      
      await this.context.commands.execute('git', [
        '-C', this.repositoryRoot!,
        'push'
      ]);
      
      this.context.ui.showNotification({
        type: 'success',
        message: 'Pushed successfully',
      });
      
      await this.updateStatus();
      
    } catch (error) {
      this.context.ui.showNotification({
        type: 'error',
        message: `Push failed: ${error.message}`,
      });
    }
  }
  
  private async pull() {
    try {
      this.context.ui.showNotification({
        type: 'info',
        message: 'Pulling...',
      });
      
      const result = await this.context.commands.execute('git', [
        '-C', this.repositoryRoot!,
        'pull'
      ]);
      
      this.context.ui.showNotification({
        type: 'success',
        message: 'Pulled successfully',
      });
      
      await this.updateStatus();
      
      // Reload open files if they changed
      await this.context.editor.reloadAllFiles();
      
    } catch (error) {
      this.context.ui.showNotification({
        type: 'error',
        message: `Pull failed: ${error.message}`,
      });
    }
  }
  
  private async showBranchManager() {
    const branches = await this.getBranches();
    
    this.context.ui.showQuickPick({
      items: branches.map(branch => ({
        label: branch.name,
        description: branch.current ? '(current)' : '',
        value: branch.name,
      })),
      placeholder: 'Select a branch or type to create new',
      onSelect: async (value) => {
        await this.checkoutBranch(value);
      },
    });
  }
  
  private async getBranches(): Promise<Array<{ name: string; current: boolean }>> {
    const result = await this.context.commands.execute('git', [
      '-C', this.repositoryRoot!,
      'branch', '--list'
    ]);
    
    return result.stdout
      .split('\n')
      .filter(line => line.trim())
      .map(line => ({
        name: line.slice(2).trim(),
        current: line.startsWith('*'),
      }));
  }
  
  private async checkoutBranch(branch: string) {
    try {
      await this.context.commands.execute('git', [
        '-C', this.repositoryRoot!,
        'checkout', branch
      ]);
      
      this.currentBranch = branch;
      await this.updateStatus();
      
      this.context.ui.showNotification({
        type: 'success',
        message: `Switched to branch: ${branch}`,
      });
      
    } catch (error) {
      this.context.ui.showNotification({
        type: 'error',
        message: `Failed to checkout: ${error.message}`,
      });
    }
  }
  
  private watchGitDirectory() {
    if (!this.repositoryRoot) return;
    
    // Watch .git directory for changes
    this.watcherDispose = this.context.fs.watch(
      `${this.repositoryRoot}/.git`,
      async (event) => {
        // Debounce updates
        await this.updateStatus();
      }
    );
  }
  
  private async onFileSave(file: string) {
    // Update status when file is saved
    await this.updateStatus();
  }
  
  private async onFileOpen(file: string) {
    // Could show git blame info, last commit, etc.
  }
  
  private renderStatusPanel(status: GitStatus, files: any[]): string {
    // Returns HTML for the status panel
    return `
      <div class="git-status-panel">
        <div class="branch-info">
          <h3>${status.branch}</h3>
          ${status.ahead > 0 ? `<span>↑ ${status.ahead}</span>` : ''}
          ${status.behind > 0 ? `<span>↓ ${status.behind}</span>` : ''}
        </div>
        
        <div class="changes">
          <h4>Changes (${files.length})</h4>
          <ul>
            ${files.map(f => `
              <li class="file-${this.getStatusClass(f.status)}">
                <span class="status">${f.status}</span>
                <span class="path">${f.path}</span>
              </li>
            `).join('')}
          </ul>
        </div>
      </div>
    `;
  }
  
  private getStatusClass(status: string): string {
    const map: Record<string, string> = {
      'M ': 'modified',
      ' M': 'modified',
      'A ': 'added',
      'D ': 'deleted',
      '??': 'untracked',
      'UU': 'conflict',
    };
    return map[status] || 'unknown';
  }
}
```

### Git Plugin UI Components

```svelte
<!-- plugins/git/components/StatusPanel.svelte -->
<script lang="ts">
  import type { GitStatus, FileChange } from '../types';
  
  export let status: GitStatus;
  export let files: FileChange[];
  export let onStage: (file: string) => void;
  export let onUnstage: (file: string) => void;
  export let onDiscard: (file: string) => void;
  export let onDiff: (file: string) => void;
  
  function getStatusIcon(status: string) {
    const icons = {
      'M': '$(diff-modified)',
      'A': '$(diff-added)',
      'D': '$(diff-removed)',
      '?': '$(question)',
      'U': '$(alert)',
    };
    return icons[status[0]] || '$(file)';
  }
  
  function getStatusColor(status: string) {
    const colors = {
      'M': 'text-yellow-500',
      'A': 'text-green-500',
      'D': 'text-red-500',
      '?': 'text-blue-500',
      'U': 'text-red-600',
    };
    return colors[status[0]] || 'text-gray-500';
  }
</script>

<div class="git-status-panel glass-panel">
  <!-- Branch info -->
  <div class="branch-header">
    <div class="branch-name">
      <span class="icon">$(git-branch)</span>
      <span class="text">{status.branch}</span>
    </div>
    
    <div class="sync-status">
      {#if status.ahead > 0}
        <span class="ahead">↑{status.ahead}</span>
      {/if}
      {#if status.behind > 0}
        <span class="behind">↓{status.behind}</span>
      {/if}
    </div>
  </div>
  
  <!-- Staged files -->
  {#if files.filter(f => f.staged).length > 0}
    <div class="file-group">
      <h4>Staged Changes ({files.filter(f => f.staged).length})</h4>
      <ul class="file-list">
        {#each files.filter(f => f.staged) as file}
          <li class="file-item">
            <span class="{getStatusIcon(file.status)} {getStatusColor(file.status)}">
              {getStatusIcon(file.status)}
            </span>
            <span class="file-path">{file.path}</span>
            <div class="file-actions">
              <button on:click={() => onDiff(file.path)} title="View diff">
                $(diff)
              </button>
              <button on:click={() => onUnstage(file.path)} title="Unstage">
                $(remove)
              </button>
            </div>
          </li>
        {/each}
      </ul>
    </div>
  {/if}
  
  <!-- Unstaged files -->
  {#if files.filter(f => !f.staged).length > 0}
    <div class="file-group">
      <h4>Changes ({files.filter(f => !f.staged).length})</h4>
      <ul class="file-list">
        {#each files.filter(f => !f.staged) as file}
          <li class="file-item">
            <span class="{getStatusIcon(file.status)} {getStatusColor(file.status)}">
              {getStatusIcon(file.status)}
            </span>
            <span class="file-path">{file.path}</span>
            <div class="file-actions">
              <button on:click={() => onDiff(file.path)} title="View diff">
                $(diff)
              </button>
              <button on:click={() => onStage(file.path)} title="Stage">
                $(add)
              </button>
              <button on:click={() => onDiscard(file.path)} title="Discard" class="danger">
                $(trash)
              </button>
            </div>
          </li>
        {/each}
      </ul>
    </div>
  {/if}
</div>

<style>
  .git-status-panel {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  
  .branch-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--border-color);
  }
  
  .branch-name {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 600;
  }
  
  .sync-status {
    display: flex;
    gap: 8px;
    font-size: 12px;
  }
  
  .ahead { color: var(--color-success); }
  .behind { color: var(--color-warning); }
  
  .file-group h4 {
    font-size: 12px;
    text-transform: uppercase;
    color: var(--text-secondary);
    margin-bottom: 8px;
  }
  
  .file-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  .file-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 8px;
    border-radius: 4px;
    transition: background var(--transition-fast);
  }
  
  .file-item:hover {
    background: var(--hover-bg);
  }
  
  .file-path {
    flex: 1;
    font-size: 13px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .file-actions {
    display: flex;
    gap: 4px;
    opacity: 0;
    transition: opacity var(--transition-fast);
  }
  
  .file-item:hover .file-actions {
    opacity: 1;
  }
  
  .file-actions button {
    padding: 4px 6px;
    background: transparent;
    border: none;
    border-radius: 3px;
    cursor: pointer;
    transition: background var(--transition-fast);
  }
  
  .file-actions button:hover {
    background: var(--button-hover);
  }
  
  .file-actions button.danger:hover {
    background: var(--color-error);
    color: white;
  }
</style>
```
