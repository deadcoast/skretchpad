<!-- src/components/Editor.svelte -->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { invoke } from '@tauri-apps/api/core';
  import { listen, type UnlistenFn } from '@tauri-apps/api/event';
  import { open as showOpenDialog } from '@tauri-apps/plugin-dialog';
  import { EditorView } from '@codemirror/view';
  import type { ViewUpdate } from '@codemirror/view';
  import {
    undo as cmUndo,
    redo as cmRedo,
    toggleComment as cmToggleComment,
    copyLineDown,
    deleteLine as cmDeleteLine,
    moveLineUp as cmMoveLineUp,
    moveLineDown as cmMoveLineDown,
  } from '@codemirror/commands';
  import {
    openSearchPanel,
    findNext as cmFindNext,
    findPrevious as cmFindPrevious,
    replaceNext as cmReplaceNext,
    replaceAll as cmReplaceAll,
    setSearchQuery,
    SearchQuery,
  } from '@codemirror/search';
  import { debounce } from '../lib/utils/debounce';
  import {
    createEditor,
    destroyEditor,
    setLanguage,
    updateTheme,
    setWordWrap,
    setLineNumbers,
    setTabSize,
    setFontSize,
    gotoLine as gotoLineInEditor,
  } from '../lib/editor-loader';
  import { icons } from '../lib/icons/index';
  import { themeStore, type Theme } from '../lib/stores/theme';
  import { pluginsStore } from '../lib/stores/plugins';
  import { keybindingStore } from '../lib/stores/keybindings';
  import { settingsStore } from '../lib/stores/settings';
  import { editorStore } from '../lib/stores/editor';
  import { coercePathString } from '../lib/utils/path';

  // Props
  export let initialPath: string | null = null;
  export let readOnly: boolean = false;

  // Local state
  let editorContainer: HTMLDivElement;
  let editorView: EditorView | null = null;
  let currentFilePath: string | null = null;
  let currentLanguage: string | null = null;
  let isDirty: boolean = false;
  let isLoading: boolean = false;
  let error: string | null = null;

  // Auto-save timer
  let autoSaveTimer: ReturnType<typeof setTimeout> | null = null;

  // Event unsubscribers
  let unsubscribers: UnlistenFn[] = [];
  let storeUnsubscribers: (() => void)[] = [];

  // Local editor status info (for UI display - future use)
  interface EditorStatusInfo {
    cursorPosition: { line: number; column: number };
    selectionLength: number;
    lineCount: number;
    encoding: string;
    eolType: 'LF' | 'CRLF' | 'CR';
  }

  let _statusInfo: EditorStatusInfo = {
    cursorPosition: { line: 1, column: 1 },
    selectionLength: 0,
    lineCount: 1,
    encoding: 'utf-8',
    eolType: 'LF',
  };

  // ============================================================================
  // LIFECYCLE: INITIALIZATION
  // ============================================================================

  onMount(async () => {
    try {
      await initializeEditor();
      await setupEventListeners();
      await setupStoreSubscriptions();

      if (initialPath) {
        await openFile(initialPath);
      }
    } catch (err) {
      console.error('Failed to initialize editor:', err);
      error = `Initialization failed: ${err instanceof Error ? err.message : String(err)}`;
    }
  });

  onDestroy(async () => {
    await cleanup();
  });

  // ============================================================================
  // EDITOR INITIALIZATION
  // ============================================================================

  async function initializeEditor() {
    if (!editorContainer) {
      throw new Error('Editor container not found');
    }

    // Get current theme
    const theme = $themeStore.current;
    const keybindings = $keybindingStore.current;

    // Create editor instance
    editorView = await createEditor(editorContainer, {
      theme: theme ?? undefined,
      keybindings,
      readOnly,
      onChange: handleEditorChange,
      onCursorMove: handleCursorMove,
      onSelection: handleSelectionChange,
    });

    console.log('Editor initialized successfully');
  }

  // ============================================================================
  // EVENT LISTENERS
  // ============================================================================

  async function setupEventListeners() {
    // Listen for file open requests from outside
    const fileOpenUnsub = await listen<string | { path: string }>('file:open', async (event) => {
      const payload = event.payload as unknown;
      const filePath = coercePathString(payload);
      if (!filePath) {
        console.error('Invalid file:open payload:', payload);
        return;
      }
      await openFile(filePath);
    });
    unsubscribers.push(fileOpenUnsub);

    // Listen for save requests
    const fileSaveUnsub = await listen('file:save', async () => {
      await saveCurrentFile();
    });
    unsubscribers.push(fileSaveUnsub);

    // Listen for theme changes
    const themeChangeUnsub = await listen<Theme>('theme:changed', async (event) => {
      await applyTheme(event.payload);
    });
    unsubscribers.push(themeChangeUnsub);

    // Listen for keybinding changes
    const keybindingChangeUnsub = await listen('keybindings:changed', async () => {
      await reloadKeybindings();
    });
    unsubscribers.push(keybindingChangeUnsub);

    // Listen for window focus (to check for external file changes)
    const focusUnsub = await listen('window:focus', async () => {
      await checkForExternalChanges();
    });
    unsubscribers.push(focusUnsub);
  }

  // ============================================================================
  // STORE SUBSCRIPTIONS
  // ============================================================================

  async function setupStoreSubscriptions() {
    // Theme store subscription
    const themeUnsub = themeStore.subscribe(async (state) => {
      if (editorView && state.current) {
        await applyTheme(state.current);
      }
    });
    storeUnsubscribers.push(themeUnsub);

    // Keybinding store subscription
    const keybindingUnsub = keybindingStore.subscribe(async (state) => {
      if (editorView && state.current) {
        await reloadKeybindings();
      }
    });
    storeUnsubscribers.push(keybindingUnsub);
  }

  // ============================================================================
  // FILE OPERATIONS
  // ============================================================================

  async function openFile(filePath: string) {
    if (isDirty && currentFilePath) {
      const shouldSave = await confirmSave();
      if (shouldSave) {
        await saveCurrentFile();
      }
    }

    isLoading = true;
    error = null;

    try {
      // Execute plugin hook: before_file_open
      await executePluginHook('before_file_open', { path: filePath });

      // Read file from disk
      const content = await invoke<string>('read_file', { path: filePath });

      // Detect language from file extension
      const language = await detectLanguage(filePath);

      // Update editor content
      if (editorView) {
        const transaction = editorView.state.update({
          changes: {
            from: 0,
            to: editorView.state.doc.length,
            insert: content,
          },
        });
        editorView.dispatch(transaction);

        // Set language/syntax highlighting
        if (language) {
          await setLanguage(editorView, language);
          currentLanguage = language;
        }
      }

      // Update state
      currentFilePath = filePath;
      isDirty = false;

      // Update editor state
      updateEditorState();

      // Execute plugin hook: on_file_open
      await executePluginHook('on_file_open', {
        path: filePath,
        content,
        language,
      });

      console.log(`Opened file: ${filePath}`);
    } catch (err) {
      console.error('Failed to open file:', err);
      error = `Failed to open file: ${err instanceof Error ? err.message : String(err)}`;
    } finally {
      isLoading = false;
    }
  }

  async function saveCurrentFile() {
    if (!currentFilePath || !editorView) {
      console.warn('No file to save');
      return;
    }

    // Clear any pending auto-save
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
      autoSaveTimer = null;
    }

    isLoading = true;
    error = null;

    try {
      const content = editorView.state.doc.toString();

      // Execute plugin hook: before_file_save
      await executePluginHook('before_file_save', {
        path: currentFilePath,
        content,
      });

      // Write file to disk
      await invoke('write_file', {
        path: currentFilePath,
        content,
      });

      // Update state
      isDirty = false;

      // Execute plugin hook: on_file_save
      await executePluginHook('on_file_save', {
        path: currentFilePath,
        content,
      });

      console.log(`Saved file: ${currentFilePath}`);
    } catch (err) {
      console.error('Failed to save file:', err);
      error = `Failed to save file: ${err instanceof Error ? err.message : String(err)}`;
    } finally {
      isLoading = false;
    }
  }

  async function _saveFileAs(newPath: string) {
    if (!editorView) return;

    const content = editorView.state.doc.toString();

    try {
      await invoke('write_file', {
        path: newPath,
        content,
      });

      currentFilePath = newPath;
      isDirty = false;

      // Re-detect language for new extension
      const language = await detectLanguage(newPath);
      if (language && language !== currentLanguage) {
        await setLanguage(editorView, language);
        currentLanguage = language;
      }

      console.log(`Saved file as: ${newPath}`);
    } catch (err) {
      console.error('Failed to save file:', err);
      error = `Failed to save file: ${err instanceof Error ? err.message : String(err)}`;
    }
  }

  async function closeCurrentFile() {
    if (isDirty) {
      const shouldSave = await confirmSave();
      if (shouldSave) {
        await saveCurrentFile();
      }
    }

    if (editorView) {
      const transaction = editorView.state.update({
        changes: {
          from: 0,
          to: editorView.state.doc.length,
          insert: '',
        },
      });
      editorView.dispatch(transaction);
    }

    currentFilePath = null;
    currentLanguage = null;
    isDirty = false;
  }

  async function _reloadCurrentFile() {
    if (!currentFilePath) return;

    const shouldReload = await confirmReload();
    if (!shouldReload) return;

    await openFile(currentFilePath);
  }

  async function checkForExternalChanges() {
    if (!currentFilePath || !editorView) return;

    try {
      // Get file metadata
      const _metadata = await invoke<{ modified: number }>('get_file_metadata', {
        path: currentFilePath,
      });

      // Compare with last known modification time
      // (This would require storing modification time in state)
      // If changed externally, prompt to reload
      console.log('File metadata:', _metadata);
    } catch (err) {
      console.error('Failed to check for external changes:', err);
    }
  }

  // ============================================================================
  // LANGUAGE DETECTION
  // ============================================================================

  async function detectLanguage(filePath: string): Promise<string | null> {
    const ext = filePath.split('.').pop()?.toLowerCase();

    const languageMap: Record<string, string> = {
      py: 'python',
      rs: 'rust',
      js: 'javascript',
      jsx: 'javascript',
      ts: 'typescript',
      tsx: 'typescript',
      md: 'markdown',
      json: 'json',
      yaml: 'yaml',
      yml: 'yaml',
      toml: 'toml',
      html: 'html',
      css: 'css',
      go: 'go',
      java: 'java',
      c: 'cpp',
      h: 'cpp',
      cpp: 'cpp',
      hpp: 'cpp',
      cc: 'cpp',
      cxx: 'cpp',
      php: 'php',
    };

    return ext ? languageMap[ext] || null : null;
  }

  // ============================================================================
  // THEME APPLICATION
  // ============================================================================

  async function applyTheme(theme: Theme) {
    if (!editorView) return;

    try {
      await updateTheme(editorView, theme);
      console.log(`Applied theme: ${theme.metadata.name}`);
    } catch (err) {
      console.error('Failed to apply theme:', err);
    }
  }

  // ============================================================================
  // KEYBINDINGS
  // ============================================================================

  async function reloadKeybindings() {
    if (!editorView) return;

    // This would involve reconfiguring the editor with new keybindings
    // Implementation depends on the keybinding system structure
    console.log('Reloading keybindings...');
  }

  // ============================================================================
  // EDITOR EVENT HANDLERS
  // ============================================================================

  const handleEditorChange = debounce((update: ViewUpdate) => {
    if (!update.docChanged) return;

    isDirty = true;
    updateEditorState();

    // Execute plugin hook: on_content_change
    executePluginHook('on_content_change', {
      path: currentFilePath,
      changes: update.changes,
    });

    // Auto-save: schedule a save if enabled and a file is open
    if ($settingsStore.files.autoSave && currentFilePath) {
      if (autoSaveTimer) clearTimeout(autoSaveTimer);
      autoSaveTimer = setTimeout(() => {
        saveCurrentFile();
        autoSaveTimer = null;
      }, $settingsStore.files.autoSaveDelay);
    }
  }, 300);

  function handleCursorMove(update: ViewUpdate) {
    if (!update.selectionSet) return;

    updateEditorState();
  }

  function handleSelectionChange(update: ViewUpdate) {
    if (!update.selectionSet) return;

    updateEditorState();
  }

  // ============================================================================
  // EDITOR STATE UPDATES
  // ============================================================================

  function updateEditorState() {
    if (!editorView) return;

    const state = editorView.state;
    const selection = state.selection.main;
    const lineInfo = state.doc.lineAt(selection.head);
    const selectionText = state.doc.sliceString(selection.from, selection.to);
    const cursorPosition = {
      line: lineInfo.number,
      column: selection.head - lineInfo.from + 1,
    };

    _statusInfo = {
      cursorPosition,
      selectionLength: selection.to - selection.from,
      lineCount: state.doc.lines,
      encoding: 'utf-8', // This would come from file metadata
      eolType: detectEOL(state.doc.toString()),
    };

    editorStore.updateCursorPosition(cursorPosition);
    editorStore.updateSelection(selectionText);

    // Push editor state to backend for plugin ops
    syncEditorStateToBackend();
  }

  const syncEditorStateToBackend = debounce(() => {
    if (!editorView) return;
    invoke('update_editor_state', {
      content: editorView.state.doc.toString(),
      activeFile: currentFilePath,
    }).catch((err: unknown) => {
      console.error('Failed to sync editor state:', err);
    });
  }, 500);

  function detectEOL(content: string): 'LF' | 'CRLF' | 'CR' {
    if (content.includes('\r\n')) return 'CRLF';
    if (content.includes('\r')) return 'CR';
    return 'LF';
  }

  // ============================================================================
  // PLUGIN HOOKS
  // ============================================================================

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function executePluginHook(hookName: string, data: any) {
    // Get active plugins from store
    const activePlugins = Array.from($pluginsStore.plugins.values())
      .filter((p) => p.state === 'active')
      .map((p) => p.id);

    for (const pluginId of activePlugins) {
      try {
        await invoke('plugin_execute_hook', {
          pluginId,
          hookName,
          data,
        });
      } catch (err) {
        console.error(`Plugin ${pluginId} hook ${hookName} failed:`, err);
      }
    }
  }

  // ============================================================================
  // DIFF VIEW
  // ============================================================================

  async function _toggleDiffView() {
    if (!currentFilePath || !editorView) return;

    try {
      // Get original content (from git HEAD or last saved version)
      const _originalContent = await invoke<string>('get_original_content', {
        path: currentFilePath,
      });

      const _currentContent = editorView.state.doc.toString();

      // Show diff view (this would involve creating a diff editor)
      // Implementation depends on diff viewer component
      console.log('Toggling diff view...', {
        original: _originalContent.substring(0, 50),
        current: _currentContent.substring(0, 50),
      });
    } catch (err) {
      console.error('Failed to show diff:', err);
    }
  }

  // ============================================================================
  // USER PROMPTS
  // ============================================================================

  async function confirmSave(): Promise<boolean> {
    // This would show a dialog
    // For now, return false (don't save)
    return confirm(`Save changes to ${currentFilePath}?`);
  }

  async function confirmReload(): Promise<boolean> {
    if (isDirty) {
      return confirm('File has unsaved changes. Reload anyway?');
    }
    return true;
  }

  async function handleOpenFileDialog() {
    try {
      const selected = await showOpenDialog({
        title: 'Open File',
        multiple: false,
        filters: [{ name: 'All Files', extensions: ['*'] }],
      });
      if (selected) {
        // selected is a string path when multiple is false
        await openFile(selected as string);
      }
    } catch (err) {
      console.error('Failed to open file dialog:', err);
      error = `Failed to open file: ${err instanceof Error ? err.message : String(err)}`;
    }
  }

  async function handleNewFile() {
    // Clear editor for a new untitled file
    if (editorView) {
      if (isDirty && currentFilePath) {
        const shouldSave = await confirmSave();
        if (shouldSave) {
          await saveCurrentFile();
        }
      }
      const transaction = editorView.state.update({
        changes: { from: 0, to: editorView.state.doc.length, insert: '' },
      });
      editorView.dispatch(transaction);
    }
    currentFilePath = null;
    currentLanguage = null;
    isDirty = false;
  }

  // ============================================================================
  // SEARCH & REPLACE
  // ============================================================================

  function openSearchReplace() {
    if (!editorView) return;
    openSearchPanel(editorView);
  }

  function findNext(query?: string) {
    if (!editorView) return;
    if (query) {
      editorView.dispatch({
        effects: setSearchQuery.of(new SearchQuery({ search: query })),
      });
    }
    cmFindNext(editorView);
  }

  function findPrevious(query?: string) {
    if (!editorView) return;
    if (query) {
      editorView.dispatch({
        effects: setSearchQuery.of(new SearchQuery({ search: query })),
      });
    }
    cmFindPrevious(editorView);
  }

  function replaceNext(query: string, replacement: string) {
    if (!editorView) return;
    editorView.dispatch({
      effects: setSearchQuery.of(new SearchQuery({ search: query, replace: replacement })),
    });
    cmReplaceNext(editorView);
  }

  function replaceAll(query: string, replacement: string) {
    if (!editorView) return;
    editorView.dispatch({
      effects: setSearchQuery.of(new SearchQuery({ search: query, replace: replacement })),
    });
    cmReplaceAll(editorView);
  }

  // ============================================================================
  // EDITOR COMMANDS
  // ============================================================================

  function undo() {
    if (!editorView) return;
    cmUndo(editorView);
  }

  function redo() {
    if (!editorView) return;
    cmRedo(editorView);
  }

  async function formatDocument() {
    if (!editorView) return;

    const content = editorView.state.doc.toString();
    const lang = currentLanguage || '';

    // Map editor language to Prettier parser + plugin
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parserMap: Record<string, { parser: string; pluginImport: () => Promise<any> }> = {
      javascript: { parser: 'babel', pluginImport: () => import('prettier/plugins/babel') },
      typescript: {
        parser: 'typescript',
        pluginImport: () => import('prettier/plugins/typescript'),
      },
      json: { parser: 'json', pluginImport: () => import('prettier/plugins/babel') },
      html: { parser: 'html', pluginImport: () => import('prettier/plugins/html') },
      css: { parser: 'css', pluginImport: () => import('prettier/plugins/postcss') },
      markdown: { parser: 'markdown', pluginImport: () => import('prettier/plugins/markdown') },
      yaml: { parser: 'yaml', pluginImport: () => import('prettier/plugins/yaml') },
    };

    const config = parserMap[lang];
    if (!config) {
      console.log(`No formatter available for language: ${lang || 'unknown'}`);
      return;
    }

    try {
      const [prettier, estreePlugin, langPlugin] = await Promise.all([
        import('prettier/standalone'),
        import('prettier/plugins/estree'),
        config.pluginImport(),
      ]);

      const formatted = await prettier.default.format(content, {
        parser: config.parser,
        plugins: [estreePlugin.default, langPlugin.default],
        tabWidth: 2,
        singleQuote: true,
        trailingComma: 'es5',
      });

      // Only update if content actually changed
      if (formatted !== content) {
        const cursor = editorView.state.selection.main.head;
        editorView.dispatch({
          changes: { from: 0, to: editorView.state.doc.length, insert: formatted },
          selection: { anchor: Math.min(cursor, formatted.length) },
        });
      }
    } catch (error) {
      console.error('Format failed:', error);
    }
  }

  function toggleComment() {
    if (!editorView) return;
    cmToggleComment(editorView);
  }

  function duplicateLine() {
    if (!editorView) return;
    copyLineDown(editorView);
  }

  function deleteLine() {
    if (!editorView) return;
    cmDeleteLine(editorView);
  }

  function moveLinesUp() {
    if (!editorView) return;
    cmMoveLineUp(editorView);
  }

  function moveLinesDown() {
    if (!editorView) return;
    cmMoveLineDown(editorView);
  }

  function gotoLine(lineNumber: number) {
    if (!editorView) return;
    gotoLineInEditor(editorView, lineNumber);
    updateEditorState();
  }

  // ============================================================================
  // CLEANUP
  // ============================================================================

  async function cleanup() {
    // Clear auto-save timer
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
      autoSaveTimer = null;
    }

    // Execute plugin hook: before_editor_destroy
    await executePluginHook('before_editor_destroy', {
      path: currentFilePath,
    });

    // Unsubscribe from all events
    for (const unsub of unsubscribers) {
      unsub();
    }
    unsubscribers = [];

    // Unsubscribe from stores
    for (const unsub of storeUnsubscribers) {
      unsub();
    }
    storeUnsubscribers = [];

    // Destroy editor
    if (editorView) {
      destroyEditor(editorView);
      editorView = null;
    }

    console.log('Editor cleanup complete');
  }

  // ============================================================================
  // REACTIVE STATEMENTS
  // ============================================================================

  $: if (editorView && $themeStore.current) {
    applyTheme($themeStore.current);
  }

  $: documentTitle = currentFilePath
    ? `${currentFilePath.split('/').pop()}${isDirty ? ' •' : ''} - skretchpad`
    : 'skretchpad';

  // Update window title
  $: if (typeof window !== 'undefined') {
    document.title = documentTitle;
  }

  // Wire settings to editor compartments
  $: if (editorView) {
    setWordWrap(editorView, $settingsStore.editor.wordWrap);
  }

  $: if (editorView) {
    setLineNumbers(editorView, $settingsStore.editor.lineNumbers);
  }

  $: if (editorView) {
    setTabSize(editorView, $settingsStore.editor.tabSize);
  }

  $: setFontSize($settingsStore.appearance.fontSize);

  // ============================================================================
  // EXPOSED FUNCTIONS (for parent components)
  // ============================================================================

  export function getEditorView(): EditorView | null {
    return editorView;
  }

  export function getCurrentFilePath(): string | null {
    return currentFilePath;
  }

  export function isDirtyFile(): boolean {
    return isDirty;
  }

  export async function save() {
    await saveCurrentFile();
  }

  export async function open(path: string) {
    await openFile(path);
  }

  export async function close() {
    await closeCurrentFile();
  }

  export function getContent(): string {
    return editorView?.state.doc.toString() || '';
  }

  export function setContent(content: string) {
    if (!editorView) return;

    const transaction = editorView.state.update({
      changes: {
        from: 0,
        to: editorView.state.doc.length,
        insert: content,
      },
    });
    editorView.dispatch(transaction);
  }

  // Reference future-use functions to prevent TS warnings
  const _futureAPI = { _statusInfo, _saveFileAs, _reloadCurrentFile, _toggleDiffView };
  void _futureAPI;

  // Export editor commands for command palette and keybinding integration
  export const editorCommands = {
    openSearchReplace,
    findNext,
    findPrevious,
    replaceNext,
    replaceAll,
    undo,
    redo,
    formatDocument,
    toggleComment,
    duplicateLine,
    deleteLine,
    moveLinesUp,
    moveLinesDown,
    gotoLine,
  };
