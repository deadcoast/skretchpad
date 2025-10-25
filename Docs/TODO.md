# TODO

<!-- ALL DATA IN THIS FILE ARE BASED ON SKELETON CODE / MINIMUM SOURCE CODE INTEGRATION. THE CHECKLIST IS TO KEEP TRACK OF FOUNDATIONAL FILE DEVELOPMENT STAGES -->

---

```ts
// 7. debounce.ts - Utility for debouncing function calls
//    Path: src/lib/utils/debounce.ts
//    Purpose: Debounce editor changes, search input, etc.

// 8. editor.ts - Editor State Management
//    Path: src/lib/stores/editor.ts
//    Purpose: Manage open files, tabs, editor state
//    Different from: editor-loader.ts (CodeMirror setup)

// 9. plugins.ts - Frontend Plugin Registry
//    Path: src/lib/stores/plugins.ts
//    Purpose: Track loaded plugins, manage plugin state on frontend

// 10. ui.ts - UI Utilities & Helpers
//     Path: src/lib/utils/ui.ts
//     Purpose: UI helper functions, animations, DOM utilities
```

```svelte
// 4. UI integration - Integration Work
//    Modifications to: StatusBar.svelte, Sidebar.svelte, etc.
//    Purpose: Connect UI components to plugin system events
```

---

## COMPLETED

✅ sandbox.rs              [████████████████████████████████] 100%
✅ capabilities.rs         [████████████████████████████████] 100%
✅ api.rs                  [████████████████████████████████] 100%
✅ plugin-api.ts           [████████████████████████████████] 100%
✅ git/main.ts             [████████████████████████████████] 100%
✅ editor-loader.ts        [████████████████████████████████] 100%
✅ Editor.svelte           [████████████████████████████████] 100%
✅ theme.ts                [████████████████████████████████] 100%
✅ keybindings.ts          [████████████████████████████████] 100%
✅ keybindings.toml        [████████████████████████████████] 100%

## INCOMPLETE

1. UI Integration
    1. ⬜ UI integration       [                                ]   0%  (Svelte Components)
    2. StatusBar.svelte modifications
    3. Sidebar.svelte modifications
    4. CommandPalette.svelte (if exists)

## ERRORS

### debounce.ts

> debounce.ts is not getting syntax highlighting

This usually happens because of a specific **file association rule** in your IDE's settings.

Cursor (which is built on VS Code) might have been accidentally told to treat any file specifically named `debounce.ts` as plain text instead of TypeScript.

---

### Common Cause: File Association Override

You or an extension may have accidentally set a rule that associates the exact filename `debounce.ts` with a different file type. This setting overrides the general rule that treats all `.ts` files as TypeScript.

This rule is stored in your `settings.json` file and would look something like this:

```json
"files.associations": {
    "debounce.ts": "plaintext"
}
```

The rule targets the *exact filename*, any other file like `my-debounce.ts` or `utils.ts` will be unaffected and get correct syntax highlighting.

---

### How to Fix It

You can fix this in a couple of ways.

### 1. Change the Language Mode Manually

1. Open the `debounce.ts` file.
2. Look at the bottom-right corner of the Cursor IDE window. You'll likely see "Plain Text".
3. Click on "Plain Text". A menu will open at the top.
4. Type `TypeScript` and select it from the list. This should immediately apply syntax highlighting for the current session. It may ask if you want to configure the file association permanently.

### 2. Edit Your `settings.json` File

This is the permanent fix.

1. Open the Command Palette:
      * macOS: `Cmd + Shift + P`
      * Windows/Linux: `Ctrl + Shift + P`
2. Type `Preferences: Open User Settings (JSON)` and press Enter.
3. Look for a `"files.associations"` section.
4. Find the line `"debounce.ts": "plaintext"` and delete that entire line.
5. Save the `settings.json` file.

After saving, close and reopen the `debounce.ts` file. The syntax highlighting should now work correctly.
