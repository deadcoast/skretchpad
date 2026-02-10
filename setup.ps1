#Requires -Version 5.1
<#
.SYNOPSIS
    Skretchpad Development Environment Setup & Verification
.DESCRIPTION
    Validates prerequisites, installs dependencies, verifies builds, and ensures
    a fully operational development environment for the Skretchpad editor.
.NOTES
    Version: 2.1.0
    Project: Skretchpad v0.1.0
    Stack:   Tauri 2.0 + Svelte 4 + CodeMirror 6 + Rust + deno_core V8
#>

param(
    [switch]$SkipRustBuild,
    [switch]$SkipFrontendBuild,
    [switch]$Force,
    [switch]$Verbose,
    [switch]$Help
)

# ============================================================================
#  CONFIGURATION
# ============================================================================

$Script:ProjectRoot   = $PSScriptRoot
$Script:LogDir        = Join-Path $ProjectRoot ".setup"
$Script:LogFile       = Join-Path $LogDir "setup-$(Get-Date -Format 'yyyy-MM-dd_HH-mm-ss').log"
$Script:StartTime     = Get-Date
$Script:ErrorCount    = 0
$Script:WarningCount  = 0
$Script:PassCount     = 0
$Script:SkipCount     = 0
$Script:StepNumber    = 0
$Script:TotalSteps    = 10
$Script:ExitCode      = 0

# Timing for visual pacing (ms) -- keep it snappy
$Script:PaceTick = 25
$Script:PaceBeat = 60

# Box-drawing characters
$Script:CH_H    = [char]0x2500
$Script:CH_V    = [char]0x2502
$Script:CH_TL   = [char]0x250C
$Script:CH_TR   = [char]0x2510
$Script:CH_BL   = [char]0x2514
$Script:CH_BR   = [char]0x2518
$Script:CH_DH   = [char]0x2550
$Script:CH_DV   = [char]0x2551
$Script:CH_DTL  = [char]0x2554
$Script:CH_DTR  = [char]0x2557
$Script:CH_DBL  = [char]0x255A
$Script:CH_DBR  = [char]0x255D
$Script:CH_FULL = [char]0x2588
$Script:CH_LITE = [char]0x2591

# Version requirements
$Script:RequiredNodeMajor = 18

$Script:RequiredNpmPackages = @(
    "codemirror",
    "@codemirror/commands",
    "@codemirror/lang-cpp",
    "@codemirror/lang-css",
    "@codemirror/lang-go",
    "@codemirror/lang-html",
    "@codemirror/lang-java",
    "@codemirror/lang-javascript",
    "@codemirror/lang-json",
    "@codemirror/lang-markdown",
    "@codemirror/lang-php",
    "@codemirror/lang-python",
    "@codemirror/lang-rust",
    "@codemirror/lang-sql",
    "@codemirror/lang-xml",
    "@codemirror/lang-yaml",
    "@codemirror/legacy-modes",
    "@codemirror/merge",
    "@codemirror/search",
    "@codemirror/state",
    "@codemirror/view",
    "@tauri-apps/api",
    "@tauri-apps/plugin-dialog",
    "@tauri-apps/plugin-fs",
    "dompurify",
    "nanostores"
)

$Script:RequiredDevPackages = @(
    "@sveltejs/vite-plugin-svelte",
    "@tauri-apps/cli",
    "@testing-library/jest-dom",
    "@testing-library/svelte",
    "@tsconfig/svelte",
    "@types/dompurify",
    "@types/node",
    "@typescript-eslint/eslint-plugin",
    "@typescript-eslint/parser",
    "autoprefixer",
    "eslint",
    "eslint-plugin-svelte",
    "jsdom",
    "postcss",
    "prettier",
    "prettier-plugin-svelte",
    "svelte",
    "svelte-check",
    "tailwindcss",
    "tslib",
    "typescript",
    "vite",
    "vitest"
)

$Script:RequiredFiles = @(
    @{ Path = "package.json";                     Label = "npm manifest" },
    @{ Path = "tsconfig.json";                    Label = "TypeScript config" },
    @{ Path = "svelte.config.js";                 Label = "Svelte config" },
    @{ Path = "vite.config.ts";                   Label = "Vite config" },
    @{ Path = ".eslintrc.cjs";                    Label = "ESLint config" },
    @{ Path = ".prettierrc";                      Label = "Prettier config" },
    @{ Path = "src-tauri\Cargo.toml";             Label = "Cargo manifest" },
    @{ Path = "src-tauri\tauri.conf.json";        Label = "Tauri config" },
    @{ Path = "src-tauri\build.rs";               Label = "Rust build script" },
    @{ Path = "src-tauri\src\main.rs";            Label = "Rust entry point" },
    @{ Path = "rust-toolchain.toml";              Label = "Rust toolchain config" },
    @{ Path = "src\main.ts";                      Label = "Frontend entry point" },
    @{ Path = "src\App.svelte";                   Label = "Root Svelte component" }
)