</script>

<div class="editor" bind:this={editorContainer}></div>

<!-- ============================================================================ -->
<!-- TEMPLATE -->
<!-- ============================================================================ -->

<div class="editor-wrapper" class:loading={isLoading}>
  {#if error}
    <div class="error-banner">
      <span class="error-icon">{@html icons.warning}</span>
      <span class="error-message">{error}</span>
      <button class="error-dismiss" on:click={() => (error = null)} aria-label="Dismiss error"
        >{@html icons.close}</button
      >
    </div>
  {/if}

  {#if isLoading}
    <div class="loading-overlay">
      <div class="loading-spinner"></div>
      <span class="loading-text">Loading...</span>
    </div>
  {/if}

  <div class="editor-container" class:read-only={readOnly} bind:this={editorContainer}>
    <!-- CodeMirror mounts here -->
  </div>

  {#if !currentFilePath}
    <div class="empty-state">
      <div class="empty-state-content">
        <h2>No file open</h2>
        <p>Open a file to start editing</p>
        <div class="empty-state-actions">
          <button on:click={handleOpenFileDialog}> Open File </button>
          <button on:click={handleNewFile}> New File </button>
        </div>
      </div>
    </div>
  {/if}
</div>

<!-- ============================================================================ -->
<!-- STYLES -->
<!-- ============================================================================ -->

<style>
  .editor-wrapper {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: var(--editor-bg, transparent);
  }

  .editor-wrapper.loading {
    pointer-events: none;
  }

  /* Error banner */
  .error-banner {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background: var(--color-error, #ff4444);
    color: white;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    animation: slideDown 200ms ease-out;
  }

  @keyframes slideDown {
    from {
      transform: translateY(-100%);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  .error-icon {
    display: flex;
    align-items: center;
  }

  .error-icon :global(svg) {
    width: 18px;
    height: 18px;
  }

  .error-message {
    flex: 1;
    font-size: 14px;
  }

  .error-dismiss {
    background: transparent;
    border: none;
    color: white;
    cursor: pointer;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: background 150ms ease;
  }

  .error-dismiss :global(svg) {
    width: 16px;
    height: 16px;
  }

  .error-dismiss:hover {
    background: rgba(0, 0, 0, 0.2);
  }

  /* Loading overlay */
  .loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(4px);
    z-index: 1000;
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid rgba(255, 255, 255, 0.2);
    border-top-color: var(--color-primary, #00d9ff);
    border-radius: 50%;
    animation: spin 800ms linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .loading-text {
    margin-top: 16px;
    color: var(--text-primary, #e4e4e4);
    font-size: 14px;
  }

  /* Editor container */
  .editor-container {
    flex: 1;
    overflow: hidden;
    position: relative;
  }

  .editor-container.read-only {
    opacity: 0.8;
  }

  /* Empty state */
  .empty-state {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
  }

  .empty-state-content {
    text-align: center;
    color: var(--text-secondary, rgba(228, 228, 228, 0.6));
    pointer-events: auto;
  }

  .empty-state-content h2 {
    font-size: 24px;
    font-weight: 600;
    margin: 0 0 8px 0;
    color: var(--text-primary, #e4e4e4);
  }

  .empty-state-content p {
    font-size: 14px;
    margin: 0 0 24px 0;
  }

  .empty-state-actions {
    display: flex;
    gap: 12px;
    justify-content: center;
  }

  .empty-state-actions button {
    padding: 10px 20px;
    background: var(--button-bg, rgba(255, 255, 255, 0.1));
    border: 1px solid var(--button-border, rgba(255, 255, 255, 0.2));
    border-radius: 6px;
    color: var(--text-primary, #e4e4e4);
    font-size: 14px;
    cursor: pointer;
    transition: all 150ms ease;
  }

  .empty-state-actions button:hover {
    background: var(--button-hover, rgba(255, 255, 255, 0.15));
    border-color: var(--color-primary, #00d9ff);
  }

  .empty-state-actions button:active {
    transform: scale(0.98);
  }

  /* CodeMirror overrides */
  :global(.cm-editor) {
    height: 100%;
    font-family: 'SF Mono', 'Cascadia Code', 'Fira Code', 'JetBrains Mono', 'Consolas', monospace;
    font-size: 14px;
    line-height: 1.6;
  }

  :global(.cm-scroller) {
    overflow: auto !important;
    overflow-x: hidden !important;
  }

  :global(.cm-scroller::-webkit-scrollbar) {
    width: 6px;
    height: 0;
  }

  :global(.cm-scroller::-webkit-scrollbar-track) {
    background: transparent;
  }

  :global(.cm-scroller::-webkit-scrollbar-thumb) {
    background: var(--scrollbar-thumb, rgba(255, 255, 255, 0.12));
    border-radius: 3px;
  }

  :global(.cm-scroller::-webkit-scrollbar-thumb:hover) {
    background: var(--scrollbar-thumb-hover, rgba(255, 255, 255, 0.25));
  }

  :global(.cm-scroller::-webkit-scrollbar-corner) {
    background: transparent;
  }

  :global(.cm-content) {
    caret-color: var(--cursor-color, #00d9ff);
    padding: 16px 0;
  }

  :global(.cm-line) {
    padding: 0 16px;
  }

  :global(.cm-cursor) {
    border-left-color: var(--cursor-color, #00d9ff);
    border-left-width: 2px;
  }

  :global(.cm-selectionBackground) {
    background: var(--selection-bg, rgba(0, 217, 255, 0.2)) !important;
  }

  :global(.cm-activeLine) {
    background: var(--line-active, rgba(255, 255, 255, 0.05));
  }

  :global(.cm-gutters) {
    background: var(--gutter-bg, rgba(0, 0, 0, 0.2));
    border-right: 1px solid var(--border-color, rgba(255, 255, 255, 0.1));
    color: var(--line-number, rgba(228, 228, 228, 0.4));
    padding: 0 8px;
  }

  :global(.cm-activeLineGutter) {
    background: transparent;
    color: var(--line-number-active, #00d9ff);
  }

  :global(.cm-foldGutter) {
    opacity: 0;
    transition: opacity 150ms ease;
  }

  :global(.cm-line:hover .cm-foldGutter) {
    opacity: 1;
  }
</style>
