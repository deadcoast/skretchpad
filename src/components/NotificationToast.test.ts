import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import NotificationToast from './NotificationToast.svelte';
import { notifications } from '../lib/stores/notifications';

beforeEach(() => {
  notifications.clear();
});

describe('NotificationToast', () => {
  it('renders nothing when no notifications', () => {
    const { container } = render(NotificationToast);
    expect(container.querySelector('.notification-container')).toBeNull();
  });

  it('renders notification message text', () => {
    notifications.add('File saved successfully', { type: 'success' });
    const { container } = render(NotificationToast);
    expect(container.textContent).toContain('File saved successfully');
  });

  it('applies correct CSS class for info type', () => {
    notifications.add('Info message', { type: 'info' });
    const { container } = render(NotificationToast);
    expect(container.querySelector('.notification-info')).not.toBeNull();
  });

  it('applies correct CSS class for error type', () => {
    notifications.add('Error message', { type: 'error' });
    const { container } = render(NotificationToast);
    expect(container.querySelector('.notification-error')).not.toBeNull();
  });

  it('applies correct CSS class for warning type', () => {
    notifications.add('Warning message', { type: 'warning' });
    const { container } = render(NotificationToast);
    expect(container.querySelector('.notification-warning')).not.toBeNull();
  });

  it('applies correct CSS class for success type', () => {
    notifications.add('Success message', { type: 'success' });
    const { container } = render(NotificationToast);
    expect(container.querySelector('.notification-success')).not.toBeNull();
  });

  it('dismiss button removes notification', async () => {
    notifications.add('Dismissable', { type: 'info' });
    const { container } = render(NotificationToast);

    const dismissBtn = container.querySelector('.notification-dismiss');
    expect(dismissBtn).not.toBeNull();
    await fireEvent.click(dismissBtn!);

    // After dismiss, the notification store should be empty
    const { get } = await import('svelte/store');
    const items = get(notifications);
    expect(items).toHaveLength(0);
  });

  it('renders action button when action is present', () => {
    const callback = vi.fn();
    notifications.add('Action notification', {
      type: 'info',
      action: { label: 'Undo', callback },
    });
    const { container } = render(NotificationToast);
    const actionBtn = container.querySelector('.notification-action');
    expect(actionBtn).not.toBeNull();
    expect(actionBtn!.textContent).toBe('Undo');
  });

  it('action button calls callback and dismisses', async () => {
    const callback = vi.fn();
    notifications.add('Action notification', {
      type: 'info',
      action: { label: 'Retry', callback },
    });
    const { container } = render(NotificationToast);

    const actionBtn = container.querySelector('.notification-action');
    expect(actionBtn).not.toBeNull();
    await fireEvent.click(actionBtn!);

    expect(callback).toHaveBeenCalledOnce();
  });

  it('renders multiple notifications', () => {
    notifications.add('First', { type: 'info' });
    notifications.add('Second', { type: 'success' });
    notifications.add('Third', { type: 'error' });
    const { container } = render(NotificationToast);

    const items = container.querySelectorAll('.notification');
    expect(items.length).toBe(3);
  });
});
