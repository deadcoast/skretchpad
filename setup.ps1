#Requires -Version 5.1
<#
.SYNOPSIS
    Skretchpad Development Environment Setup & Verification Script
.DESCRIPTION
    Comprehensive onboarding script that validates prerequisites, installs
    dependencies, verifies builds, and ensures a fully operational development
    environment for the Skretchpad editor.
.NOTES
    Version: 1.0.0
    Project: Skretchpad v0.0.6
    Stack:   Tauri 2.0 + Svelte 4 + CodeMirror 6 + Rust + TypeScript
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

# Box-drawing characters (avoid encoding issues by using char codes)
$Script:CH_H    = [char]0x2500  # horizontal line
$Script:CH_V    = [char]0x2502  # vertical line
$Script:CH_TL   = [char]0x250C  # top-left corner
$Script:CH_TR   = [char]0x2510  # top-right corner
$Script:CH_BL   = [char]0x2514  # bottom-left corner
$Script:CH_BR   = [char]0x2518  # bottom-right corner
$Script:CH_DH   = [char]0x2550  # double horizontal
$Script:CH_DV   = [char]0x2551  # double vertical
$Script:CH_DTL  = [char]0x2554  # double top-left
$Script:CH_DTR  = [char]0x2557  # double top-right
$Script:CH_DBL  = [char]0x255A  # double bottom-left
$Script:CH_DBR  = [char]0x255D  # double bottom-right
$Script:CH_FULL = [char]0x2588  # full block
$Script:CH_LITE = [char]0x2591  # light shade

# Version requirements
$Script:RequiredNodeMajor = 18

$Script:RequiredNpmPackages = @(
    "codemirror",
    "@codemirror/commands",
    "@codemirror/lang-css",
    "@codemirror/lang-html",
    "@codemirror/lang-javascript",
    "@codemirror/lang-json",
    "@codemirror/lang-markdown",
    "@codemirror/lang-python",
    "@codemirror/lang-rust",
    "@codemirror/lang-sql",
    "@codemirror/lang-xml",
    "@codemirror/lang-yaml",
    "@codemirror/search",
    "@codemirror/state",
    "@codemirror/view",
    "@codemirror/legacy-modes",
    "@codemirror/merge",
    "@tauri-apps/api",
    "@tauri-apps/plugin-dialog",
    "@tauri-apps/plugin-fs",
    "nanostores"
)

$Script:RequiredDevPackages = @(
    "@sveltejs/vite-plugin-svelte",
    "@tauri-apps/cli",
    "@tsconfig/svelte",
    "@types/node",
    "@typescript-eslint/eslint-plugin",
    "@typescript-eslint/parser",
    "autoprefixer",
    "eslint",
    "eslint-plugin-svelte",
    "postcss",
    "prettier",
    "prettier-plugin-svelte",
    "svelte",
    "svelte-check",
    "tailwindcss",
    "tslib",
    "typescript",
    "vite"
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
    @{ Path = "rust-toolchain.toml";                Label = "Rust toolchain config" },
    @{ Path = "src\main.ts";                      Label = "Frontend entry point" },
    @{ Path = "src\App.svelte";                   Label = "Root Svelte component" }
)

