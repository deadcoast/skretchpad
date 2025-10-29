// src/lib/plugin-api.ts

import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';

// ============================================================================
// CORE PLUGIN TYPES
// ============================================================================

/**
 * Plugin hook event data
 */
export interface PluginHookEvent {
  hookName: string;
  data: any;
  timestamp: number;
}

/**
 * Main plugin interface that all plugins must implement
 */
export interface Plugin {
  /**
   * Called when the plugin is activated
   */
  activate(context: PluginContext): Promise<void>;

  /**
   * Called when the plugin is deactivated
   */
  deactivate(): Promise<void>;
}

/**
 * Plugin context provided to plugins on activation
 */
export interface PluginContext {
  /** Plugin metadata */
  plugin: PluginMetadata;

  /** Workspace API */
  workspace: WorkspaceAPI;

  /** Filesystem API */
  fs: FilesystemAPI;

  /** UI API */
  ui: UiAPI;

  /** Commands API */
  commands: CommandsAPI;

  /** Editor API */
  editor: EditorAPI;

  /** Network API (if enabled) */
  network?: NetworkAPI;

  /** Event system */
  on(event: string, handler: (data: any) => void): UnlistenFn;
  emit(event: string, data: any): Promise<void>;
}

/**
 * Plugin metadata from plugin.toml
 */
export interface PluginMetadata {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  trust: 'first-party' | 'verified' | 'unverified';
}

// ============================================================================
// WORKSPACE API
// ============================================================================

export interface WorkspaceAPI {
  /**
   * Get the current workspace path
   */
  getPath(): string | null;

  /**
   * Get the workspace root path
   */
  getRootPath(): string;

  /**
   * Get workspace configuration
   */
  getConfiguration<T = any>(section?: string): Promise<T>;

  /**
   * Update workspace configuration
   */
  updateConfiguration(section: string, value: any): Promise<void>;

  /**
   * Get all files in workspace
   */
  getFiles(): Promise<WorkspaceFile[]>;

  /**
   * Find files matching pattern
   */
  findFiles(pattern: string): Promise<WorkspaceFile[]>;
}

export interface WorkspaceFile {
  path: string;
  name: string;
  type: 'file' | 'directory';
  size: number;
  modified: number;
}

// ============================================================================
// FILESYSTEM API
// ============================================================================

export interface FilesystemAPI {
  /**
   * Check if a path exists
   */
  exists(path: string): Promise<boolean>;

  /**
   * Read file contents
   */
  readFile(path: string): Promise<string>;

  /**
   * Write file contents
   */
  writeFile(path: string, content: string): Promise<void>;

  /**
   * List directory contents
   */
  listDirectory(path: string): Promise<DirectoryEntry[]>;

  /**
   * Watch path for changes
   */
  watch(path: string, handler: (event: FileEvent) => void): FileWatcher;

  /**
   * Create directory
   */
  createDirectory(path: string): Promise<void>;

  /**
   * Delete file or directory
   */
  delete(path: string): Promise<void>;

  /**
   * Copy file or directory
   */
  copy(source: string, destination: string): Promise<void>;

  /**
   * Move/rename file or directory
   */
  move(source: string, destination: string): Promise<void>;
}

export interface DirectoryEntry {
  name: string;
  path: string;
  is_dir: boolean;
  size: number;
  modified?: number;
}

export interface FileEvent {
  type: 'create' | 'modify' | 'delete';
  path: string;
}

export interface FileWatcher {
  dispose(): void;
}

// ============================================================================
// UI API
// ============================================================================

export interface UiAPI {
  /**
   * Add item to status bar
   */
  addStatusBarItem(options: StatusBarOptions): StatusBarItem;

  /**
   * Show notification
   */
  showNotification(options: NotificationOptions): void;

  /**
   * Show confirmation dialog
   */
  showConfirm(options: ConfirmOptions): Promise<boolean>;

  /**
   * Show input box
   */
  showInputBox(options: InputBoxOptions): Promise<string | null>;

  /**
   * Show quick pick menu
   */
  showQuickPick(options: QuickPickOptions): Promise<string | null>;

