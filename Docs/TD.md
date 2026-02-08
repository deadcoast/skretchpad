## TODO 0.0.7 - Plan to implement

### Theme Unification Plan

> Context
> The app has two diverged theme systems that don't talk to each other:

1. Rust backend (theme_engine.rs): Parses TOML files into a Theme struct, generates CSS vars string via to_css_vars(). Has 4 Tauri commands but the load_theme command returns a CSS string — never consumed by the
 frontend.
2. Frontend (stores/theme.ts): Has hardcoded MILKYTEXT and LIQUID_GLASS_DARK Theme objects (~220 lines of constants), applies ~85 CSS vars via applyThemeToDocument(). Completely self-contained.
3. Dead code (theme-engine.ts): 69-line ThemeEngine class that calls invoke('load_theme') — never instantiated anywhere.

Goal: Make TOML files the single source of truth. Frontend loads themes from Rust backend, removes hardcoded constants.

> Key Design Decision

Instead of converting load_theme to return the full Theme JSON (which requires complex snake_case → camelCase mapping and restructuring between the Rust struct shape and TS interface shape), we keep load_theme returning a CSS   string but also add a load_theme_json command that returns the full Theme as JSON. The frontend's applyThemeToDocument() already works perfectly — we just need to feed it Theme objects from Rust instead of hardcoded constants.

Actually, looking more carefully: the Rust ChromeTheme has background: ChromeBackground { color, blur } + foreground + height, but the TS ChromeTheme has flat background: string + foreground + height + blur? + border? + menuBackground? etc. These structures don't align. Converting Rust→TS JSON would require custom serialization. The simpler path: expand the Rust struct to match the TS interface exactly, and use #[serde(rename_all = "camelCase")] on all structs.

## Phase 1: Restructure Rust Theme struct to match TS interface

File: src-tauri/src/theme_engine.rs

> Changes:

1. Add PaletteTheme struct (new) — 20 string fields matching TS ThemePalette:
+ background, foreground, cursor_color, selection_background, selection_foreground?
+ 16 ANSI colors: black, red, green, yellow, blue, purple, cyan, white, bright_black..bright_white
1. Flatten ChromeTheme — remove ChromeBackground sub-struct, make fields flat:
+ background: String, foreground: String, height: u32
+ Add: blur: Option<u32>, border: Option<String>, menu_background: Option<String>, menu_hover: Option<String>,menu_foreground: Option<String>
1. Expand EditorTheme — add nested line and gutter + font fields:
+ Add line: EditorLineTheme (new struct: active, number, number_active)
+ Add gutter: EditorGutterTheme (new struct: background, border?)
+ Add font_family: Option<String>, font_size: Option<u32>, line_height: Option<f32>
1. Add optional fields to SyntaxTheme (keep TokenStyle for existing 9, add optional string fields):
+ Add: tag, attribute, property, punctuation, regexp, heading, link, meta — all Option<TokenStyle>
1. Expand UiTheme — currently only has status_bar. Make it a full struct with all TS fields:
+ status_bar: UiStatusBarTheme
+ primary, border, border_subtle, text_primary, text_secondary, text_disabled
+ button_background, button_hover, button_active
+ input_background, input_border, input_focus
+ tooltip_background, scrollbar_thumb, scrollbar_thumb_hover
+ error, warning, success, info
+ search_match, search_match_selected, selection_match
1. Make ui required (not Option<UiTheme>) — all themes must have it
2. Make transitions required (not Option<TransitionsTheme>) — all themes must have it
3. Add palette: PaletteTheme to Theme struct
4. Add WindowShadow to WindowTheme: shadow: Option<WindowShadow> with color, blur, offset fields
5. Add #[serde(rename_all = "camelCase")] to ALL structs (for JSON serialization to frontend)
+ BUT TOML files use snake_case keys. Since rename_all applies to both serialize AND deserialize, we need a
 workaround:
+ Use #[serde(alias = "snake_case_name")] on each field, OR
+ Better: Keep snake_case in Rust, add a to_frontend_json() method using serde_json::Value manipulation, OR
+ Best: Use separate deserialize (snake_case for TOML) and serialize (camelCase for JSON) via:
```rust
#[serde(rename_all(deserialize = "snake_case", serialize = "camelCase"))] // this is the cleanest approach
```
1. Add load_theme_data Tauri command — returns Theme as JSON (the struct auto-serializes as camelCase)
2. Update to_css_vars() to include all new fields

> Serde Strategy
```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all(deserialize = "snake_case", serialize = "camelCase"))]
pub struct ChromeTheme { ... }
```

This way:
+ TOML deserialization reads menu_background (snake_case)
+ JSON serialization writes menuBackground (camelCase)

For TokenStyle: keep the custom deserializer (supports string or object), but serialization always writes full object. Frontend syntax fields are plain strings, so to_frontend_json() will extract just .color from each TokenStyle when building the response.

> New command
```rust
 #[tauri::command]
 pub async fn load_theme_data(theme_name: String) -> Result<serde_json::Value, String> {
     // Parse TOML, then manually build camelCase JSON matching TS Theme interface
 }
```

## Phase 2: Populate TOML theme files