$Script:RequiredSourceFiles = @(
    # Backend
    @{ Path = "src-tauri\src\plugin_system\mod.rs";          Label = "Plugin module exports" },
    @{ Path = "src-tauri\src\plugin_system\sandbox.rs";      Label = "V8 sandbox" },
    @{ Path = "src-tauri\src\plugin_system\worker.rs";       Label = "Worker threads" },
    @{ Path = "src-tauri\src\plugin_system\capabilities.rs"; Label = "Capability model" },
    @{ Path = "src-tauri\src\plugin_system\loader.rs";       Label = "Plugin loader" },
    @{ Path = "src-tauri\src\plugin_system\manager.rs";      Label = "Plugin manager" },
    @{ Path = "src-tauri\src\plugin_system\api.rs";          Label = "Plugin API (25+ cmds)" },
    @{ Path = "src-tauri\src\plugin_system\trust.rs";        Label = "Trust levels" },
    @{ Path = "src-tauri\src\plugin_system\ops.rs";          Label = "deno_core ops (9 ops)" },
    @{ Path = "src-tauri\src\window_manager.rs";             Label = "Window manager" },
    @{ Path = "src-tauri\src\theme_engine.rs";               Label = "Theme engine" },
    @{ Path = "src-tauri\src\language_loader.rs";            Label = "Language loader" },
    # Frontend components
    @{ Path = "src\components\Editor.svelte";                Label = "Editor component" },
    @{ Path = "src\components\Chrome.svelte";                Label = "Chrome component" },
    @{ Path = "src\components\StatusBar.svelte";             Label = "StatusBar component" },
    @{ Path = "src\components\CommandPalette.svelte";        Label = "Command palette" },
    @{ Path = "src\components\NotificationToast.svelte";     Label = "Notification toasts" },
    @{ Path = "src\components\SideBar.svelte";               Label = "Sidebar component" },
    @{ Path = "src\components\PluginPermissionDialog.svelte";Label = "Permission dialog" },
    @{ Path = "src\components\SettingsPanel.svelte";         Label = "Settings panel" },
    @{ Path = "src\features\diff\DiffView.svelte";           Label = "Diff viewer" },
    # Frontend libraries
    @{ Path = "src\lib\editor-loader.ts";                    Label = "Editor loader" },
    @{ Path = "src\lib\plugin-api.ts";                       Label = "Plugin API bridge" },
    @{ Path = "src\lib\stores\editor.ts";                    Label = "Editor store" },
    @{ Path = "src\lib\stores\theme.ts";                     Label = "Theme store" },
    @{ Path = "src\lib\stores\keybindings.ts";               Label = "Keybinding store" },
    @{ Path = "src\lib\stores\plugins.ts";                   Label = "Plugin store" },
    @{ Path = "src\lib\stores\notifications.ts";             Label = "Notification store" },
    @{ Path = "src\lib\stores\ui.ts";                        Label = "UI utilities" },
    @{ Path = "src\lib\utils\debounce.ts";                   Label = "Debounce utility" },
    # Assets
    @{ Path = "themes\glass-dark.toml";                      Label = "Dark theme" },
    @{ Path = "themes\glass-light.toml";                     Label = "Light theme" },
    @{ Path = "languages\python.lang.json";                  Label = "Python language def" },
    @{ Path = "languages\rust.lang.json";                    Label = "Rust language def" },
    @{ Path = "languages\markdown.lang.json";                Label = "Markdown language def" },
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
    $w = 72
    $border = [string]::new($Script:CH_DH, $w - 2)

    function Pad([string]$text) {
        $inner = $w - 4
        $space = $inner - $text.Length
        if ($space -lt 0) { $space = 0 }
        $left  = [Math]::Floor($space / 2)
        $right = $space - $left
        return "$($Script:CH_DV) " + (" " * $left) + $text + (" " * $right) + " $($Script:CH_DV)"
    }

    Write-Host ""
    Write-Host "  $($Script:CH_DTL)$border$($Script:CH_DTR)" -ForegroundColor DarkCyan
    Write-Host (Pad "") -ForegroundColor DarkCyan

    # ASCII art banner (pure ASCII, no unicode)
    $art = @(
        "▄▄▄▄ ▄▄ ▄▄ ▄▄▄▄  ▄▄▄▄▄ ▄▄▄▄▄▄ ▄▄▄▄ ▄▄ ▄▄ ▄▄▄▄   ▄▄▄  ▄▄▄▄",  
       "███▄▄ ██▄█▀ ██▄█▄ ██▄▄    ██  ██▀▀▀ ██▄██ ██▄█▀ ██▀██ ██▀██", 
       "▄▄██▀ ██ ██ ██ ██ ██▄▄▄   ██  ▀████ ██ ██ ██    ██▀██ ████▀"                                                            
    )
    foreach ($line in $art) {
        Write-Host (Pad $line) -ForegroundColor Cyan
    }

    Write-Host (Pad "") -ForegroundColor DarkCyan
    Write-Host (Pad "Development Environment Setup") -ForegroundColor White
    Write-Host (Pad "v0.0.6  |  Tauri 2.0 + Svelte 4 + CodeMirror 6") -ForegroundColor DarkGray
    Write-Host (Pad "") -ForegroundColor DarkCyan
    Write-Host "  $($Script:CH_DBL)$border$($Script:CH_DBR)" -ForegroundColor DarkCyan
    Write-Host ""
}

function Write-SectionHeader {
    param([string]$Title)
    $Script:StepNumber++
    $num = "$($Script:StepNumber)".PadLeft(2, ' ')
    $remain = 56 - $Title.Length
    if ($remain -lt 2) { $remain = 2 }
    $bar = [string]::new($Script:CH_H, $remain)
    Write-Host ""
    Write-Host "  [$num/$Script:TotalSteps] " -NoNewline -ForegroundColor DarkCyan
    Write-Host "$Title " -NoNewline -ForegroundColor White
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
        "pass" { "[OK]";   $Script:PassCount++ }
        "fail" { "[!!]";   $Script:ErrorCount++ }
        "warn" { "[??]";   $Script:WarningCount++ }
        "skip" { "[--]";   $Script:SkipCount++ }
        "info" { "[..]" }
    }
    $color = switch ($Type) {
        "pass" { "Green" }
        "fail" { "Red" }
        "warn" { "Yellow" }
        "skip" { "DarkGray" }
        "info" { "Cyan" }
    }

    $paddedLabel = $Label.PadRight(40)
    Write-Host "    $icon " -NoNewline -ForegroundColor $color
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
    Write-Host "         $Message" -ForegroundColor $Color
}

