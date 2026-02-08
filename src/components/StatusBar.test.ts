import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import StatusBar from './StatusBar.svelte';

describe('StatusBar', () => {
  it('renders the status bar element', () => {
    const { container } = render(StatusBar);
    expect(container.querySelector('.status-bar')).not.toBeNull();
  });

  it('has left and right sections', () => {
    const { container } = render(StatusBar);
    expect(container.querySelector('.status-bar__left')).not.toBeNull();
    expect(container.querySelector('.status-bar__right')).not.toBeNull();
  });

  it('shows plugins button', () => {
    const { container } = render(StatusBar);
    const pluginBtn = container.querySelector('[aria-label="Plugins"]');
    expect(pluginBtn).not.toBeNull();
  });

  it('renders with menuVisible prop', () => {
    const { container } = render(StatusBar, { props: { menuVisible: true } });
    const bar = container.querySelector('.status-bar');
    expect(bar).not.toBeNull();
    // When menuVisible=true, should NOT have the minimal class
    expect(bar!.classList.contains('status-bar--minimal')).toBe(false);
  });

  it('applies minimal class when menuVisible is false', () => {
    const { container } = render(StatusBar, { props: { menuVisible: false } });
    const bar = container.querySelector('.status-bar');
    expect(bar!.classList.contains('status-bar--minimal')).toBe(true);
  });
});
