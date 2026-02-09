// src/lib/stores/editor.ts

import { writable, derived, get } from 'svelte/store';
import type { EditorView, ViewUpdate } from '@codemirror/view';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { save as showSaveDialog, ask as showConfirmDialog } from '@tauri-apps/plugin-dialog';
import {
  createEditor,
  setLanguage,
  detectLanguage,
  updateTheme,
  destroyEditor,
  getEditorContent,
  setEditorContent,
  getCursorPosition,
  saveEditorState,
  restoreEditorState,
  type EditorStateSnapshot,
} from '../editor-loader';
import { themeStore } from './theme';
import { debounce } from '../utils/debounce';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface OpenFile {
  path: string;
  name: string;
  content: string;
  language?: string;
  isDirty: boolean;
  snapshot?: EditorStateSnapshot;
  lastSaved?: number;
}

export interface Tab {
  id: string;
  file: OpenFile;
  active: boolean;
}

export interface EditorState {
  tabs: Tab[];
  activeTabId: string | null;
  editorView: EditorView | null;
  cursorPosition: { line: number; column: number };
  selection: string;
  canUndo: boolean;
  canRedo: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface EditorAction {
  type: 'open' | 'save' | 'close' | 'create' | 'rename';
  file: string;
  timestamp: number;
}

// ============================================================================
// EDITOR STORE
// ============================================================================

function createEditorStore() {
  const { subscribe, set, update } = writable<EditorState>({
    tabs: [],
    activeTabId: null,
    editorView: null,
    cursorPosition: { line: 1, column: 1 },
    selection: '',
    canUndo: false,
    canRedo: false,
    isLoading: false,
    error: null,
  });

  // Recent actions for undo/redo
  const recentActions: EditorAction[] = [];

  // Debounced save function
  const debouncedSave = debounce(async (path: string, content: string) => {
    try {
      await invoke('save_file', { path, content });

      // Mark file as not dirty
      update((state) => ({
        ...state,
        tabs: state.tabs.map((tab) =>
          tab.file.path === path
            ? { ...tab, file: { ...tab.file, isDirty: false, lastSaved: Date.now() } }
            : tab
        ),
      }));

      // Emit save event for plugins
      await invoke('emit_editor_event', {
        event: 'file:save',
        data: { path },
      });
    } catch (error) {
      console.error('Failed to save file:', error);
      update((state) => ({
        ...state,
        error: `Failed to save file: ${error}`,
      }));
    }
  }, 1000);

  return {
    subscribe,

    /**
     * Initialize editor with container element
     */
    async initialize(container: HTMLElement): Promise<void> {
      const state = get({ subscribe });

      if (state.editorView) {
        console.warn('Editor already initialized');
        return;
      }

      try {
        const theme = get(themeStore).current;

        const view = await createEditor(container, {
          theme: theme || undefined,
          onChange: (viewUpdate: ViewUpdate) => {
            const content = getEditorContent(viewUpdate.view);
            const state = get({ subscribe });

            if (state.activeTabId) {
              // Mark file as dirty
              update((s) => ({
                ...s,
                tabs: s.tabs.map((tab) =>
                  tab.id === s.activeTabId
                    ? { ...tab, file: { ...tab.file, content, isDirty: true } }
                    : tab
                ),
              }));

              // Auto-save
              const activeTab = state.tabs.find((t) => t.id === state.activeTabId);
              if (activeTab) {
                debouncedSave(activeTab.file.path, content);
              }
            }
          },
          onCursorMove: (viewUpdate: ViewUpdate) => {
            const position = getCursorPosition(viewUpdate.view);
            update((state) => ({
              ...state,
              cursorPosition: position,
            }));
          },
          onSelection: (viewUpdate: ViewUpdate) => {
            const selection = viewUpdate.state.selection.main;
            const text = viewUpdate.state.doc.sliceString(selection.from, selection.to);
            update((state) => ({
              ...state,
              selection: text,
            }));
          },
        });

        update((state) => ({
          ...state,
          editorView: view,
        }));

        // Subscribe to theme changes
        themeStore.subscribe(($theme) => {
          if ($theme.current && view) {
            updateTheme(view, $theme.current);
          }
        });
      } catch (error) {
        console.error('Failed to initialize editor:', error);
        update((state) => ({
          ...state,
          error: `Failed to initialize editor: ${error}`,
        }));
      }
    },

    /**
     * Open a file in a new tab
     */
    async openFile(path: string): Promise<void> {
      update((state) => ({ ...state, isLoading: true, error: null }));

      try {
        // Check if file is already open
        const state = get({ subscribe });
        const existingTab = state.tabs.find((tab) => tab.file.path === path);

        if (existingTab) {
          // Switch to existing tab
          await editorStore.switchTab(existingTab.id);
          update((s) => ({ ...s, isLoading: false }));
          return;
        }

        // Read file content
        const content = await invoke<string>('read_file', { path });

        // Get file name
        const name = path.split('/').pop() || 'Untitled';

        // Detect language
        const language = detectLanguage(name);

        // Create new file object
        const file: OpenFile = {
          path,
          name,
          content,
          language: language || undefined,
          isDirty: false,
          lastSaved: Date.now(),
        };

        // Create new tab
        const tab: Tab = {
          id: `tab-${Date.now()}-${Math.random()}`,
          file,
          active: true,
        };

        update((state) => {
          // Save current editor state
          const currentTab = state.tabs.find((t) => t.id === state.activeTabId);
          if (currentTab && state.editorView) {
            currentTab.file.snapshot = saveEditorState(state.editorView);
          }

          return {
            ...state,
            tabs: [...state.tabs.map((t) => ({ ...t, active: false })), tab],
            activeTabId: tab.id,
            isLoading: false,
          };
        });

        // Update editor content
        await editorStore.updateEditorContent(content, language || null);

        // Record action
        recentActions.push({
          type: 'open',
          file: path,
          timestamp: Date.now(),
        });

        // Emit event for plugins
        await invoke('emit_editor_event', {
          event: 'file:open',
          data: { path, name },
        });
      } catch (error) {
        console.error('Failed to open file:', error);
        update((state) => ({
          ...state,
          isLoading: false,
          error: `Failed to open file: ${error}`,
        }));
      }
    },

    /**
     * Create a new untitled file
     */
    async createFile(): Promise<void> {
      const file: OpenFile = {
        path: '',
        name: 'Untitled',
        content: '',
        isDirty: true,
      };

      const tab: Tab = {
        id: `tab-${Date.now()}-${Math.random()}`,
        file,
        active: true,
      };

      update((state) => ({
        ...state,
        tabs: [...state.tabs.map((t) => ({ ...t, active: false })), tab],
        activeTabId: tab.id,
      }));

      await editorStore.updateEditorContent('', null);

      recentActions.push({
        type: 'create',
        file: 'Untitled',
        timestamp: Date.now(),
      });
    },

    /**
     * Save the active file
     */
    async saveFile(): Promise<void> {
      const state = get({ subscribe });

      if (!state.activeTabId) {
        return;
      }

      const activeTab = state.tabs.find((tab) => tab.id === state.activeTabId);

      if (!activeTab) {
        return;
      }

      // If file has no path, prompt for save location
      if (!activeTab.file.path) {
        await editorStore.saveFileAs();
        return;
      }

      try {
        const content = state.editorView
          ? getEditorContent(state.editorView)
          : activeTab.file.content;

        await invoke('save_file', {
          path: activeTab.file.path,
          content,
        });

        update((s) => ({
          ...s,
          tabs: s.tabs.map((tab) =>
            tab.id === s.activeTabId
              ? {
                  ...tab,
                  file: {
                    ...tab.file,
                    content,
                    isDirty: false,
                    lastSaved: Date.now(),
                  },
                }
              : tab
          ),
        }));

        recentActions.push({
          type: 'save',
          file: activeTab.file.path,
          timestamp: Date.now(),
        });

        // Emit event for plugins
        await invoke('emit_editor_event', {
          event: 'file:save',
          data: { path: activeTab.file.path },
        });
      } catch (error) {
        console.error('Failed to save file:', error);
        update((s) => ({
          ...s,
          error: `Failed to save file: ${error}`,
        }));
      }
    },

    /**
     * Save file with new path (Save As)
     */
    async saveFileAs(): Promise<void> {
      try {
        const path = await showSaveDialog({
          title: 'Save File As',
          filters: [{ name: 'All Files', extensions: ['*'] }],
        });

        if (!path) {
          return;
        }

        const state = get({ subscribe });

        if (!state.activeTabId || !state.editorView) {
          return;
        }

        const content = getEditorContent(state.editorView);
        const name = path.split('/').pop() || 'Untitled';

        await invoke('save_file', { path, content });

        update((s) => ({
          ...s,
          tabs: s.tabs.map((tab) =>
            tab.id === s.activeTabId
              ? {
                  ...tab,
                  file: {
                    ...tab.file,
                    path,
                    name,
                    content,
                    isDirty: false,
                    lastSaved: Date.now(),
                  },
                }
              : tab
          ),
        }));

        recentActions.push({
          type: 'save',
          file: path,
          timestamp: Date.now(),
        });
      } catch (error) {
        console.error('Failed to save file:', error);
        update((s) => ({
          ...s,
          error: `Failed to save file: ${error}`,
        }));
      }
    },

    /**
     * Close a tab
     */
    async closeTab(tabId: string): Promise<void> {
      const state = get({ subscribe });
      const tab = state.tabs.find((t) => t.id === tabId);

      if (!tab) {
        return;
      }

      // Check if file is dirty
      if (tab.file.isDirty) {
        const shouldSave = await showConfirmDialog(
          `Do you want to save changes to ${tab.file.name}?`,
          { title: 'Unsaved Changes', kind: 'warning' }
        );

        if (shouldSave) {
          // Switch to tab and save
          await editorStore.switchTab(tabId);
          await editorStore.saveFile();
        }
      }

      update((s) => {
        const newTabs = s.tabs.filter((t) => t.id !== tabId);

        // If closing active tab, activate another tab
        let newActiveTabId = s.activeTabId;
        if (s.activeTabId === tabId) {
          newActiveTabId = newTabs.length > 0 ? newTabs[newTabs.length - 1].id : null;
        }

        return {
          ...s,
          tabs: newTabs,
          activeTabId: newActiveTabId,
        };
      });

      // If there's a new active tab, load its content
      const newState = get({ subscribe });
      if (newState.activeTabId) {
        const newActiveTab = newState.tabs.find((t) => t.id === newState.activeTabId);
        if (newActiveTab) {
          await editorStore.updateEditorContent(
            newActiveTab.file.content,
            newActiveTab.file.language || null
          );

          // Restore editor state if available
          if (newActiveTab.file.snapshot && newState.editorView) {
            restoreEditorState(newState.editorView, newActiveTab.file.snapshot);
          }
        }
      }

      recentActions.push({
        type: 'close',
        file: tab.file.path,
        timestamp: Date.now(),
      });

      // Emit event for plugins
      await invoke('emit_editor_event', {
        event: 'file:close',
        data: { path: tab.file.path },
      });
    },

    /**
     * Switch to a different tab
     */
    async switchTab(tabId: string): Promise<void> {
      const state = get({ subscribe });

      // Save current tab state
      const currentTab = state.tabs.find((t) => t.id === state.activeTabId);
      if (currentTab && state.editorView) {
        currentTab.file.snapshot = saveEditorState(state.editorView);
      }

      update((s) => ({
        ...s,
        tabs: s.tabs.map((tab) => ({
          ...tab,
          active: tab.id === tabId,
        })),
        activeTabId: tabId,
      }));

      // Load new tab content
      const newTab = state.tabs.find((t) => t.id === tabId);
      if (newTab) {
        await editorStore.updateEditorContent(newTab.file.content, newTab.file.language || null);

        // Restore editor state if available
        if (newTab.file.snapshot && state.editorView) {
          restoreEditorState(state.editorView, newTab.file.snapshot);
        }
      }
    },

    /**
     * Update editor content and language
     */
    async updateEditorContent(content: string, language: string | null): Promise<void> {
      const state = get({ subscribe });

      if (!state.editorView) {
        return;
      }

      setEditorContent(state.editorView, content);

      if (language) {
        await setLanguage(state.editorView, language);
      }
    },

    /**
     * Get active file
     */
    getActiveFile(): OpenFile | null {
      const state = get({ subscribe });
      const activeTab = state.tabs.find((tab) => tab.id === state.activeTabId);
      return activeTab?.file || null;
    },

    /**
     * Close all tabs
     */
    async closeAll(): Promise<void> {
      const state = get({ subscribe });

      for (const tab of state.tabs) {
        await editorStore.closeTab(tab.id);
      }
    },

    /**
     * Save all files
     */
    async saveAll(): Promise<void> {
      const state = get({ subscribe });

      for (const tab of state.tabs) {
        if (tab.file.isDirty && tab.file.path) {
          await editorStore.switchTab(tab.id);
          await editorStore.saveFile();
        }
      }
    },

    /**
     * Reload file from disk
     */
    async reloadFile(path: string): Promise<void> {
      try {
        const content = await invoke<string>('read_file', { path });

        update((state) => ({
          ...state,
          tabs: state.tabs.map((tab) =>
            tab.file.path === path
              ? {
                  ...tab,
                  file: {
                    ...tab.file,
                    content,
                    isDirty: false,
                    lastSaved: Date.now(),
                  },
                }
              : tab
          ),
        }));

        // If this is the active file, update editor
        const state = get({ subscribe });
        const activeTab = state.tabs.find((t) => t.id === state.activeTabId);
        if (activeTab && activeTab.file.path === path) {
          await editorStore.updateEditorContent(content, activeTab.file.language || null);
        }
      } catch (error) {
        console.error('Failed to reload file:', error);
        update((state) => ({
          ...state,
          error: `Failed to reload file: ${error}`,
        }));
      }
    },

    /**
     * Get recent actions
     */
    getRecentActions(): EditorAction[] {
      return [...recentActions];
    },

    /**
     * Reorder tabs (for drag-and-drop)
     */
    reorderTabs(fromIndex: number, toIndex: number): void {
      update((state) => {
        const tabs = [...state.tabs];
        if (fromIndex < 0 || fromIndex >= tabs.length || toIndex < 0 || toIndex >= tabs.length) {
          return state;
        }
        const [moved] = tabs.splice(fromIndex, 1);
        tabs.splice(toIndex, 0, moved);
        return { ...state, tabs };
      });
    },

    /**
     * Close all tabs except the specified one
     */
    async closeOtherTabs(tabId: string): Promise<void> {
      const state = get({ subscribe });
      const otherTabs = state.tabs.filter((t) => t.id !== tabId);
      for (const tab of otherTabs) {
        await editorStore.closeTab(tab.id);
      }
    },

    /**
     * Close all tabs to the right of the specified one
     */
    async closeTabsToRight(tabId: string): Promise<void> {
      const state = get({ subscribe });
      const index = state.tabs.findIndex((t) => t.id === tabId);
      if (index === -1) return;
      const tabsToClose = state.tabs.slice(index + 1);
      for (const tab of tabsToClose) {
        await editorStore.closeTab(tab.id);
      }
    },

    /**
     * Clear error
     */
    clearError(): void {
      update((state) => ({
        ...state,
        error: null,
      }));
    },

    /**
     * Cleanup editor
     */
    cleanup(): void {
      const state = get({ subscribe });

      if (state.editorView) {
        destroyEditor(state.editorView);
      }

      set({
        tabs: [],
        activeTabId: null,
        editorView: null,
        cursorPosition: { line: 1, column: 1 },
        selection: '',
        canUndo: false,
        canRedo: false,
        isLoading: false,
        error: null,
      });
    },
  };
}

export const editorStore = createEditorStore();

// ============================================================================
// DERIVED STORES
// ============================================================================

/**
 * Active file
 */
export const activeFile = derived(editorStore, ($editor) => {
  const activeTab = $editor.tabs.find((tab) => tab.id === $editor.activeTabId);
  return activeTab?.file || null;
});

/**
 * Has unsaved changes
 */
export const hasUnsavedChanges = derived(editorStore, ($editor) =>
  $editor.tabs.some((tab) => tab.file.isDirty)
);

/**
 * Open file count
 */
export const openFileCount = derived(editorStore, ($editor) => $editor.tabs.length);

/**
 * Active tab
 */
export const activeTab = derived(editorStore, ($editor) =>
  $editor.tabs.find((tab) => tab.id === $editor.activeTabId)
);

// ============================================================================
// EVENT LISTENERS
// ============================================================================

// Listen for file changes from backend
if (typeof window !== 'undefined') {
  listen<{ path: string }>('file:changed', async (event) => {
    const { path } = event.payload;
    await editorStore.reloadFile(path);
  }).catch(console.error);

  listen<{ path: string }>('file:deleted', async (event) => {
    const { path } = event.payload;
    const state = get(editorStore);
    const tab = state.tabs.find((t) => t.file.path === path);
    if (tab) {
      await editorStore.closeTab(tab.id);
    }
  }).catch(console.error);

  // Handle before unload
  window.addEventListener('beforeunload', (e) => {
    const state = get(editorStore);
    if (state.tabs.some((tab) => tab.file.isDirty)) {
      e.preventDefault();
      e.returnValue = '';
    }
  });
}
