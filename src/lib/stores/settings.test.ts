import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { get } from 'svelte/store';
import { settingsStore, type AppSettings } from './settings';
import { clearInvokeHandlers, mockInvokeHandler, invoke } from '../../test/mocks/tauri-core';

beforeEach(() => {
  vi.useFakeTimers();
  settingsStore.reset();
  clearInvokeHandlers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('settings store', () => {
  it('has correct default values', () => {
    const settings = get(settingsStore);
    expect(settings.appearance.theme).toBe('glass-dark');
    expect(settings.appearance.fontSize).toBe(14);
    expect(settings.editor.tabSize).toBe(2);
    expect(settings.editor.wordWrap).toBe(false);
    expect(settings.editor.lineNumbers).toBe(true);
    expect(settings.editor.minimap).toBe(false);
    expect(settings.files.autoSave).toBe(true);
    expect(settings.files.autoSaveDelay).toBe(1000);
    expect(settings.keybindings.scheme).toBe('Default');
  });

  it('update() modifies individual section', () => {
    settingsStore.update('appearance', { fontSize: 16 });
    const settings = get(settingsStore);
    expect(settings.appearance.fontSize).toBe(16);
    expect(settings.appearance.theme).toBe('glass-dark');
  });

  it('nested settings merge correctly', () => {
    settingsStore.update('editor', { tabSize: 4, wordWrap: true });
    const settings = get(settingsStore);
    expect(settings.editor.tabSize).toBe(4);
    expect(settings.editor.wordWrap).toBe(true);
    expect(settings.editor.lineNumbers).toBe(true);
  });

  it('reset() restores defaults', () => {
    settingsStore.update('appearance', { fontSize: 20 });
    settingsStore.update('editor', { tabSize: 8 });
    settingsStore.reset();
    const settings = get(settingsStore);
    expect(settings.appearance.fontSize).toBe(14);
    expect(settings.editor.tabSize).toBe(2);
  });

  it('defaults getter returns default settings', () => {
    expect(settingsStore.defaults.appearance.fontSize).toBe(14);
    expect(settingsStore.defaults.editor.tabSize).toBe(2);
  });

  it('set() replaces entire settings', () => {
    const newSettings: AppSettings = {
      appearance: { theme: 'light', fontSize: 18, fontFamily: 'monospace' },
      editor: { tabSize: 4, wordWrap: true, lineNumbers: false, minimap: true },
      files: { autoSave: false, autoSaveDelay: 2000 },
      keybindings: { scheme: 'Vim' },
    };
    settingsStore.set(newSettings);
    const settings = get(settingsStore);
    expect(settings.appearance.theme).toBe('light');
    expect(settings.editor.tabSize).toBe(4);
    expect(settings.keybindings.scheme).toBe('Vim');
  });

  it('update() can modify files section', () => {
    settingsStore.update('files', { autoSave: false, autoSaveDelay: 5000 });
    const settings = get(settingsStore);
    expect(settings.files.autoSave).toBe(false);
    expect(settings.files.autoSaveDelay).toBe(5000);
  });

  it('update() can modify keybindings section', () => {
    settingsStore.update('keybindings', { scheme: 'Emacs' });
    const settings = get(settingsStore);
    expect(settings.keybindings.scheme).toBe('Emacs');
  });

  it('load() reads settings from disk', async () => {
    const savedSettings = JSON.stringify({
      appearance: { theme: 'monokai', fontSize: 16, fontFamily: 'Fira Code' },
      editor: { tabSize: 4 },
    });
    mockInvokeHandler('read_file', savedSettings);

    await settingsStore.load();
    const settings = get(settingsStore);
    expect(settings.appearance.theme).toBe('monokai');
    expect(settings.appearance.fontSize).toBe(16);
    // Deep merge fills in missing keys with defaults
    expect(settings.editor.tabSize).toBe(4);
    expect(settings.editor.wordWrap).toBe(false);
    expect(settings.files.autoSave).toBe(true);
  });

  it('load() uses defaults when no saved settings exist', async () => {
    mockInvokeHandler('read_file', () => {
      throw new Error('File not found');
    });

    await settingsStore.load();
    const settings = get(settingsStore);
    expect(settings.appearance.theme).toBe('glass-dark');
  });

  it('multiple updates in sequence', () => {
    settingsStore.update('appearance', { fontSize: 16 });
    settingsStore.update('appearance', { theme: 'light' });
    settingsStore.update('editor', { tabSize: 4 });

    const settings = get(settingsStore);
    expect(settings.appearance.fontSize).toBe(16);
    expect(settings.appearance.theme).toBe('light');
    expect(settings.editor.tabSize).toBe(4);
  });

  it('update() triggers debounced save to disk', async () => {
    mockInvokeHandler('write_file', undefined);

    settingsStore.update('appearance', { fontSize: 20 });

    // Before debounce fires, write_file should not be called
    expect(invoke).not.toHaveBeenCalledWith('write_file', expect.anything());

    // Advance past the 500ms debounce
    await vi.advanceTimersByTimeAsync(600);

    // After debounce, write_file should have been called
    expect(invoke).toHaveBeenCalledWith(
      'write_file',
      expect.objectContaining({
        content: expect.stringContaining('"fontSize": 20'),
      })
    );
  });

  it('set() triggers debounced save to disk', async () => {
    mockInvokeHandler('write_file', undefined);

    const newSettings: AppSettings = {
      appearance: { theme: 'dark', fontSize: 12, fontFamily: 'Fira' },
      editor: { tabSize: 2, wordWrap: false, lineNumbers: true, minimap: false },
      files: { autoSave: true, autoSaveDelay: 1000 },
      keybindings: { scheme: 'Default' },
    };
    settingsStore.set(newSettings);

    await vi.advanceTimersByTimeAsync(600);

    expect(invoke).toHaveBeenCalledWith(
      'write_file',
      expect.objectContaining({
        content: expect.stringContaining('"theme": "dark"'),
      })
    );
  });

  it('save handles write failure gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockInvokeHandler('write_file', () => {
      throw new Error('Write failed');
    });

    settingsStore.update('appearance', { fontSize: 99 });
    await vi.advanceTimersByTimeAsync(600);

    // Should not throw, just log error
    expect(consoleSpy).toHaveBeenCalledWith('Failed to save settings:', expect.any(Error));
    consoleSpy.mockRestore();
  });
});
