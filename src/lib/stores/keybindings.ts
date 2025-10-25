// src/lib/stores/keybindings.ts

import { writable, derived, get } from 'svelte/store';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type KeyModifier = 'Ctrl' | 'Shift' | 'Alt' | 'Cmd' | 'Meta';

export interface Keybinding {
  key: string;
  modifiers: KeyModifier[];
  command: string;
  when?: string; // Context condition
  args?: Record<string, any>;
}

export type Keybindings = Record<string, Keybinding>;

export interface KeybindingScheme {
  name: string;
  description: string;
  author: string;
  bindings: Keybindings;
}

export interface KeybindingState {
  current: Keybindings;
  currentScheme: KeybindingScheme | null;
  available: KeybindingScheme[];
  customBindings: Keybindings;
  loading: boolean;
  error: string | null;
}

export interface KeyEvent {
  key: string;
  code: string;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  metaKey: boolean;
}

// ============================================================================
// DEFAULT KEYBINDING SCHEMES
// ============================================================================

const DEFAULT_SCHEME: KeybindingScheme = {
  name: 'Default',
  description: 'Default keybindings for skretchpad',
  author: 'skretchpad',
  bindings: {
    // File operations
    'Ctrl+O': {
      key: 'o',
      modifiers: ['Ctrl'],
      command: 'file.open',
    },
    'Ctrl+S': {
      key: 's',
      modifiers: ['Ctrl'],
      command: 'file.save',
    },
    'Ctrl+Shift+S': {
      key: 's',
      modifiers: ['Ctrl', 'Shift'],
      command: 'file.saveAs',
    },
    'Ctrl+W': {
      key: 'w',
      modifiers: ['Ctrl'],
      command: 'file.close',
    },
    'Ctrl+N': {
      key: 'n',
      modifiers: ['Ctrl'],
      command: 'file.new',
    },

    // Edit operations
    'Ctrl+Z': {
      key: 'z',
      modifiers: ['Ctrl'],
      command: 'edit.undo',
    },
    'Ctrl+Y': {
      key: 'y',
      modifiers: ['Ctrl'],
      command: 'edit.redo',
    },
    'Ctrl+Shift+Z': {
      key: 'z',
      modifiers: ['Ctrl', 'Shift'],
      command: 'edit.redo',
    },
    'Ctrl+C': {
      key: 'c',
      modifiers: ['Ctrl'],
      command: 'edit.copy',
    },
    'Ctrl+X': {
      key: 'x',
      modifiers: ['Ctrl'],
      command: 'edit.cut',
    },
    'Ctrl+V': {
      key: 'v',
      modifiers: ['Ctrl'],
      command: 'edit.paste',
    },
    'Ctrl+A': {
      key: 'a',
      modifiers: ['Ctrl'],
      command: 'edit.selectAll',
    },
    'Ctrl+/': {
      key: '/',
      modifiers: ['Ctrl'],
      command: 'edit.toggleComment',
    },
    'Ctrl+D': {
      key: 'd',
      modifiers: ['Ctrl'],
      command: 'edit.duplicateLine',
    },
    'Ctrl+Shift+K': {
      key: 'k',
      modifiers: ['Ctrl', 'Shift'],
      command: 'edit.deleteLine',
    },

    // Search operations
    'Ctrl+F': {
      key: 'f',
      modifiers: ['Ctrl'],
      command: 'search.find',
    },
    'Ctrl+H': {
      key: 'h',
      modifiers: ['Ctrl'],
      command: 'search.replace',
    },
    'F3': {
      key: 'F3',
      modifiers: [],
      command: 'search.findNext',
    },
    'Shift+F3': {
      key: 'F3',
      modifiers: ['Shift'],
      command: 'search.findPrevious',
    },

    // View operations
    'Ctrl+Shift+H': {
      key: 'h',
      modifiers: ['Ctrl', 'Shift'],
      command: 'view.toggleChrome',
    },
    'Ctrl+P': {
      key: 'p',
      modifiers: ['Ctrl'],
      command: 'view.togglePin',
    },
    'Ctrl+,': {
      key: ',',
      modifiers: ['Ctrl'],
      command: 'view.openSettings',
    },
    'Ctrl+Shift+P': {
      key: 'p',
      modifiers: ['Ctrl', 'Shift'],
      command: 'view.commandPalette',
    },

    // Navigation
    'Ctrl+G': {
      key: 'g',
      modifiers: ['Ctrl'],
      command: 'navigation.gotoLine',
    },
    'Ctrl+Tab': {
      key: 'Tab',
      modifiers: ['Ctrl'],
      command: 'navigation.nextTab',
    },
    'Ctrl+Shift+Tab': {
      key: 'Tab',
      modifiers: ['Ctrl', 'Shift'],
      command: 'navigation.previousTab',
    },

    // Formatting
    'Shift+Alt+F': {
      key: 'f',
      modifiers: ['Shift', 'Alt'],
      command: 'format.document',
    },

    // Git commands
    'Ctrl+Shift+G': {
      key: 'g',
      modifiers: ['Ctrl', 'Shift'],
      command: 'git.status',
    },
    'Ctrl+K': {
      key: 'k',
      modifiers: ['Ctrl'],
      command: 'git.commit',
      when: 'gitAvailable',
    },

    // Terminal
    'Ctrl+`': {
      key: '`',
      modifiers: ['Ctrl'],
      command: 'terminal.toggle',
    },
  },
};

