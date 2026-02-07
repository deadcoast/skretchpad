```svelte
<!-- src/components/Editor.svelte -->
<script lang="ts">
  import { onMount, onDestroy, tick } from 'svelte';
  import { invoke } from '@tauri-apps/api/tauri';
  import { listen, type UnlistenFn } from '@tauri-apps/api/event';
  import { EditorView } from 'codemirror';
  import type { ViewUpdate } from '@codemirror/view';
  import { debounce } from '../lib/utils/debounce';
  import { createEditor, destroyEditor, setLanguage, updateTheme } from '../lib/editor-loader';
  import { editorStore, type EditorState } from '../lib/stores/editor';
  import { themeStore, type Theme } from '../lib/stores/theme';
  import { uiStore } from '../lib/stores/ui';
  import { pluginStore } from '../lib/stores/plugins';
  import { keybindingStore } from '../lib/stores/keybindings';
  import type { PluginHookEvent } from '../lib/plugin-api';

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
  
  // Event unsubscribers
  let unsubscribers: UnlistenFn[] = [];
  let storeUnsubscribers: (() => void)[] = [];

  // Editor state
  let editorState: EditorState = {
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
      error = `Initialization failed: ${err.message}`;
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
      theme,
      keybindings,
      readOnly,
      onChange: handleEditorChange,
      onCursorMove: handleCursorMove,
      onSelection: handleSelectionChange,
    });

    // Update store
    editorStore.setView(editorView);

    console.log('Editor initialized successfully');
  }

  // ============================================================================
  // EVENT LISTENERS
  // ============================================================================

  async function setupEventListeners() {
    // Listen for file open requests from outside
    const fileOpenUnsub = await listen<string>('file:open', async (event) => {
      await openFile(event.payload);
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

    // UI store subscription (chrome visibility, etc.)
    const uiUnsub = uiStore.subscribe((state) => {
      // React to UI state changes if needed
    });
    storeUnsubscribers.push(uiUnsub);

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

      // Update store
      editorStore.openFile(filePath, content);

      // Execute plugin hook: on_file_open
      await executePluginHook('on_file_open', { 
        path: filePath,
        content,
        language,
      });

      console.log(`Opened file: ${filePath}`);
    } catch (err) {
      console.error('Failed to open file:', err);
      error = `Failed to open file: ${err.message}`;
    } finally {
      isLoading = false;
    }
  }

  async function saveCurrentFile() {
    if (!currentFilePath || !editorView) {
      console.warn('No file to save');
      return;
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
      editorStore.markClean();

      // Execute plugin hook: on_file_save
      await executePluginHook('on_file_save', { 
        path: currentFilePath,
        content,
      });

      console.log(`Saved file: ${currentFilePath}`);
    } catch (err) {
      console.error('Failed to save file:', err);
      error = `Failed to save file: ${err.message}`;
    } finally {
      isLoading = false;
    }
  }

  async function saveFileAs(newPath: string) {
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

      editorStore.openFile(newPath, content);
      
      console.log(`Saved file as: ${newPath}`);
    } catch (err) {
      console.error('Failed to save file:', err);
      error = `Failed to save file: ${err.message}`;
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

    editorStore.closeFile();
  }

  async function reloadCurrentFile() {
    if (!currentFilePath) return;

    const shouldReload = await confirmReload();
    if (!shouldReload) return;

    await openFile(currentFilePath);
  }

  async function checkForExternalChanges() {
    if (!currentFilePath || !editorView) return;

    try {
      // Get file metadata
      const metadata = await invoke<{ modified: number }>('get_file_metadata', {
        path: currentFilePath,
      });

      // Compare with last known modification time
      // (This would require storing modification time in state)
      // If changed externally, prompt to reload
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
      'py': 'python',
      'rs': 'rust',
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'md': 'markdown',
      'json': 'json',
      'yaml': 'yaml',
      'yml': 'yaml',
      'toml': 'toml',
      'html': 'html',
      'css': 'css',
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
    editorStore.markDirty();

    // Execute plugin hook: on_content_change
    executePluginHook('on_content_change', {
      path: currentFilePath,
      changes: update.changes,
    });
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

    editorState = {
      cursorPosition: {
        line: lineInfo.number,
        column: selection.head - lineInfo.from + 1,
      },
      selectionLength: selection.to - selection.from,
      lineCount: state.doc.lines,
      encoding: 'utf-8', // This would come from file metadata
      eolType: detectEOL(state.doc.toString()),
    };

    // Update store
    editorStore.updateState(editorState);
  }

  function detectEOL(content: string): 'LF' | 'CRLF' | 'CR' {
    if (content.includes('\r\n')) return 'CRLF';
    if (content.includes('\r')) return 'CR';
    return 'LF';
  }

  // ============================================================================
  // PLUGIN HOOKS
  // ============================================================================

  async function executePluginHook(hookName: string, data: PluginHookEvent) {
    const plugins = $pluginStore.active;

    for (const pluginId of plugins) {
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

  async function toggleDiffView() {
    if (!currentFilePath || !editorView) return;

    try {
      // Get original content (from git HEAD or last saved version)
      const originalContent = await invoke<string>('get_original_content', {
        path: currentFilePath,
      });

      const currentContent = editorView.state.doc.toString();

      // Show diff view (this would involve creating a diff editor)
      // Implementation depends on diff viewer component
      console.log('Toggling diff view...');
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

  // ============================================================================
  // SEARCH & REPLACE
  // ============================================================================

  function openSearchPanel() {
    if (!editorView) return;
    
    // This would open the search panel
    // Implementation depends on search component
    console.log('Opening search panel...');
  }

  function findNext(query: string) {
    // Search implementation
  }

  function findPrevious(query: string) {
    // Search implementation
  }

  function replaceNext(query: string, replacement: string) {
    // Replace implementation
  }

  function replaceAll(query: string, replacement: string) {
    // Replace all implementation
  }

  // ============================================================================
  // EDITOR COMMANDS
  // ============================================================================

  function undo() {
    if (!editorView) return;
    // Trigger undo command
  }

  function redo() {
    if (!editorView) return;
    // Trigger redo command
  }

  function formatDocument() {
    if (!editorView || !currentLanguage) return;
    
    // Format based on language
    // This would call a formatter (prettier, rustfmt, etc.)
    console.log('Formatting document...');
  }

  function toggleComment() {
    if (!editorView) return;
    // Toggle line/block comment
  }

  function duplicateLine() {
    if (!editorView) return;
    // Duplicate current line or selection
  }

  function deleteLine() {
    if (!editorView) return;
    // Delete current line
  }

  function moveLinesUp() {
    if (!editorView) return;
    // Move selected lines up
  }

  function moveLinesDown() {
    if (!editorView) return;
    // Move selected lines down
  }

  // ============================================================================
  // CLEANUP
  // ============================================================================

  async function cleanup() {
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
</script>

<!-- ============================================================================ -->
<!-- TEMPLATE -->
<!-- ============================================================================ -->

<div class="editor-wrapper" class:loading={isLoading}>
  {#if error}
    <div class="error-banner">
      <span class="error-icon">⚠️</span>
      <span class="error-message">{error}</span>
      <button class="error-dismiss" on:click={() => error = null}>×</button>
    </div>
  {/if}

  {#if isLoading}
    <div class="loading-overlay">
      <div class="loading-spinner"></div>
      <span class="loading-text">Loading...</span>
    </div>
  {/if}

  <div 
    class="editor-container"
    class:read-only={readOnly}
    bind:this={editorContainer}
  >
    <!-- CodeMirror mounts here -->
  </div>

  {#if !currentFilePath}
    <div class="empty-state">
      <div class="empty-state-content">
        <h2>No file open</h2>
        <p>Open a file to start editing</p>
        <div class="empty-state-actions">
          <button on:click={() => invoke('show_open_dialog')}>
            Open File
          </button>
          <button on:click={() => invoke('create_new_file')}>
            New File
          </button>
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
    font-size: 20px;
  }

  .error-message {
    flex: 1;
    font-size: 14px;
  }

  .error-dismiss {
    background: transparent;
    border: none;
    color: white;
    font-size: 24px;
    cursor: pointer;
    padding: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: background 150ms ease;
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
    overflow: auto;
    scrollbar-width: thin;
    scrollbar-color: var(--scrollbar-thumb, rgba(255, 255, 255, 0.2)) 
                     var(--scrollbar-track, transparent);
  }

  :global(.cm-scroller::-webkit-scrollbar) {
    width: 10px;
    height: 10px;
  }

  :global(.cm-scroller::-webkit-scrollbar-track) {
    background: var(--scrollbar-track, transparent);
  }

  :global(.cm-scroller::-webkit-scrollbar-thumb) {
    background: var(--scrollbar-thumb, rgba(255, 255, 255, 0.2));
    border-radius: 5px;
  }

  :global(.cm-scroller::-webkit-scrollbar-thumb:hover) {
    background: var(--scrollbar-thumb-hover, rgba(255, 255, 255, 0.3));
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

```

