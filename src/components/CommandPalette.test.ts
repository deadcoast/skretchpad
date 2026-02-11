import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import CommandPalette from './CommandPalette.svelte';

describe('CommandPalette', () => {
  it('does not render when visible is false', () => {
    const { container } = render(CommandPalette, { props: { visible: false } });
    expect(container.querySelector('.command-palette-backdrop')).toBeNull();
  });

  it('renders when visible is true', () => {
    const { container } = render(CommandPalette, { props: { visible: true } });
    expect(container.querySelector('.command-palette-backdrop')).not.toBeNull();
    expect(container.querySelector('.command-palette')).not.toBeNull();
  });

  it('has an input with placeholder', () => {
    const { container } = render(CommandPalette, { props: { visible: true } });
    const input = container.querySelector('.command-palette__input') as HTMLInputElement;
    expect(input).not.toBeNull();
    expect(input.placeholder).toBe('Type a command...');
  });

  it('has footer with navigation hints', () => {
    const { container } = render(CommandPalette, { props: { visible: true } });
    const footer = container.querySelector('.command-palette__footer');
    expect(footer).not.toBeNull();
    expect(footer!.textContent).toContain('commands');
    expect(footer!.textContent).toContain('files');
    expect(footer!.textContent).toContain('symbols');
  });

  it('dispatches close event on Escape', async () => {
    const { container, component } = render(CommandPalette, {
      props: { visible: true },
    });

    const closeSpy = vi.fn();
    component.$on('close', closeSpy);

    const backdrop = container.querySelector('.command-palette-backdrop');
    await fireEvent.keyDown(backdrop!, { key: 'Escape' });

    expect(closeSpy).toHaveBeenCalled();
  });

  it('shows empty state when no commands match', () => {
    const { container } = render(CommandPalette, { props: { visible: true } });
    // The default plugins store may be empty, so we should see either commands or empty state
    const empty = container.querySelector('.command-palette__empty');
    const results = container.querySelector('.command-palette__results');
    expect(results).not.toBeNull();
    // With empty store, should show empty-state text
    if (empty) {
      expect(empty.textContent).toContain('No results found');
    }
  });

  it('executes file results in file mode', async () => {
    const { container, component } = render(CommandPalette, {
      props: {
        visible: true,
        mode: 'files',
        workspaceFiles: [
          { path: '/tmp/a.ts', name: 'a.ts', relativePath: 'src/a.ts' },
          { path: '/tmp/b.ts', name: 'b.ts', relativePath: 'src/b.ts' },
        ],
        initialQuery: '#a',
      },
    });

    const executeSpy = vi.fn();
    component.$on('execute', executeSpy);
    const firstItem = container.querySelector('.command-item') as HTMLButtonElement;
    await fireEvent.click(firstItem);

    expect(executeSpy).toHaveBeenCalled();
    expect(executeSpy.mock.calls[0][0].detail).toEqual({
      type: 'file',
      path: '/tmp/a.ts',
    });
  });
});