const VIM_SCHEME: KeybindingScheme = {
  name: 'Vim',
  description: 'Vim-style keybindings',
  author: 'skretchpad',
  bindings: {
    // Normal mode navigation
    'h': {
      key: 'h',
      modifiers: [],
      command: 'vim.moveLeft',
      when: 'vim.normalMode',
    },
    'j': {
      key: 'j',
      modifiers: [],
      command: 'vim.moveDown',
      when: 'vim.normalMode',
    },
    'k': {
      key: 'k',
      modifiers: [],
      command: 'vim.moveUp',
      when: 'vim.normalMode',
    },
    'l': {
      key: 'l',
      modifiers: [],
      command: 'vim.moveRight',
      when: 'vim.normalMode',
    },
    'i': {
      key: 'i',
      modifiers: [],
      command: 'vim.insertMode',
      when: 'vim.normalMode',
    },
    'a': {
      key: 'a',
      modifiers: [],
      command: 'vim.appendMode',
      when: 'vim.normalMode',
    },
    'Escape': {
      key: 'Escape',
      modifiers: [],
      command: 'vim.normalMode',
      when: 'vim.insertMode',
    },
    // ... more vim bindings would go here
  },
};

const EMACS_SCHEME: KeybindingScheme = {
  name: 'Emacs',
  description: 'Emacs-style keybindings',
  author: 'skretchpad',
  bindings: {
    'Ctrl+F': {
      key: 'f',
      modifiers: ['Ctrl'],
      command: 'emacs.moveForward',
    },
    'Ctrl+B': {
      key: 'b',
      modifiers: ['Ctrl'],
      command: 'emacs.moveBackward',
    },
    'Ctrl+N': {
      key: 'n',
      modifiers: ['Ctrl'],
      command: 'emacs.moveDown',
    },
    'Ctrl+P': {
      key: 'p',
      modifiers: ['Ctrl'],
      command: 'emacs.moveUp',
    },
    'Ctrl+A': {
      key: 'a',
      modifiers: ['Ctrl'],
      command: 'emacs.moveLineStart',
    },
    'Ctrl+E': {
      key: 'e',
      modifiers: ['Ctrl'],
      command: 'emacs.moveLineEnd',
    },
    // ... more emacs bindings would go here
  },
};

// ============================================================================
// KEYBINDING STORE
// ============================================================================

function createKeybindingStore() {
  const { subscribe, set, update } = writable<KeybindingState>({
    current: DEFAULT_SCHEME.bindings,
    currentScheme: DEFAULT_SCHEME,
    available: [DEFAULT_SCHEME, VIM_SCHEME, EMACS_SCHEME],
    customBindings: {},
    loading: false,
    error: null,
  });

  return {
    subscribe,

    /**
     * Set keybinding scheme
     */
    setScheme: (scheme: KeybindingScheme) => {
      update((state) => ({
        ...state,
        current: { ...scheme.bindings, ...state.customBindings },
        currentScheme: scheme,
      }));
    },

    /**
     * Load scheme by name
     */
    loadScheme: async (schemeName: string) => {
      const state = get({ subscribe });
      const scheme = state.available.find((s) => s.name === schemeName);

      if (scheme) {
        keybindingStore.setScheme(scheme);
      } else {
        // Try loading from backend
        try {
          const loadedScheme = await invoke<KeybindingScheme>('load_keybinding_scheme', {
            schemeName,
          });

          update((s) => ({
            ...s,
            available: [...s.available, loadedScheme],
            current: { ...loadedScheme.bindings, ...s.customBindings },
            currentScheme: loadedScheme,
          }));
        } catch (error) {
          console.error('Failed to load keybinding scheme:', error);
          throw error;
        }
      }
    },

    /**
     * Add custom keybinding
     */
    addCustomBinding: (id: string, binding: Keybinding) => {
      update((state) => {
        const customBindings = { ...state.customBindings, [id]: binding };
        return {
          ...state,
          customBindings,
          current: { ...state.current, [id]: binding },
        };
      });
    },

    /**
     * Remove custom keybinding
     */
    removeCustomBinding: (id: string) => {
      update((state) => {
        const customBindings = { ...state.customBindings };
        delete customBindings[id];

        const current = { ...state.current };
        delete current[id];

        return {
          ...state,
          customBindings,
          current,
        };
      });
    },

    /**
     * Reset to default scheme
     */
    resetToDefault: () => {
      update((state) => ({
        ...state,
        current: { ...DEFAULT_SCHEME.bindings, ...state.customBindings },
        currentScheme: DEFAULT_SCHEME,
      }));
    },

    /**
     * Clear all custom bindings
     */
    clearCustomBindings: () => {
      update((state) => ({
        ...state,
        customBindings: {},
        current: state.currentScheme
          ? state.currentScheme.bindings
          : DEFAULT_SCHEME.bindings,
      }));
    },

    /**
     * Get command for key event
     */
    getCommand: (event: KeyEvent): string | null => {
      const state = get({ subscribe });
      const id = keybindingToString(eventToKeybinding(event));

      const binding = state.current[id];
      if (!binding) return null;

      // Check context condition if specified
      if (binding.when && !evaluateContext(binding.when)) {
        return null;
      }

      return binding.command;
    },

    /**
     * Execute keybinding
     */
    execute: async (event: KeyEvent): Promise<boolean> => {
      const command = keybindingStore.getCommand(event);
      if (!command) return false;

      try {
        await invoke('execute_command', { command });
        return true;
      } catch (error) {
        console.error('Failed to execute command:', error);
        return false;
      }
    },
  };
}