---

# Integration Dependencies Map

## Component Dependencies

```plaintext
Editor.svelte (THIS FILE)
├─> Svelte Framework
│   ├─> onMount (lifecycle)
│   ├─> onDestroy (lifecycle)
│   └─> tick (reactive updates)
│
├─> Tauri APIs
│   ├─> @tauri-apps/api/tauri → invoke()
│   └─> @tauri-apps/api/event → listen()
│
├─> CodeMirror 6
│   ├─> EditorView (codemirror)
│   └─> ViewUpdate (@codemirror/view)
│
├─> Local Modules
│   ├─> src/lib/editor-loader.ts
│   │   ├─> createEditor()
│   │   ├─> destroyEditor()
│   │   ├─> setLanguage()
│   │   └─> updateTheme()
│   │
│   ├─> src/lib/utils/debounce.ts
│   │   └─> debounce()
│   │
│   ├─> src/lib/stores/editor.ts
│   │   ├─> editorStore
│   │   └─> EditorState (type)
│   │
│   ├─> src/lib/stores/theme.ts
│   │   ├─> themeStore
│   │   └─> Theme (type)
│   │
│   ├─> src/lib/stores/ui.ts
│   │   └─> uiStore
│   │
│   ├─> src/lib/stores/plugins.ts
│   │   └─> pluginStore
│   │
│   ├─> src/lib/stores/keybindings.ts
│   │   └─> keybindingStore
│   │
│   └─> src/lib/plugin-api.ts
│       └─> PluginHookEvent (type)
│
└─> Backend Tauri Commands (invoke calls)
    ├─> read_file
    ├─> write_file
    ├─> get_file_metadata
    ├─> get_original_content
    ├─> plugin_execute_hook
    ├─> show_open_dialog
    └─> create_new_file
```