$Script:RequiredSourceFiles = @(
    # Backend -- Plugin Runtime (deno_core V8 sandbox)
    @{ Path = "src-tauri\src\plugin_system\mod.rs";          Label = "Plugin module exports" },
    @{ Path = "src-tauri\src\plugin_system\sandbox.rs";      Label = "V8 sandbox runtime" },
    @{ Path = "src-tauri\src\plugin_system\worker.rs";       Label = "Worker thread pool" },
    @{ Path = "src-tauri\src\plugin_system\capabilities.rs"; Label = "Capability model" },
    @{ Path = "src-tauri\src\plugin_system\loader.rs";       Label = "Plugin loader" },
    @{ Path = "src-tauri\src\plugin_system\manager.rs";      Label = "Plugin manager" },
    @{ Path = "src-tauri\src\plugin_system\api.rs";          Label = "Plugin API commands" },
    @{ Path = "src-tauri\src\plugin_system\ops.rs";          Label = "deno_core ops bridge" },
    @{ Path = "src-tauri\src\plugin_system\trust.rs";        Label = "Trust system" },
    @{ Path = "src-tauri\src\theme_engine.rs";               Label = "Theme engine" },
    @{ Path = "src-tauri\src\git.rs";                        Label = "Git CLI wrapper" },
    @{ Path = "src-tauri\src\security\threat_matrix.rs";     Label = "Security threat matrix" },
    # Frontend -- Components
    @{ Path = "src\components\Editor.svelte";                Label = "Editor (CodeMirror 6)" },
    @{ Path = "src\components\Chrome.svelte";                Label = "Chrome (title bar)" },
    @{ Path = "src\components\StatusBar.svelte";             Label = "Status bar" },
    @{ Path = "src\components\TabBar.svelte";                Label = "Tab bar" },
    @{ Path = "src\components\CommandPalette.svelte";        Label = "Command palette" },
    @{ Path = "src\components\NotificationToast.svelte";     Label = "Notification toasts" },
    @{ Path = "src\components\SideBar.svelte";               Label = "Sidebar panel" },
    @{ Path = "src\components\SourceControlPanel.svelte";    Label = "Source control panel" },
    @{ Path = "src\components\ChangeItem.svelte";            Label = "Change item row" },
    @{ Path = "src\components\PluginPermissionDialog.svelte";Label = "Permission dialog" },
    @{ Path = "src\components\SettingsPanel.svelte";         Label = "Settings panel" },
    @{ Path = "src\components\BootScreen.svelte";            Label = "Boot screen" },
    @{ Path = "src\components\Breadcrumb.svelte";            Label = "Breadcrumb nav" },
    @{ Path = "src\components\Minimap.svelte";               Label = "Minimap sidebar" },
    @{ Path = "src\components\SplitPane.svelte";             Label = "Split pane" },
    @{ Path = "src\features\diff\DiffView.svelte";           Label = "Diff viewer" },
    # Frontend -- Libraries
    @{ Path = "src\lib\editor-loader.ts";                    Label = "Editor loader + syntax" },
    @{ Path = "src\lib\codemirror-loader.ts";                Label = "CodeMirror loader" },
    @{ Path = "src\lib\icons\index.ts";                      Label = "SVG icon system" },
    # Frontend -- Stores
    @{ Path = "src\lib\stores\editor.ts";                    Label = "Editor store" },
    @{ Path = "src\lib\stores\theme.ts";                     Label = "Theme store" },
    @{ Path = "src\lib\stores\keybindings.ts";               Label = "Keybinding store" },
    @{ Path = "src\lib\stores\plugins.ts";                   Label = "Plugin store" },
    @{ Path = "src\lib\stores\git.ts";                       Label = "Git store" },
    @{ Path = "src\lib\stores\notifications.ts";             Label = "Notification store" },
    @{ Path = "src\lib\stores\ui.ts";                        Label = "UI store" },
    @{ Path = "src\lib\stores\settings.ts";                  Label = "Settings store" },
    # Frontend -- Utilities
    @{ Path = "src\lib\utils\debounce.ts";                   Label = "Debounce utility" },
    @{ Path = "src\lib\utils\ui.ts";                         Label = "UI utilities" },
    # Theme definitions
    @{ Path = "themes\glass-dark.toml";                      Label = "Glass Dark theme" },
    @{ Path = "themes\milkytext.toml";                       Label = "MilkyText theme" },
    @{ Path = "themes\cyberpunk.toml";                       Label = "Cyberpunk theme" },
    @{ Path = "themes\nord.toml";                            Label = "Nord theme" },
    @{ Path = "themes\solarized-dark.toml";                  Label = "Solarized Dark theme" },
    # Plugins
    @{ Path = "plugins\git\plugin.toml";                     Label = "Git plugin manifest" },
    @{ Path = "plugins\git\main.js";                         Label = "Git plugin entry" },
    @{ Path = "plugins\git-status\plugin.toml";              Label = "Git-status manifest" },
    @{ Path = "plugins\git-status\main.js";                  Label = "Git-status entry" }
)

# ============================================================================
#  OUTPUT HELPERS
# ============================================================================

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss.fff"
    $entry = "[$timestamp] [$Level] $Message"
    Add-Content -Path $Script:LogFile -Value $entry -ErrorAction SilentlyContinue
}

function Write-Banner {
    $w = 68
    $border = [string]::new($Script:CH_DH, $w - 2)

    function Pad([string]$text) {
        $inner = $w - 4
        $space = $inner - $text.Length
        if ($space -lt 0) { $space = 0 }
        $left  = [Math]::Floor($space / 2)
        $right = $space - $left
        return "  $($Script:CH_DV) " + (" " * $left) + $text + (" " * $right) + " $($Script:CH_DV)"
    }

    # Left-align a block of text as a group, centered within the box
    function PadBlock([string]$text, [int]$blockWidth) {
        $inner = $w - 4
        $space = $inner - $blockWidth
        if ($space -lt 0) { $space = 0 }
        $left  = [Math]::Floor($space / 2)
        $trail = $inner - $left - $text.Length
        if ($trail -lt 0) { $trail = 0 }
        return "  $($Script:CH_DV) " + (" " * $left) + $text + (" " * $trail) + " $($Script:CH_DV)"
    }

    Write-Host ""
    Start-Sleep -Milliseconds 80
    Write-Host "  $($Script:CH_DTL)$border$($Script:CH_DTR)" -ForegroundColor DarkCyan
    Write-Host (Pad "") -ForegroundColor DarkCyan

    $artLines = @(
        " ▄▄▄▄ ▄▄ ▄▄ ▄▄▄▄  ▄▄▄▄▄ ▄▄▄▄▄▄ ▄▄▄▄ ▄▄ ▄▄ ▄▄▄▄   ▄▄▄  ▄▄▄▄",
        "███▄▄ ██▄█▀ ██▄█▄ ██▄▄    ██  ██▀▀▀ ██▄██ ██▄█▀ ██▀██ ██▀██",
        "▄▄██▀ ██ ██ ██ ██ ██▄▄▄   ██  ▀████ ██ ██ ██    ██▀██ ████▀"
    )

    # Find longest line to align banner as a group
    $maxLen = 0
    foreach ($line in $artLines) {
        if ($line.Length -gt $maxLen) { $maxLen = $line.Length }
    }

    foreach ($line in $artLines) {
        Write-Host (PadBlock $line $maxLen) -ForegroundColor Cyan
        Start-Sleep -Milliseconds $Script:PaceTick
    }

    Write-Host (Pad "") -ForegroundColor DarkCyan
    Start-Sleep -Milliseconds $Script:PaceTick
    Write-Host (Pad "v0.1.0") -ForegroundColor DarkGray
    Write-Host (Pad "") -ForegroundColor DarkCyan
    Write-Host "  $($Script:CH_DBL)$border$($Script:CH_DBR)" -ForegroundColor DarkCyan
    Start-Sleep -Milliseconds $Script:PaceBeat

    # System init line (matches boot screen tone)
    Write-Host ""
    Write-Host "  > " -NoNewline -ForegroundColor DarkCyan
    Write-Host "ENVIRONMENT SETUP" -ForegroundColor White
    Write-Host "    Tauri 2.0 + Svelte 4 + CodeMirror 6 + deno_core V8" -ForegroundColor DarkGray
    Write-Host ""
    Start-Sleep -Milliseconds $Script:PaceBeat
}