  /**
   * Show panel
   */
  showPanel(options: PanelOptions): Panel;

  /**
   * Show progress notification
   */
  withProgress<T>(
    options: ProgressOptions,
    task: (progress: Progress) => Promise<T>
  ): Promise<T>;
}

export interface StatusBarOptions {
  id: string;
  text: string;
  tooltip?: string;
  priority?: number;
  color?: string;
  onClick?: () => void;
}

export interface StatusBarItem {
  id: string;
  text: string;
  tooltip?: string;
  priority: number;
  color?: string;
  
  update(options: Partial<StatusBarOptions>): void;
  dispose(): void;
}

export interface NotificationOptions {
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
  actions?: NotificationAction[];
  timeout?: number;
}

export interface NotificationAction {
  label: string;
  callback: () => void;
}

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

export interface InputBoxOptions {
  prompt: string;
  placeholder?: string;
  value?: string;
  multiline?: boolean;
  password?: boolean;
  validate?: (value: string) => string | null;
}

export interface QuickPickOptions {
  items: QuickPickItem[];
  placeholder?: string;
  canSelectMany?: boolean;
}

export interface QuickPickItem {
  label: string;
  description?: string;
  value: string;
}

export interface PanelOptions {
  id: string;
  title: string;
  content: string;
  position?: 'sidebar' | 'bottom' | 'modal';
}

export interface Panel {
  id: string;
  title: string;
  
  setContent(content: string): void;
  setTitle(title: string): void;
  show(): void;
  hide(): void;
  dispose(): void;
}

export interface ProgressOptions {
  title: string;
  cancellable?: boolean;
}

export interface Progress {
  report(value: { message?: string; increment?: number }): void;
}

// ============================================================================
// COMMANDS API
// ============================================================================

export interface CommandsAPI {
  /**
   * Register a command
   */
  register(id: string, handler: (...args: any[]) => Promise<void>): UnlistenFn;

  /**
   * Execute a command
   */
  execute(id: string, ...args: any[]): Promise<void>;

  /**
   * Execute shell command
   */
  executeShell(
    command: string,
    args: string[],
    options?: ExecuteOptions
  ): Promise<CommandOutput>;

  /**
   * Get all registered commands
   */
  getCommands(): Promise<CommandInfo[]>;
}

export interface ExecuteOptions {
  cwd?: string;
  env?: Record<string, string>;
}

export interface CommandOutput {
  stdout: string;
  stderr: string;
  status: number;
}

export interface CommandInfo {
  id: string;
  title: string;
  keybinding?: string;
  category?: string;
}

// ============================================================================
// EDITOR API
// ============================================================================

export interface EditorAPI {
  /**
   * Get the active file
   */
  getActiveFile(): FileInfo | null;

  /**
   * Get all open files
   */
  getOpenFiles(): FileInfo[];

  /**
   * Get editor content
   */
  getContent(): string;

  /**
   * Set editor content
   */
  setContent(content: string): void;

  /**
   * Get selected text
   */
  getSelection(): string;

  /**
   * Replace selected text
   */
  replaceSelection(text: string): void;

  /**
   * Get cursor position
   */
  getCursorPosition(): Position;

  /**
   * Set cursor position
   */
  setCursorPosition(position: Position): void;

  /**
   * Insert text at cursor
   */
  insertText(text: string): void;

  /**
   * Open file in editor
   */
  openFile(path: string): Promise<void>;

  /**
   * Close file
   */
  closeFile(path?: string): Promise<void>;

  /**
   * Save current file
   */
  save(): Promise<void>;

  /**
   * Save all open files
   */
  saveAll(): Promise<void>;

  /**
   * Open diff view
   */
  openDiffView(options: DiffViewOptions): Promise<void>;

  /**
   * Reload all open files from disk
   */
  reloadAllFiles(): Promise<void>;

  /**
   * Apply text edits
   */
  applyEdits(edits: TextEdit[]): Promise<void>;
}

export interface FileInfo {
  path: string;
  name: string;
  language?: string;
  is_dirty: boolean;
}

