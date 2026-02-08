import { describe, it, expect, vi, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import {
  pluginsStore,
  pluginsList,
  activePluginCount,
  sortedStatusBarItems,
  hasPluginErrors,
  commandsByCategory,
  visiblePanels,
} from './plugins';
import { clearInvokeHandlers, mockInvokeHandler } from '../../test/mocks/tauri-core';
import { clearListeners, emitTestEvent } from '../../test/mocks/tauri-event';
import type { PluginCommand, PluginPanel, PluginStatusBarItem } from './plugins';

beforeEach(() => {
  pluginsStore.cleanup();
  clearInvokeHandlers();
  clearListeners();
});

describe('plugins store', () => {
  it('starts with empty state', () => {
    const state = get(pluginsStore);
    expect(state.plugins.size).toBe(0);
    expect(state.commands.size).toBe(0);
    expect(state.panels.size).toBe(0);
    expect(state.statusBarItems.size).toBe(0);
    expect(state.pendingPermission).toBeNull();
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('registerCommand adds command to store', () => {
    const cmd: PluginCommand = {
      id: 'test.cmd',
      plugin_id: 'test-plugin',
      label: 'Test Command',
      category: 'Test',
    };
    pluginsStore.registerCommand(cmd);
    const state = get(pluginsStore);
    expect(state.commands.get('test.cmd')).toEqual(cmd);
  });

  it('unregisterCommand removes command', () => {
    const cmd: PluginCommand = {
      id: 'test.cmd',
      plugin_id: 'test-plugin',
      label: 'Test Command',
    };
    pluginsStore.registerCommand(cmd);
    pluginsStore.unregisterCommand('test.cmd');
    expect(get(pluginsStore).commands.has('test.cmd')).toBe(false);
  });

  it('registerPanel / showPanel / hidePanel lifecycle', () => {
    const panel: PluginPanel = {
      id: 'test.panel',
      plugin_id: 'test-plugin',
      title: 'Test Panel',
      position: 'sidebar',
      visible: false,
    };
    pluginsStore.registerPanel(panel);
    expect(get(pluginsStore).panels.get('test.panel')?.visible).toBe(false);

    pluginsStore.showPanel('test.panel');
    expect(get(pluginsStore).panels.get('test.panel')?.visible).toBe(true);

    pluginsStore.hidePanel('test.panel');
    expect(get(pluginsStore).panels.get('test.panel')?.visible).toBe(false);
  });

  it('showPanel with non-existent panel is no-op', () => {
    pluginsStore.showPanel('nonexistent');
    expect(get(pluginsStore).panels.size).toBe(0);
  });

  it('hidePanel with non-existent panel is no-op', () => {
    pluginsStore.hidePanel('nonexistent');
    expect(get(pluginsStore).panels.size).toBe(0);
  });

  it('unregisterPanel removes panel', () => {
    pluginsStore.registerPanel({
      id: 'p1',
      plugin_id: 'test',
      title: 'Panel',
      position: 'sidebar',
      visible: true,
    });
    pluginsStore.unregisterPanel('p1');
    expect(get(pluginsStore).panels.has('p1')).toBe(false);
  });

  it('registerStatusBarItem adds item', () => {
    const item: PluginStatusBarItem = {
      id: 'test.status',
      plugin_id: 'test-plugin',
      text: 'Git: main',
      priority: 10,
    };
    pluginsStore.registerStatusBarItem(item);
    expect(get(pluginsStore).statusBarItems.get('test.status')).toEqual(item);
  });

  it('unregisterStatusBarItem removes item', () => {
    pluginsStore.registerStatusBarItem({
      id: 'sb1',
      plugin_id: 'test',
      text: 'Item',
      priority: 1,
    });
    pluginsStore.unregisterStatusBarItem('sb1');
    expect(get(pluginsStore).statusBarItems.has('sb1')).toBe(false);
  });

  it('updateStatusBarItem updates existing item', () => {
    pluginsStore.registerStatusBarItem({
      id: 'sb1',
      plugin_id: 'test',
      text: 'Old',
      priority: 1,
    });
    pluginsStore.updateStatusBarItem('sb1', { text: 'New', priority: 5 });
    const item = get(pluginsStore).statusBarItems.get('sb1');
    expect(item?.text).toBe('New');
    expect(item?.priority).toBe(5);
  });

  it('updateStatusBarItem with non-existent item is no-op', () => {
    pluginsStore.updateStatusBarItem('nonexistent', { text: 'X' });
    expect(get(pluginsStore).statusBarItems.size).toBe(0);
  });

  it('getStatusBarItems sorts by priority', () => {
    pluginsStore.registerStatusBarItem({
      id: 'low',
      plugin_id: 'p',
      text: 'Low',
      priority: 1,
    });
    pluginsStore.registerStatusBarItem({
      id: 'high',
      plugin_id: 'p',
      text: 'High',
      priority: 100,
    });
    const items = pluginsStore.getStatusBarItems();
    expect(items[0].id).toBe('high');
    expect(items[1].id).toBe('low');
  });

  it('getStatusBarItems filters by pluginId', () => {
    pluginsStore.registerStatusBarItem({
      id: 'a',
      plugin_id: 'plugin-a',
      text: 'A',
      priority: 1,
    });
    pluginsStore.registerStatusBarItem({
      id: 'b',
      plugin_id: 'plugin-b',
      text: 'B',
      priority: 2,
    });
    const items = pluginsStore.getStatusBarItems('plugin-a');
    expect(items).toHaveLength(1);
    expect(items[0].id).toBe('a');
  });

  it('getPlugin returns undefined for unknown plugin', () => {
    expect(pluginsStore.getPlugin('unknown')).toBeUndefined();
  });

  it('getAllPlugins returns empty array initially', () => {
    expect(pluginsStore.getAllPlugins()).toEqual([]);
  });

  it('getActivePlugins returns only active plugins', () => {
    expect(pluginsStore.getActivePlugins()).toEqual([]);
  });

  it('getCommands returns all commands', () => {
    pluginsStore.registerCommand({
      id: 'cmd1',
      plugin_id: 'p1',
      label: 'Cmd 1',
    });
    pluginsStore.registerCommand({
      id: 'cmd2',
      plugin_id: 'p2',
      label: 'Cmd 2',
    });
    expect(pluginsStore.getCommands()).toHaveLength(2);
  });

  it('getCommands filters by pluginId', () => {
    pluginsStore.registerCommand({
      id: 'cmd1',
      plugin_id: 'p1',
      label: 'Cmd 1',
    });
    pluginsStore.registerCommand({
      id: 'cmd2',
      plugin_id: 'p2',
      label: 'Cmd 2',
    });
    expect(pluginsStore.getCommands('p1')).toHaveLength(1);
    expect(pluginsStore.getCommands('p1')[0].id).toBe('cmd1');
  });

  it('getPanels returns all panels', () => {
    pluginsStore.registerPanel({
      id: 'p1',
      plugin_id: 'a',
      title: 'P1',
      position: 'sidebar',
      visible: true,
    });
    expect(pluginsStore.getPanels()).toHaveLength(1);
  });

  it('getPanels filters by pluginId', () => {
    pluginsStore.registerPanel({
      id: 'p1',
      plugin_id: 'plugin-a',
      title: 'P1',
      position: 'sidebar',
      visible: true,
    });
    pluginsStore.registerPanel({
      id: 'p2',
      plugin_id: 'plugin-b',
      title: 'P2',
      position: 'bottom',
      visible: false,
    });
    const panels = pluginsStore.getPanels('plugin-a');
    expect(panels).toHaveLength(1);
    expect(panels[0].id).toBe('p1');
  });

  it('approvePermission resolves pending permission', () => {
    const state = get(pluginsStore);
    expect(state.pendingPermission).toBeNull();
    pluginsStore.approvePermission();
    expect(get(pluginsStore).pendingPermission).toBeNull();
  });

  it('denyPermission clears pending permission', () => {
    pluginsStore.denyPermission();
    expect(get(pluginsStore).pendingPermission).toBeNull();
  });

  it('clearError clears error state', () => {
    pluginsStore.clearError();
    expect(get(pluginsStore).error).toBeNull();
  });

  it('cleanup resets all state', () => {
    pluginsStore.registerCommand({
      id: 'cmd',
      plugin_id: 'p',
      label: 'Test',
    });
    pluginsStore.cleanup();
    const state = get(pluginsStore);
    expect(state.commands.size).toBe(0);
    expect(state.plugins.size).toBe(0);
  });

  it('discover calls invoke and returns plugin ids', async () => {
    mockInvokeHandler('discover_plugins', ['git', 'git-status']);
    const ids = await pluginsStore.discover();
    expect(ids).toEqual(['git', 'git-status']);
  });

  it('discover throws on error', async () => {
    mockInvokeHandler('discover_plugins', () => {
      throw new Error('Discovery failed');
    });
    await expect(pluginsStore.discover()).rejects.toThrow('Discovery failed');
  });

  it('load calls invoke', async () => {
    mockInvokeHandler('load_plugin', undefined);
    mockInvokeHandler('get_plugin_status', {
      id: 'git',
      name: 'Git',
      version: '1.0',
      state: 'loaded',
      capabilities: {
        filesystem: 'None',
        network: 'None',
        commands: { allowlist: [], require_confirmation: false },
        ui: { status_bar: false, sidebar: false, notifications: false, webview: false },
      },
    });
    await pluginsStore.load('git');
    expect(get(pluginsStore).plugins.get('git')?.state).toBe('loaded');
  });

  it('deactivate calls invoke', async () => {
    mockInvokeHandler('deactivate_plugin', undefined);
    mockInvokeHandler('get_plugin_status', {
      id: 'git',
      name: 'Git',
      version: '1.0',
      state: 'loaded',
      capabilities: {
        filesystem: 'None',
        network: 'None',
        commands: { allowlist: [], require_confirmation: false },
        ui: { status_bar: false, sidebar: false, notifications: false, webview: false },
      },
    });
    await pluginsStore.deactivate('git');
    expect(get(pluginsStore).plugins.get('git')?.state).toBe('loaded');
  });

  it('reload calls invoke', async () => {
    mockInvokeHandler('reload_plugin', undefined);
    mockInvokeHandler('get_plugin_status', {
      id: 'git',
      name: 'Git',
      version: '1.0',
      state: 'active',
      capabilities: {
        filesystem: 'None',
        network: 'None',
        commands: { allowlist: [], require_confirmation: false },
        ui: { status_bar: false, sidebar: false, notifications: false, webview: false },
      },
    });
    await pluginsStore.reload('git');
    expect(get(pluginsStore).plugins.get('git')?.state).toBe('active');
  });

  it('refreshStatuses populates plugins map', async () => {
    mockInvokeHandler('get_all_plugin_statuses', [
      {
        id: 'git',
        name: 'Git',
        version: '1.0',
        state: 'active',
        capabilities: {
          filesystem: 'None',
          network: 'None',
          commands: { allowlist: [], require_confirmation: false },
          ui: { status_bar: false, sidebar: false, notifications: false, webview: false },
        },
      },
    ]);
    await pluginsStore.refreshStatuses();
    expect(get(pluginsStore).plugins.size).toBe(1);
    expect(get(pluginsStore).plugins.get('git')?.name).toBe('Git');
  });

  it('setupEventListeners sets up listeners', async () => {
    await pluginsStore.setupEventListeners();
    // Listeners are set up internally; cleanup should work
    pluginsStore.cleanup();
  });

  it('initialize calls discover, refreshStatuses, and setupEventListeners', async () => {
    mockInvokeHandler('discover_plugins', ['git']);
    mockInvokeHandler('get_all_plugin_statuses', [
      {
        id: 'git',
        name: 'Git',
        version: '1.0',
        state: 'active',
        capabilities: {
          filesystem: 'None',
          network: 'None',
          commands: { allowlist: [], require_confirmation: false },
          ui: { status_bar: false, sidebar: false, notifications: false, webview: false },
        },
      },
    ]);
    await pluginsStore.initialize();
    const state = get(pluginsStore);
    expect(state.loading).toBe(false);
    expect(state.plugins.size).toBe(1);
  });

  it('initialize sets error on failure', async () => {
    mockInvokeHandler('discover_plugins', () => {
      throw new Error('fail');
    });
    await pluginsStore.initialize();
    const state = get(pluginsStore);
    expect(state.loading).toBe(false);
    expect(state.error).toContain('Failed to initialize');
  });

  it('load throws on error', async () => {
    mockInvokeHandler('load_plugin', () => {
      throw new Error('Load failed');
    });
    await expect(pluginsStore.load('git')).rejects.toThrow('Load failed');
  });

  it('deactivate throws on error', async () => {
    mockInvokeHandler('deactivate_plugin', () => {
      throw new Error('Deactivate failed');
    });
    await expect(pluginsStore.deactivate('git')).rejects.toThrow('Deactivate failed');
  });

  it('reload throws on error', async () => {
    mockInvokeHandler('reload_plugin', () => {
      throw new Error('Reload failed');
    });
    await expect(pluginsStore.reload('git')).rejects.toThrow('Reload failed');
  });

  it('refreshStatus handles error gracefully', async () => {
    mockInvokeHandler('get_plugin_status', () => {
      throw new Error('Status failed');
    });
    // Should not throw, just log error
    await pluginsStore.refreshStatus('git');
    expect(get(pluginsStore).plugins.size).toBe(0);
  });

  it('refreshStatuses handles error gracefully', async () => {
    mockInvokeHandler('get_all_plugin_statuses', () => {
      throw new Error('Statuses failed');
    });
    await pluginsStore.refreshStatuses();
    expect(get(pluginsStore).plugins.size).toBe(0);
  });

  it('getActivePlugins filters only active plugins', async () => {
    mockInvokeHandler('get_all_plugin_statuses', [
      {
        id: 'git',
        name: 'Git',
        version: '1.0',
        state: 'active',
        capabilities: {
          filesystem: 'None',
          network: 'None',
          commands: { allowlist: [], require_confirmation: false },
          ui: { status_bar: false, sidebar: false, notifications: false, webview: false },
        },
      },
      {
        id: 'linter',
        name: 'Linter',
        version: '1.0',
        state: 'loaded',
        capabilities: {
          filesystem: 'None',
          network: 'None',
          commands: { allowlist: [], require_confirmation: false },
          ui: { status_bar: false, sidebar: false, notifications: false, webview: false },
        },
      },
    ]);
    await pluginsStore.refreshStatuses();
    const active = pluginsStore.getActivePlugins();
    expect(active).toHaveLength(1);
    expect(active[0].id).toBe('git');
  });

  it('activate with no permission needed succeeds', async () => {
    // First add plugin to the store with no capabilities
    mockInvokeHandler('get_all_plugin_statuses', [
      {
        id: 'git',
        name: 'Git',
        version: '1.0',
        state: 'loaded',
        capabilities: {
          filesystem: 'None',
          network: 'None',
          commands: { allowlist: [], require_confirmation: false },
          ui: { status_bar: false, sidebar: false, notifications: false, webview: false },
        },
      },
    ]);
    await pluginsStore.refreshStatuses();

    mockInvokeHandler('activate_plugin', undefined);
    mockInvokeHandler('get_plugin_status', {
      id: 'git',
      name: 'Git',
      version: '1.0',
      state: 'active',
      capabilities: {
        filesystem: 'None',
        network: 'None',
        commands: { allowlist: [], require_confirmation: false },
        ui: { status_bar: false, sidebar: false, notifications: false, webview: false },
      },
    });
    await pluginsStore.activate('git');
    expect(get(pluginsStore).plugins.get('git')?.state).toBe('active');
  });

  it('activate with permission needed prompts and approves', async () => {
    // Plugin with filesystem capabilities needs approval
    mockInvokeHandler('get_all_plugin_statuses', [
      {
        id: 'fs-plugin',
        name: 'FS Plugin',
        version: '1.0',
        state: 'loaded',
        capabilities: {
          filesystem: 'WorkspaceRead',
          network: 'None',
          commands: { allowlist: [], require_confirmation: false },
          ui: { status_bar: false, sidebar: false, notifications: false, webview: false },
        },
      },
    ]);
    await pluginsStore.refreshStatuses();

    mockInvokeHandler('activate_plugin', undefined);
    mockInvokeHandler('get_plugin_status', {
      id: 'fs-plugin',
      name: 'FS Plugin',
      version: '1.0',
      state: 'active',
      capabilities: {
        filesystem: 'WorkspaceRead',
        network: 'None',
        commands: { allowlist: [], require_confirmation: false },
        ui: { status_bar: false, sidebar: false, notifications: false, webview: false },
      },
    });

    // Start activation (will await permission)
    const activatePromise = pluginsStore.activate('fs-plugin');

    // Permission dialog should be pending
    await vi.waitFor(() => {
      expect(get(pluginsStore).pendingPermission).not.toBeNull();
    });

    // Approve the permission
    pluginsStore.approvePermission();

    await activatePromise;
    expect(get(pluginsStore).plugins.get('fs-plugin')?.state).toBe('active');
  });

  it('activate with permission denied does not activate', async () => {
    mockInvokeHandler('get_all_plugin_statuses', [
      {
        id: 'net-plugin',
        name: 'Net Plugin',
        version: '1.0',
        state: 'loaded',
        capabilities: {
          filesystem: 'None',
          network: 'Unrestricted',
          commands: { allowlist: [], require_confirmation: false },
          ui: { status_bar: false, sidebar: false, notifications: false, webview: false },
        },
      },
    ]);
    await pluginsStore.refreshStatuses();

    // Start activation
    const activatePromise = pluginsStore.activate('net-plugin');

    await vi.waitFor(() => {
      expect(get(pluginsStore).pendingPermission).not.toBeNull();
    });

    // Deny permission
    pluginsStore.denyPermission();

    await activatePromise;
    // Plugin should NOT have been activated (state stays loaded)
    expect(get(pluginsStore).plugins.get('net-plugin')?.state).toBe('loaded');
  });

  it('activate with command capabilities needs permission', async () => {
    mockInvokeHandler('get_all_plugin_statuses', [
      {
        id: 'cmd-plugin',
        name: 'Cmd Plugin',
        version: '1.0',
        state: 'loaded',
        capabilities: {
          filesystem: 'None',
          network: 'None',
          commands: { allowlist: ['git'], require_confirmation: false },
          ui: { status_bar: false, sidebar: false, notifications: false, webview: false },
        },
      },
    ]);
    await pluginsStore.refreshStatuses();

    mockInvokeHandler('activate_plugin', undefined);
    mockInvokeHandler('get_plugin_status', {
      id: 'cmd-plugin',
      name: 'Cmd Plugin',
      version: '1.0',
      state: 'active',
      capabilities: {
        filesystem: 'None',
        network: 'None',
        commands: { allowlist: ['git'], require_confirmation: false },
        ui: { status_bar: false, sidebar: false, notifications: false, webview: false },
      },
    });

    const activatePromise = pluginsStore.activate('cmd-plugin');

    await vi.waitFor(() => {
      expect(get(pluginsStore).pendingPermission).not.toBeNull();
    });

    pluginsStore.approvePermission();
    await activatePromise;
    expect(get(pluginsStore).plugins.get('cmd-plugin')?.state).toBe('active');
  });

  it('activate throws on error', async () => {
    mockInvokeHandler('get_all_plugin_statuses', [
      {
        id: 'err-plugin',
        name: 'Error Plugin',
        version: '1.0',
        state: 'loaded',
        capabilities: {
          filesystem: 'None',
          network: 'None',
          commands: { allowlist: [], require_confirmation: false },
          ui: { status_bar: false, sidebar: false, notifications: false, webview: false },
        },
      },
    ]);
    await pluginsStore.refreshStatuses();

    mockInvokeHandler('activate_plugin', () => {
      throw new Error('Activate failed');
    });
    await expect(pluginsStore.activate('err-plugin')).rejects.toThrow('Activate failed');
  });

  it('activate with unknown plugin skips permission check', async () => {
    // Plugin not in the store - activate still calls invoke directly
    mockInvokeHandler('activate_plugin', undefined);
    mockInvokeHandler('get_plugin_status', {
      id: 'unknown',
      name: 'Unknown',
      version: '1.0',
      state: 'active',
      capabilities: {
        filesystem: 'None',
        network: 'None',
        commands: { allowlist: [], require_confirmation: false },
        ui: { status_bar: false, sidebar: false, notifications: false, webview: false },
      },
    });
    await pluginsStore.activate('unknown');
    expect(get(pluginsStore).plugins.get('unknown')?.state).toBe('active');
  });

  it('setupEventListeners responds to status_bar:add events', async () => {
    await pluginsStore.setupEventListeners();
    emitTestEvent('plugin:status_bar:add', {
      id: 'test-sb',
      plugin_id: 'test',
      text: 'Test',
      priority: 1,
    });
    expect(get(pluginsStore).statusBarItems.get('test-sb')).toBeDefined();
  });

  it('setupEventListeners responds to status_bar:remove events', async () => {
    pluginsStore.registerStatusBarItem({
      id: 'sb-remove',
      plugin_id: 'test',
      text: 'Remove Me',
      priority: 1,
    });
    await pluginsStore.setupEventListeners();
    emitTestEvent('plugin:status_bar:remove', { plugin_id: 'test', id: 'sb-remove' });
    expect(get(pluginsStore).statusBarItems.has('sb-remove')).toBe(false);
  });

  it('setupEventListeners responds to panel:show events', async () => {
    await pluginsStore.setupEventListeners();
    emitTestEvent('plugin:panel:show', {
      id: 'new-panel',
      plugin_id: 'test',
      title: 'New Panel',
      position: 'sidebar',
    });
    const panel = get(pluginsStore).panels.get('new-panel');
    expect(panel).toBeDefined();
    expect(panel?.visible).toBe(true);
  });

  it('setupEventListeners responds to panel:hide events', async () => {
    pluginsStore.registerPanel({
      id: 'panel-hide',
      plugin_id: 'test',
      title: 'Hide Me',
      position: 'sidebar',
      visible: true,
    });
    await pluginsStore.setupEventListeners();
    emitTestEvent('plugin:panel:hide', { plugin_id: 'test', id: 'panel-hide' });
    expect(get(pluginsStore).panels.get('panel-hide')?.visible).toBe(false);
  });

  it('setupEventListeners responds to notification events', async () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await pluginsStore.setupEventListeners();
    emitTestEvent('plugin:notification', {
      plugin_id: 'test',
      title: 'Hello',
      message: 'World',
      level: 'info',
    });
    expect(spy).toHaveBeenCalledWith(
      'Plugin notification:',
      expect.objectContaining({ plugin_id: 'test' })
    );
    spy.mockRestore();
  });

  it('cleanup removes event listeners and resets state', async () => {
    await pluginsStore.setupEventListeners();
    pluginsStore.registerStatusBarItem({
      id: 'before-cleanup',
      plugin_id: 'test',
      text: 'Test',
      priority: 1,
    });
    expect(get(pluginsStore).statusBarItems.size).toBe(1);
    pluginsStore.cleanup();
    // After cleanup, state is reset
    expect(get(pluginsStore).statusBarItems.size).toBe(0);
    expect(get(pluginsStore).commands.size).toBe(0);
    expect(get(pluginsStore).panels.size).toBe(0);
  });
});

describe('derived stores', () => {
  beforeEach(() => {
    pluginsStore.cleanup();
  });

  it('pluginsList returns array of plugins', () => {
    expect(get(pluginsList)).toEqual([]);
  });

  it('activePluginCount counts active plugins', () => {
    expect(get(activePluginCount)).toBe(0);
  });

  it('hasPluginErrors is false with no plugins', () => {
    expect(get(hasPluginErrors)).toBe(false);
  });

  it('sortedStatusBarItems sorts by priority', () => {
    pluginsStore.registerStatusBarItem({
      id: 'a',
      plugin_id: 'p',
      text: 'A',
      priority: 5,
    });
    pluginsStore.registerStatusBarItem({
      id: 'b',
      plugin_id: 'p',
      text: 'B',
      priority: 50,
    });
    const items = get(sortedStatusBarItems);
    expect(items[0].id).toBe('b');
  });

  it('commandsByCategory groups commands', () => {
    pluginsStore.registerCommand({
      id: 'cmd1',
      plugin_id: 'p',
      label: 'Cmd1',
      category: 'Git',
    });
    pluginsStore.registerCommand({
      id: 'cmd2',
      plugin_id: 'p',
      label: 'Cmd2',
      category: 'Git',
    });
    pluginsStore.registerCommand({
      id: 'cmd3',
      plugin_id: 'p',
      label: 'Cmd3',
    });
    const grouped = get(commandsByCategory);
    expect(grouped.get('Git')).toHaveLength(2);
    expect(grouped.get('Other')).toHaveLength(1);
  });

  it('visiblePanels returns only visible panels', () => {
    pluginsStore.registerPanel({
      id: 'p1',
      plugin_id: 'a',
      title: 'P1',
      position: 'sidebar',
      visible: true,
    });
    pluginsStore.registerPanel({
      id: 'p2',
      plugin_id: 'a',
      title: 'P2',
      position: 'bottom',
      visible: false,
    });
    const visible = get(visiblePanels);
    expect(visible).toHaveLength(1);
    expect(visible[0].id).toBe('p1');
  });
});