function Write-ErrorBlock {
    param([string]$Title, [string[]]$Lines)
    Write-Host ""
    $tl = $Script:CH_TL; $v = $Script:CH_V; $bl = $Script:CH_BL; $h = $Script:CH_H
    Write-Host "    $tl$h " -NoNewline -ForegroundColor Red
    Write-Host $Title -ForegroundColor Red
    foreach ($line in $Lines) {
        Write-Host "    $v  " -NoNewline -ForegroundColor Red
        Write-Host $line -ForegroundColor Gray
    }
    Write-Host "    $bl$h$h" -ForegroundColor Red
    Write-Host ""
    Write-Log "ERROR BLOCK: $Title -- $($Lines -join ' | ')" "ERROR"
}

function Write-Suggestion {
    param([string]$Command, [string]$Description = "")
    Write-Host "         > " -NoNewline -ForegroundColor DarkYellow
    Write-Host $Command -ForegroundColor Yellow
    if ($Description) {
        Write-Host "           $Description" -ForegroundColor DarkGray
    }
}

# ============================================================================
#  UTILITY FUNCTIONS
# ============================================================================

function Get-CommandVersion {
    param([string]$Command, [string[]]$VersionArgs = @("-v"))
    try {
        $output = & $Command @VersionArgs 2>&1 | Out-String
        # Extract just the first line (version string)
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
    Write-Host "  Skretchpad Setup Script" -ForegroundColor Cyan
    $hLine = [string]::new($Script:CH_H, 45)
    Write-Host "  $hLine" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "  Usage:" -ForegroundColor White
    Write-Host "    .\setup.ps1                    Run full setup" -ForegroundColor Gray
    Write-Host "    .\setup.ps1 -SkipRustBuild     Skip cargo build verification" -ForegroundColor Gray
    Write-Host "    .\setup.ps1 -SkipFrontendBuild Skip vite build verification" -ForegroundColor Gray
    Write-Host "    .\setup.ps1 -Force             Reinstall npm packages" -ForegroundColor Gray
    Write-Host "    .\setup.ps1 -Verbose           Show extended output" -ForegroundColor Gray
    Write-Host "    .\setup.ps1 -Help              Show this help" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  Steps performed:" -ForegroundColor White
    Write-Host "     1. Environment detection (OS, arch, shell)" -ForegroundColor Gray
    Write-Host "     2. Prerequisite validation (Node, Rust, Cargo)" -ForegroundColor Gray
    Write-Host "     3. Project file integrity check" -ForegroundColor Gray
    Write-Host "     4. Source file completeness audit" -ForegroundColor Gray
    Write-Host "     5. npm dependency installation" -ForegroundColor Gray
    Write-Host "     6. npm package verification (all packages)" -ForegroundColor Gray
    Write-Host "     7. Rust dependency check (cargo check)" -ForegroundColor Gray
    Write-Host "     8. Frontend build verification (vite build)" -ForegroundColor Gray
    Write-Host "     9. Asset and plugin verification" -ForegroundColor Gray
    Write-Host "    10. Final summary report" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  Log files are saved to .setup/ directory" -ForegroundColor DarkGray
    Write-Host ""
    exit 0
}

# ============================================================================
#  INITIALIZATION
# ============================================================================

# Ensure we are in the project root
if (-not (Test-Path (Join-Path $ProjectRoot "package.json"))) {
    Write-Host ""
    Write-Host "  [!!] This script must be run from the skretchpad project root." -ForegroundColor Red
    Write-Host "       Current directory: $ProjectRoot" -ForegroundColor DarkGray
    exit 1
}

# Create log directory
if (-not (Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
}

# Prune old logs (keep last 10)
$oldLogs = Get-ChildItem -Path $LogDir -Filter "setup-*.log" -ErrorAction SilentlyContinue |
           Sort-Object LastWriteTime -Descending |
           Select-Object -Skip 10
foreach ($old in $oldLogs) {
    Remove-Item $old.FullName -Force -ErrorAction SilentlyContinue
}

Write-Log "Setup started at $($Script:StartTime)"
Write-Log "Project root: $ProjectRoot"
Write-Log "Arguments: SkipRustBuild=$SkipRustBuild SkipFrontendBuild=$SkipFrontendBuild Force=$Force Verbose=$Verbose"

# ============================================================================
#  BANNER
# ============================================================================

Write-Banner

# ============================================================================
#  STEP 1: ENVIRONMENT DETECTION
# ============================================================================

Write-SectionHeader "Environment Detection"

# OS
$osName = [System.Runtime.InteropServices.RuntimeInformation]::OSDescription
$arch   = [System.Runtime.InteropServices.RuntimeInformation]::OSArchitecture
Write-Status "Operating System" "detected" $osName "info"
Write-Status "Architecture" "detected" "$arch" "info"

# PowerShell version
$psVer = "$($PSVersionTable.PSVersion)"
Write-Status "PowerShell" "detected" "v$psVer" "info"

# Disk space
try {
    $drive = (Get-Item $ProjectRoot).PSDrive
    $freeGB = [math]::Round((Get-PSDrive $drive.Name).Free / 1GB, 1)
    if ($freeGB -lt 5) {
        Write-Status "Disk Space" "low" "$($freeGB)GB free (recommend 10GB+)" "warn"
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
    Write-Status "Git" "not found" "optional but recommended" "warn"
}

Write-Log "Environment detection complete"

# ============================================================================
#  STEP 2: PREREQUISITES
# ============================================================================

Write-SectionHeader "Prerequisite Validation"

$prereqFailed = $false

# --- Node.js ---
if (Test-CommandExists "node") {
    $nodeVerRaw = (Get-CommandVersion "node" @("--version")).TrimStart("v")
    $nodeMajor  = [int]($nodeVerRaw.Split(".")[0])
    if ($nodeMajor -ge $Script:RequiredNodeMajor) {
        Write-Status "Node.js" "v$nodeVerRaw" "meets requirement (>= $($Script:RequiredNodeMajor))" "pass"
    } else {
        Write-Status "Node.js" "v$nodeVerRaw" "OUTDATED (need >= $($Script:RequiredNodeMajor))" "fail"
        Write-Suggestion "nvm install $($Script:RequiredNodeMajor)" "or download from https://nodejs.org"
        $prereqFailed = $true
    }
} else {
    Write-Status "Node.js" "NOT FOUND" "" "fail"
    Write-Suggestion "Download from https://nodejs.org (LTS recommended)"
    $prereqFailed = $true
}

# --- npm ---
if (Test-CommandExists "npm") {
    $npmVer = (Get-CommandVersion "npm" @("--version"))
    Write-Status "npm" "v$npmVer" "" "pass"
} else {
    Write-Status "npm" "NOT FOUND" "ships with Node.js" "fail"
    $prereqFailed = $true
}

# --- Rust ---
if (Test-CommandExists "rustc") {
    $rustVer = Get-CommandVersion "rustc" @("--version")
    Write-Status "Rust Compiler" "found" $rustVer "pass"
} else {
    Write-Status "Rust Compiler" "NOT FOUND" "" "fail"
    Write-Suggestion "https://www.rust-lang.org/tools/install" "Windows installer"
    $prereqFailed = $true
}

# --- Cargo ---
if (Test-CommandExists "cargo") {
    $cargoVer = Get-CommandVersion "cargo" @("--version")
    Write-Status "Cargo" "found" $cargoVer "pass"
} else {
    Write-Status "Cargo" "NOT FOUND" "installs with Rust" "fail"
    $prereqFailed = $true
}

# --- Rust toolchain components ---
if (Test-CommandExists "rustup") {
    $components = & rustup component list --installed 2>&1 | Out-String
    $hasRustfmt = $components -match "rustfmt"
    $hasClippy  = $components -match "clippy"

    if ($hasRustfmt) {
        Write-Status "rustfmt" "installed" "" "pass"
    } else {
        Write-Status "rustfmt" "not installed" "" "warn"
        Write-Suggestion "rustup component add rustfmt"
    }
    if ($hasClippy) {
        Write-Status "clippy" "installed" "" "pass"
    } else {
        Write-Status "clippy" "not installed" "" "warn"
        Write-Suggestion "rustup component add clippy"
    }
} else {
    Write-Status "rustup" "not found" "needed for toolchain management" "warn"
}

# --- Platform-specific: WebView2 (Windows) ---
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
            Write-Status "WebView2 Runtime" "available" "via Microsoft Edge" "pass"
        } else {
            Write-Status "WebView2 Runtime" "NOT FOUND" "required for Tauri on Windows" "fail"
            Write-Suggestion "https://developer.microsoft.com/en-us/microsoft-edge/webview2/"
            $prereqFailed = $true
        }
    }
}