function Write-SectionHeader {
    param([string]$Title)
    $Script:StepNumber++
    $num = "$($Script:StepNumber)".PadLeft(2, '0')
    $hLen = 56 - $Title.Length
    if ($hLen -lt 2) { $hLen = 2 }
    $bar = [string]::new($Script:CH_H, $hLen)

    Write-Host ""
    Start-Sleep -Milliseconds $Script:PaceTick
    Write-Host "  " -NoNewline
    Write-Host "[$num/$Script:TotalSteps]" -NoNewline -ForegroundColor DarkCyan
    Write-Host " $Title " -NoNewline -ForegroundColor White
    Write-Host $bar -ForegroundColor DarkGray
    Write-Host ""
    Write-Log "=== STEP $($Script:StepNumber): $Title ==="
}

function Write-Status {
    param(
        [string]$Label,
        [string]$Status,
        [string]$Detail = "",
        [ValidateSet("pass","fail","warn","info","skip")]
        [string]$Type = "info"
    )

    $icon = switch ($Type) {
        "pass" { "*";  $Script:PassCount++ }
        "fail" { "!";  $Script:ErrorCount++ }
        "warn" { "?";  $Script:WarningCount++ }
        "skip" { "-";  $Script:SkipCount++ }
        "info" { "." }
    }
    $color = switch ($Type) {
        "pass" { "Green" }
        "fail" { "Red" }
        "warn" { "Yellow" }
        "skip" { "DarkGray" }
        "info" { "Cyan" }
    }

    Start-Sleep -Milliseconds $Script:PaceTick
    $paddedLabel = $Label.PadRight(36)
    Write-Host "    " -NoNewline
    Write-Host "$icon " -NoNewline -ForegroundColor $color
    Write-Host $paddedLabel -NoNewline -ForegroundColor Gray
    if ($Detail) {
        Write-Host $Detail -ForegroundColor DarkGray
    } else {
        Write-Host $Status -ForegroundColor $color
    }
    Write-Log "$icon $Label - $Status $Detail" $Type.ToUpper()
}

function Write-Detail {
    param([string]$Message, [string]$Color = "DarkGray")
    Write-Host "      $Message" -ForegroundColor $Color
}

function Write-ErrorBlock {
    param([string]$Title, [string[]]$Lines)
    Write-Host ""
    $v = $Script:CH_V; $h = $Script:CH_H
    Write-Host "    $($Script:CH_TL)$h " -NoNewline -ForegroundColor Red
    Write-Host $Title -ForegroundColor Red
    foreach ($line in $Lines) {
        Write-Host "    $v  " -NoNewline -ForegroundColor Red
        Write-Host $line -ForegroundColor Gray
    }
    Write-Host "    $($Script:CH_BL)$h$h" -ForegroundColor Red
    Write-Host ""
    Write-Log "ERROR BLOCK: $Title -- $($Lines -join ' | ')" "ERROR"
}

function Write-Suggestion {
    param([string]$Command, [string]$Description = "")
    Write-Host "      > " -NoNewline -ForegroundColor DarkYellow
    Write-Host $Command -ForegroundColor Yellow
    if ($Description) {
        Write-Host "        $Description" -ForegroundColor DarkGray
    }
}

# ============================================================================
#  UTILITY FUNCTIONS
# ============================================================================

function Get-CommandVersion {
    param([string]$Command, [string[]]$VersionArgs = @("-v"))
    try {
        $output = & $Command @VersionArgs 2>&1 | Out-String
        $firstLine = ($output -split "`n")[0].Trim()
        return $firstLine
    } catch {
        return $null
    }
}

function Test-CommandExists {
    param([string]$Command)
    return [bool](Get-Command $Command -ErrorAction SilentlyContinue)
}

function Measure-StepDuration {
    param([scriptblock]$Block)
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    & $Block
    $sw.Stop()
    return $sw.Elapsed
}

function Format-ProgressBar {
    param([int]$Percent, [int]$Width = 20)
    $filled = [math]::Floor($Percent / (100 / $Width))
    $empty  = $Width - $filled
    $bar = ([string]::new($Script:CH_FULL, $filled)) + ([string]::new($Script:CH_LITE, $empty))
    return $bar
}

# ============================================================================
#  HELP
# ============================================================================

if ($Help) {
    Write-Host ""
    Write-Host "  Skretchpad Setup" -ForegroundColor Cyan
    Write-Host "  $([string]::new($Script:CH_H, 40))" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "  Usage:" -ForegroundColor White
    Write-Host "    .\setup.ps1                    Full setup" -ForegroundColor Gray
    Write-Host "    .\setup.ps1 -SkipRustBuild     Skip cargo check" -ForegroundColor Gray
    Write-Host "    .\setup.ps1 -SkipFrontendBuild Skip vite build" -ForegroundColor Gray
    Write-Host "    .\setup.ps1 -Force             Reinstall npm packages" -ForegroundColor Gray
    Write-Host "    .\setup.ps1 -Verbose           Extended output" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  Steps:" -ForegroundColor White
    Write-Host "     01  Environment detection" -ForegroundColor Gray
    Write-Host "     02  Prerequisite validation" -ForegroundColor Gray
    Write-Host "     03  Project file integrity" -ForegroundColor Gray
    Write-Host "     04  Source file audit" -ForegroundColor Gray
    Write-Host "     05  npm dependency install" -ForegroundColor Gray
    Write-Host "     06  npm package verification" -ForegroundColor Gray
    Write-Host "     07  Rust build check" -ForegroundColor Gray
    Write-Host "     08  Frontend build check" -ForegroundColor Gray
    Write-Host "     09  Asset + plugin verification" -ForegroundColor Gray
    Write-Host "     10  Summary report" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  Logs saved to .setup/" -ForegroundColor DarkGray
    Write-Host ""
    exit 0
}

