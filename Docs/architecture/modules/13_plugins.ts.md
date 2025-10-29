# plugins.ts Architecture

> **Source File**: [`src/lib/stores/plugins.ts`](../../../src/lib/stores/plugins.ts)
> **Status**: ✅ Implemented
> **Module Type**: Svelte Store - Plugin Registry & Management
> **Lines of Code**: 541

---

## Table of Contents

- [Overview](#overview)
- [Type System](#type-system)
- [Store API](#store-api)
- [Plugin Lifecycle](#plugin-lifecycle)
- [UI Extensions](#ui-extensions)
- [Event System](#event-system)
- [Derived Stores](#derived-stores)
- [Related Documentation](#related-documentation)

---

## Overview

`plugins.ts` provides the frontend plugin registry and management system. It maintains plugin state, handles lifecycle operations, and manages plugin-contributed UI elements (commands, panels, status bar items).

### Key Features

- **Plugin Lifecycle Management**: Load, activate, deactivate, reload plugins
- **UI Extension Registry**: Commands, panels, status bar items
- **State Tracking**: Real-time plugin state (loaded, active, error)
- **Event-Driven Updates**: Backend plugin events update frontend state
- **Capability Management**: Track plugin permissions and capabilities
- **Command Palette Integration**: Register/unregister plugin commands

---

## Type System

### PluginMetadata

```typescript
export interface PluginMetadata {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  trust: 'first-party' | 'verified' | 'unverified';
}
```

**Source**: Lines 11-18

Plugin identification and trust level.

### PluginCapabilities

```typescript
export interface PluginCapabilities {
  filesystem: string;
  network: any;
  commands: {
    allowlist: string[];
    require_confirmation: boolean;
  };
  ui: {
    status_bar: boolean;
    sidebar: boolean;
    notifications: boolean;
    webview: boolean;
  };
}
```

**Source**: Lines 20-33

Defines what APIs and UI surfaces a plugin can access.

### PluginLifecycleState

```typescript
export type PluginLifecycleState =
  | 'loaded'       // Manifest loaded, not yet activated
  | 'activating'   // In the process of activating
  | 'active'       // Fully activated and running
  | 'deactivating' // In the process of deactivating
  | 'error';       // Failed to load or activate
```

**Source**: Lines 35-40

### PluginStatus

```typescript
export interface PluginStatus {
  id: string;
  name: string;
  version: string;
  state: PluginLifecycleState;
  capabilities: PluginCapabilities;
  error?: string;
}
```

**Source**: Lines 42-49

Complete plugin status information.

### PluginCommand

```typescript
export interface PluginCommand {
  id: string;
  plugin_id: string;
  label: string;
  keybinding?: string;
  category?: string;
}
```

**Source**: Lines 51-57

Command registered by a plugin for command palette.

### PluginPanel

```typescript
export interface PluginPanel {
  id: string;
  plugin_id: string;
  title: string;
  position: 'sidebar' | 'bottom' | 'modal';
  visible: boolean;
}
```

**Source**: Lines 59-65

Panel (sidebar/bottom/modal) contributed by plugin.

### PluginStatusBarItem

```typescript
export interface PluginStatusBarItem {
  id: string;
  plugin_id: string;
  text: string;
  tooltip?: string;
  priority: number;
  color?: string;
}
```

**Source**: Lines 67-74

Status bar item displayed in StatusBar.svelte.

### PluginsStoreState

```typescript
export interface PluginsStoreState {
  plugins: Map<string, PluginStatus>;
  commands: Map<string, PluginCommand>;
  panels: Map<string, PluginPanel>;
  statusBarItems: Map<string, PluginStatusBarItem>;
  loading: boolean;
  error: string | null;
}
```

**Source**: Lines 76-83

Main store state structure using Maps for efficient lookup.

---

## Store API

### Initialization

| Method | Signature | Description |
|--------|-----------|-------------|
| `initialize()` | `() => Promise<void>` | Initialize plugin system (discover, load statuses, setup events) |
| `discover()` | `() => Promise<string[]>` | Discover available plugins |
| `setupEventListeners()` | `() => Promise<void>` | Set up Tauri event listeners |

#### initialize()

```typescript
await pluginsStore.initialize();
```

**Flow**:
1. Set loading state
2. Discover all plugins via `discover_plugins` command
3. Refresh all plugin statuses
4. Set up event listeners
5. Clear loading state

**Source**: Lines 108-130

### Lifecycle Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `load(pluginId)` | `(pluginId: string) => Promise<void>` | Load plugin manifest |
| `activate(pluginId)` | `(pluginId: string) => Promise<void>` | Activate loaded plugin |
| `deactivate(pluginId)` | `(pluginId: string) => Promise<void>` | Deactivate active plugin |
| `reload(pluginId)` | `(pluginId: string) => Promise<void>` | Reload plugin (deactivate → load → activate) |

#### load()

```typescript
await pluginsStore.load('git-plugin');
```

**Process**:
1. Call `invoke('load_plugin', { pluginId })`
2. Refresh plugin status
3. Update store

**Source**: Lines 148-156

#### activate()

```typescript
await pluginsStore.activate('git-plugin');
```

**Process**:
1. Call `invoke('activate_plugin', { pluginId })`
2. Execute plugin entry point in sandbox
3. Refresh plugin status → state becomes 'active'

**Source**: Lines 161-169

#### deactivate()

```typescript
await pluginsStore.deactivate('git-plugin');
```

**Process**:
1. Call `invoke('deactivate_plugin', { pluginId })`
2. Cleanup plugin resources
3. Remove sandbox
4. Refresh plugin status → state becomes 'loaded'

**Source**: Lines 174-182

#### reload()

```typescript
await pluginsStore.reload('git-plugin');
```

Full reload cycle: deactivate → load manifest → activate.

**Source**: Lines 187-195

### Status Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `refreshStatus(pluginId)` | `(pluginId: string) => Promise<void>` | Refresh single plugin status |
| `refreshStatuses()` | `() => Promise<void>` | Refresh all plugin statuses |

**Source**: Lines 200-232

---

## UI Extensions

### Commands

| Method | Description | Source |
|--------|-------------|--------|
| `registerCommand(command)` | Add command to command palette | Lines 237-242 |
| `unregisterCommand(commandId)` | Remove command | Lines 247-252 |
| `getCommands(pluginId?)` | Get all commands or filter by plugin | Lines 364-373 |

**Usage**:

```typescript
pluginsStore.registerCommand({
  id: 'git.commit',
  plugin_id: 'git-plugin',
  label: 'Git: Commit',
  keybinding: 'Ctrl+K',
  category: 'Git',
});
```

### Panels

| Method | Description | Source |
|--------|-------------|--------|
| `registerPanel(panel)` | Add panel to UI | Lines 257-262 |
| `unregisterPanel(panelId)` | Remove panel | Lines 267-272 |
| `showPanel(panelId)` | Show hidden panel | Lines 277-286 |
| `hidePanel(panelId)` | Hide visible panel | Lines 291-300 |
| `getPanels(pluginId?)` | Get all panels or filter by plugin | Lines 378-387 |

**Positions**:
- `'sidebar'` - Left/right sidebar
- `'bottom'` - Bottom panel
- `'modal'` - Modal overlay

### Status Bar Items

| Method | Description | Source |
|--------|-------------|--------|
| `registerStatusBarItem(item)` | Add status bar item | Lines 305-310 |
| `unregisterStatusBarItem(itemId)` | Remove status bar item | Lines 315-320 |
| `updateStatusBarItem(itemId, updates)` | Update existing item | Lines 325-333 |
| `getStatusBarItems(pluginId?)` | Get items sorted by priority | Lines 392-401 |

**Priority System**:
- Higher priority → further left in status bar
- Same priority → insertion order

**Usage**:

```typescript
pluginsStore.registerStatusBarItem({
  id: 'git.branch',
  plugin_id: 'git-plugin',
  text: '  main',
  tooltip: 'Current branch',
  priority: 100,
  color: '#50fa7b',
});
```

**Source**: Lines 305-333

---

## Event System

### Event Listeners Setup

The store listens for backend plugin events:

```typescript
async setupEventListeners(): Promise<void>
```

**Events**:

| Event | Payload | Handler |
|-------|---------|---------|
| `plugin:status_bar:add` | `PluginStatusBarItem` | Register status bar item |
| `plugin:status_bar:remove` | `{ plugin_id, id }` | Unregister status bar item |
| `plugin:panel:show` | `PluginPanel` | Register and show panel |
| `plugin:panel:hide` | `{ plugin_id, id }` | Hide panel |
| `plugin:notification` | `{ plugin_id, title, message, level }` | Log notification |

**Source**: Lines 406-452

### Event Flow Example

```plaintext
Backend Plugin                    Tauri Event Bus                  Frontend Store
     │                                   │                                │
     ├─ addStatusBarItem()               │                                │
     │       │                           │                                │
     │       └──> emit('plugin:status_bar:add', item)                     │
     │                                   │                                │
     │                                   ├──> listen handler              │
     │                                   │         │                      │
     │                                   │         └──> registerStatusBarItem()
     │                                   │                                │
     │                                   │                           Store Updated
     │                                   │                                │
     │                                   │                     StatusBar.svelte renders
```

---

## Derived Stores

### pluginsList

```typescript
export const pluginsList = derived(pluginsStore, ($plugins) =>
  Array.from($plugins.plugins.values())
);
```

**Source**: Lines 491-493

Returns all plugins as array.

### activePluginCount

```typescript
export const activePluginCount = derived(pluginsStore, ($plugins) =>
  Array.from($plugins.plugins.values()).filter((p) => p.state === 'active').length
);
```

**Source**: Lines 498-500

Count of active plugins.

### hasPluginErrors

```typescript
export const hasPluginErrors = derived(pluginsStore, ($plugins) =>
  Array.from($plugins.plugins.values()).some((p) => p.state === 'error')
);
```

**Source**: Lines 505-507

Returns `true` if any plugin has error state.

### commandsByCategory

```typescript
export const commandsByCategory = derived(pluginsStore, ($plugins) => {
  const commands = Array.from($plugins.commands.values());
  const grouped = new Map<string, PluginCommand[]>();
  // Group by category...
  return grouped;
});
```

**Source**: Lines 512-525

Groups commands by category for command palette.

### visiblePanels

```typescript
export const visiblePanels = derived(pluginsStore, ($plugins) =>
  Array.from($plugins.panels.values()).filter((panel) => panel.visible)
);
```

**Source**: Lines 530-534

Only panels with `visible: true`.

### sortedStatusBarItems

```typescript
export const sortedStatusBarItems = derived(pluginsStore, ($plugins) =>
  Array.from($plugins.statusBarItems.values()).sort((a, b) => b.priority - a.priority)
);
```

**Source**: Lines 539-541

Status bar items sorted by priority (high to low).

**Used by**: [`StatusBar.svelte`](./StatusBar.svelte.md)

---

## Usage Examples

### Initialize on App Startup

```typescript
import { pluginsStore } from '$lib/stores/plugins';
import { onMount } from 'svelte';

onMount(async () => {
  await pluginsStore.initialize();
});
```

### Display Plugin List

```typescript
import { pluginsList } from '$lib/stores/plugins';

{#each $pluginsList as plugin}
  <div class="plugin-item">
    <h3>{plugin.name}</h3>
    <p>{plugin.version}</p>
    <span class={`state-${plugin.state}`}>{plugin.state}</span>
  </div>
{/each}
```

### Activate/Deactivate Plugin

```typescript
async function handleToggle(plugin: PluginStatus) {
  if (plugin.state === 'active') {
    await pluginsStore.deactivate(plugin.id);
  } else if (plugin.state === 'loaded') {
    await pluginsStore.activate(plugin.id);
  }
}
```

### Display Status Bar Items

```typescript
import { sortedStatusBarItems } from '$lib/stores/plugins';

{#each $sortedStatusBarItems as item}
  <div class="status-item" style="color: {item.color}" title={item.tooltip}>
    {item.text}
  </div>
{/each}
```

**Actual implementation**: [`StatusBar.svelte`](./StatusBar.svelte.md)

---

## Related Documentation

### Components Using This Store

- **[StatusBar.svelte](./StatusBar.svelte.md)** - Displays status bar items and plugin menu
- **[App.svelte](./0_App.svelte.md)** - Initializes plugin system on mount

### Backend Integration

- **[main.rs](./11_main.rs.md)** - Plugin management commands (7 commands)
- **[manager.rs](./10_manager.rs.md)** - Plugin lifecycle management
- **[api.rs](./3_api.rs.md)** - Plugin API commands (18 commands)

### Related Frontend Files

- **[plugin-api.ts](./8_plugin-api.ts.md)** - Plugin API types
- **[editor.ts](./12_editor.ts.md)** - Emits events plugins can listen to

### Project Documentation

- **[STATUS.md](../../STATUS.md)** - Development progress
- **[Technical Details](../3_technical-details.md)** - Plugin system architecture

---

## Implementation Notes

### Map vs Array Storage

The store uses `Map<string, T>` instead of arrays:

**Benefits**:
- O(1) lookup by ID
- Efficient updates (no array scan)
- No duplicate IDs possible

**Trade-off**:
- Derived stores convert to arrays for iteration
- Slightly more memory overhead

### Event Listener Cleanup

```typescript
const eventListeners: UnlistenFn[] = [];

// Store unlisteners
eventListeners.push(await listen('event', handler));

// Cleanup on unmount
cleanup() {
  eventListeners.forEach((unlisten) => unlisten());
}
```

Prevents memory leaks by cleaning up Tauri event listeners.

**Source**: Lines 100, 464-467

### Plugin State Transitions

```plaintext
[Discovered]
      │
      ▼
   [Loaded] ◄──────────┐
      │                │
      ├─ activate()    │
      ▼                │
 [Activating]          │
      │                │
      ▼                │
   [Active]            │
      │                │
      ├─ deactivate()  │
      ▼                │
 [Deactivating]        │
      │                │
      └────────────────┘

[Any State] ──error──> [Error]
```

### Priority-Based Sorting

Status bar items use priority for positioning:

```typescript
sort((a, b) => b.priority - a.priority)  // High to low
```

- Priority 100+ → Left side
- Priority < 100 → Right side (convention from StatusBar.svelte)

---

## Performance Considerations

### Store Updates

Every UI extension operation triggers store update:

```typescript
update((state) => {
  state.statusBarItems.set(item.id, item);
  return { ...state };  // New reference triggers reactivity
});
```

Svelte's reactivity requires new object reference.

### Derived Store Recalculation

Derived stores recalculate on every base store update. For large plugin counts, consider memoization.

---

**Documentation Version**: 2.0.0
**Module Version**: 0.1.0
**Accuracy**: Verified against source code 2025-10-28
