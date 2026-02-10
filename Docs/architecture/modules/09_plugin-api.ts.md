# plugin-api.ts

> Source target: `src/lib/plugin-api.ts`
> Last updated: v0.1.0 (2026-02-10)
> Status: Active (typed command wrapper)

## Current State

`src/lib/plugin-api.ts` is present and provides a typed frontend wrapper over the
currently implemented Rust plugin API commands.

Implemented command groups in this module:

- Filesystem: `plugin_read_file`, `plugin_write_file`, `plugin_list_directory`, `plugin_watch_path`, `plugin_unwatch_path`
- Network: `plugin_fetch`
- Command execution: `plugin_execute_command`
- UI: `plugin_show_notification`, `plugin_add_status_bar_item`, `plugin_remove_status_bar_item`, `plugin_show_panel`, `plugin_hide_panel`
- Editor: `plugin_get_editor_content`, `plugin_set_editor_content`, `plugin_get_active_file`
- Events/hooks: `plugin_register_event`, `plugin_emit_event`, `plugin_execute_hook`

## Guidance

- Treat this file as the typed frontend boundary for plugin command invocation.
- Keep this module in parity with:
  - `src-tauri/src/plugin_system/api.rs` (backend command handlers)
  - `src-tauri/src/main.rs` (`invoke_handler` registrations)
  - `src-tauri/js/plugin_api.js` (sandbox runtime bridge)

## Known Limits

- This module intentionally mirrors only the currently implemented backend command surface.
- Historical docs that describe additional extension APIs should be treated as planned unless corresponding backend handlers exist.

## References

- `Docs/architecture/modules/14_plugins.ts.md`
- `Docs/architecture/modules/05_api.rs.md`
