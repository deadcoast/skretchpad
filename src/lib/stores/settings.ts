// src/lib/stores/settings.ts
// Persistent settings store -- saves/loads via Tauri file commands

import { writable } from 'svelte/store';
import { invoke } from '@tauri-apps/api/core';
import { debounce } from '../utils/debounce';

export interface AppSettings {
  appearance: {
    theme: string;
    fontSize: number;
    fontFamily: string;
  };
  editor: {
    tabSize: number;
    wordWrap: boolean;
    lineNumbers: boolean;
    minimap: boolean;
  };
  files: {
    autoSave: boolean;
    autoSaveDelay: number;
  };
  keybindings: {
    scheme: string;
  };
}

const DEFAULT_SETTINGS: AppSettings = {
  appearance: {
    theme: 'glass-dark',
    fontSize: 14,
    fontFamily: "'SF Mono', 'Cascadia Code', 'Fira Code', 'JetBrains Mono', 'Consolas', monospace",
  },
  editor: {
    tabSize: 2,
    wordWrap: false,
    lineNumbers: true,
    minimap: false,
  },
  files: {
    autoSave: true,
    autoSaveDelay: 1000,
  },
  keybindings: {
    scheme: 'Default',
  },
};

// Settings file path (relative to workspace in dev, app data in prod)
const SETTINGS_FILENAME = 'skretchpad-settings.json';

function createSettingsStore() {
  const { subscribe, set, update } = writable<AppSettings>({ ...DEFAULT_SETTINGS });

  const debouncedSave = debounce(async (settings: AppSettings) => {
    try {
      const json = JSON.stringify(settings, null, 2);
      // Try to save to a well-known location
      // Use the home directory config path
      const homeDir = await getHomePath();
      const configDir = `${homeDir}/.skretchpad`;
      const configPath = `${configDir}/${SETTINGS_FILENAME}`;

      // Ensure config directory exists (write_file creates parent dirs)
      await invoke('write_file', { path: configPath, content: json });
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
  }, 500);

  async function getHomePath(): Promise<string> {
    // Use environment-appropriate path
    try {
      const { homeDir } = await import('@tauri-apps/api/path');
      return await homeDir();
    } catch {
      // Fallback for when path API isn't available
      return process.env.HOME || process.env.USERPROFILE || '.';
    }
  }

  return {
    subscribe,

    async load(): Promise<void> {
      try {
        const homeDir = await getHomePath();
        const configPath = `${homeDir}/.skretchpad/${SETTINGS_FILENAME}`;
        const content = await invoke<string>('read_file', { path: configPath });
        const parsed = JSON.parse(content) as Partial<AppSettings>;

        // Deep merge with defaults to handle missing keys
        const merged: AppSettings = {
          appearance: { ...DEFAULT_SETTINGS.appearance, ...parsed.appearance },
          editor: { ...DEFAULT_SETTINGS.editor, ...parsed.editor },
          files: { ...DEFAULT_SETTINGS.files, ...parsed.files },
          keybindings: { ...DEFAULT_SETTINGS.keybindings, ...parsed.keybindings },
        };

        set(merged);
        console.log('Settings loaded from disk');
      } catch {
        // No saved settings yet -- use defaults
        console.log('Using default settings');
      }
    },

    update(key: keyof AppSettings, section: Partial<AppSettings[keyof AppSettings]>): void {
      update((s) => {
        const newSettings = {
          ...s,
          [key]: { ...(s[key] as Record<string, unknown>), ...section },
        };
        debouncedSave(newSettings);
        return newSettings;
      });
    },

    set(settings: AppSettings): void {
      set(settings);
      debouncedSave(settings);
    },

    reset(): void {
      const defaults = { ...DEFAULT_SETTINGS };
      set(defaults);
      debouncedSave(defaults);
    },

    get defaults(): AppSettings {
      return { ...DEFAULT_SETTINGS };
    },
  };
}

export const settingsStore = createSettingsStore();