if ($prereqFailed) {
    Write-ErrorBlock "Missing Prerequisites" @(
        "One or more required tools are missing or outdated.",
        "Install the missing prerequisites above and re-run this script.",
        "The script will continue but builds may fail."
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
    Write-ErrorBlock "Missing Configuration Files" @(
        "$configMissing configuration file(s) are missing.",
        "The project may have been cloned incompletely.",
        "Try: git checkout -- . or re-clone the repository."
    )
}

Write-Log "File integrity check complete. Missing=$configMissing"

# ============================================================================
#  STEP 4: SOURCE FILE AUDIT
# ============================================================================

Write-SectionHeader "Source File Completeness Audit"

$sourceMissing  = 0
$sourcePresent  = 0
$totalSourceLOC = 0
$categories     = @{}

foreach ($file in $Script:RequiredSourceFiles) {
    $fullPath = Join-Path $ProjectRoot $file.Path

    # Determine category
    $category = if     ($file.Path -match "^src-tauri")       { "Backend (Rust)" }
                elseif ($file.Path -match "^src\\components") { "Frontend Components" }
                elseif ($file.Path -match "^src\\lib")        { "Frontend Libraries" }
                elseif ($file.Path -match "^themes|^languages") { "Assets" }
                elseif ($file.Path -match "^plugins")         { "Plugins" }
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
            Write-Status $file.Label "ok" "$($file.Path)  ($loc lines)" "pass"
        }
    } else {
        Write-Status $file.Label "MISSING" $file.Path "fail"
        $categories[$category].Missing++
        $sourceMissing++
    }
}