# ============================================================================
#  INITIALIZATION
# ============================================================================

if (-not (Test-Path (Join-Path $ProjectRoot "package.json"))) {
    Write-Host ""
    Write-Host "  ! Run from the skretchpad project root." -ForegroundColor Red
    Write-Host "    Current: $ProjectRoot" -ForegroundColor DarkGray
    exit 1
}

if (-not (Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
}

# Prune old logs (keep 10)
$oldLogs = Get-ChildItem -Path $LogDir -Filter "setup-*.log" -ErrorAction SilentlyContinue |
           Sort-Object LastWriteTime -Descending |
           Select-Object -Skip 10
foreach ($old in $oldLogs) {
    Remove-Item $old.FullName -Force -ErrorAction SilentlyContinue
}

Write-Log "Setup started at $($Script:StartTime)"
Write-Log "Project root: $ProjectRoot"
Write-Log "Flags: SkipRust=$SkipRustBuild SkipFE=$SkipFrontendBuild Force=$Force Verbose=$Verbose"

# ============================================================================
#  BANNER
# ============================================================================

Write-Banner

# ============================================================================
#  STEP 1: ENVIRONMENT DETECTION
# ============================================================================

Write-SectionHeader "Environment Detection"

$osName = [System.Runtime.InteropServices.RuntimeInformation]::OSDescription
$arch   = [System.Runtime.InteropServices.RuntimeInformation]::OSArchitecture
Write-Status "Operating System" "detected" $osName "info"
Write-Status "Architecture" "detected" "$arch" "info"

$psVer = "$($PSVersionTable.PSVersion)"
Write-Status "PowerShell" "detected" "v$psVer" "info"

# Disk space
try {
    $drive = (Get-Item $ProjectRoot).PSDrive
    $freeGB = [math]::Round((Get-PSDrive $drive.Name).Free / 1GB, 1)
    if ($freeGB -lt 5) {
        Write-Status "Disk Space" "low" "$($freeGB)GB free" "warn"
    } else {
        Write-Status "Disk Space" "ok" "$($freeGB)GB free" "pass"
    }
} catch {
    Write-Status "Disk Space" "unknown" "" "warn"
}

# Git
if (Test-CommandExists "git") {
    $gitVer = Get-CommandVersion "git" @("--version")
    Write-Status "Git" "found" $gitVer "pass"

    $gitStatus = & git -C $ProjectRoot rev-parse --is-inside-work-tree 2>&1
    if ($gitStatus -eq "true") {
        $branch = & git -C $ProjectRoot branch --show-current 2>&1
        Write-Status "Git Repository" "valid" "branch: $branch" "pass"
    } else {
        Write-Status "Git Repository" "not a repo" "" "warn"
    }
} else {
    Write-Status "Git" "not found" "optional" "warn"
}

Write-Log "Environment detection complete"

# ============================================================================
#  STEP 2: PREREQUISITES
# ============================================================================

Write-SectionHeader "Prerequisite Validation"

$prereqFailed = $false

# Node.js
if (Test-CommandExists "node") {
    $nodeVerRaw = (Get-CommandVersion "node" @("--version")).TrimStart("v")
    $nodeMajor  = [int]($nodeVerRaw.Split(".")[0])
    if ($nodeMajor -ge $Script:RequiredNodeMajor) {
        Write-Status "Node.js" "v$nodeVerRaw" ">= $($Script:RequiredNodeMajor)" "pass"
    } else {
        Write-Status "Node.js" "v$nodeVerRaw" "OUTDATED (need >= $($Script:RequiredNodeMajor))" "fail"
        Write-Suggestion "nvm install $($Script:RequiredNodeMajor)"
        $prereqFailed = $true
    }
} else {
    Write-Status "Node.js" "NOT FOUND" "" "fail"
    Write-Suggestion "https://nodejs.org (LTS)"
    $prereqFailed = $true
}

# npm
if (Test-CommandExists "npm") {
    $npmVer = (Get-CommandVersion "npm" @("--version"))
    Write-Status "npm" "v$npmVer" "" "pass"
} else {
    Write-Status "npm" "NOT FOUND" "" "fail"
    $prereqFailed = $true
}

# Rust
if (Test-CommandExists "rustc") {
    $rustVer = Get-CommandVersion "rustc" @("--version")
    Write-Status "Rust Compiler" "found" $rustVer "pass"
} else {
    Write-Status "Rust Compiler" "NOT FOUND" "" "fail"
    Write-Suggestion "https://www.rust-lang.org/tools/install"
    $prereqFailed = $true
}

# Cargo
if (Test-CommandExists "cargo") {
    $cargoVer = Get-CommandVersion "cargo" @("--version")
    Write-Status "Cargo" "found" $cargoVer "pass"
} else {
    Write-Status "Cargo" "NOT FOUND" "" "fail"
    $prereqFailed = $true
}

# Rust toolchain components
if (Test-CommandExists "rustup") {
    $components = & rustup component list --installed 2>&1 | Out-String
    $hasRustfmt = $components -match "rustfmt"
    $hasClippy  = $components -match "clippy"

    if ($hasRustfmt) {
        Write-Status "rustfmt" "installed" "" "pass"
    } else {
        Write-Status "rustfmt" "missing" "" "warn"
        Write-Suggestion "rustup component add rustfmt"
    }
    if ($hasClippy) {
        Write-Status "clippy" "installed" "" "pass"
    } else {
        Write-Status "clippy" "missing" "" "warn"
        Write-Suggestion "rustup component add clippy"
    }
} else {
    Write-Status "rustup" "not found" "" "warn"
}

# WebView2 (Windows)
if ($env:OS -eq "Windows_NT") {
    $wv2Version = $null
    $wv2Keys = @(
        "HKLM:\SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BEF-AE57F956752D}",
        "HKCU:\SOFTWARE\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BEF-AE57F956752D}"
    )
    foreach ($key in $wv2Keys) {
        if (-not $wv2Version) {
            try { $wv2Version = (Get-ItemProperty $key -ErrorAction SilentlyContinue).pv } catch {}
        }
    }

    if ($wv2Version) {
        Write-Status "WebView2 Runtime" "found" "v$wv2Version" "pass"
    } else {
        $edgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
        if (Test-Path $edgePath) {
            Write-Status "WebView2 Runtime" "available" "via Edge" "pass"
        } else {
            Write-Status "WebView2 Runtime" "NOT FOUND" "required for Tauri" "fail"
            Write-Suggestion "https://developer.microsoft.com/en-us/microsoft-edge/webview2/"
            $prereqFailed = $true
        }
    }
}

if ($prereqFailed) {
    Write-ErrorBlock "Missing Prerequisites" @(
        "One or more required tools are missing.",
        "Install the missing items above and re-run.",
        "Continuing -- builds may fail."
    )
}

Write-Log "Prerequisite validation complete. Failed=$prereqFailed"

# ============================================================================
#  STEP 3: PROJECT FILE INTEGRITY
# ============================================================================

Write-SectionHeader "Project File Integrity"

$configMissing = 0
foreach ($file in $Script:RequiredFiles) {
    $fullPath = Join-Path $ProjectRoot $file.Path
    if (Test-Path $fullPath) {
        $size = (Get-Item $fullPath).Length
        $sizeStr = if ($size -gt 1024) { "$([math]::Round($size/1024, 1))KB" } else { "$($size)B" }
        Write-Status $file.Label "present" "$($file.Path)  ($sizeStr)" "pass"
    } else {
        Write-Status $file.Label "MISSING" $file.Path "fail"
        $configMissing++
    }
}

if ($configMissing -gt 0) {
    Write-ErrorBlock "Missing Config Files" @(
        "$configMissing configuration file(s) missing.",
        "Try: git checkout -- . or re-clone."
    )
}

Write-Log "File integrity check complete. Missing=$configMissing"

# ============================================================================
#  STEP 4: SOURCE FILE AUDIT
# ============================================================================

Write-SectionHeader "Source File Audit"

$sourceMissing  = 0
$sourcePresent  = 0
$totalSourceLOC = 0
$categories     = @{}

foreach ($file in $Script:RequiredSourceFiles) {
    $fullPath = Join-Path $ProjectRoot $file.Path

    $category = if     ($file.Path -match "^src-tauri\\src\\plugin_system") { "Plugin Runtime" }
                elseif ($file.Path -match "^src-tauri\\src\\security")      { "Security" }
                elseif ($file.Path -match "^src-tauri")                     { "Backend" }
                elseif ($file.Path -match "^src\\components")               { "Components" }
                elseif ($file.Path -match "^src\\features")                 { "Features" }
                elseif ($file.Path -match "^src\\lib\\stores")              { "Stores" }
                elseif ($file.Path -match "^src\\lib\\icons")               { "Icons" }
                elseif ($file.Path -match "^src\\lib\\utils")               { "Utilities" }
                elseif ($file.Path -match "^src\\lib")                      { "Libraries" }
                elseif ($file.Path -match "^themes")                        { "Themes" }
                elseif ($file.Path -match "^plugins")                       { "Plugins" }
                else   { "Other" }

    if (-not $categories.ContainsKey($category)) {
        $categories[$category] = @{ Present = 0; Missing = 0; LOC = 0 }
    }

    if (Test-Path $fullPath) {
        $loc = (Get-Content $fullPath -ErrorAction SilentlyContinue | Measure-Object -Line).Lines
        $totalSourceLOC += $loc
        $categories[$category].Present++
        $categories[$category].LOC += $loc
        $sourcePresent++
        if ($Verbose) {
            Write-Status $file.Label "ok" "$($file.Path)  ($loc LOC)" "pass"
        }
    } else {
        Write-Status $file.Label "MISSING" $file.Path "fail"
        $categories[$category].Missing++
        $sourceMissing++
    }
}

if (-not $Verbose -and $sourcePresent -gt 0) {
    Write-Status "Source files scanned" "$sourcePresent found" "-Verbose for details" "pass"
}

# Category breakdown
Write-Host ""
$hRule = [string]::new($Script:CH_H, 60)
Write-Host "    $hRule" -ForegroundColor DarkGray

# Sort: Plugin Runtime first, then alphabetical
$sortedCats = $categories.GetEnumerator() | Sort-Object {
    switch ($_.Name) {
        "Plugin Runtime" { "00" }
        "Backend"        { "01" }
        "Security"       { "02" }
        "Components"     { "03" }
        "Features"       { "04" }
        "Libraries"      { "05" }
        "Stores"         { "06" }
        "Icons"          { "07" }
        "Utilities"      { "08" }
        "Themes"         { "09" }
        "Plugins"        { "10" }
        default          { "99" }
    }
}

foreach ($cat in $sortedCats) {
    $p = $cat.Value.Present
    $m = $cat.Value.Missing
    $l = $cat.Value.LOC
    $total = $p + $m
    $pct   = if ($total -gt 0) { [math]::Round(($p / $total) * 100) } else { 0 }
    $bar   = Format-ProgressBar $pct 16
    $color = if ($pct -eq 100) { "Green" } elseif ($pct -ge 80) { "Yellow" } else { "Red" }
    $catName = $cat.Name.PadRight(18)

    Start-Sleep -Milliseconds $Script:PaceTick
    Write-Host "    $bar " -NoNewline -ForegroundColor $color
    Write-Host $catName -NoNewline -ForegroundColor Gray
    Write-Host "$p/$total" -NoNewline -ForegroundColor $color
    Write-Host "  " -NoNewline
    Write-Host "($l LOC)" -ForegroundColor DarkGray
}

Write-Host "    $hRule" -ForegroundColor DarkGray
Write-Host "    Total: " -NoNewline -ForegroundColor DarkGray
Write-Host "$sourcePresent files" -NoNewline -ForegroundColor Cyan
Write-Host ", " -NoNewline -ForegroundColor DarkGray
Write-Host "~$totalSourceLOC LOC" -ForegroundColor Cyan

if ($sourceMissing -gt 0) {
    Write-ErrorBlock "Missing Source Files" @(
        "$sourceMissing source file(s) missing.",
        "Check git status or re-clone."
    )
}

Write-Log "Source audit complete. Present=$sourcePresent Missing=$sourceMissing LOC=$totalSourceLOC"

# ============================================================================
#  STEP 5: NPM DEPENDENCY INSTALLATION
# ============================================================================

Write-SectionHeader "npm Dependencies"

$nodeModulesPath = Join-Path $ProjectRoot "node_modules"
$nodeModulesExist = Test-Path $nodeModulesPath

if ($nodeModulesExist -and -not $Force) {
    $pkgCount = (Get-ChildItem -Path $nodeModulesPath -Directory -ErrorAction SilentlyContinue |
                 Where-Object { $_.Name -ne ".bin" -and $_.Name -ne ".cache" }).Count
    Write-Status "node_modules" "exists" "$pkgCount packages" "info"
    Write-Detail "Use -Force to reinstall"
} else {
    if ($Force -and $nodeModulesExist) {
        Write-Status "node_modules" "removing" "forced reinstall" "info"
        Remove-Item -Path $nodeModulesPath -Recurse -Force -ErrorAction SilentlyContinue
    }
    Write-Status "node_modules" "installing..." "" "info"
}

Write-Host ""
Write-Host "    Installing..." -ForegroundColor DarkGray
Write-Log "Running npm install..."

$npmInstallResult = $null
$npmInstallDuration = Measure-StepDuration {
    $Script:npmInstallResult = & npm install --prefix $ProjectRoot 2>&1 | Out-String
}

Write-Log "npm install output: $($Script:npmInstallResult)"

if ($LASTEXITCODE -eq 0) {
    $durStr = "$([math]::Round($npmInstallDuration.TotalSeconds, 1))s"
    Write-Status "npm install" "success" $durStr "pass"

    $auditMatch = [regex]::Match($Script:npmInstallResult, "(\d+)\s+vulnerabilit")
    if ($auditMatch.Success) {
        $vulnCount = $auditMatch.Groups[1].Value
        Write-Status "npm audit" "vulnerabilities" "$vulnCount found" "warn"
    }
} else {
    Write-Status "npm install" "FAILED" "" "fail"
    $errLines = ($Script:npmInstallResult -split "`n") | Where-Object { $_ -match "ERR!" } | Select-Object -First 5
    if ($errLines) {
        Write-ErrorBlock "npm install failed" $errLines
    }
    Write-Suggestion "npm install --verbose"
    Write-Suggestion "Remove-Item -Recurse node_modules; npm install" "Clean install"
}

if ($Verbose -and $Script:npmInstallResult) {
    Write-Detail "--- npm output (last 10 lines) ---"
    $lastLines = ($Script:npmInstallResult -split "`n") | Select-Object -Last 10
    foreach ($line in $lastLines) { Write-Detail $line.Trim() }
}

# ============================================================================
#  STEP 6: NPM PACKAGE VERIFICATION
# ============================================================================

Write-SectionHeader "Package Verification"

$pkgMissing    = 0
$pkgCorrupt    = 0
$pkgVerified   = 0

function Test-NpmPackage {
    param([string]$PackageName, [string]$Category)

    $pkgDir = Join-Path (Join-Path $ProjectRoot "node_modules") $PackageName
    if ($PackageName.StartsWith("@")) {
        $parts = $PackageName.Split("/")
        $pkgDir = Join-Path (Join-Path (Join-Path $ProjectRoot "node_modules") $parts[0]) $parts[1]
    }

    if (-not (Test-Path $pkgDir)) {
        Write-Status $PackageName "MISSING" "" "fail"
        $Script:pkgMissing++
        return
    }

    $pkgJson = Join-Path $pkgDir "package.json"
    if (-not (Test-Path $pkgJson)) {
        Write-Status $PackageName "CORRUPT" "no package.json" "fail"
        $Script:pkgCorrupt++
        return
    }

    try {
        $manifest = Get-Content $pkgJson -Raw | ConvertFrom-Json
        $version = $manifest.version
        if ($Verbose) {
            Write-Status $PackageName "v$version" $Category "pass"
        }
        $Script:pkgVerified++
    } catch {
        Write-Status $PackageName "CORRUPT" "malformed" "fail"
        $Script:pkgCorrupt++
    }
}

Write-Host "    Scanning production dependencies..." -ForegroundColor DarkGray
foreach ($pkg in $Script:RequiredNpmPackages) {
    Test-NpmPackage $pkg "dependency"
}

Write-Host "    Scanning dev dependencies..." -ForegroundColor DarkGray
foreach ($pkg in $Script:RequiredDevPackages) {
    Test-NpmPackage $pkg "devDependency"
}

$totalPkgs = $Script:RequiredNpmPackages.Count + $Script:RequiredDevPackages.Count

if (-not $Verbose -and $pkgVerified -gt 0) {
    Write-Status "Packages verified" "$pkgVerified/$totalPkgs" "" "pass"
}

if ($pkgMissing -gt 0 -or $pkgCorrupt -gt 0) {
    Write-ErrorBlock "Package Issues" @(
        "$pkgMissing missing, $pkgCorrupt corrupt of $totalPkgs required.",
        "Run: npm install"
    )
}

Write-Log "Package verification complete. Verified=$pkgVerified Missing=$pkgMissing Corrupt=$pkgCorrupt"

# ============================================================================
#  STEP 7: RUST BUILD CHECK
# ============================================================================

Write-SectionHeader "Rust Build"

if ($SkipRustBuild) {
    Write-Status "cargo check" "SKIPPED" "-SkipRustBuild" "skip"
} elseif (-not (Test-CommandExists "cargo")) {
    Write-Status "cargo check" "SKIPPED" "cargo not found" "skip"
} else {
    Write-Host "    Running cargo check..." -ForegroundColor DarkGray
    Write-Log "Running cargo check..."

    $cargoOutput = $null
    $cargoDuration = Measure-StepDuration {
        Push-Location (Join-Path $ProjectRoot "src-tauri")
        $Script:cargoOutput = & cargo check 2>&1 | Out-String
        Pop-Location
    }

    Write-Log "cargo check output: $($Script:cargoOutput)"

    $cargoErrors   = ([regex]::Matches($Script:cargoOutput, "error(\[E\d+\])?:")).Count
    $cargoWarnings = ([regex]::Matches($Script:cargoOutput, "warning:")).Count
    $summaryWarnings = ([regex]::Matches($Script:cargoOutput, "generated \d+ warning")).Count
    $cargoWarnings = [Math]::Max(0, $cargoWarnings - $summaryWarnings)

    $durStr = "$([math]::Round($cargoDuration.TotalSeconds, 1))s"

    if ($cargoErrors -eq 0) {
        $warnStr = if ($cargoWarnings -gt 0) { ", $cargoWarnings warnings" } else { "" }
        Write-Status "cargo check" "0 errors$warnStr" $durStr "pass"

        if ($cargoWarnings -gt 0) {
            Write-Status "Rust warnings" "$cargoWarnings" "cargo check for details" "warn"
        }
    } else {
        Write-Status "cargo check" "FAILED" "$cargoErrors errors" "fail"
        $errorLines = ($Script:cargoOutput -split "`n") |
                      Where-Object { $_ -match "^error" } |
                      Select-Object -First 8
        if ($errorLines) {
            Write-ErrorBlock "Rust Compilation Errors" $errorLines
        }
        Write-Suggestion "cd src-tauri; cargo check"
    }

    # Cargo.lock
    $cargoLock = Join-Path $ProjectRoot "src-tauri\Cargo.lock"
    if (Test-Path $cargoLock) {
        $lockSize = [math]::Round((Get-Item $cargoLock).Length / 1024)
        $depCount = (Select-String -Path $cargoLock -Pattern '^\[\[package\]\]' -ErrorAction SilentlyContinue).Count
        Write-Status "Cargo.lock" "present" "$depCount deps ($($lockSize)KB)" "pass"
    } else {
        Write-Status "Cargo.lock" "missing" "created on first build" "warn"
    }
}

# ============================================================================
#  STEP 8: FRONTEND BUILD VERIFICATION
# ============================================================================

Write-SectionHeader "Frontend Build"

if ($SkipFrontendBuild) {
    Write-Status "vite build" "SKIPPED" "-SkipFrontendBuild" "skip"
    Write-Status "svelte-check" "SKIPPED" "-SkipFrontendBuild" "skip"
} elseif (-not (Test-CommandExists "npm")) {
    Write-Status "vite build" "SKIPPED" "npm not found" "skip"
} else {
    Write-Host "    Running vite build..." -ForegroundColor DarkGray
    Write-Log "Running npm run build..."

    $buildOutput = $null
    $buildDuration = Measure-StepDuration {
        $Script:buildOutput = & npm run build --prefix $ProjectRoot 2>&1 | Out-String
    }

    Write-Log "vite build output: $($Script:buildOutput)"

    if ($LASTEXITCODE -eq 0) {
        $moduleMatch = [regex]::Match($Script:buildOutput, "(\d+)\s+modules?\s+transformed")
        $modules = if ($moduleMatch.Success) { $moduleMatch.Groups[1].Value } else { "?" }
        $durStr = "$([math]::Round($buildDuration.TotalSeconds, 1))s"

        Write-Status "vite build" "success" "$modules modules, $durStr" "pass"

        # dist output
        $distDir = Join-Path $ProjectRoot "dist"
        if (Test-Path $distDir) {
            $distFiles = Get-ChildItem -Path $distDir -Recurse -File -ErrorAction SilentlyContinue
            $distSize  = ($distFiles | Measure-Object -Property Length -Sum).Sum
            $distSizeStr = if ($distSize -gt 1MB) { "$([math]::Round($distSize/1MB, 1))MB" }
                           else { "$([math]::Round($distSize/1KB, 1))KB" }
            Write-Status "dist/ output" "$($distFiles.Count) files" $distSizeStr "pass"

            $indexHtml = Join-Path $distDir "index.html"
            if (Test-Path $indexHtml) {
                Write-Status "index.html" "present" "" "pass"
            } else {
                Write-Status "index.html" "MISSING" "" "fail"
            }
        } else {
            Write-Status "dist/ directory" "MISSING" "" "fail"
        }
    } else {
        Write-Status "vite build" "FAILED" "" "fail"
        $errorLines = ($Script:buildOutput -split "`n") |
                      Where-Object { $_ -match "error|Error|ERROR" } |
                      Select-Object -First 8
        if ($errorLines) {
            Write-ErrorBlock "Frontend Build Errors" $errorLines
        }
        Write-Suggestion "npm run build"
    }

    # Svelte type check
    Write-Host ""
    Write-Host "    Running svelte-check..." -ForegroundColor DarkGray
    $svelteCheckOutput = & npx svelte-check --tsconfig (Join-Path $ProjectRoot "tsconfig.json") 2>&1 | Out-String
    Write-Log "svelte-check output: $svelteCheckOutput"

    $svelteErrors   = ([regex]::Matches($svelteCheckOutput, "Error:")).Count
    $svelteWarnings = ([regex]::Matches($svelteCheckOutput, "Warning:")).Count

    if ($svelteErrors -eq 0) {
        $warnStr = if ($svelteWarnings -gt 0) { ", $svelteWarnings warnings" } else { "" }
        Write-Status "svelte-check" "0 errors$warnStr" "" "pass"
    } else {
        Write-Status "svelte-check" "FAILED" "$svelteErrors errors" "fail"
    }
}

# ============================================================================
#  STEP 9: ASSET & PLUGIN VERIFICATION
# ============================================================================

Write-SectionHeader "Assets and Plugins"

# Themes
$themesDir = Join-Path $ProjectRoot "themes"
if (Test-Path $themesDir) {
    $themeFiles = Get-ChildItem -Path $themesDir -Filter "*.toml" -ErrorAction SilentlyContinue
    foreach ($theme in $themeFiles) {
        $content = Get-Content $theme.FullName -Raw -ErrorAction SilentlyContinue
        $hasStructure = ($content -match '\[') -and ($content -match '=')
        if ($hasStructure) {
            $sizeStr = "$([math]::Round($theme.Length/1024, 1))KB"
            Write-Status "Theme: $($theme.BaseName)" "valid" $sizeStr "pass"
        } else {
            Write-Status "Theme: $($theme.BaseName)" "incomplete" "" "warn"
        }
    }
} else {
    Write-Status "themes/ directory" "MISSING" "" "fail"
}

# Plugins
$pluginsDir = Join-Path $ProjectRoot "plugins"
if (Test-Path $pluginsDir) {
    $pluginDirs = Get-ChildItem -Path $pluginsDir -Directory -ErrorAction SilentlyContinue
    foreach ($plugDir in $pluginDirs) {
        $manifest = Join-Path $plugDir.FullName "plugin.toml"
        $entry    = Join-Path $plugDir.FullName "main.js"

        if (Test-Path $manifest) {
            $manifestContent = Get-Content $manifest -Raw -ErrorAction SilentlyContinue
            $hasName    = $manifestContent -match 'name\s*='
            $hasVersion = $manifestContent -match 'version\s*='

            if ($hasName -and $hasVersion) {
                $entryStatus = if (Test-Path $entry) { "manifest + entry" } else { "manifest only" }
                Write-Status "Plugin: $($plugDir.Name)" $entryStatus "" "pass"
            } else {
                Write-Status "Plugin: $($plugDir.Name)" "incomplete" "" "warn"
            }
        } else {
            Write-Status "Plugin: $($plugDir.Name)" "no manifest" "" "warn"
        }
    }
} else {
    Write-Status "plugins/ directory" "MISSING" "" "fail"
}

# Tauri icons
$iconsDir = Join-Path $ProjectRoot "src-tauri\icons"
if (Test-Path $iconsDir) {
    $iconCount = (Get-ChildItem -Path $iconsDir -File -ErrorAction SilentlyContinue).Count
    if ($iconCount -gt 0) {
        Write-Status "App Icons" "$iconCount files" "" "pass"
    } else {
        Write-Status "App Icons" "empty" "" "warn"
    }
} else {
    Write-Status "App Icons" "missing" "" "warn"
}

# Sandbox JS API
$sandboxJs = Join-Path $ProjectRoot "src-tauri\js\plugin_api.js"
if (Test-Path $sandboxJs) {
    $jsLoc = (Get-Content $sandboxJs -ErrorAction SilentlyContinue | Measure-Object -Line).Lines
    Write-Status "Sandbox JS API" "present" "plugin_api.js ($jsLoc LOC)" "pass"
} else {
    Write-Status "Sandbox JS API" "MISSING" "" "fail"
}

# ASCII banner asset
$bannerTxt = Join-Path (Join-Path (Join-Path (Join-Path $ProjectRoot "docs") "assets") "ascii") "templates\banner.txt"
if (Test-Path $bannerTxt) {
    Write-Status "ASCII banner" "present" "docs/assets/ascii/" "pass"
} else {
    Write-Status "ASCII banner" "missing" "" "warn"
}

Write-Log "Asset and plugin verification complete"

# ============================================================================
#  STEP 10: FINAL SUMMARY
# ============================================================================

Write-SectionHeader "Summary"

$elapsed    = (Get-Date) - $Script:StartTime
$elapsedStr = "{0}m {1}s" -f [math]::Floor($elapsed.TotalMinutes), $elapsed.Seconds

# Status determination
$overallStatus = if ($Script:ErrorCount -eq 0 -and -not $prereqFailed) {
    "READY"
} elseif ($Script:ErrorCount -le 2 -and -not $prereqFailed) {
    "READY"
} else {
    "NOT READY"
}

$statusColor = if ($overallStatus -eq "READY") { "Cyan" } else { "Red" }

# Summary box
$boxW  = 56
$hLine = [string]::new($Script:CH_H, $boxW - 2)

Start-Sleep -Milliseconds $Script:PaceBeat

Write-Host ""
Write-Host "    $($Script:CH_TL)$hLine$($Script:CH_TR)" -ForegroundColor DarkCyan

function Write-BoxLine {
    param([string]$Text, [string]$Color = "Gray")
    $pad = $boxW - 2 - $Text.Length
    if ($pad -lt 0) { $pad = 0 }
    Write-Host "    $($Script:CH_V)" -NoNewline -ForegroundColor DarkCyan
    Write-Host $Text -NoNewline -ForegroundColor $Color
    Write-Host "$(' ' * $pad)$($Script:CH_V)" -ForegroundColor DarkCyan
}

function Write-BoxStat {
    param([string]$Label, [string]$Value, [string]$ValueColor = "Gray")
    $line = "  $($Label.PadRight(20))$Value"
    $pad  = $boxW - 2 - $line.Length
    if ($pad -lt 0) { $pad = 0 }
    Write-Host "    $($Script:CH_V)" -NoNewline -ForegroundColor DarkCyan
    Write-Host "  $($Label.PadRight(20))" -NoNewline -ForegroundColor DarkGray
    Write-Host $Value -NoNewline -ForegroundColor $ValueColor
    Write-Host "$(' ' * $pad)$($Script:CH_V)" -ForegroundColor DarkCyan
}

Write-BoxLine ""
Write-BoxLine "  Status: $overallStatus" $statusColor
Write-BoxLine ""

Start-Sleep -Milliseconds $Script:PaceTick

Write-BoxStat "Passed" "$($Script:PassCount)" "Green"
$warnColor = if ($Script:WarningCount -gt 0) { "Yellow" } else { "Green" }
Write-BoxStat "Warnings" "$($Script:WarningCount)" $warnColor
$errColor = if ($Script:ErrorCount -gt 0) { "Red" } else { "Green" }
Write-BoxStat "Errors" "$($Script:ErrorCount)" $errColor
Write-BoxStat "Skipped" "$($Script:SkipCount)" "DarkGray"
Write-BoxStat "Duration" $elapsedStr "Cyan"

$logName = Split-Path $Script:LogFile -Leaf
Write-BoxStat "Log" ".setup\$logName" "DarkGray"

Write-BoxLine ""
Write-Host "    $($Script:CH_BL)$hLine$($Script:CH_BR)" -ForegroundColor DarkCyan

# Quick start / next steps
Write-Host ""
if ($overallStatus -eq "READY") {
    Write-Host "    All systems nominal." -ForegroundColor Cyan
    Write-Host ""
    $qs = [string]::new($Script:CH_H, 40)
    Write-Host "    $qs" -ForegroundColor DarkGray
    Write-Host "    npx tauri dev" -NoNewline -ForegroundColor White
    Write-Host "               Launch with hot reload" -ForegroundColor DarkGray
    Write-Host "    npx tauri build" -NoNewline -ForegroundColor White
    Write-Host "             Production binary" -ForegroundColor DarkGray
    Write-Host "    npm run build" -NoNewline -ForegroundColor White
    Write-Host "               Frontend only" -ForegroundColor DarkGray
    Write-Host "    $qs" -ForegroundColor DarkGray
} else {
    Write-Host "    Fix errors above, then re-run:" -ForegroundColor Red
    Write-Host "    .\setup.ps1" -ForegroundColor Yellow
}

Write-Host ""

# Log summary
Write-Log "=========================================="
Write-Log "SETUP COMPLETE"
Write-Log "Status: $overallStatus"
Write-Log "Pass=$($Script:PassCount) Warn=$($Script:WarningCount) Error=$($Script:ErrorCount) Skip=$($Script:SkipCount)"
Write-Log "Duration: $elapsedStr"
Write-Log "=========================================="

exit $Script:ExitCode
