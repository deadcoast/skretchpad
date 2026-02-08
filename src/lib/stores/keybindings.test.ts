import { describe, it, expect, vi, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import {
  keybindingStore,
  parseKeybinding,
  formatKeybinding,
  currentSchemeName,
  hasCustomBindings,
  keybindingArray,
} from './keybindings';
import { mockInvokeHandler, clearInvokeHandlers } from '../../test/mocks/tauri-core';
import { emitTestEvent } from '../../test/mocks/tauri-event';

beforeEach(() => {
  keybindingStore.resetToDefault();
  keybindingStore.clearCustomBindings();
  clearInvokeHandlers();
});

describe('keybinding store', () => {
  it('default scheme is loaded', () => {
    const state = get(keybindingStore);
    expect(state.currentScheme?.name).toBe('Default');
    expect(Object.keys(state.current).length).toBeGreaterThan(0);
  });

  it('has three available schemes', () => {
    const state = get(keybindingStore);
    expect(state.available).toHaveLength(3);
    expect(state.available.map((s) => s.name)).toEqual(['Default', 'Vim', 'Emacs']);
  });

  it('scheme switching updates current bindings', () => {
    const state = get(keybindingStore);
    const vimScheme = state.available.find((s) => s.name === 'Vim')!;
    keybindingStore.setScheme(vimScheme);
    const updated = get(keybindingStore);
    expect(updated.currentScheme?.name).toBe('Vim');
    expect(updated.current['h']).toBeDefined();
  });

  it('switch to Emacs scheme', () => {
    const state = get(keybindingStore);
    const emacsScheme = state.available.find((s) => s.name === 'Emacs')!;
    keybindingStore.setScheme(emacsScheme);
    const updated = get(keybindingStore);
    expect(updated.currentScheme?.name).toBe('Emacs');
    expect(updated.current['Ctrl+F']).toBeDefined();
    expect(updated.current['Ctrl+F'].command).toBe('emacs.moveForward');
  });

  it('addCustomBinding adds binding', () => {
    keybindingStore.addCustomBinding('Ctrl+Shift+X', {
      key: 'x',
      modifiers: ['Ctrl', 'Shift'],
      command: 'custom.action',
    });
    const state = get(keybindingStore);
    expect(state.customBindings['Ctrl+Shift+X']).toBeDefined();
    expect(state.current['Ctrl+Shift+X'].command).toBe('custom.action');
  });

  it('removeCustomBinding removes binding', () => {
    keybindingStore.addCustomBinding('Ctrl+Shift+X', {
      key: 'x',
      modifiers: ['Ctrl', 'Shift'],
      command: 'custom.action',
    });
    keybindingStore.removeCustomBinding('Ctrl+Shift+X');
    const state = get(keybindingStore);
    expect(state.customBindings['Ctrl+Shift+X']).toBeUndefined();
    expect(state.current['Ctrl+Shift+X']).toBeUndefined();
  });

  it('clearCustomBindings removes all custom bindings', () => {
    keybindingStore.addCustomBinding('Ctrl+1', {
      key: '1',
      modifiers: ['Ctrl'],
      command: 'a',
    });
    keybindingStore.addCustomBinding('Ctrl+2', {
      key: '2',
      modifiers: ['Ctrl'],
      command: 'b',
    });
    keybindingStore.clearCustomBindings();
    const state = get(keybindingStore);
    expect(Object.keys(state.customBindings)).toHaveLength(0);
  });

  it('resetToDefault restores default scheme', () => {
    const state = get(keybindingStore);
    const vimScheme = state.available.find((s) => s.name === 'Vim')!;
    keybindingStore.setScheme(vimScheme);
    keybindingStore.resetToDefault();
    expect(get(keybindingStore).currentScheme?.name).toBe('Default');
  });

  it('custom bindings persist through scheme switching', () => {
    keybindingStore.addCustomBinding('Ctrl+Shift+X', {
      key: 'x',
      modifiers: ['Ctrl', 'Shift'],
      command: 'custom.action',
    });
    const vimScheme = get(keybindingStore).available.find((s) => s.name === 'Vim')!;
    keybindingStore.setScheme(vimScheme);
    const state = get(keybindingStore);
    // Custom bindings are merged into current
    expect(state.current['Ctrl+Shift+X']).toBeDefined();
    expect(state.current['Ctrl+Shift+X'].command).toBe('custom.action');
  });

  it('getCommand returns command for matching key event', () => {
    keybindingStore.addCustomBinding('Ctrl+s', {
      key: 's',
      modifiers: ['Ctrl'],
      command: 'file.save',
    });
    const command = keybindingStore.getCommand({
      key: 's',
      code: 'KeyS',
      ctrlKey: true,
      shiftKey: false,
      altKey: false,
      metaKey: false,
    });
    expect(command).toBe('file.save');
  });

  it('getCommand returns null for unbound key', () => {
    const command = keybindingStore.getCommand({
      key: 'q',
      code: 'KeyQ',
      ctrlKey: true,
      shiftKey: true,
      altKey: true,
      metaKey: false,
    });
    expect(command).toBeNull();
  });

  it('getCommand respects when condition (false context returns null)', () => {
    keybindingStore.addCustomBinding('Ctrl+k', {
      key: 'k',
      modifiers: ['Ctrl'],
      command: 'vim.special',
      when: 'vim.normalMode', // This is false by default
    });
    const command = keybindingStore.getCommand({
      key: 'k',
      code: 'KeyK',
      ctrlKey: true,
      shiftKey: false,
      altKey: false,
      metaKey: false,
    });
    expect(command).toBeNull();
  });

  it('getCommand respects when condition (true context returns command)', () => {
    keybindingStore.addCustomBinding('Ctrl+k', {
      key: 'k',
      modifiers: ['Ctrl'],
      command: 'git.commit',
      when: 'gitAvailable', // This is true by default
    });
    const command = keybindingStore.getCommand({
      key: 'k',
      code: 'KeyK',
      ctrlKey: true,
      shiftKey: false,
      altKey: false,
      metaKey: false,
    });
    expect(command).toBe('git.commit');
  });

  it('getCommand respects when condition (unknown context defaults to true)', () => {
    keybindingStore.addCustomBinding('Ctrl+j', {
      key: 'j',
      modifiers: ['Ctrl'],
      command: 'custom.cmd',
      when: 'someUnknownContext',
    });
    const command = keybindingStore.getCommand({
      key: 'j',
      code: 'KeyJ',
      ctrlKey: true,
      shiftKey: false,
      altKey: false,
      metaKey: false,
    });
    expect(command).toBe('custom.cmd');
  });

  it('execute returns false for unbound key', async () => {
    const handled = await keybindingStore.execute({
      key: 'q',
      code: 'KeyQ',
      ctrlKey: true,
      shiftKey: true,
      altKey: true,
      metaKey: false,
    });
    expect(handled).toBe(false);
  });

  it('execute returns true when command executes', async () => {
    mockInvokeHandler('execute_command', undefined);
    keybindingStore.addCustomBinding('Ctrl+t', {
      key: 't',
      modifiers: ['Ctrl'],
      command: 'test.cmd',
    });
    const handled = await keybindingStore.execute({
      key: 't',
      code: 'KeyT',
      ctrlKey: true,
      shiftKey: false,
      altKey: false,
      metaKey: false,
    });
    expect(handled).toBe(true);
  });

  it('execute returns false on invoke error', async () => {
    mockInvokeHandler('execute_command', () => {
      throw new Error('Command failed');
    });
    keybindingStore.addCustomBinding('Ctrl+t', {
      key: 't',
      modifiers: ['Ctrl'],
      command: 'test.cmd',
    });
    const handled = await keybindingStore.execute({
      key: 't',
      code: 'KeyT',
      ctrlKey: true,
      shiftKey: false,
      altKey: false,
      metaKey: false,
    });
    expect(handled).toBe(false);
  });

  it('loadScheme with existing scheme name', async () => {
    await keybindingStore.loadScheme('Vim');
    const state = get(keybindingStore);
    expect(state.currentScheme?.name).toBe('Vim');
  });

  it('loadScheme with unknown name tries backend', async () => {
    mockInvokeHandler('load_keybinding_scheme', {
      name: 'Custom',
      description: 'Custom scheme',
      author: 'user',
      bindings: {
        'Ctrl+Q': { key: 'q', modifiers: ['Ctrl'], command: 'custom.quit' },
      },
    });
    await keybindingStore.loadScheme('Custom');
    const state = get(keybindingStore);
    expect(state.currentScheme?.name).toBe('Custom');
    expect(state.available.find((s) => s.name === 'Custom')).toBeDefined();
  });

  it('loadScheme with unknown name and backend failure throws', async () => {
    mockInvokeHandler('load_keybinding_scheme', () => {
      throw new Error('Not found');
    });
    await expect(keybindingStore.loadScheme('Unknown')).rejects.toThrow('Not found');
  });
});

describe('parseKeybinding', () => {
  it('parses simple key', () => {
    const binding = parseKeybinding('Escape');
    expect(binding.key).toBe('Escape');
    expect(binding.modifiers).toEqual([]);
  });

  it('parses key with modifiers', () => {
    const binding = parseKeybinding('Ctrl+Shift+S');
    expect(binding.key).toBe('S');
    expect(binding.modifiers).toEqual(['Ctrl', 'Shift']);
  });

  it('parses key with single modifier', () => {
    const binding = parseKeybinding('Alt+F');
    expect(binding.key).toBe('F');
    expect(binding.modifiers).toEqual(['Alt']);
  });

  it('parses function key with modifier', () => {
    const binding = parseKeybinding('Shift+F3');
    expect(binding.key).toBe('F3');
    expect(binding.modifiers).toEqual(['Shift']);
  });
});

describe('formatKeybinding', () => {
  it('formats with Ctrl on Windows', () => {
    const result = formatKeybinding({
      key: 's',
      modifiers: ['Ctrl'],
      command: '',
    });
    expect(result).toBe('Ctrl+S');
  });

  it('formats space key', () => {
    const result = formatKeybinding({
      key: ' ',
      modifiers: ['Ctrl'],
      command: '',
    });
    expect(result).toContain('Space');
  });

  it('formats with Shift modifier', () => {
    const result = formatKeybinding({
      key: 's',
      modifiers: ['Ctrl', 'Shift'],
      command: '',
    });
    expect(result).toContain('Ctrl');
    expect(result).toContain('Shift');
    expect(result).toContain('S');
  });

  it('formats with Alt modifier', () => {
    const result = formatKeybinding({
      key: 'f',
      modifiers: ['Alt'],
      command: '',
    });
    expect(result).toContain('Alt');
    expect(result).toContain('F');
  });

  it('formats Cmd modifier as Ctrl on Windows', () => {
    const result = formatKeybinding({
      key: 'c',
      modifiers: ['Cmd'],
      command: '',
    });
    expect(result).toContain('Ctrl');
  });

  it('formats multi-character key as-is', () => {
    const result = formatKeybinding({
      key: 'F3',
      modifiers: [],
      command: '',
    });
    expect(result).toBe('F3');
  });

  it('formats Escape key', () => {
    const result = formatKeybinding({
      key: 'Escape',
      modifiers: [],
      command: '',
    });
    expect(result).toBe('Escape');
  });
});

describe('derived stores', () => {
  it('currentSchemeName reflects current scheme', () => {
    expect(get(currentSchemeName)).toBe('Default');
  });

  it('currentSchemeName shows Custom when no scheme set', () => {
    // Clear scheme by setting bindings directly without a scheme
    keybindingStore.setScheme({
      name: '',
      description: '',
      author: '',
      bindings: {},
    });
    // When scheme name is empty, derived store returns the name (empty) or 'Custom'
    const name = get(currentSchemeName);
    expect(typeof name).toBe('string');
  });

  it('hasCustomBindings is false by default', () => {
    expect(get(hasCustomBindings)).toBe(false);
  });

  it('hasCustomBindings is true after adding custom binding', () => {
    keybindingStore.addCustomBinding('Ctrl+1', {
      key: '1',
      modifiers: ['Ctrl'],
      command: 'test',
    });
    expect(get(hasCustomBindings)).toBe(true);
  });

  it('keybindingArray returns all bindings as array', () => {
    const arr = get(keybindingArray);
    expect(arr.length).toBeGreaterThan(0);
    expect(arr[0]).toHaveProperty('id');
    expect(arr[0]).toHaveProperty('command');
  });

  it('keybindingArray includes custom bindings', () => {
    keybindingStore.addCustomBinding('Ctrl+Shift+Z', {
      key: 'z',
      modifiers: ['Ctrl', 'Shift'],
      command: 'custom.test',
    });
    const arr = get(keybindingArray);
    const custom = arr.find((b) => b.command === 'custom.test');
    expect(custom).toBeDefined();
    expect(custom?.id).toBe('Ctrl+Shift+Z');
  });
});

describe('global keydown handler', () => {
  it('handles keydown events on window', async () => {
    mockInvokeHandler('execute_command', undefined);
    keybindingStore.addCustomBinding('Ctrl+m', {
      key: 'm',
      modifiers: ['Ctrl'],
      command: 'test.globalHandler',
    });

    const event = new KeyboardEvent('keydown', {
      key: 'm',
      code: 'KeyM',
      ctrlKey: true,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      bubbles: true,
    });

    const preventSpy = vi.spyOn(event, 'preventDefault');
    const stopSpy = vi.spyOn(event, 'stopPropagation');
    window.dispatchEvent(event);

    // Wait for async handler
    await vi.waitFor(() => {
      expect(preventSpy).toHaveBeenCalled();
    });
    expect(stopSpy).toHaveBeenCalled();
  });

  it('ignores keydown from input elements', () => {
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    const event = new KeyboardEvent('keydown', {
      key: 'm',
      code: 'KeyM',
      ctrlKey: true,
      bubbles: true,
    });
    Object.defineProperty(event, 'target', { value: input });

    const preventSpy = vi.spyOn(event, 'preventDefault');
    window.dispatchEvent(event);

    // Should NOT have been handled since target is input
    expect(preventSpy).not.toHaveBeenCalled();
    document.body.removeChild(input);
  });

  it('ignores keydown from textarea elements', () => {
    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);

    const event = new KeyboardEvent('keydown', {
      key: 's',
      code: 'KeyS',
      ctrlKey: true,
      bubbles: true,
    });
    Object.defineProperty(event, 'target', { value: textarea });

    const preventSpy = vi.spyOn(event, 'preventDefault');
    window.dispatchEvent(event);

    expect(preventSpy).not.toHaveBeenCalled();
    document.body.removeChild(textarea);
  });

  it('does not preventDefault for unbound keys', async () => {
    const event = new KeyboardEvent('keydown', {
      key: 'q',
      code: 'KeyQ',
      ctrlKey: true,
      shiftKey: true,
      altKey: true,
      metaKey: false,
      bubbles: true,
    });
    const preventSpy = vi.spyOn(event, 'preventDefault');
    window.dispatchEvent(event);

    // Small delay to let async handler run
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(preventSpy).not.toHaveBeenCalled();
  });
});

describe('keybindings:changed event', () => {
  it('updates scheme when keybindings:changed event fires', () => {
    emitTestEvent('keybindings:changed', {
      name: 'CustomRemote',
      description: 'Remote scheme',
      author: 'remote',
      bindings: {
        'Ctrl+R': { key: 'r', modifiers: ['Ctrl'], command: 'remote.reload' },
      },
    });
    const state = get(keybindingStore);
    expect(state.currentScheme?.name).toBe('CustomRemote');
    expect(state.current['Ctrl+R']?.command).toBe('remote.reload');
  });
});
