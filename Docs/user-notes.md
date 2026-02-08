# USER NOTES

## REVISIONS

### LIMITATIONS

- Editor ops (sync return): `getEditorContent` and `getActiveFile` fire events but can't return data synchronously
- Async plugin hooks: Plugin hooks must be synchronous; async/await requires event loop pumping
- ~29 frontend plugin-api.ts invoke calls have no backend handler (legacy bridge, superseded by deno_core ops)

### ICONOGRAPHY

- ICONOGRAPHY, EMOJIS NEED COMPLETE OVERHAUL
  - Introduce an 'icon library' that can be swaped out, and themed.
  - ALL emojis need to be replaced with custom icons, that match the design language of the app.
  - ALL icons need to be optimized for color and shape, to match the design language of the app.

- When the pin or eye button is clicked on the top menu, it dissapears, and does not return to the 'off' state until the app is reloaded.
  - The pin and eye buttons need to be 'toggled', and return to their original state when clicked again.(aswell as replaced with the correct new icons)

### MODULES

`src-tauri\src\theme_engine.rs`
`src-tauri\src\window_manager.rs`
`src-tauri\src\language_loader.rs`
`src-tauri\src\plugin_system\`

> The above files provide the following error.
```
This file is not included anywhere in the module tree, so rust-analyzer can't offer IDE services.

If you're intentionally working on unowned files, you can silence this warning by adding "unlinked-file" to rust-analyzer.diagnostics.disabled in your settings.
```

### ./languages/

- What is this directory? Why are these language files just floating? The rust file is completely blank. Is this a legacy system? Or does this system compliment the codemirror one?

`./languages/python.lang.json`
`./languages/rust.lang.json`
`./languages/markdown.lang.json`

## APP STYLE AND DESIGN

### MAIN DESIGN AESTHETIC

- MINIMAL RETRO FUTURISM
  - The design should evoke a sense of nostalgia for the user, while also being modern and sleek.
  - The design should be minimal, and not distract the user from the content they are working on.
  - The design should be clean, and easy to read
  - Inspired by: Retro analog sci-fi, retro computing, and modern minimalism

## CURRENT LINTING ERRORS AND WARNINGS

- [SEE THE LINTING ERROR LOG](linting-errors.json)
