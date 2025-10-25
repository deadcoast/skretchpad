# 2. plugins.ts - Frontend Plugin Registry

```typescript
// src/lib/stores/plugins.ts

import { writable, derived, get } from 'svelte/store';
import { invoke } from '@tauri-apps/api/tauri';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface PluginMetadata {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  trust: 'first-party' | 'verified' | 'unverified';
}

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

export type PluginState =
  | 'loaded'
  | 'activating'
  | 'active'
  | 'deactivating'
  | 'error';

export interface PluginStatus {
  id: string;
  name: string;
  version: string;
  state: PluginState;
  capabilities: PluginCapabilities;
  error?: string;
}

export interface PluginCommand {
  id: string;
  plugin_id: string;
  label: string;
  keybinding?: string;
  category?: string;
}

export interface PluginPanel {
  id: string;
  plugin_id: string;
  title: string;
  position: 'sidebar' | 'bottom' | 'modal';
  visible: boolean;
}

export interface PluginStatusBarItem {
  id: string;
  plugin_id: string;
  text: string;
  tooltip?: string;
  priority: number;
  color?: string;
}

export interface PluginState {
  plugins: Map<string, PluginStatus>;
  commands: Map<string, PluginCommand>;
  panels: Map<string, PluginPanel>;
  statusBarItems: Map<string, PluginStatusBarItem>;
  loading: boolean;
  error: string | null;
}

// ============================================================================
// PLUGINS STORE
// ============================================================================

function createPluginsStore() {
  const { subscribe, set, update } = writable<PluginState>({
    plugins: new Map(),
    commands: new Map(),
    panels: new Map(),
    statusBarItems: new Map(),
    loading: false,
    error: null,
  });

  // Event listeners cleanup
  const eventListeners: UnlistenFn[] = [];

  return {
    subscribe,

    /
     * Initialize plugin system
     */
    async initialize(): Promise<void> {
      update((state) => ({ ...state, loading: true, error: null }));

      try {
        // Discover plugins
        await pluginsStore.discover();

        // Get all plugin statuses
        await pluginsStore.refreshStatuses();

        // Set up event listeners
        await pluginsStore.setupEventListeners();

        update((state) => ({ ...state, loading: false }));
      } catch (error) {
        console.error('Failed to initialize plugin system:', error);
        update((state) => ({
          ...state,
          loading: false,
          error: `Failed to initialize: ${error}`,
        }));
      }
    },

    /
     * Discover available plugins
     */
    async discover(): Promise<string[]> {
      try {
        const pluginIds = await invoke<string[]>('discover_plugins');
        return pluginIds;
      } catch (error) {
        console.error('Failed to discover plugins:', error);
        throw error;
      }
    },

    /
     * Load a plugin
     */
    async load(pluginId: string): Promise<void> {
      try {
        await invoke('load_plugin', { pluginId });
        await pluginsStore.refreshStatus(pluginId);
      } catch (error) {
        console.error(`Failed to load plugin ${pluginId}:`, error);
        throw error;
      }
    },

    /
     * Activate a plugin
     */
    async activate(pluginId: string): Promise<void> {
      try {
        await invoke('activate_plugin', { pluginId });
        await pluginsStore.refreshStatus(pluginId);
      } catch (error) {
        console.error(`Failed to activate plugin ${pluginId}:`, error);
        throw error;
      }
    },

    /
     * Deactivate a plugin
     */
    async deactivate(pluginId: string): Promise<void> {
      try {
        await invoke('deactivate_plugin', { pluginId });
        await pluginsStore.refreshStatus(pluginId);
      } catch (error) {
        console.error(`Failed to deactivate plugin ${pluginId}:`, error);
        throw error;
      }
    },

    /
     * Reload a plugin
     */
    async reload(pluginId: string): Promise<void> {
      try {
        await invoke('reload_plugin', { pluginId });
        await pluginsStore.refreshStatus(pluginId);
      } catch (error) {
        console.error(`Failed to reload plugin ${pluginId}:`, error);
        throw error;
      }
    },

    /
     * Get plugin status
     */
    async refreshStatus(pluginId: string): Promise<void> {
      try {
        const status = await invoke<PluginStatus>('get_plugin_status', {
          pluginId,
        });

        update((state) => {
          state.plugins.set(pluginId, status);
          return { ...state };
        });
      } catch (error) {
        console.error(`Failed to get status for plugin ${pluginId}:`, error);
      }
    },

    /
     * Get all plugin statuses
     */
    async refreshStatuses(): Promise<void> {
      try {
        const statuses = await invoke<PluginStatus[]>('get_all_plugin_statuses');

        update((state) => {
          const plugins = new Map<string, PluginStatus>();
          for (const status of statuses) {
            plugins.set(status.id, status);
          }
          return { ...state, plugins };
        });
      } catch (error) {
        console.error('Failed to get plugin statuses:', error);
      }
    },

    /
     * Register plugin command
     */
    registerCommand(command: PluginCommand): void {
      update((state) => {
        state.commands.set(command.id, command);
        return { ...state };
      });
    },

    /
     * Unregister plugin command
     */
    unregisterCommand(commandId: string): void {
      update((state) => {
        state.commands.delete(commandId);
        return { ...state };
      });
    },

    /
     * Register plugin panel
     */
    registerPanel(panel: PluginPanel): void {
      update((state) => {
        state.panels.set(panel.id, panel);
        return { ...state };
      });
    },

    /
     * Unregister plugin panel
     */
    unregisterPanel(panelId: string): void {
      update((state) => {
        state.panels.delete(panelId);
        return { ...state };
      });
    },

    /
     * Show plugin panel
     */
    showPanel(panelId: string): void {
      update((state) => {
        const panel = state.panels.get(panelId);
        if (panel) {
          panel.visible = true;
          state.panels.set(panelId, panel);
        }
        return { ...state };
      });
    },

    /
     * Hide plugin panel
     */
    hidePanel(panelId: string): void {
      update((state) => {
        const panel = state.panels.get(panelId);
        if (panel) {
          panel.visible = false;
          state.panels.set(panelId, panel);
        }
        return { ...state };
      });
    },

    /
     * Register status bar item
     */
    registerStatusBarItem(item: PluginStatusBarItem): void {
      update((state) => {
        state.statusBarItems.set(item.id, item);
        return { ...state };
      });
    },

    /
     * Unregister status bar item
     */
    unregisterStatusBarItem(itemId: string): void {
      update((state) => {
        state.statusBarItems.delete(itemId);
        return { ...state };
      });
    },

    /
     * Update status bar item
     */
    updateStatusBarItem(itemId: string, updates: Partial<PluginStatusBarItem>): void {
      update((state) => {
        const item = state.statusBarItems.get(itemId);
        if (item) {
          state.statusBarItems.set(itemId, { ...item, ...updates });
        }
        return { ...state };
      });
    },

    /
     * Get plugin by ID
     */
    getPlugin(pluginId: string): PluginStatus | undefined {
      const state = get({ subscribe });
      return state.plugins.get(pluginId);
    },

    /
     * Get all plugins
     */
    getAllPlugins(): PluginStatus[] {
      const state = get({ subscribe });
      return Array.from(state.plugins.values());
    },

    /
     * Get active plugins
     */
    getActivePlugins(): PluginStatus[] {
      const state = get({ subscribe });
      return Array.from(state.plugins.values()).filter(
        (plugin) => plugin.state === 'active'
      );
    },

    /
     * Get plugin commands
     */
    getCommands(pluginId?: string): PluginCommand[] {
      const state = get({ subscribe });
      const commands = Array.from(state.commands.values());
      
      if (pluginId) {
        return commands.filter((cmd) => cmd.plugin_id === pluginId);
      }
      
      return commands;
    },

    /
     * Get plugin panels
     */
    getPanels(pluginId?: string): PluginPanel[] {
      const state = get({ subscribe });
      const panels = Array.from(state.panels.values());
      
      if (pluginId) {
        return panels.filter((panel) => panel.plugin_id === pluginId);
      }
      
      return panels;
    },

    /
     * Get status bar items
     */
    getStatusBarItems(pluginId?: string): PluginStatusBarItem[] {
      const state = get({ subscribe });
      const items = Array.from(state.statusBarItems.values());
      
      if (pluginId) {
        return items.filter((item) => item.plugin_id === pluginId);
      }
      
      return items.sort((a, b) => b.priority - a.priority);
    },

    /
     * Set up event listeners for plugin events
     */
    async setupEventListeners(): Promise<void> {
      // Listen for status bar item events
      const statusBarAddUnlisten = await listen<PluginStatusBarItem>(
        'plugin:status_bar:add',
        (event) => {
          pluginsStore.registerStatusBarItem(event.payload);
        }
      );
      eventListeners.push(statusBarAddUnlisten);

      const statusBarRemoveUnlisten = await listen<{ plugin_id: string; id: string }>(
        'plugin:status_bar:remove',
        (event) => {
          pluginsStore.unregisterStatusBarItem(event.payload.id);
        }
      );
      eventListeners.push(statusBarRemoveUnlisten);

      // Listen for panel events
      const panelShowUnlisten = await listen<PluginPanel>(
        'plugin:panel:show',
        (event) => {
          pluginsStore.registerPanel({ ...event.payload, visible: true });
        }
      );
      eventListeners.push(panelShowUnlisten);

      const panelHideUnlisten = await listen<{ plugin_id: string; id: string }>(
        'plugin:panel:hide',
        (event) => {
          pluginsStore.hidePanel(event.payload.id);
        }
      );
      eventListeners.push(panelHideUnlisten);

      // Listen for notification events
      const notificationUnlisten = await listen<{
        plugin_id: string;
        title: string;
        message: string;
        level: string;
      }>('plugin:notification', (event) => {
        // This would integrate with a notification system
        console.log('Plugin notification:', event.payload);
      });
      eventListeners.push(notificationUnlisten);
    },

    /
     * Clear error
     */
    clearError(): void {
      update((state) => ({ ...state, error: null }));
    },

    /
     * Cleanup
     */
    cleanup(): void {
      // Clean up event listeners
      eventListeners.forEach((unlisten) => unlisten());
      eventListeners.length = 0;

      // Reset state
      set({
        plugins: new Map(),
        commands: new Map(),
        panels: new Map(),
        statusBarItems: new Map(),
        loading: false,
        error: null,
      });
    },
  };
}

export const pluginsStore = createPluginsStore();

// ============================================================================
// DERIVED STORES
// ============================================================================

/
 * All plugins as array
 */
export const pluginsList = derived(pluginsStore, ($plugins) =>
  Array.from($plugins.plugins.values())
);

/
 * Active plugins count
 */
export const activePluginCount = derived(pluginsStore, ($plugins) =>
  Array.from($plugins.plugins.values()).filter((p) => p.state === 'active').length
);

/
 * Has any plugin errors
 */
export const hasPluginErrors = derived(pluginsStore, ($plugins) =>
  Array.from($plugins.plugins.values()).some((p) => p.state === 'error')
);

/**
 * Plugin commands by category
 */
export const commandsByCategory = derived(pluginsStore, ($plugins) => {
  const commands = Array.from($plugins.commands.values());
  const grouped = new Map<string, PluginCommand[]>();

  for (const command of commands) {
    const category = command.category || 'Other';
    if (!grouped.has(category)) {
      grouped.set(category, []);
    }
    grouped.get(category)!.push(command);
  }

  return grouped;
});

/
 * Visible panels
 */
export const visiblePanels = derived(pluginsStore, ($plugins) =>
  Array.from($plugins.panels.values()).filter((p) => p.visible)
);

/
 * Status bar items sorted by priority
 */
export const sortedStatusBarItems = derived(pluginsStore, ($plugins) =>
  Array.from($plugins.statusBarItems.values()).sort((a, b) => b.priority - a.priority)
);
```
