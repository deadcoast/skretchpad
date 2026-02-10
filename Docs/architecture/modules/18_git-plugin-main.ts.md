# Git Plugin - main.ts Architecture

> **Source File**: [`plugins/git/main.ts`](../../../plugins/git/main.ts)
> **Status**: 📋 Planned
> **Component Type**: Git Plugin Implementation
> **Lines of Code**: ~900 (estimated)

---

*This file was previously named `4_main.ts.md` but has been renamed to avoid confusion with the frontend entry point `src/main.ts`.*

---

## Overview

This document describes the planned Git plugin for Skretchpad - a complete Git client implementation in TypeScript that will provide Git integration directly in the editor.

## Planned Features

- Git status tracking (porcelain v2 format parsing)
- Diff parsing with hunk extraction
- Branch management (list, checkout, create, delete)
- Commit workflow (stage, unstage, commit, push, pull)
- Conflict detection and resolution UI
- File watching for .git directory changes
- Real-time status bar updates
- Multiple UI components (status panel, diff viewer, branch manager)
- Command execution with error handling
- State management for repository context

## Integration Points

- Plugin API (fs, commands, ui, events)
- Editor integration
- Status bar
- Sidebar panels
- Command palette
- File watcher
- Git CLI

## Estimated Implementation

**Lines of Code**: 600-900 lines (plus 300+ in Svelte components)

---

**Documentation Version**: 1.0.0
**Plugin Status**: Planned
