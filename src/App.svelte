<script lang="ts">
  import Editor from './components/Editor.svelte';
  import Chrome from './components/Chrome.svelte';
  import StatusBar from './components/StatusBar.svelte';
  import NotificationToast from './components/NotificationToast.svelte';
  import CommandPalette from './components/CommandPalette.svelte';
  import { onMount } from 'svelte';
  import { getCurrentWindow } from '@tauri-apps/api/window';
  import { themeStore } from './lib/stores/theme';
  import { pluginsStore } from './lib/stores/plugins';
  import { keybindingStore } from './lib/stores/keybindings';
  import { editorStore, activeFile } from './lib/stores/editor';
  import { open as showOpenDialog } from '@tauri-apps/plugin-dialog';
  let chromeVisible = true;
  let alwaysOnTop = false;
  let commandPaletteVisible = false;
  let editorRef: Editor;

  // Reactive current file from editor store (used for window title updates)
  $: currentFile = $activeFile?.path || '';

  // Update window title when file changes
  $: if (typeof document !== 'undefined') {
    document.title = currentFile ? `${currentFile.split('/').pop()} - Skretchpad` : 'Skretchpad';
  }

  onMount(async () => {
    try {
      // Initialize stores
      await initializeApp();
    } catch (error) {
      console.error('Failed to initialize app:', error);
    }
  });

  async function initializeApp() {
    // Theme and keybinding stores auto-initialize on import
    if ($themeStore.current) {
      console.log('Theme loaded:', $themeStore.current.metadata.name);
    }

    if ($keybindingStore.currentScheme) {
      console.log('Keybindings loaded:', $keybindingStore.currentScheme.name);
    }

    // Initialize plugin system (discover and load plugins)
    await pluginsStore.initialize();

    // Register built-in editor commands for the command palette
    registerBuiltinCommands();

    console.log('App initialized successfully');
  }

  function registerBuiltinCommands() {
    const builtins = [
      { id: 'editor.undo', label: 'Undo', keybinding: 'Ctrl+Z', category: 'Editor' },
      { id: 'editor.redo', label: 'Redo', keybinding: 'Ctrl+Shift+Z', category: 'Editor' },
      { id: 'editor.toggleComment', label: 'Toggle Comment', keybinding: 'Ctrl+/', category: 'Editor' },
      { id: 'editor.duplicateLine', label: 'Duplicate Line', keybinding: 'Ctrl+Shift+D', category: 'Editor' },
      { id: 'editor.deleteLine', label: 'Delete Line', keybinding: 'Ctrl+Shift+K', category: 'Editor' },
      { id: 'editor.moveLinesUp', label: 'Move Lines Up', keybinding: 'Alt+Up', category: 'Editor' },
      { id: 'editor.moveLinesDown', label: 'Move Lines Down', keybinding: 'Alt+Down', category: 'Editor' },
      { id: 'editor.find', label: 'Find', keybinding: 'Ctrl+F', category: 'Editor' },
      { id: 'editor.formatDocument', label: 'Format Document', keybinding: 'Ctrl+Shift+F', category: 'Editor' },
      { id: 'file.open', label: 'Open File', keybinding: 'Ctrl+O', category: 'File' },
      { id: 'file.new', label: 'New File', keybinding: 'Ctrl+N', category: 'File' },
      { id: 'file.save', label: 'Save File', keybinding: 'Ctrl+S', category: 'File' },
      { id: 'file.saveAs', label: 'Save As...', keybinding: 'Ctrl+Shift+S', category: 'File' },
      { id: 'file.close', label: 'Close File', keybinding: 'Ctrl+W', category: 'File' },
      { id: 'view.commandPalette', label: 'Command Palette', keybinding: 'Ctrl+Shift+P', category: 'View' },
      { id: 'view.toggleChrome', label: 'Toggle Title Bar', category: 'View' },
      { id: 'view.toggleAlwaysOnTop', label: 'Toggle Always on Top', category: 'View' },
    ];

    for (const cmd of builtins) {
      pluginsStore.registerCommand({ ...cmd, plugin_id: 'builtin' });
    }
  }

  function handleCommandExecute(event: CustomEvent<{ commandId: string }>) {
    const { commandId } = event.detail;
    const commands = editorRef?.editorCommands;

    switch (commandId) {
      case 'editor.undo': commands?.undo(); break;
      case 'editor.redo': commands?.redo(); break;
      case 'editor.toggleComment': commands?.toggleComment(); break;
      case 'editor.duplicateLine': commands?.duplicateLine(); break;
      case 'editor.deleteLine': commands?.deleteLine(); break;
      case 'editor.moveLinesUp': commands?.moveLinesUp(); break;
      case 'editor.moveLinesDown': commands?.moveLinesDown(); break;
      case 'editor.find': commands?.openSearchReplace(); break;
      case 'editor.formatDocument': commands?.formatDocument(); break;
      case 'file.open': handleOpenFile(); break;
      case 'file.new': editorStore.createFile(); break;
      case 'file.save': editorRef?.save(); break;
      case 'file.saveAs': editorStore.saveFileAs(); break;
      case 'file.close': {
        const state = editorStore.getActiveFile();
        if (state) {
          // Close via editor component
          editorRef?.close();
        }
        break;
      }
      case 'view.commandPalette': commandPaletteVisible = true; break;
      case 'view.toggleChrome': toggleChrome(); break;
      case 'view.toggleAlwaysOnTop': toggleAlwaysOnTop(); break;
      default:
        console.log('Unhandled command:', commandId);
    }
  }

  async function handleOpenFile() {
    try {
      const selected = await showOpenDialog({
        title: 'Open File',
        multiple: false,
        filters: [{ name: 'All Files', extensions: ['*'] }],
      });
      if (selected) {
        await editorStore.openFile(selected as string);
      }
    } catch (err) {
      console.error('Failed to open file:', err);
    }
  }

  // Global keyboard shortcuts
  function handleKeydown(e: KeyboardEvent) {
    const mod = e.ctrlKey || e.metaKey;

    if (mod && e.shiftKey && e.key === 'P') {
      e.preventDefault();
      commandPaletteVisible = !commandPaletteVisible;
      return;
    }
    if (mod && e.key === 'o') {
      e.preventDefault();
      handleOpenFile();
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
  }

  function toggleChrome() {
    chromeVisible = !chromeVisible;
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

<div class="app glass-window">
  {#if chromeVisible}
    <Chrome
      {alwaysOnTop}
      onToggleChrome={toggleChrome}
      onTogglePin={toggleAlwaysOnTop}
    />
  {/if}

  <div class="editor-container">
    <Editor bind:this={editorRef} />
  </div>

  <StatusBar />
  <NotificationToast />
  <CommandPalette
    bind:visible={commandPaletteVisible}
    on:execute={handleCommandExecute}
  />
</div>

<style>
  .app {
    width: 100vw;
    height: 100vh;
    display: flex;
    flex-direction: column;
    background: var(--window-bg);
    backdrop-filter: blur(var(--window-blur));
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    overflow: hidden;
  }
  
  .glass-window {
    background: var(--window-bg);
    backdrop-filter: blur(var(--window-blur));
  }
  
  .editor-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }
  
  :global(body) {
    margin: 0;
    padding: 0;
    background: transparent;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
  
  :global(html) {
    background: linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%);
  }
</style>