export interface Position {
  line: number;
  column: number;
}

export interface DiffViewOptions {
  original: string;
  modified: string;
  title?: string;
}

export interface TextEdit {
  range: Range;
  newText: string;
}

export interface Range {
  start: Position;
  end: Position;
}

// ============================================================================
// NETWORK API
// ============================================================================

export interface NetworkAPI {
  /**
   * Make HTTP request
   */
  fetch(url: string, options?: FetchOptions): Promise<FetchResponse>;

  /**
   * Download file
   */
  download(url: string, destination: string): Promise<void>;
}

export interface FetchOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  timeout?: number;
}

export interface FetchResponse {
  status: number;
  headers: Record<string, string>;
  body: string;
}

// ============================================================================
// PLUGIN API IMPLEMENTATION
// ============================================================================

class PluginContextImpl implements PluginContext {
  plugin: PluginMetadata;
  workspace: WorkspaceAPI;
  fs: FilesystemAPI;
  ui: UiAPI;
  commands: CommandsAPI;
  editor: EditorAPI;
  network?: NetworkAPI;

  private eventListeners: Map<string, Set<(data: any) => void>> = new Map();
  private unlisteners: UnlistenFn[] = [];

  constructor(pluginId: string, metadata: PluginMetadata) {
    this.plugin = metadata;
    this.workspace = new WorkspaceAPIImpl(pluginId);
    this.fs = new FilesystemAPIImpl(pluginId);
    this.ui = new UiAPIImpl(pluginId);
    this.commands = new CommandsAPIImpl(pluginId);
    this.editor = new EditorAPIImpl(pluginId);
    
    // Network API only available if plugin has network permissions
    if (this.hasNetworkPermission()) {
      this.network = new NetworkAPIImpl(pluginId);
    }
  }

  private hasNetworkPermission(): boolean {
    // This would check the plugin's capabilities
    // For now, assume it's available
    return true;
  }

  on(event: string, handler: (data: any) => void): UnlistenFn {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }

    this.eventListeners.get(event)!.add(handler);

    // Set up backend listener
    const unlisten = listen(`plugin:${this.plugin.id}:${event}`, (e) => {
      handler(e.payload);
    });

    this.unlisteners.push(unlisten as any);

    // Return cleanup function
    return () => {
      this.eventListeners.get(event)?.delete(handler);
    };
  }

  async emit(event: string, data: any): Promise<void> {
    await invoke('plugin_emit_event', {
      params: {
        plugin_id: this.plugin.id,
        event_name: event,
        data,
      },
    });
  }

  async cleanup(): Promise<void> {
    // Clean up all event listeners
    for (const unlisten of this.unlisteners) {
      await unlisten();
    }
    this.eventListeners.clear();
  }
}

// ============================================================================
// WORKSPACE API IMPLEMENTATION
// ============================================================================

class WorkspaceAPIImpl implements WorkspaceAPI {
  constructor(private pluginId: string) {}

  getPath(): string | null {
    // This would be retrieved from app state
    return null;
  }

  getRootPath(): string {
    return this.getPath() || '';
  }

  async getConfiguration<T = any>(section?: string): Promise<T> {
    return await invoke('workspace_get_configuration', {
      plugin_id: this.pluginId,
      section,
    });
  }

  async updateConfiguration(section: string, value: any): Promise<void> {
    await invoke('workspace_update_configuration', {
      plugin_id: this.pluginId,
      section,
      value,
    });
  }

  async getFiles(): Promise<WorkspaceFile[]> {
    return await invoke('workspace_get_files', {
      plugin_id: this.pluginId,
    });
  }

  async findFiles(pattern: string): Promise<WorkspaceFile[]> {
    return await invoke('workspace_find_files', {
      plugin_id: this.pluginId,
      pattern,
    });
  }
}

// ============================================================================
// FILESYSTEM API IMPLEMENTATION
// ============================================================================

class FilesystemAPIImpl implements FilesystemAPI {
  constructor(private pluginId: string) {}

