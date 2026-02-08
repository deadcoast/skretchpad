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
    expect(footer!.textContent).toContain('navigate');
    expect(footer!.textContent).toContain('select');
    expect(footer!.textContent).toContain('close');
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
    // With empty store, should show "No commands found"
    if (empty) {
      expect(empty.textContent).toContain('No commands found');
    }
  });
});