Files: themes/milkytext.toml, themes/glass-dark.toml, themes/glass-light.toml

Copy exact values from TS hardcoded constants into TOML. Fix known discrepancies:

+ milkytext.toml: base = "dark" (not "light")
+ milkytext.toml: selection.background = "rgba(255, 255, 255, 0.15)" (not "#FFFFFF")
+ milkytext.toml: border.color = "rgba(255, 255, 255, 0.08)" (not "rgba(0, 0, 0, 0.1)")

Add all new sections: [palette], [chrome] expanded fields, [editor.line], [editor.gutter], [syntax] expanded, [ui] full fields.

For glass-light.toml: derive values from the dark theme with appropriate light-mode adjustments (or populate from any existing data).

## Phase 3: Frontend theme.ts refactor

File: src/lib/stores/theme.ts

1. Remove MILKYTEXT constant (lines 145-254)
2. Remove LIQUID_GLASS_DARK constant (lines 260-369)
3. Add async function loadThemeFromBackend(fileName: string): Promise<Theme>
+ Calls invoke('load_theme_data', { themeName: fileName })
+ Returns the Theme object directly (JSON is already camelCase)
1. Modify createThemeStore():
+ Initialize with current: null and loading: true
+ Add init() method that calls invoke('list_themes'), then loads default theme
+ Modify switchTheme() to call backend if theme not in local cache
1. Keep applyThemeToDocument() unchanged — it works perfectly
2. Keep all derived stores, type definitions — no changes needed
3. Update initialization block (lines 570-575) to call init() instead of synchronous apply

## Phase 4: Delete dead code

+ Delete src/lib/theme-engine.ts (69 lines)
+ Remove any imports if they exist (likely none since it's never used)

## Phase 5: Update SettingsPanel.svelte

File: src/lib/components/SettingsPanel.svelte

+ Theme selector should call invoke('list_themes') for available theme list (instead of hardcoded array)
+ Use themeStore.switchTheme(name) which now calls backend

## Phase 6: Null guards

Files: src/lib/editor-loader.ts, src/lib/components/Editor.svelte, src/lib/components/DiffView.svelte

+ Guard against $themeStore.current === null during initial async load
+ editor-loader.ts: createSyntaxHighlighting() should fallback if no theme yet

## Phase 7: Verify

1. cargo check from src-tauri/ — 0 errors
2. npm run build — 0 errors
3. cargo test from src-tauri/ — theme tests pass
4. npx vitest run — frontend tests pass
5. cargo tauri dev — app launches, themes load from TOML, switching works

> File Change Summary
┌─────────────────────────────────────────┬──────────────────────────────────────────────────┬──────────────┐
│                  File                   │                      Action                      │ LOC estimate │
├─────────────────────────────────────────┼──────────────────────────────────────────────────┼──────────────┤
│ src-tauri/src/theme_engine.rs           │ MODIFY — expand structs, add load_theme_data cmd │ +200         │
├─────────────────────────────────────────┼──────────────────────────────────────────────────┼──────────────┤
│ themes/milkytext.toml                   │ MODIFY — add all missing sections                │ +60          │
├─────────────────────────────────────────┼──────────────────────────────────────────────────┼──────────────┤
│ themes/glass-dark.toml                  │ MODIFY — add all missing sections                │ +60          │
├─────────────────────────────────────────┼──────────────────────────────────────────────────┼──────────────┤
│ themes/glass-light.toml                 │ MODIFY — add all missing sections                │ +60          │
├─────────────────────────────────────────┼──────────────────────────────────────────────────┼──────────────┤
│ src/lib/stores/theme.ts                 │ MODIFY — remove hardcoded, add async init        │ net -100     │
├─────────────────────────────────────────┼──────────────────────────────────────────────────┼──────────────┤
│ src/lib/theme-engine.ts                 │ DELETE                                           │ -69          │
├─────────────────────────────────────────┼──────────────────────────────────────────────────┼──────────────┤
│ src/lib/components/SettingsPanel.svelte │ MODIFY — dynamic theme list                      │ ~10          │
├─────────────────────────────────────────┼──────────────────────────────────────────────────┼──────────────┤
│ src/lib/editor-loader.ts                │ MODIFY — null guard                              │ ~5           │
├─────────────────────────────────────────┼──────────────────────────────────────────────────┼──────────────┤
│ src/lib/components/Editor.svelte        │ MODIFY — null guard                              │ ~5           │
├─────────────────────────────────────────┼──────────────────────────────────────────────────┼──────────────┤
│ src/lib/components/DiffView.svelte      │ MODIFY — null guard                              │ ~5           │
├─────────────────────────────────────────┼──────────────────────────────────────────────────┼──────────────┤
│ src-tauri/src/main.rs                   │ MODIFY — register load_theme_data cmd            │ +1           │
└─────────────────────────────────────────┴──────────────────────────────────────────────────┴──────────────┘
> Implementation Order

1. Phase 1 (Rust struct expansion + new command) → cargo check
2. Phase 2 (TOML files) → cargo test
3. Phase 3 + 4 (frontend refactor + delete dead code)
4. Phase 5 + 6 (SettingsPanel + null guards) → npm run build
5. Phase 7 (full verify)

---