  async exists(path: string): Promise<boolean> {
    try {
      await invoke('plugin_read_file', {
        params: { plugin_id: this.pluginId, path },
      });
      return true;
    } catch {
      return false;
    }
  }

  async readFile(path: string): Promise<string> {
    return await invoke('plugin_read_file', {
      params: { plugin_id: this.pluginId, path },
    });
  }

  async writeFile(path: string, content: string): Promise<void> {
    await invoke('plugin_write_file', {
      params: { plugin_id: this.pluginId, path, content },
    });
  }

  async listDirectory(path: string): Promise<DirectoryEntry[]> {
    return await invoke('plugin_list_directory', {
      params: { plugin_id: this.pluginId, path },
    });
  }

  watch(path: string, handler: (event: FileEvent) => void): FileWatcher {
    let unlisten: UnlistenFn | null = null;
    let watchId: string | null = null;

    // Set up file watcher
    invoke<string>('plugin_watch_path', {
      params: { plugin_id: this.pluginId, path },
    }).then(async (id) => {
      watchId = id;
      unlisten = await listen(`plugin:${this.pluginId}:file_change`, (event: any) => {
        handler(event.payload);
      });
    });

    return {
      dispose: () => {
        if (unlisten) {
          unlisten();
        }
        if (watchId) {
          invoke('plugin_unwatch_path', {
            params: { plugin_id: this.pluginId, watch_id: watchId },
          }).catch(console.error);
        }
      },
    };
  }

  async createDirectory(path: string): Promise<void> {
    await invoke('plugin_create_directory', {
      params: { plugin_id: this.pluginId, path },
    });
  }

  async delete(path: string): Promise<void> {
    await invoke('plugin_delete_path', {
      params: { plugin_id: this.pluginId, path },
    });
  }

  async copy(source: string, destination: string): Promise<void> {
    await invoke('plugin_copy_path', {
      params: { plugin_id: this.pluginId, source, destination },
    });
  }

  async move(source: string, destination: string): Promise<void> {
    await invoke('plugin_move_path', {
      params: { plugin_id: this.pluginId, source, destination },
    });
  }
}

// ============================================================================
// UI API IMPLEMENTATION
// ============================================================================

class UiAPIImpl implements UiAPI {
  constructor(private pluginId: string) {}

  addStatusBarItem(options: StatusBarOptions): StatusBarItem {
    invoke('plugin_add_status_bar_item', {
      params: {
        plugin_id: this.pluginId,
        id: options.id,
        text: options.text,
        tooltip: options.tooltip,
        priority: options.priority,
      },
    }).catch(console.error);

    return new StatusBarItemImpl(this.pluginId, options);
  }

  showNotification(options: NotificationOptions): void {
    invoke('plugin_show_notification', {
      params: {
        plugin_id: this.pluginId,
        title: '',
        message: options.message,
        level: options.type,
      },
    }).catch(console.error);
  }

  async showConfirm(options: ConfirmOptions): Promise<boolean> {
    return await invoke('plugin_show_confirm', {
      params: {
        plugin_id: this.pluginId,
        ...options,
      },
    });
  }

  async showInputBox(options: InputBoxOptions): Promise<string | null> {
    return await invoke('plugin_show_input_box', {
      params: {
        plugin_id: this.pluginId,
        ...options,
      },
    });
  }

  async showQuickPick(options: QuickPickOptions): Promise<string | null> {
    return await invoke('plugin_show_quick_pick', {
      params: {
        plugin_id: this.pluginId,
        ...options,
      },
    });
  }

  showPanel(options: PanelOptions): Panel {
    invoke('plugin_show_panel', {
      params: {
        plugin_id: this.pluginId,
        ...options,
      },
    }).catch(console.error);

    return new PanelImpl(this.pluginId, options);
  }

  async withProgress<T>(
    _options: ProgressOptions,
    task: (progress: Progress) => Promise<T>
  ): Promise<T> {
    const progress: Progress = {
      report: (value) => {
        invoke('plugin_report_progress', {
          params: {
            plugin_id: this.pluginId,
            ...value,
          },
        }).catch(console.error);
      },
    };

    return await task(progress);
  }
}

