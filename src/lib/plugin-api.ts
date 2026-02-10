import { invoke } from '@tauri-apps/api/core';

export interface PluginDirectoryEntry {
  name: string;
  path: string;
  is_dir: boolean;
  size: number;
  modified: number | null;
}

export interface PluginFetchResponse {
  status: number;
  headers: Record<string, string>;
  body: string;
}

export interface PluginCommandOutput {
  stdout: string;
  stderr: string;
  status: number;
}

export interface PluginFileInfo {
  path: string;
  language: string | null;
  is_dirty: boolean;
}

export interface PluginStatusBarItem {
  id: string;
  text: string;
  tooltip?: string;
  priority?: number;
}

export interface PluginPanel {
  id: string;
  title: string;
  content: string;
  position?: 'sidebar' | 'bottom' | 'modal';
}

export class PluginApi {
  constructor(private readonly pluginId: string) {}

  readFile(path: string): Promise<string> {
    return invoke('plugin_read_file', { params: { plugin_id: this.pluginId, path } });
  }

  writeFile(path: string, content: string): Promise<void> {
    return invoke('plugin_write_file', { params: { plugin_id: this.pluginId, path, content } });
  }

  listDirectory(path: string): Promise<PluginDirectoryEntry[]> {
    return invoke('plugin_list_directory', { params: { plugin_id: this.pluginId, path } });
  }

  watchPath(path: string): Promise<string> {
    return invoke('plugin_watch_path', { params: { plugin_id: this.pluginId, path } });
  }

  unwatchPath(watchId: string): Promise<void> {
    return invoke('plugin_unwatch_path', {
      params: { plugin_id: this.pluginId, watch_id: watchId },
    });
  }

  fetch(
    url: string,
    options?: {
      method?: string;
      headers?: Record<string, string>;
      body?: string;
    }
  ): Promise<PluginFetchResponse> {
    return invoke('plugin_fetch', {
      params: {
        plugin_id: this.pluginId,
        url,
        method: options?.method,
        headers: options?.headers,
        body: options?.body,
      },
    });
  }

  executeCommand(command: string, args: string[] = [], cwd?: string): Promise<PluginCommandOutput> {
    return invoke('plugin_execute_command', {
      params: { plugin_id: this.pluginId, command, args, cwd },
    });
  }

  showNotification(
    title: string,
    message: string,
    level?: 'info' | 'warning' | 'error' | 'success'
  ): Promise<void> {
    return invoke('plugin_show_notification', {
      params: { plugin_id: this.pluginId, title, message, level },
    });
  }

  addStatusBarItem(item: PluginStatusBarItem): Promise<string> {
    return invoke('plugin_add_status_bar_item', {
      params: {
        plugin_id: this.pluginId,
        id: item.id,
        text: item.text,
        tooltip: item.tooltip,
        priority: item.priority,
      },
    });
  }

  removeStatusBarItem(id: string): Promise<void> {
    return invoke('plugin_remove_status_bar_item', {
      params: { plugin_id: this.pluginId, id },
    });
  }

  showPanel(panel: PluginPanel): Promise<void> {
    return invoke('plugin_show_panel', {
      params: {
        plugin_id: this.pluginId,
        id: panel.id,
        title: panel.title,
        content: panel.content,
        position: panel.position,
      },
    });
  }

  hidePanel(id: string): Promise<void> {
    return invoke('plugin_hide_panel', { params: { plugin_id: this.pluginId, id } });
  }

  getEditorContent(): Promise<string> {
    return invoke('plugin_get_editor_content', { params: { plugin_id: this.pluginId } });
  }

  setEditorContent(content: string): Promise<void> {
    return invoke('plugin_set_editor_content', {
      params: { plugin_id: this.pluginId, content },
    });
  }

  getActiveFile(): Promise<PluginFileInfo | null> {
    return invoke('plugin_get_active_file', { params: { plugin_id: this.pluginId } });
  }

  registerEvent(eventName: string): Promise<void> {
    return invoke('plugin_register_event', {
      params: { plugin_id: this.pluginId, event_name: eventName },
    });
  }

  emitEvent(eventName: string, data: unknown): Promise<void> {
    return invoke('plugin_emit_event', {
      params: { plugin_id: this.pluginId, event_name: eventName, data },
    });
  }

  executeHook(hookName: string, data: unknown): Promise<unknown> {
    return invoke('plugin_execute_hook', {
      params: { plugin_id: this.pluginId, hook_name: hookName, data },
    });
  }
}