if (-not $Verbose -and $sourcePresent -gt 0) {
    Write-Status "Source files scanned" "$sourcePresent found" "use -Verbose to see each file" "pass"
}

# Category summary
Write-Host ""
$hRule = [string]::new($Script:CH_H, 57)
Write-Host "    Category Breakdown:" -ForegroundColor DarkGray
Write-Host "    $hRule" -ForegroundColor DarkGray
foreach ($cat in $categories.GetEnumerator() | Sort-Object Name) {
    $p = $cat.Value.Present
    $m = $cat.Value.Missing
    $l = $cat.Value.LOC
    $total = $p + $m
    $pct   = if ($total -gt 0) { [math]::Round(($p / $total) * 100) } else { 0 }
    $bar   = Format-ProgressBar $pct 20
    $color = if ($pct -eq 100) { "Green" } elseif ($pct -ge 80) { "Yellow" } else { "Red" }
    $catName = $cat.Name.PadRight(22)
    Write-Host "    $bar " -NoNewline -ForegroundColor $color
    Write-Host $catName -NoNewline -ForegroundColor Gray
    Write-Host "$p/$total files  " -NoNewline -ForegroundColor $color
    Write-Host "($l LOC)" -ForegroundColor DarkGray
}
Write-Host "    $hRule" -ForegroundColor DarkGray
Write-Host "    Total: $sourcePresent files, ~$totalSourceLOC lines of code" -ForegroundColor Gray

if ($sourceMissing -gt 0) {
    Write-ErrorBlock "Missing Source Files" @(
        "$sourceMissing source file(s) are missing from the project.",
        "These files are required for a complete build.",
        "Check git status or re-clone the repository."
    )
}

Write-Log "Source audit complete. Present=$sourcePresent Missing=$sourceMissing LOC=$totalSourceLOC"

# ============================================================================
#  STEP 5: NPM DEPENDENCY INSTALLATION
# ============================================================================

Write-SectionHeader "npm Dependency Installation"

$nodeModulesPath = Join-Path $ProjectRoot "node_modules"
$nodeModulesExist = Test-Path $nodeModulesPath

if ($nodeModulesExist -and -not $Force) {
    $pkgCount = (Get-ChildItem -Path $nodeModulesPath -Directory -ErrorAction SilentlyContinue |
                 Where-Object { $_.Name -ne ".bin" -and $_.Name -ne ".cache" }).Count
    Write-Status "node_modules" "exists" "$pkgCount top-level packages found" "info"
    Write-Detail "Use -Force to reinstall all packages"
} else {
    if ($Force -and $nodeModulesExist) {
        Write-Status "node_modules" "removing" "forced reinstall" "info"
        Remove-Item -Path $nodeModulesPath -Recurse -Force -ErrorAction SilentlyContinue
    }
    Write-Status "node_modules" "not found" "installing..." "info"
}

# Run npm install
Write-Host ""
Write-Host "    Running npm install..." -ForegroundColor DarkGray
Write-Log "Running npm install..."

$npmInstallResult = $null
$npmInstallDuration = Measure-StepDuration {
    $Script:npmInstallResult = & npm install --prefix $ProjectRoot 2>&1 | Out-String
}

Write-Log "npm install output: $($Script:npmInstallResult)"