class StatusBarItemImpl implements StatusBarItem {
  constructor(
    private pluginId: string,
    public options: StatusBarOptions
  ) {}

  get id(): string {
    return this.options.id;
  }

  get text(): string {
    return this.options.text;
  }

  get tooltip(): string | undefined {
    return this.options.tooltip;
  }

  get priority(): number {
    return this.options.priority || 0;
  }

  get color(): string | undefined {
    return this.options.color;
  }

  update(options: Partial<StatusBarOptions>): void {
    Object.assign(this.options, options);
    invoke('plugin_update_status_bar_item', {
      params: {
        plugin_id: this.pluginId,
        id: this.id,
        ...options,
      },
    }).catch(console.error);
  }

  dispose(): void {
    invoke('plugin_remove_status_bar_item', {
      params: {
        plugin_id: this.pluginId,
        id: this.id,
      },
    }).catch(console.error);
  }
}

class PanelImpl implements Panel {
  constructor(
    private pluginId: string,
    private options: PanelOptions
  ) {}

  get id(): string {
    return this.options.id;
  }

  get title(): string {
    return this.options.title;
  }

  setContent(content: string): void {
    this.options.content = content;
    invoke('plugin_update_panel', {
      params: {
        plugin_id: this.pluginId,
        id: this.id,
        content,
      },
    }).catch(console.error);
  }

  setTitle(title: string): void {
    this.options.title = title;
    invoke('plugin_update_panel', {
      params: {
        plugin_id: this.pluginId,
        id: this.id,
        title,
      },
    }).catch(console.error);
  }

  show(): void {
    invoke('plugin_show_panel', {
      params: {
        plugin_id: this.pluginId,
        ...this.options,
      },
    }).catch(console.error);
  }

  hide(): void {
    invoke('plugin_hide_panel', {
      params: {
        plugin_id: this.pluginId,
        id: this.id,
      },
    }).catch(console.error);
  }

  dispose(): void {
    this.hide();
  }
}

// ============================================================================
// COMMANDS API IMPLEMENTATION
// ============================================================================

class CommandsAPIImpl implements CommandsAPI {
  private registeredCommands: Map<string, (...args: any[]) => Promise<void>> = new Map();

  constructor(private pluginId: string) {}

  register(id: string, handler: (...args: any[]) => Promise<void>): UnlistenFn {
    this.registeredCommands.set(id, handler);

    // Register with backend
    invoke('plugin_register_command', {
      params: {
        plugin_id: this.pluginId,
        command_id: id,
      },
    }).catch(console.error);

    // Listen for command invocations
    const unlisten = listen(`plugin:${this.pluginId}:command:${id}`, async (event: any) => {
      try {
        await handler(...(event.payload.args || []));
      } catch (error) {
        console.error(`Command ${id} failed:`, error);
      }
    });

    return () => {
      this.registeredCommands.delete(id);
      unlisten.then((fn) => fn());
    };
  }

  async execute(id: string, ...args: any[]): Promise<void> {
    // Check if command is registered locally
    const handler = this.registeredCommands.get(id);
    if (handler) {
      await handler(...args);
      return;
    }

    // Otherwise, execute via backend
    await invoke('plugin_execute_command_by_id', {
      params: {
        plugin_id: this.pluginId,
        command_id: id,
        args,
      },
    });
  }

  async executeShell(
    command: string,
    args: string[],
    options?: ExecuteOptions
  ): Promise<CommandOutput> {
    return await invoke('plugin_execute_command', {
      params: {
        plugin_id: this.pluginId,
        command,
        args,
        cwd: options?.cwd,
      },
    });
  }

  async getCommands(): Promise<CommandInfo[]> {
    return await invoke('plugin_get_commands', {
      params: {
        plugin_id: this.pluginId,
      },
    });
  }
}

// ============================================================================
// EDITOR API IMPLEMENTATION
// ============================================================================

class EditorAPIImpl implements EditorAPI {
  constructor(private pluginId: string) {}