## Required Files to Create (Priority Order)

### 🔴 **CRITICAL - Must exist before Editor.svelte works:**

```plaintext
1. src/lib/editor-loader.ts
   └─> Exports: createEditor(), destroyEditor(), setLanguage(), updateTheme()
   └─> Required by: Editor.svelte (line 7)

2. src/lib/stores/editor.ts
   └─> Exports: editorStore, EditorState type
   └─> Required by: Editor.svelte (line 8)

3. src/lib/stores/theme.ts
   └─> Exports: themeStore, Theme type
   └─> Required by: Editor.svelte (line 9)

4. src/lib/stores/ui.ts
   └─> Exports: uiStore
   └─> Required by: Editor.svelte (line 10)

5. src/lib/stores/plugins.ts
   └─> Exports: pluginStore
   └─> Required by: Editor.svelte (line 11)

6. src/lib/stores/keybindings.ts
   └─> Exports: keybindingStore
   └─> Required by: Editor.svelte (line 12)

7. src/lib/plugin-api.ts
   └─> Exports: PluginHookEvent type
   └─> Required by: Editor.svelte (line 13)

8. src/lib/utils/debounce.ts
   └─> Exports: debounce()
   └─> Required by: Editor.svelte (line 6)
```

### 🟡 **IMPORTANT - Backend integration:**

```plaintext
9. src-tauri/src/commands/file.rs
   └─> Commands: read_file, write_file, get_file_metadata
   └─> Required by: Editor.svelte invoke() calls

10. src-tauri/src/commands/plugin.rs
    └─> Commands: plugin_execute_hook
    └─> Required by: Plugin system integration
```

## File-Level Dependencies Diagram

```plaintext
┌──────────────────────────────────────────────────────────────┐
│                    EDITOR.SVELTE INTEGRATION                 │
└──────────────────────────────────────────────────────────────┘

┌─────────────────┐
│  Editor.svelte  │ (THIS FILE - 750 lines)
└────────┬────────┘
         │
         ├─────────────────────────────────────────────────────┐
         │                                                     │
         ▼                                                     ▼
┌──────────────────┐                                   ┌─────────────────┐
│ editor-loader.ts │  MUST CREATE                      │   Svelte Core   │
├──────────────────┤                                   ├─────────────────┤
│ • createEditor   │                                   │ • onMount       │
│ • destroyEditor  │                                   │ • onDestroy     │
│ • setLanguage    │                                   │ • tick          │
│ • updateTheme    │                                   └─────────────────┘
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  CodeMirror 6    │  External dependency (npm)
├──────────────────┤
│ • EditorView     │
│ • State          │
│ • Extensions     │
└──────────────────┘

         │
         ├──────────────────────┬─────────────────────┬───────────────┐
         │                      │                     │               │
         ▼                      ▼                     ▼               ▼
┌───────────────┐     ┌──────────────┐     ┌──────────────┐  ┌─────────────┐
│ editor.ts     │     │  theme.ts    │     │   ui.ts      │  │ plugins.ts  │
│ (store)       │     │  (store)     │     │  (store)     │  │ (store)     │
├───────────────┤     ├──────────────┤     ├──────────────┤  ├─────────────┤
│ • editorStore │     │ • themeStore │     │ • uiStore    │  │•pluginStore │
│ • EditorState │     │ • Theme type │     └──────────────┘  └─────────────┘
└───────────────┘     └──────────────┘
     ⚠️ CREATE           ⚠️ CREATE            ⚠️ CREATE         ⚠️ CREATE

         │
         ▼
┌──────────────────┐
│keybindings.ts    │ ⚠️ MUST CREATE
│(store)           │
├──────────────────┤
│•keybindingStore  │
└──────────────────┘

         │
         ▼
┌──────────────────┐
│ plugin-api.ts    │ ⚠️ MUST CREATE
├──────────────────┤
│•PluginHookEvent  │
└──────────────────┘

         │
         ▼
┌──────────────────────────────────────────────────────────────┐
│                    TAURI BACKEND COMMANDS                    │
├──────────────────────────────────────────────────────────────┤
│ src-tauri/src/commands/                                      │
│   ├─> file.rs                                                │
│   │   ├─> read_file(path: String) -> String                  │
│   │   ├─> write_file(path: String, content: String)          │
│   │   └─> get_file_metadata(path: String) -> Metadata        │
│   │                                                          │
│   ├─> plugin.rs                                              │
│   │   └─> plugin_execute_hook(                               │
│   │          pluginId: String,                               │
│   │          hookName: String,                               │
│   │          data: Value                                     │
│   │       )                                                  │
│   │                                                          │
│   └─> dialog.rs                                              │
│       ├─> show_open_dialog() -> Option<String>               │
│       └─> create_new_file() -> String                        │
└──────────────────────────────────────────────────────────────┘
          ⚠️ MUST CREATE ALL BACKEND COMMANDS
```