export const keybindingStore = createKeybindingStore();

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert keyboard event to keybinding
 */
function eventToKeybinding(event: KeyEvent): Keybinding {
  const modifiers: KeyModifier[] = [];

  if (event.ctrlKey || event.metaKey) {
    modifiers.push(isMac() ? 'Cmd' : 'Ctrl');
  }
  if (event.shiftKey) {
    modifiers.push('Shift');
  }
  if (event.altKey) {
    modifiers.push('Alt');
  }

  return {
    key: event.key,
    modifiers,
    command: '',
  };
}

/**
 * Convert keybinding to string ID
 */
function keybindingToString(binding: Keybinding): string {
  const parts: string[] = [];

  if (binding.modifiers.includes('Ctrl') || binding.modifiers.includes('Cmd')) {
    parts.push('Ctrl');
  }
  if (binding.modifiers.includes('Shift')) {
    parts.push('Shift');
  }
  if (binding.modifiers.includes('Alt')) {
    parts.push('Alt');
  }

  parts.push(binding.key);

  return parts.join('+');
}

/**
 * Parse keybinding string
 */
export function parseKeybinding(str: string): Keybinding {
  const parts = str.split('+');
  const key = parts[parts.length - 1];
  const modifiers = parts.slice(0, -1) as KeyModifier[];

  return {
    key,
    modifiers,
    command: '',
  };
}

/**
 * Check if running on macOS
 */
function isMac(): boolean {
  return typeof window !== 'undefined' && /Mac/.test(window.navigator.platform);
}

/**
 * Evaluate context condition
 */
function evaluateContext(condition: string): boolean {
  // This is a simplified implementation
  // In production, this would be more robust with proper context tracking

  const contexts = {
    'vim.normalMode': false,
    'vim.insertMode': false,
    gitAvailable: true,
    // Add more contexts as needed
  };

  return contexts[condition] ?? true;
}

/**
 * Format keybinding for display
 */
export function formatKeybinding(binding: Keybinding): string {
  const parts: string[] = [];

  const isMacOS = isMac();

  for (const mod of binding.modifiers) {
    if (mod === 'Ctrl' || mod === 'Cmd') {
      parts.push(isMacOS ? '⌘' : 'Ctrl');
    } else if (mod === 'Shift') {
      parts.push(isMacOS ? '⇧' : 'Shift');
    } else if (mod === 'Alt') {
      parts.push(isMacOS ? '⌥' : 'Alt');
    }
  }

  // Format key
  const key = binding.key;
  if (key === ' ') {
    parts.push('Space');
  } else if (key.length === 1) {
    parts.push(key.toUpperCase());
  } else {
    parts.push(key);
  }

  return parts.join(isMacOS ? '' : '+');
}

// ============================================================================
// DERIVED STORES
// ============================================================================

/**
 * Current scheme name
 */
export const currentSchemeName = derived(
  keybindingStore,
  ($kb) => $kb.currentScheme?.name || 'Custom'
);

/**
 * Has custom bindings
 */
export const hasCustomBindings = derived(
  keybindingStore,
  ($kb) => Object.keys($kb.customBindings).length > 0
);

/**
 * All keybindings as array
 */
export const keybindingArray = derived(keybindingStore, ($kb) =>
  Object.entries($kb.current).map(([id, binding]) => ({
    id,
    ...binding,
  }))
);

// ============================================================================
// EVENT LISTENERS
// ============================================================================

// Global keyboard event handler
if (typeof window !== 'undefined') {
  window.addEventListener('keydown', async (event) => {
    // Don't handle events from input fields
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement
    ) {
      return;
    }

    const keyEvent: KeyEvent = {
      key: event.key,
      code: event.code,
      ctrlKey: event.ctrlKey,
      shiftKey: event.shiftKey,
      altKey: event.altKey,
      metaKey: event.metaKey,
    };

    const handled = await keybindingStore.execute(keyEvent);

    if (handled) {
      event.preventDefault();
      event.stopPropagation();
    }
  });

  // Listen for keybinding changes from backend
  listen<KeybindingScheme>('keybindings:changed', (event) => {
    keybindingStore.setScheme(event.payload);
  }).catch(console.error);
}