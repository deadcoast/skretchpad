// src/lib/stores/plugins.ts

import { writable, derived, get } from 'svelte/store';
import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import DOMPurify from 'dompurify';

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

export type PluginLifecycleState = 'loaded' | 'activating' | 'active' | 'deactivating' | 'error';

export type TrustLevel = 'first-party' | 'verified' | 'community' | 'local';

export interface PluginStatus {
  id: string;
  name: string;
  version: string;
  state: PluginLifecycleState;
  capabilities: PluginCapabilities;
  error?: string;
  trust: TrustLevel;
  loaded_at?: number;
  auto_approve: boolean;
  capability_tier: string;
  commands?: PluginCommand[];
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
  content?: string; // Sanitized HTML content from plugin
}

export interface PluginStatusBarItem {
  id: string;
  plugin_id: string;
  text: string;
  tooltip?: string;
  priority: number;
  color?: string;
}

export interface PluginsStoreState {
  plugins: Map<string, PluginStatus>;
  commands: Map<string, PluginCommand>;
  panels: Map<string, PluginPanel>;
  statusBarItems: Map<string, PluginStatusBarItem>;
  pendingPermission: PluginStatus | null;
  loading: boolean;
  error: string | null;
}

export interface TrustedKeysState {
  keys: string[];
}

// ============================================================================
// PLUGINS STORE
// ============================================================================