  getActiveFile(): FileInfo | null {
    // This would be retrieved from editor state
    return null;
  }

  getOpenFiles(): FileInfo[] {
    // This would be retrieved from editor state
    return [];
  }

  getContent(): string {
    // This would be retrieved from editor state
    return '';
  }

  setContent(content: string): void {
    invoke('plugin_set_editor_content', {
      params: {
        plugin_id: this.pluginId,
        content,
      },
    }).catch(console.error);
  }

  getSelection(): string {
    // This would be retrieved from editor state
    return '';
  }

  replaceSelection(text: string): void {
    invoke('plugin_replace_selection', {
      params: {
        plugin_id: this.pluginId,
        text,
      },
    }).catch(console.error);
  }

  getCursorPosition(): Position {
    // This would be retrieved from editor state
    return { line: 0, column: 0 };
  }

  setCursorPosition(position: Position): void {
    invoke('plugin_set_cursor_position', {
      params: {
        plugin_id: this.pluginId,
        position,
      },
    }).catch(console.error);
  }

  insertText(text: string): void {
    invoke('plugin_insert_text', {
      params: {
        plugin_id: this.pluginId,
        text,
      },
    }).catch(console.error);
  }

  async openFile(path: string): Promise<void> {
    await invoke('plugin_open_file', {
      params: {
        plugin_id: this.pluginId,
        path,
      },
    });
  }

  async closeFile(path?: string): Promise<void> {
    await invoke('plugin_close_file', {
      params: {
        plugin_id: this.pluginId,
        path,
      },
    });
  }

  async save(): Promise<void> {
    await invoke('plugin_save_file', {
      params: {
        plugin_id: this.pluginId,
      },
    });
  }

  async saveAll(): Promise<void> {
    await invoke('plugin_save_all_files', {
      params: {
        plugin_id: this.pluginId,
      },
    });
  }

  async openDiffView(options: DiffViewOptions): Promise<void> {
    await invoke('plugin_open_diff_view', {
      params: {
        plugin_id: this.pluginId,
        ...options,
      },
    });
  }

  async reloadAllFiles(): Promise<void> {
    await invoke('plugin_reload_all_files', {
      params: {
        plugin_id: this.pluginId,
      },
    });
  }

  async applyEdits(edits: TextEdit[]): Promise<void> {
    await invoke('plugin_apply_edits', {
      params: {
        plugin_id: this.pluginId,
        edits,
      },
    });
  }
}

// ============================================================================
// NETWORK API IMPLEMENTATION
// ============================================================================

class NetworkAPIImpl implements NetworkAPI {
  constructor(private pluginId: string) {}

  async fetch(url: string, options?: FetchOptions): Promise<FetchResponse> {
    return await invoke('plugin_fetch', {
      params: {
        plugin_id: this.pluginId,
        url,
        method: options?.method,
        headers: options?.headers,
        body: options?.body,
      },
    });
  }

  async download(url: string, destination: string): Promise<void> {
    await invoke('plugin_download', {
      params: {
        plugin_id: this.pluginId,
        url,
        destination,
      },
    });
  }
}

// ============================================================================
// PLUGIN LOADER
// ============================================================================

/**
 * Create plugin context for a plugin
 */
export function createPluginContext(
  pluginId: string,
  metadata: PluginMetadata
): PluginContext {
  return new PluginContextImpl(pluginId, metadata);
}

/**
 * Load and activate a plugin
 */
export async function loadPlugin(pluginId: string): Promise<Plugin> {
  // Get plugin metadata
  const metadata = await invoke<PluginMetadata>('get_plugin_metadata', {
    plugin_id: pluginId,
  });

  // Load plugin module
  const pluginModule = await import(`/plugins/${pluginId}/main.ts`);

  // Create plugin instance
  const plugin: Plugin = new pluginModule.default();

  // Create context
  const context = createPluginContext(pluginId, metadata);

  // Activate plugin
  await plugin.activate(context);

  return plugin;
}

// ============================================================================
// EXPORTS
// ============================================================================

export type {
  UnlistenFn,
};