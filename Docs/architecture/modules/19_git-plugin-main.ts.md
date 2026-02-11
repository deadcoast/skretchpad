# git plugin main.js

> Source file: `plugins/git/main.js`
> Last updated: v0.1.0 (2026-02-10)
> Status: Implemented (minimal runtime plugin)

## Purpose

Current local git plugin entrypoint loaded by plugin runtime.

## Current Behavior

- Registers hook handlers through plugin runtime API.
- Integrates with available plugin bridge commands/events.
- Serves as minimal first-party plugin baseline, not a full TypeScript Git client implementation.
- Remains loadable for development/demo, but is not auto-activated by default in app startup.

## Notes

- This document supersedes older planning references to `plugins/git/main.ts`.

## References

- `Docs/architecture/modules/14_plugins.ts.md`
- `Docs/architecture/modules/05_api.rs.md`
