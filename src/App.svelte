<script lang="ts">
  import Editor from './components/Editor.svelte';
  import Chrome from './components/Chrome.svelte';
  import TabBar from './components/TabBar.svelte';
  import Breadcrumb from './components/Breadcrumb.svelte';
  import Minimap from './components/Minimap.svelte';
  import SplitPane from './components/SplitPane.svelte';
  import StatusBar from './components/StatusBar.svelte';
  import SideBar from './components/SideBar.svelte';
  import NotificationToast from './components/NotificationToast.svelte';
  import CommandPalette from './components/CommandPalette.svelte';
  import type {
    PaletteExecuteDetail,
    PaletteFileItem,
    PaletteMode,
    PaletteSymbolItem,
  } from './lib/types/command-palette';
  import SettingsPanel from './components/SettingsPanel.svelte';
  import PluginPermissionDialog from './components/PluginPermissionDialog.svelte';
  import DiffView from './features/diff/DiffView.svelte';
  import BootScreen from './components/BootScreen.svelte';
  import { onMount, onDestroy } from 'svelte';
  import { listen, type UnlistenFn } from '@tauri-apps/api/event';
  import { get } from 'svelte/store';
  import { getCurrentWindow } from '@tauri-apps/api/window';
  import { themeStore } from './lib/stores/theme';
  import { pluginsStore } from './lib/stores/plugins';
  import { keybindingStore } from './lib/stores/keybindings';
  import { editorStore, activeFile } from './lib/stores/editor';
  import { settingsStore } from './lib/stores/settings';
  import { gitStore } from './lib/stores/git';
  import { open as showOpenDialog } from '@tauri-apps/plugin-dialog';
  import { invoke } from '@tauri-apps/api/core';
  import { detectLanguage, extractSymbolsFromContent } from './lib/editor-loader';
  import { setExplorerRoot } from './lib/stores/explorer';
  import { coercePathString } from './lib/utils/path';

  let booting = true;
  let menuVisible = true;
  let alwaysOnTop = false;
  let commandPaletteVisible = false;
  let commandPaletteMode: PaletteMode = 'commands';
  let commandPaletteInitialQuery = '';
  let settingsVisible = false;
  let sidebarVisible = true;
  let activeSidebarPanel = 'explorer';
  let editorRef: Editor;
  // Used via bind:this in template for split pane editor instance
  // @ts-expect-error: bound in template via bind:this
  let splitEditorRef: Editor;
  let minimapVisible = true;
  let splitActive = false;
  let splitDirection: 'horizontal' | 'vertical' = 'horizontal';
  let workspaceRoot = '';
  let workspaceFiles: PaletteFileItem[] = [];
  let workspaceFilesLoading = false;
  let workspaceFileIndexAt = 0;
  let workspaceIndexRefreshTimer: ReturnType<typeof setTimeout> | null = null;
  let workspaceWatchUnlisten: UnlistenFn | null = null;
  let currentSymbols: PaletteSymbolItem[] = [];

  const WORKSPACE_IGNORED_DIRS = new Set([
    '.git',
    'node_modules',
    'target',
    'dist',
    'coverage',
    '.svelte-kit',
    '.next',
    '.turbo',
  ]);

  interface WorkspaceFileChangeEntry {
    path: string;
    exists: boolean;
    is_file: boolean;
  }

  interface WorkspaceFilesChangedEvent {
    root: string;
    kind: string;
    entries: WorkspaceFileChangeEntry[];
  }

  // Diff view state
  let diffViewVisible = false;
  let diffOriginal = '';
  let diffModified = '';
  let diffOriginalLabel = 'Original';
  let diffModifiedLabel = 'Modified';
  let diffLanguage: string | null = null;

  onDestroy(() => {
    gitStore.cleanup();
    if (workspaceWatchUnlisten) {
      workspaceWatchUnlisten();
      workspaceWatchUnlisten = null;
    }
    invoke('stop_workspace_file_watch').catch((error) => {
      console.warn('Failed to stop workspace file watcher:', error);
    });
    if (workspaceIndexRefreshTimer) {
      clearTimeout(workspaceIndexRefreshTimer);
      workspaceIndexRefreshTimer = null;
    }
  });

  // Reactive current file from editor store (used for window title updates)
  $: currentFile = $activeFile?.path || '';

  // Update window title when file changes
  $: if (typeof document !== 'undefined') {
    document.title = currentFile ? `${currentFile.split('/').pop()} - Skretchpad` : 'Skretchpad';
  }

  onMount(async () => {
    try {
      // Load persisted settings
      await settingsStore.load();

      // Initialize stores
      await initializeApp();
    } catch (error) {
      console.error('Failed to initialize app:', error);
    }
  });

  async function initializeApp() {
    // Sync theme from settings -> themeStore after theme metadata is fully loaded.
    await syncThemeFromSettings();

    if ($themeStore.current) {
      console.log('Theme loaded:', $themeStore.current.metadata.name);
    }

    if ($keybindingStore.currentScheme) {
      console.log('Keybindings loaded:', $keybindingStore.currentScheme.name);
    }

    // Initialize plugin system (discover and load plugins)
    await pluginsStore.initialize();

    // Initialize git store
    try {
      const workdir = await invoke<string>('get_workspace_root');
      workspaceRoot = workdir.replace(/\\/g, '/');
      await refreshWorkspaceFileIndex(workspaceRoot);
      await startWorkspaceFileWatcher(workspaceRoot);
      await gitStore.initialize(workdir);
    } catch (err) {
      console.warn('Git initialization skipped:', err);
    }

    // Register built-in editor commands for the command palette
    registerBuiltinCommands();

    console.log('App initialized successfully');
  }

  async function syncThemeFromSettings() {
    const savedStem = $settingsStore.appearance.theme;
    if (!savedStem) return;

    let state = get(themeStore);
    if (state.loading) {
      await new Promise<void>((resolve) => {
        const un = themeStore.subscribe((next) => {
          if (!next.loading) {
            un();
            resolve();
          }
        });
      });
      state = get(themeStore);
    }

    if (state.available.length === 0) {
      return;
    }

    const info = state.available.find((t) => t.file.replace(/\.toml$/, '') === savedStem);
    if (info && state.current?.metadata?.name !== info.name) {
      await themeStore.switchTheme(info.name);
    }
  }

  function registerBuiltinCommands() {
    const builtins = [
      { id: 'editor.undo', label: 'Undo', keybinding: 'Ctrl+Z', category: 'Editor' },
      { id: 'editor.redo', label: 'Redo', keybinding: 'Ctrl+Shift+Z', category: 'Editor' },
      {
        id: 'editor.toggleComment',
        label: 'Toggle Comment',
        keybinding: 'Ctrl+/',
        category: 'Editor',
      },
      {
        id: 'editor.duplicateLine',
        label: 'Duplicate Line',
        keybinding: 'Ctrl+Shift+D',
        category: 'Editor',
      },
      {
        id: 'editor.deleteLine',
        label: 'Delete Line',
        keybinding: 'Ctrl+Shift+K',
        category: 'Editor',
      },
      {
        id: 'editor.moveLinesUp',
        label: 'Move Lines Up',
        keybinding: 'Alt+Up',
        category: 'Editor',
      },
      {
        id: 'editor.moveLinesDown',
        label: 'Move Lines Down',
        keybinding: 'Alt+Down',
        category: 'Editor',
      },
      { id: 'editor.find', label: 'Find', keybinding: 'Ctrl+F', category: 'Editor' },
      {
        id: 'editor.formatDocument',
        label: 'Format Document',
        keybinding: 'Ctrl+Shift+F',
        category: 'Editor',
      },
      { id: 'file.open', label: 'Open File', keybinding: 'Ctrl+O', category: 'File' },
      {
        id: 'file.quickOpen',
        label: 'Quick Open File...',
        keybinding: 'Ctrl+P',
        category: 'File',
      },
      {
        id: 'file.openFolder',
        label: 'Open Folder...',
        keybinding: 'Ctrl+Alt+O',
        category: 'File',
      },
      { id: 'file.new', label: 'New File', keybinding: 'Ctrl+N', category: 'File' },
      { id: 'file.save', label: 'Save File', keybinding: 'Ctrl+S', category: 'File' },
      { id: 'file.saveAs', label: 'Save As...', keybinding: 'Ctrl+Shift+S', category: 'File' },
      { id: 'file.close', label: 'Close File', keybinding: 'Ctrl+W', category: 'File' },
      {
        id: 'navigation.gotoLine',
        label: 'Go To Line...',
        keybinding: 'Ctrl+G',
        category: 'Navigation',
      },
      {
        id: 'navigation.gotoSymbol',
        label: 'Go To Symbol...',
        keybinding: 'Ctrl+Shift+O',
        category: 'Navigation',
      },
      {
        id: 'view.commandPalette',
        label: 'Command Palette',
        keybinding: 'Ctrl+Shift+P',
        category: 'View',
      },
      {
        id: 'view.toggleChrome',
        label: 'Toggle Title Bar',
        keybinding: 'Ctrl+Shift+H',
        category: 'View',
      },
      { id: 'view.toggleAlwaysOnTop', label: 'Toggle Always on Top', category: 'View' },
      { id: 'view.toggleSidebar', label: 'Toggle Sidebar', keybinding: 'Ctrl+B', category: 'View' },
      { id: 'view.openDiffView', label: 'Open Diff View', category: 'View' },
      {
        id: 'view.sourceControl',
        label: 'Source Control',
        keybinding: 'Ctrl+Shift+G',
        category: 'View',
      },
      { id: 'view.toggleMinimap', label: 'Toggle Minimap', category: 'View' },
      {
        id: 'view.splitEditorRight',
        label: 'Split Editor Right',
        keybinding: 'Ctrl+\\',
        category: 'View',
      },
      { id: 'view.splitEditorDown', label: 'Split Editor Down', category: 'View' },
      { id: 'view.closeSplitEditor', label: 'Close Split Editor', category: 'View' },
      { id: 'view.openSettings', label: 'Open Settings', keybinding: 'Ctrl+,', category: 'View' },
    ];

    for (const cmd of builtins) {
      pluginsStore.registerCommand({ ...cmd, plugin_id: 'builtin' });
    }
  }

  function handleCommandExecute(event: CustomEvent<PaletteExecuteDetail | { commandId: string }>) {
    const payload = event.detail;

    if ('type' in payload && payload.type === 'file') {
      editorStore.openFile(payload.path);
      return;
    }
    if ('type' in payload && payload.type === 'symbol') {
      editorRef?.editorCommands?.gotoLine(payload.line);
      return;
    }

    const commandId = payload.commandId;
    const commands = editorRef?.editorCommands;

    switch (commandId) {
      case 'editor.undo':
        commands?.undo();
        break;
      case 'editor.redo':
        commands?.redo();
        break;
      case 'editor.toggleComment':
        commands?.toggleComment();
        break;
      case 'editor.duplicateLine':
        commands?.duplicateLine();
        break;
      case 'editor.deleteLine':
        commands?.deleteLine();
        break;
      case 'editor.moveLinesUp':
        commands?.moveLinesUp();
        break;
      case 'editor.moveLinesDown':
        commands?.moveLinesDown();
        break;
      case 'editor.find':
        commands?.openSearchReplace();
        break;
      case 'editor.formatDocument':
        commands?.formatDocument();
        break;
      case 'file.open':
        handleOpenFile();
        break;
      case 'file.new':
        editorStore.createFile();
        scheduleWorkspaceFileIndexRefresh();
        break;
      case 'file.quickOpen':
        openCommandPalette('files');
        break;
      case 'file.openFolder':
        handleOpenFolder();
        break;
      case 'file.save':
        editorRef?.save();
        break;
      case 'file.saveAs':
        editorStore.saveFileAs();
        scheduleWorkspaceFileIndexRefresh();
        break;
      case 'file.close': {
        const state = editorStore.getActiveFile();
        if (state) {
          editorRef?.close();
        }
        break;
      }
      case 'view.commandPalette':
        openCommandPalette('commands');
        break;
      case 'view.toggleChrome':
        menuVisible = !menuVisible;
        break;
      case 'view.toggleAlwaysOnTop':
        toggleAlwaysOnTop();
        break;
      case 'view.toggleSidebar':
        sidebarVisible = !sidebarVisible;
        break;
      case 'view.openDiffView':
        openDiffView();
        break;
      case 'view.sourceControl':
        openSourceControl();
        break;
      case 'view.toggleMinimap':
        minimapVisible = !minimapVisible;
        break;
      case 'view.splitEditorRight':
        splitDirection = 'horizontal';
        splitActive = true;
        break;
      case 'view.splitEditorDown':
        splitDirection = 'vertical';
        splitActive = true;
        break;
      case 'view.closeSplitEditor':
        splitActive = false;
        break;
      case 'view.openSettings':
        settingsVisible = true;
        break;
      case 'navigation.gotoLine':
        promptGotoLine();
        break;
      case 'navigation.gotoSymbol':
        void refreshCurrentSymbols();
        openCommandPalette('symbols');
        break;
      default: {
        const pluginCommand = pluginsStore
          .getCommands()
          .find((cmd) => cmd.id === commandId && cmd.plugin_id !== 'builtin');

        if (pluginCommand) {
          invoke('plugin_execute_hook', {
            pluginId: pluginCommand.plugin_id,
            hookName: `command:${pluginCommand.id}`,
            data: { commandId: pluginCommand.id },
          }).catch((err: unknown) => {
            console.error(`Failed to execute plugin command ${pluginCommand.id}:`, err);
          });
        } else {
          console.log('Unhandled command:', commandId);
        }
      }
    }
  }

  async function handleOpenFile() {
    try {
      const selected = await showOpenDialog({
        title: 'Open File',
        multiple: false,
        filters: [{ name: 'All Files', extensions: ['*'] }],
      });
      const selectedPath = coercePathString(selected);
      if (selectedPath) {
        await editorStore.openFile(selectedPath);
        if (workspaceRoot) {
          scheduleWorkspaceFileIndexRefresh();
        }
      }
    } catch (err) {
      console.error('Failed to open file:', err);
    }
  }

  async function handleOpenFolder() {
    try {
      const selected = await showOpenDialog({
        title: 'Open Folder',
        directory: true,
        multiple: false,
      });
      const selectedPath = coercePathString(selected);
      if (selectedPath) {
        workspaceRoot = selectedPath.replace(/\\/g, '/');
        setExplorerRoot(workspaceRoot);
        await refreshWorkspaceFileIndex(workspaceRoot);
        await startWorkspaceFileWatcher(workspaceRoot);
      }
    } catch (err) {
      console.error('Failed to open folder:', err);
    }
  }

  async function openDiffView() {
    try {
      const file1 = await showOpenDialog({
        title: 'Select Original File',
        multiple: false,
        filters: [{ name: 'All Files', extensions: ['*'] }],
      });
      const file1Path = coercePathString(file1);
      if (!file1Path) return;

      const file2 = await showOpenDialog({
        title: 'Select Modified File',
        multiple: false,
        filters: [{ name: 'All Files', extensions: ['*'] }],
      });
      const file2Path = coercePathString(file2);
      if (!file2Path) return;

      diffOriginal = await invoke<string>('read_file', { path: file1Path });
      diffModified = await invoke<string>('read_file', { path: file2Path });
      diffOriginalLabel = file1Path.split(/[/\\]/).pop() || 'Original';
      diffModifiedLabel = file2Path.split(/[/\\]/).pop() || 'Modified';
      diffViewVisible = true;
    } catch (err) {
      console.error('Failed to open diff view:', err);
    }
  }

  function openSourceControl() {
    sidebarVisible = true;
    activeSidebarPanel = 'scm';
  }

  async function refreshWorkspaceFileIndex(root?: string) {
    const base = (root || workspaceRoot || '').replace(/\\/g, '/');
    if (!base) return;

    workspaceFilesLoading = true;
    try {
      const files = await invoke<string[]>('list_workspace_files', { root: base });
      workspaceFiles = files.map((relativePath) => {
        const normalized = relativePath.replace(/\\/g, '/');
        const path = `${base}/${normalized}`.replace(/\/+/g, '/');
        const parts = normalized.split('/');
        const name = parts[parts.length - 1] || normalized;
        return { path, name, relativePath: normalized };
      });
      workspaceFileIndexAt = Date.now();
    } catch (error) {
      console.error('Failed to index workspace files:', error);
      workspaceFiles = [];
    } finally {
      workspaceFilesLoading = false;
    }
  }

  function scheduleWorkspaceFileIndexRefresh(delayMs = 450) {
    if (workspaceIndexRefreshTimer) {
      clearTimeout(workspaceIndexRefreshTimer);
    }
    workspaceIndexRefreshTimer = setTimeout(() => {
      void refreshWorkspaceFileIndex();
      workspaceIndexRefreshTimer = null;
    }, delayMs);
  }

  function normalizePath(path: string): string {
    return path.replace(/\\/g, '/').replace(/\/+/g, '/');
  }

  function relativeToWorkspace(absolutePath: string): string | null {
    const root = normalizePath(workspaceRoot);
    const abs = normalizePath(absolutePath);
    const rootLower = root.toLowerCase();
    const absLower = abs.toLowerCase();
    if (absLower === rootLower) return '';
    if (!absLower.startsWith(`${rootLower}/`)) return null;
    return abs.slice(root.length + 1);
  }

  function isIgnoredRelativePath(relativePath: string): boolean {
    return relativePath
      .split('/')
      .filter(Boolean)
      .some((segment) => WORKSPACE_IGNORED_DIRS.has(segment.toLowerCase()));
  }

  function upsertWorkspaceFile(absolutePath: string) {
    const relativePath = relativeToWorkspace(absolutePath);
    if (!relativePath || isIgnoredRelativePath(relativePath)) return;
    const normalizedRelative = normalizePath(relativePath);
    const name = normalizedRelative.split('/').pop() || normalizedRelative;
    const normalizedAbsolute = `${normalizePath(workspaceRoot)}/${normalizedRelative}`.replace(
      /\/+/g,
      '/'
    );

    const next = [...workspaceFiles];
    const index = next.findIndex(
      (item) => item.relativePath.toLowerCase() === normalizedRelative.toLowerCase()
    );
    const item = { path: normalizedAbsolute, name, relativePath: normalizedRelative };
    if (index >= 0) {
      next[index] = item;
    } else {
      next.push(item);
    }
    next.sort((a, b) =>
      a.relativePath.localeCompare(b.relativePath, undefined, { sensitivity: 'base' })
    );
    workspaceFiles = next;
  }

  function removeWorkspacePath(absolutePath: string) {
    const relativePath = relativeToWorkspace(absolutePath);
    if (relativePath === null) return;
    const normalizedRelative = normalizePath(relativePath);
    if (!normalizedRelative) {
      workspaceFiles = [];
      return;
    }
    const targetLower = normalizedRelative.toLowerCase();
    workspaceFiles = workspaceFiles.filter((item) => {
      const current = item.relativePath.toLowerCase();
      return current !== targetLower && !current.startsWith(`${targetLower}/`);
    });
  }

  function handleWorkspaceFilesChanged(payload: WorkspaceFilesChangedEvent) {
    if (!workspaceRoot) return;
    const payloadRoot = normalizePath(payload.root);
    if (payloadRoot.toLowerCase() !== normalizePath(workspaceRoot).toLowerCase()) return;

    const kind = payload.kind.toLowerCase();
    const requiresRescan = kind.includes('name(') || kind.includes('rename');
    if (requiresRescan) {
      scheduleWorkspaceFileIndexRefresh(120);
      return;
    }

    for (const entry of payload.entries) {
      if (!entry?.path) continue;
      if (entry.exists && entry.is_file) {
        upsertWorkspaceFile(entry.path);
      } else {
        removeWorkspacePath(entry.path);
      }
    }
    workspaceFileIndexAt = Date.now();
  }

  async function startWorkspaceFileWatcher(root: string) {
    if (!root) return;
    if (!workspaceWatchUnlisten) {
      workspaceWatchUnlisten = await listen<WorkspaceFilesChangedEvent>(
        'workspace:files-changed',
        (event) => {
          handleWorkspaceFilesChanged(event.payload);
        }
      );
    }
    await invoke('start_workspace_file_watch', { root });
  }

  async function refreshCurrentSymbols() {
    const content = editorRef?.getContent() || '';
    const path = $activeFile?.path || '';
    if (!path || !content) {
      currentSymbols = [];
      return;
    }
    try {
      currentSymbols = await extractSymbolsFromContent(path, content);
    } catch (error) {
      console.error('Failed to extract symbols:', error);
      currentSymbols = [];
    }
  }

  function openCommandPalette(nextMode: PaletteMode) {
    if (nextMode === 'symbols') {
      void refreshCurrentSymbols();
    } else if (nextMode === 'files' && workspaceFiles.length === 0 && !workspaceFilesLoading) {
      void refreshWorkspaceFileIndex();
    } else if (nextMode === 'files' && Date.now() - workspaceFileIndexAt > 5000) {
      void refreshWorkspaceFileIndex();
    }
    commandPaletteMode = nextMode;
    commandPaletteInitialQuery = nextMode === 'files' ? '#' : nextMode === 'symbols' ? '@' : '>';
    commandPaletteVisible = true;
  }

  function promptGotoLine() {
    const raw = window.prompt('Go to line:', '');
    if (raw === null) return;
    const line = Number.parseInt(raw.trim(), 10);
    if (!Number.isFinite(line) || line < 1) return;
    editorRef?.editorCommands?.gotoLine(line);
  }

  async function openDiffFromSCM(e: CustomEvent<{ path: string; staged: boolean }>) {
    const { path, staged } = e.detail;
    try {
      const workdir = await invoke<string>('get_workspace_root');
      const fullPath = workdir.replace(/\\/g, '/') + '/' + path;

      if (staged) {
        // Staged: compare HEAD vs index (show HEAD content as original)
        diffOriginal = await invoke<string>('git_diff_file_content', {
          workdir,
          path,
          refName: 'HEAD',
        });
        // For staged files, the index version is what's staged - read the working copy
        // since staged changes reflect the working copy at staging time
        diffModified = await invoke<string>('read_file', { path: fullPath });
      } else {
        // Unstaged: compare HEAD vs working copy
        diffOriginal = await invoke<string>('git_diff_file_content', {
          workdir,
          path,
          refName: 'HEAD',
        });
        diffModified = await invoke<string>('read_file', { path: fullPath });
      }

      diffOriginalLabel = `${path} (HEAD)`;
      diffModifiedLabel = `${path} (Working Tree)`;

      // Detect language from filename
      const fileName = path.split(/[/\\]/).pop() || '';
      diffLanguage = detectLanguage(fileName);

      diffViewVisible = true;
    } catch (err) {
      console.error('Failed to open diff:', err);
    }
  }

  // Global keyboard shortcuts
  function handleKeydown(e: KeyboardEvent) {
    const mod = e.ctrlKey || e.metaKey;

    if (mod && e.shiftKey && e.key === 'P') {
      e.preventDefault();
      if (commandPaletteVisible && commandPaletteMode === 'commands') {
        commandPaletteVisible = false;
      } else {
        openCommandPalette('commands');
      }
      return;
    }
    if (mod && e.shiftKey && (e.key === 'H' || e.key === 'h')) {
      e.preventDefault();
      menuVisible = !menuVisible;
      return;
    }
    if (mod && e.shiftKey && (e.key === 'G' || e.key === 'g')) {
      e.preventDefault();
      openSourceControl();
      return;
    }
    if (mod && e.key === 'b') {
      e.preventDefault();
      sidebarVisible = !sidebarVisible;
      return;
    }
    if (mod && !e.shiftKey && !e.altKey && (e.key === 'o' || e.key === 'O')) {
      e.preventDefault();
      handleOpenFile();
      return;
    }
    if (mod && (e.key === 'p' || e.key === 'P')) {
      e.preventDefault();
      openCommandPalette('files');
      return;
    }
    if (mod && (e.key === 'g' || e.key === 'G')) {
      e.preventDefault();
      promptGotoLine();
      return;
    }
    if (mod && e.shiftKey && !e.altKey && (e.key === 'O' || e.key === 'o')) {
      e.preventDefault();
      openCommandPalette('symbols');
      return;
    }
    if (mod && e.altKey && (e.key === 'O' || e.key === 'o')) {
      e.preventDefault();
      handleOpenFolder();
      return;
    }
    if (mod && e.key === 'n') {
      e.preventDefault();
      editorStore.createFile();
      return;
    }
    if (mod && e.shiftKey && e.key === 'S') {
      e.preventDefault();
      editorStore.saveFileAs();
      return;
    }
    if (mod && e.key === 's') {
      e.preventDefault();
      editorRef?.save();
      return;
    }
    if (mod && e.key === 'w') {
      e.preventDefault();
      editorRef?.close();
      return;
    }
    if (mod && e.key === '\\') {
      e.preventDefault();
      if (splitActive) {
        splitActive = false;
      } else {
        splitDirection = 'horizontal';
        splitActive = true;
      }
      return;
    }
    if (mod && e.key === ',') {
      e.preventDefault();
      settingsVisible = !settingsVisible;
      return;
    }
  }

  async function toggleAlwaysOnTop() {
    alwaysOnTop = !alwaysOnTop;
    try {
      await getCurrentWindow().setAlwaysOnTop(alwaysOnTop);
    } catch (e) {
      console.error('Failed to set always on top:', e);
      alwaysOnTop = !alwaysOnTop; // revert on failure
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if booting}
  <BootScreen on:complete={() => (booting = false)} />
{/if}

<div class="app glass-window" class:app--hidden={booting}>
  <Chrome
    {alwaysOnTop}
    {menuVisible}
    on:command={handleCommandExecute}
    on:togglePin={toggleAlwaysOnTop}
    on:toggleMenu={() => (menuVisible = !menuVisible)}
  />

  <div class="main-content">
    <SideBar
      visible={sidebarVisible}
      {activeSidebarPanel}
      on:openDiff={openDiffFromSCM}
      on:panelChange={(e) => (activeSidebarPanel = e.detail.panel)}
    />

    <div class="editor-container">
      {#if $editorStore.tabs.length > 0}
        <TabBar
          tabs={$editorStore.tabs}
          activeTabId={$editorStore.activeTabId}
          on:switchTab={(e) => editorStore.switchTab(e.detail.tabId)}
          on:closeTab={(e) => editorStore.closeTab(e.detail.tabId)}
          on:newTab={() => editorStore.createFile()}
        />
      {/if}
      {#if $activeFile?.path}
        <Breadcrumb filePath={$activeFile.path} />
      {/if}
      {#if diffViewVisible}
        <DiffView
          original={diffOriginal}
          modified={diffModified}
          originalLabel={diffOriginalLabel}
          modifiedLabel={diffModifiedLabel}
          language={diffLanguage}
          on:close={() => (diffViewVisible = false)}
        />
      {:else if splitActive}
        <SplitPane direction={splitDirection}>
          <div slot="first" class="split-editor-pane">
            <Editor bind:this={editorRef} />
          </div>
          <div slot="second" class="split-editor-pane">
            <Editor bind:this={splitEditorRef} />
          </div>
        </SplitPane>
      {:else}
        <div class="editor-with-minimap">
          <Editor bind:this={editorRef} />
          <Minimap editorView={editorRef?.getEditorView() ?? null} visible={minimapVisible} />
        </div>
      {/if}
    </div>
  </div>

  <StatusBar {menuVisible} on:openSCM={openSourceControl} />
  <NotificationToast />
  <CommandPalette
    bind:visible={commandPaletteVisible}
    mode={commandPaletteMode}
    initialQuery={commandPaletteInitialQuery}
    {workspaceFiles}
    symbols={currentSymbols}
    on:execute={handleCommandExecute}
  />
  <SettingsPanel bind:visible={settingsVisible} on:close={() => (settingsVisible = false)} />
  {#if $pluginsStore.pendingPermission}
    <PluginPermissionDialog
      plugin={$pluginsStore.pendingPermission}
      onApprove={() => pluginsStore.approvePermission()}
      onDeny={() => pluginsStore.denyPermission()}
    />
  {/if}
</div>

<style>
  .app {
    width: 100vw;
    height: 100vh;
    display: flex;
    flex-direction: column;
    background: var(--window-bg);
    backdrop-filter: blur(var(--window-blur));
    border-radius: var(--window-border-radius, 12px);
    border: var(--window-border-width, 1px) solid
      var(--window-border-color, rgba(255, 255, 255, 0.1));
    overflow: hidden;
  }

  .app--hidden {
    opacity: 0;
    pointer-events: none;
  }

  .glass-window {
    background: var(--window-bg);
    backdrop-filter: blur(var(--window-blur));
  }

  .main-content {
    flex: 1;
    display: flex;
    min-height: 0;
  }

  .editor-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    min-width: 0;
  }

  .editor-with-minimap {
    flex: 1;
    display: flex;
    flex-direction: row;
    min-height: 0;
    min-width: 0;
  }

  .split-editor-pane {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    min-width: 0;
    overflow: hidden;
  }

  :global(body) {
    margin: 0;
    padding: 0;
    overflow: hidden;
    background: var(--window-bg, #0a0a0e);
    color: var(--text-primary, #e4e4e4);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  :global(html) {
    overflow: hidden;
    background: var(--window-bg, #0a0a0e);
  }

  /* Global scrollbar styling -- thin, dark, overlay */
  :global(*::-webkit-scrollbar) {
    width: 6px;
    height: 6px;
  }
  :global(*::-webkit-scrollbar-track) {
    background: transparent;
  }
  :global(*::-webkit-scrollbar-thumb) {
    background: var(--scrollbar-thumb, rgba(255, 255, 255, 0.12));
    border-radius: 3px;
  }
  :global(*::-webkit-scrollbar-thumb:hover) {
    background: var(--scrollbar-thumb-hover, rgba(255, 255, 255, 0.25));
  }
  :global(*::-webkit-scrollbar-corner) {
    background: transparent;
  }
</style>