if ($LASTEXITCODE -eq 0) {
    $durStr = "$([math]::Round($npmInstallDuration.TotalSeconds, 1))s"
    Write-Status "npm install" "success" $durStr "pass"

    # Check for vulnerabilities
    $auditMatch = [regex]::Match($Script:npmInstallResult, "(\d+)\s+vulnerabilit")
    if ($auditMatch.Success) {
        $vulnCount = $auditMatch.Groups[1].Value
        Write-Status "npm audit" "vulnerabilities" "$vulnCount found (run npm audit for details)" "warn"
    }
} else {
    Write-Status "npm install" "FAILED" "" "fail"
    $errLines = ($Script:npmInstallResult -split "`n") | Where-Object { $_ -match "ERR!" } | Select-Object -First 5
    if ($errLines) {
        Write-ErrorBlock "npm install failed" $errLines
    }
    Write-Suggestion "npm install --verbose" "Run with verbose output for more details"
    Write-Suggestion "Remove-Item -Recurse node_modules; npm install" "Try a clean install"
}

if ($Verbose -and $Script:npmInstallResult) {
    Write-Detail "--- npm output (last 10 lines) ---"
    $lastLines = ($Script:npmInstallResult -split "`n") | Select-Object -Last 10
    foreach ($line in $lastLines) {
        Write-Detail $line.Trim()
    }
}

# ============================================================================
#  STEP 6: NPM PACKAGE VERIFICATION
# ============================================================================

Write-SectionHeader "npm Package Verification"

$pkgMissing    = 0
$pkgCorrupt    = 0
$pkgVerified   = 0

function Test-NpmPackage {
    param([string]$PackageName, [string]$Category)

    $pkgDir = Join-Path (Join-Path $ProjectRoot "node_modules") $PackageName
    # Handle scoped packages
    if ($PackageName.StartsWith("@")) {
        $parts = $PackageName.Split("/")
        $pkgDir = Join-Path (Join-Path (Join-Path $ProjectRoot "node_modules") $parts[0]) $parts[1]
    }

    if (-not (Test-Path $pkgDir)) {
        Write-Status $PackageName "MISSING" "not in node_modules" "fail"
        $Script:pkgMissing++
        return
    }

    $pkgJson = Join-Path $pkgDir "package.json"
    if (-not (Test-Path $pkgJson)) {
        Write-Status $PackageName "CORRUPT" "missing package.json" "fail"
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
        Write-Status $PackageName "CORRUPT" "malformed package.json" "fail"
        $Script:pkgCorrupt++
    }
}

Write-Host "    Verifying production dependencies..." -ForegroundColor DarkGray
foreach ($pkg in $Script:RequiredNpmPackages) {
    Test-NpmPackage $pkg "dependency"
}

Write-Host "    Verifying dev dependencies..." -ForegroundColor DarkGray
foreach ($pkg in $Script:RequiredDevPackages) {
    Test-NpmPackage $pkg "devDependency"
}

$totalPkgs = $Script:RequiredNpmPackages.Count + $Script:RequiredDevPackages.Count

if (-not $Verbose -and $pkgVerified -gt 0) {
    Write-Status "Packages verified" "$pkgVerified/$totalPkgs" "" "pass"
}

if ($pkgMissing -gt 0 -or $pkgCorrupt -gt 0) {
    Write-ErrorBlock "Package Issues" @(
        "$pkgMissing missing, $pkgCorrupt corrupt out of $totalPkgs required packages.",
        "Run 'npm install' to fix missing packages.",
        "Run 'Remove-Item -Recurse node_modules; npm install' for corrupt packages."
    )
}

Write-Log "Package verification complete. Verified=$pkgVerified Missing=$pkgMissing Corrupt=$pkgCorrupt"

# ============================================================================
#  STEP 7: RUST BUILD CHECK
# ============================================================================

Write-SectionHeader "Rust Build Verification"