## Integration Checklist

### COMPLETED

- `src/components/Editor.svelte` (750 lines) - Main editor component

### MUST CREATE NEXT (in dependency order)

- **Phase 1: Utilities**

```plaintext
1. src/lib/utils/debounce.ts (20 lines)
   export function debounce<T extends (...args: any[]) => any>(
     fn: T,
     delay: number
   ): (...args: Parameters<T>) => void
```

- **Phase 2: Type Definitions**

```plaintext
2. src/lib/plugin-api.ts (100-200 lines)
   - PluginHookEvent interface
   - Plugin API type definitions
```

- **Phase 3: Stores (can be created in parallel)**

```plaintext
3. src/lib/stores/editor.ts (100-150 lines)
   - editorStore (writable store)
   - EditorState interface

4. src/lib/stores/theme.ts (150-200 lines)
   - themeStore (writable store)
   - Theme interface
   - Theme loading/switching logic

5. src/lib/stores/ui.ts (80-100 lines)
   - uiStore (writable store)
   - UI state (chrome visibility, etc.)

6. src/lib/stores/plugins.ts (100-150 lines)
   - pluginStore (writable store)
   - Active plugins tracking

7. src/lib/stores/keybindings.ts (100-150 lines)
   - keybindingStore (writable store)
   - Keybinding definitions
```

- **Phase 4: Editor Loader (complex, needs CodeMirror setup)**

```plaintext
8. src/lib/editor-loader.ts (500-700 lines) ⭐ MOST COMPLEX
   - createEditor()
   - destroyEditor()
   - setLanguage()
   - updateTheme()
   - Extension management
   - Language loading
```

- **Phase 5: Backend Commands**

```plaintext
9. src-tauri/src/commands/mod.rs
   pub mod file;
   pub mod plugin;
   pub mod dialog;

10. src-tauri/src/commands/file.rs (200-300 lines)
    - read_file command
    - write_file command
    - get_file_metadata command

11. src-tauri/src/commands/plugin.rs (100-150 lines)
    - plugin_execute_hook command

12. src-tauri/src/commands/dialog.rs (100-150 lines)
    - show_open_dialog command
    - create_new_file command

13. src-tauri/src/main.rs (modifications)
    - Register all commands
    - Initialize state
```

## Dependency Flow Summary

```plaintext
Editor.svelte (750 LOC)
├── REQUIRES: 8 frontend files (1,500-2,000 LOC total)
├── REQUIRES: 4 backend files (500-700 LOC total)
└── DEPENDS ON: CodeMirror 6 (external npm package)

Total Additional Code Required: ~2,000-2,700 LOC
Complexity: ⭐⭐⭐⭐⭐
Integration Points: 12 files across frontend + backend
```

## Critical Path (What to Build First)

```plaintext
1. debounce.ts        (20 lines) ────┐
2. plugin-api.ts      (150 lines)    │
3. All stores         (650 lines)    ├─> Enable Editor.svelte compilation
4. editor-loader.ts   (650 lines) ───┘
                                      │
                                      ▼
5. Backend commands   (700 lines) ───> Enable full Editor.svelte functionality
```

**Recommendation:** Start with stores (they're simpler) to unblock Editor compilation, then tackle `editor-loader.ts` (the most complex piece), finally integrate backend commands for full functionality.