function createPluginsStore() {
  const { subscribe, set, update } = writable<PluginsStoreState>({
    plugins: new Map(),
    commands: new Map(),
    panels: new Map(),
    statusBarItems: new Map(),
    pendingPermission: null,
    loading: false,
    error: null,
  });

  // Resolve/reject for pending permission approval
  let permissionResolve: ((approved: boolean) => void) | null = null;

  // Event listeners cleanup
  const eventListeners: UnlistenFn[] = [];

  return {
    subscribe,

    /**
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

    /**
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

    /**
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

    /**
     * Activate a plugin (prompts for permission if needed)
     */
    async activate(pluginId: string): Promise<void> {
      try {
        // Get plugin status to check capabilities
        const state = get({ subscribe });
        const plugin = state.plugins.get(pluginId);

        // If plugin has non-trivial capabilities, request permission
        if (plugin && needsPermissionApproval(plugin)) {
          const approved = await requestPermission(plugin);
          if (!approved) {
            console.log(`Permission denied for plugin ${pluginId}`);
            return;
          }
        }

        await invoke('activate_plugin', { pluginId });
        await pluginsStore.refreshStatus(pluginId);
      } catch (error) {
        console.error(`Failed to activate plugin ${pluginId}:`, error);
        throw error;
      }
    },

    /**
     * Approve pending permission request
     */
    approvePermission(): void {
      update((s) => ({ ...s, pendingPermission: null }));
      if (permissionResolve) {
        permissionResolve(true);
        permissionResolve = null;
      }
    },

    /**
     * Deny pending permission request
     */
    denyPermission(): void {
      update((s) => ({ ...s, pendingPermission: null }));
      if (permissionResolve) {
        permissionResolve(false);
        permissionResolve = null;
      }
    },

    /**
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

    /**
     * Unload a plugin (removes from loaded plugins)
     */
    async unload(pluginId: string): Promise<void> {
      try {
        await invoke('unload_plugin', { pluginId });
        update((state) => {
          state.plugins.delete(pluginId);
          for (const [commandId, command] of state.commands.entries()) {
            if (command.plugin_id === pluginId) {
              state.commands.delete(commandId);
            }
          }
          return { ...state };
        });
      } catch (error) {
        console.error(`Failed to unload plugin ${pluginId}:`, error);
        throw error;
      }
    },

    /**
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

    /**
     * Get plugin status
     */
    async refreshStatus(pluginId: string): Promise<void> {
      try {
        const status = await invoke<PluginStatus>('get_plugin_status', {
          pluginId,
        });

        update((state) => {
          state.plugins.set(pluginId, status);
          // Reconcile command registry for this plugin from backend status payload.
          for (const [commandId, command] of state.commands.entries()) {
            if (command.plugin_id === pluginId) {
              state.commands.delete(commandId);
            }
          }
          for (const command of status.commands || []) {
            state.commands.set(command.id, {
              ...command,
              plugin_id: command.plugin_id || pluginId,
            });
          }
          return { ...state };
        });
      } catch (error) {
        console.error(`Failed to get status for plugin ${pluginId}:`, error);
      }
    },

    /**
     * Get all plugin statuses
     */
    async refreshStatuses(): Promise<void> {
      try {
        const statuses = await invoke<PluginStatus[]>('get_all_plugin_statuses');

        update((state) => {
          const plugins = new Map<string, PluginStatus>();
          const commands = new Map<string, PluginCommand>();
          for (const status of statuses) {
            plugins.set(status.id, status);
            for (const command of status.commands || []) {
              commands.set(command.id, {
                ...command,
                plugin_id: command.plugin_id || status.id,
              });
            }
          }
          return { ...state, plugins, commands };
        });
      } catch (error) {
        console.error('Failed to get plugin statuses:', error);
      }
    },

    /**
     * Register plugin command
     */
    registerCommand(command: PluginCommand): void {
      update((state) => {
        state.commands.set(command.id, command);
        return { ...state };
      });
    },

    /**
     * Get persisted trusted signer keys.
     */
    async listTrustedKeys(): Promise<string[]> {
      return invoke<string[]>('list_trusted_keys');
    },

    /**
     * Add a trusted signer key and persist it.
     */
    async addTrustedKey(key: string): Promise<void> {
      await invoke('add_trusted_key', { key });
    },

    /**
     * Remove a trusted signer key and persist the updated set.
     */
    async removeTrustedKey(key: string): Promise<boolean> {
      return invoke<boolean>('remove_trusted_key', { key });
    },

    /**
     * Atomically replace all trusted signer keys.
     */
    async setTrustedKeys(keys: string[]): Promise<void> {
      await invoke('set_trusted_keys', { keys });
    },

    /**
     * Unregister plugin command
     */
    unregisterCommand(commandId: string): void {
      update((state) => {
        state.commands.delete(commandId);
        return { ...state };
      });
    },

    /**
     * Register plugin panel
     */
    registerPanel(panel: PluginPanel): void {
      update((state) => {
        state.panels.set(panel.id, panel);
        return { ...state };
      });
    },

    /**
     * Unregister plugin panel
     */
    unregisterPanel(panelId: string): void {
      update((state) => {
        state.panels.delete(panelId);
        return { ...state };
      });
    },

    /**
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

    /**
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

    /**
     * Register status bar item
     */
    registerStatusBarItem(item: PluginStatusBarItem): void {
      update((state) => {
        state.statusBarItems.set(item.id, item);
        return { ...state };
      });
    },

    /**
     * Unregister status bar item
     */
    unregisterStatusBarItem(itemId: string): void {
      update((state) => {
        state.statusBarItems.delete(itemId);
        return { ...state };
      });
    },

    /**
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

    /**
     * Get plugin by ID
     */
    getPlugin(pluginId: string): PluginStatus | undefined {
      const state = get({ subscribe });
      return state.plugins.get(pluginId);
    },

    /**
     * Get all plugins
     */
    getAllPlugins(): PluginStatus[] {
      const state = get({ subscribe });
      return Array.from(state.plugins.values());
    },

    /**
     * Get active plugins
     */
    getActivePlugins(): PluginStatus[] {
      const state = get({ subscribe });
      return Array.from(state.plugins.values()).filter((plugin) => plugin.state === 'active');
    },

    /**
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

    /**
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

    /**
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

    /**
     * Set up event listeners for plugin events
     */
    async setupEventListeners(): Promise<void> {
      // Listen for status bar item events
      const statusBarAddUnlisten = await listen<PluginStatusBarItem>(
        'plugin:status_bar:add',
        (event) => {
          // Sanitize text content from plugins (strip all HTML tags)
          const payload = { ...event.payload };
          payload.text = DOMPurify.sanitize(payload.text, { ALLOWED_TAGS: [] });
          if (payload.tooltip) {
            payload.tooltip = DOMPurify.sanitize(payload.tooltip, { ALLOWED_TAGS: [] });
          }
          pluginsStore.registerStatusBarItem(payload);
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
      const panelShowUnlisten = await listen<PluginPanel & { content?: string }>(
        'plugin:panel:show',
        (event) => {
          const payload = event.payload;
          // Sanitize plugin-provided HTML to prevent XSS
          const sanitizedContent = payload.content
            ? DOMPurify.sanitize(payload.content, {
                ALLOWED_TAGS: [
                  'div',
                  'span',
                  'p',
                  'h1',
                  'h2',
                  'h3',
                  'h4',
                  'h5',
                  'h6',
                  'ul',
                  'ol',
                  'li',
                  'a',
                  'strong',
                  'em',
                  'code',
                  'pre',
                  'br',
                  'hr',
                  'img',
                  'table',
                  'thead',
                  'tbody',
                  'tr',
                  'th',
                  'td',
                  'button',
                  'input',
                  'label',
                  'select',
                  'option',
                  'textarea',
                ],
                ALLOWED_ATTR: [
                  'class',
                  'id',
                  'style',
                  'href',
                  'target',
                  'src',
                  'alt',
                  'type',
                  'value',
                  'placeholder',
                  'disabled',
                  'checked',
                  'title',
                  'data-*',
                  'aria-label',
                  'role',
                ],
                ALLOW_DATA_ATTR: true,
                FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form'],
                FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
              })
            : undefined;
          pluginsStore.registerPanel({
            ...payload,
            content: sanitizedContent,
            visible: true,
          });
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

      // Listen for hot-reload events
      const hotReloadUnlisten = await listen<{
        plugin_id: string;
        status: 'reloaded' | 'error';
        error?: string;
      }>('plugin:hot-reload', async (event) => {
        const { plugin_id, status, error } = event.payload;
        if (status === 'reloaded') {
          console.log(`[hot-reload] Plugin reloaded: ${plugin_id}`);
          await pluginsStore.refreshStatus(plugin_id);
        } else if (status === 'error') {
          console.error(`[hot-reload] Plugin reload failed: ${plugin_id}`, error);
          await pluginsStore.refreshStatus(plugin_id);
        }
      });
      eventListeners.push(hotReloadUnlisten);

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

    /**
     * Enable hot-reload for a plugin
     */
    async enableHotReload(pluginId: string): Promise<void> {
      try {
        await invoke('enable_plugin_hot_reload', { pluginId });
      } catch (error) {
        console.error(`Failed to enable hot-reload for ${pluginId}:`, error);
      }
    },

    /**
     * Disable hot-reload for a plugin
     */
    async disableHotReload(pluginId: string): Promise<void> {
      try {
        await invoke('disable_plugin_hot_reload', { pluginId });
      } catch (error) {
        console.error(`Failed to disable hot-reload for ${pluginId}:`, error);
      }
    },

    /**
     * Clear error
     */
    clearError(): void {
      update((state) => ({ ...state, error: null }));
    },

    /**
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
        pendingPermission: null,
        loading: false,
        error: null,
      });
    },
  };

  // Helper: check if plugin capabilities need user approval
  function needsPermissionApproval(plugin: PluginStatus): boolean {
    // First-party/auto-approved plugins skip permission dialog
    if (plugin.auto_approve || plugin.trust === 'first-party') {
      return false;
    }

    const caps = plugin.capabilities;
    if (!caps) return false;

    const hasFs = caps.filesystem && caps.filesystem !== 'None';
    const hasNet = caps.network && caps.network !== 'None';
    const hasCmds = caps.commands?.allowlist?.length > 0;

    return hasFs || hasNet || hasCmds;
  }

  // Helper: show permission dialog and wait for response
  function requestPermission(plugin: PluginStatus): Promise<boolean> {
    return new Promise((resolve) => {
      permissionResolve = resolve;
      update((s) => ({ ...s, pendingPermission: plugin }));
    });
  }
}

export const pluginsStore = createPluginsStore();

// ============================================================================
// DERIVED STORES
// ============================================================================

/**
 * All plugins as array
 */
export const pluginsList = derived(pluginsStore, ($plugins) =>
  Array.from($plugins.plugins.values())
);

/**
 * Active plugins count
 */
export const activePluginCount = derived(
  pluginsStore,
  ($plugins) => Array.from($plugins.plugins.values()).filter((p) => p.state === 'active').length
);

/**
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
    let bucket = grouped.get(category);
    if (!bucket) {
      bucket = [];
      grouped.set(category, bucket);
    }
    bucket.push(command);
  }

  return grouped;
});

/**
 * Visible panels
 */
export const visiblePanels = derived(pluginsStore, ($plugins) =>
  Array.from($plugins.panels.values()).filter((panel): panel is PluginPanel => panel.visible)
);

/**
 * Status bar items sorted by priority
 */
export const sortedStatusBarItems = derived(pluginsStore, ($plugins) =>
  Array.from($plugins.statusBarItems.values()).sort((a, b) => b.priority - a.priority)
);