if ($SkipRustBuild) {
    Write-Status "cargo check" "SKIPPED" "-SkipRustBuild flag" "skip"
} elseif (-not (Test-CommandExists "cargo")) {
    Write-Status "cargo check" "SKIPPED" "cargo not found" "skip"
} else {
    Write-Host "    Running cargo check (this may take a while on first run)..." -ForegroundColor DarkGray
    Write-Log "Running cargo check..."

    $cargoOutput = $null
    $cargoDuration = Measure-StepDuration {
        Push-Location (Join-Path $ProjectRoot "src-tauri")
        $Script:cargoOutput = & cargo check 2>&1 | Out-String
        Pop-Location
    }

    Write-Log "cargo check output: $($Script:cargoOutput)"

    # Parse results
    $cargoErrors   = ([regex]::Matches($Script:cargoOutput, "error(\[E\d+\])?:")).Count
    $cargoWarnings = ([regex]::Matches($Script:cargoOutput, "warning:")).Count
    # Subtract summary lines like "generated X warnings"
    $summaryWarnings = ([regex]::Matches($Script:cargoOutput, "generated \d+ warning")).Count
    $cargoWarnings = [Math]::Max(0, $cargoWarnings - $summaryWarnings)

    $durStr = "$([math]::Round($cargoDuration.TotalSeconds, 1))s"

    if ($cargoErrors -eq 0) {
        $warnStr = if ($cargoWarnings -gt 0) { ", $cargoWarnings warnings" } else { "" }
        Write-Status "cargo check" "0 errors$warnStr" $durStr "pass"

        if ($cargoWarnings -gt 0) {
            Write-Status "Rust warnings" "$cargoWarnings" "run cargo check for details" "warn"
        }
    } else {
        Write-Status "cargo check" "FAILED" "$cargoErrors errors, $cargoWarnings warnings" "fail"

        $errorLines = ($Script:cargoOutput -split "`n") |
                      Where-Object { $_ -match "^error" } |
                      Select-Object -First 8
        if ($errorLines) {
            Write-ErrorBlock "Rust Compilation Errors" $errorLines
        }
        Write-Suggestion "cd src-tauri; cargo check" "Run manually for full output"
    }

    # Check Cargo.lock
    $cargoLock = Join-Path $ProjectRoot "src-tauri\Cargo.lock"
    if (Test-Path $cargoLock) {
        $lockSize = [math]::Round((Get-Item $cargoLock).Length / 1024)
        $depCount = (Select-String -Path $cargoLock -Pattern '^\[\[package\]\]' -ErrorAction SilentlyContinue).Count
        Write-Status "Cargo.lock" "present" "$depCount transitive deps ($($lockSize)KB)" "pass"
    } else {
        Write-Status "Cargo.lock" "missing" "will be created on first build" "warn"
    }
}

# ============================================================================
#  STEP 8: FRONTEND BUILD VERIFICATION
# ============================================================================

Write-SectionHeader "Frontend Build Verification"

if ($SkipFrontendBuild) {
    Write-Status "vite build" "SKIPPED" "-SkipFrontendBuild flag" "skip"
    Write-Status "svelte-check" "SKIPPED" "-SkipFrontendBuild flag" "skip"
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

        # Check dist output
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
                Write-Status "index.html" "MISSING" "build output incomplete" "fail"
            }
        } else {
            Write-Status "dist/ directory" "MISSING" "build may have failed silently" "fail"
        }
    } else {
        Write-Status "vite build" "FAILED" "" "fail"
        $errorLines = ($Script:buildOutput -split "`n") |
                      Where-Object { $_ -match "error|Error|ERROR" } |
                      Select-Object -First 8
        if ($errorLines) {
            Write-ErrorBlock "Frontend Build Errors" $errorLines
        }
        Write-Suggestion "npm run build" "Run manually for full output"
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

Write-SectionHeader "Asset and Plugin Verification"

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
            Write-Status "Theme: $($theme.BaseName)" "suspect" "may be incomplete" "warn"
        }
    }
} else {
    Write-Status "themes/ directory" "MISSING" "" "fail"
}

# Languages
$langsDir = Join-Path $ProjectRoot "languages"
if (Test-Path $langsDir) {
    $langFiles = Get-ChildItem -Path $langsDir -Filter "*.lang.json" -ErrorAction SilentlyContinue
    foreach ($lang in $langFiles) {
        try {
            $null = Get-Content $lang.FullName -Raw | ConvertFrom-Json
            $langName = $lang.BaseName -replace "\.lang$", ""
            $sizeStr = "$([math]::Round($lang.Length/1024, 1))KB"
            Write-Status "Language: $langName" "valid JSON" $sizeStr "pass"
        } catch {
            Write-Status "Language: $($lang.BaseName)" "INVALID JSON" "parse error" "fail"
        }
    }
} else {
    Write-Status "languages/ directory" "MISSING" "" "fail"
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
                Write-Status "Plugin: $($plugDir.Name)" "incomplete manifest" "" "warn"
            }
        } else {
            Write-Status "Plugin: $($plugDir.Name)" "no manifest" "missing plugin.toml" "warn"
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
        Write-Status "App Icons" "empty directory" "" "warn"
    }
} else {
    Write-Status "App Icons" "icons/ directory missing" "" "warn"
}

# JS sandbox API
$sandboxJs = Join-Path $ProjectRoot "src-tauri\js\plugin_api.js"
if (Test-Path $sandboxJs) {
    $jsLoc = (Get-Content $sandboxJs -ErrorAction SilentlyContinue | Measure-Object -Line).Lines
    Write-Status "Sandbox JS API" "present" "plugin_api.js ($jsLoc lines)" "pass"
} else {
    Write-Status "Sandbox JS API" "MISSING" "src-tauri/js/plugin_api.js" "fail"
}

Write-Log "Asset and plugin verification complete"

# ============================================================================
#  STEP 10: FINAL SUMMARY
# ============================================================================

Write-SectionHeader "Setup Summary"

$elapsed    = (Get-Date) - $Script:StartTime
$elapsedStr = "{0}m {1}s" -f [math]::Floor($elapsed.TotalMinutes), $elapsed.Seconds

# Status determination
$overallStatus = if ($Script:ErrorCount -eq 0 -and -not $prereqFailed) {
    "READY"
} elseif ($Script:ErrorCount -le 2 -and -not $prereqFailed) {
    "READY (with warnings)"
} else {
    "NOT READY"
}

$statusColor = if ($overallStatus -eq "READY") { "Green" }
               elseif ($overallStatus -match "warning") { "Yellow" }
               else { "Red" }

# Summary box
$boxW  = 60
$hLine = [string]::new($Script:CH_H, $boxW - 2)
$v     = $Script:CH_V

Write-Host ""
Write-Host "    $($Script:CH_TL)$hLine$($Script:CH_TR)" -ForegroundColor DarkCyan

function Write-BoxLine {
    param([string]$Text, [string]$Color = "Gray")
    $pad = $boxW - 2 - $Text.Length
    if ($pad -lt 0) { $pad = 0 }
    Write-Host "    $v" -NoNewline -ForegroundColor DarkCyan
    Write-Host $Text -NoNewline -ForegroundColor $Color
    Write-Host "$(' ' * $pad)$v" -ForegroundColor DarkCyan
}

function Write-BoxStat {
    param([string]$Label, [string]$Value, [string]$ValueColor = "Gray")
    $line = "  $($Label.PadRight(24))$Value"
    $pad  = $boxW - 2 - $line.Length
    if ($pad -lt 0) { $pad = 0 }
    Write-Host "    $v" -NoNewline -ForegroundColor DarkCyan
    Write-Host "  $($Label.PadRight(24))" -NoNewline -ForegroundColor DarkGray
    Write-Host $Value -NoNewline -ForegroundColor $ValueColor
    Write-Host "$(' ' * $pad)$v" -ForegroundColor DarkCyan
}

Write-BoxLine ""
Write-BoxLine "  Environment Status: $overallStatus" $statusColor
Write-BoxLine ""
Write-BoxStat "Checks Passed" "$($Script:PassCount)" "Green"
$warnColor = if ($Script:WarningCount -gt 0) { "Yellow" } else { "Green" }
Write-BoxStat "Warnings" "$($Script:WarningCount)" $warnColor
$errColor = if ($Script:ErrorCount -gt 0) { "Red" } else { "Green" }
Write-BoxStat "Errors" "$($Script:ErrorCount)" $errColor
Write-BoxStat "Skipped" "$($Script:SkipCount)" "DarkGray"
Write-BoxStat "Duration" $elapsedStr "Cyan"
$logName = Split-Path $Script:LogFile -Leaf
Write-BoxStat "Log File" ".setup\$logName" "DarkGray"
Write-BoxLine ""

Write-Host "    $($Script:CH_BL)$hLine$($Script:CH_BR)" -ForegroundColor DarkCyan

# Quick-start commands
Write-Host ""
if ($overallStatus -match "READY") {
    Write-Host "    Quick Start:" -ForegroundColor White
    $qs = [string]::new($Script:CH_H, 13)
    Write-Host "    $qs" -ForegroundColor DarkGray
    Write-Host "    npm run dev          " -NoNewline -ForegroundColor Yellow
    Write-Host "Start frontend dev server" -ForegroundColor DarkGray
    Write-Host "    npm run tauri:dev    " -NoNewline -ForegroundColor Yellow
    Write-Host "Launch desktop app with hot reload" -ForegroundColor DarkGray
    Write-Host "    npm run tauri:build  " -NoNewline -ForegroundColor Yellow
    Write-Host "Build production binary" -ForegroundColor DarkGray
} else {
    Write-Host "    Fix the errors above and re-run:" -ForegroundColor Red
    Write-Host "    .\setup.ps1" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "    For help:" -ForegroundColor DarkGray
    Write-Host "    .\setup.ps1 -Help" -ForegroundColor Yellow
}

Write-Host ""

# Write final log summary
Write-Log "=========================================="
Write-Log "SETUP COMPLETE"
Write-Log "Status: $overallStatus"
Write-Log "Pass=$($Script:PassCount) Warn=$($Script:WarningCount) Error=$($Script:ErrorCount) Skip=$($Script:SkipCount)"
Write-Log "Duration: $elapsedStr"
Write-Log "=========================================="

exit $Script:ExitCode
