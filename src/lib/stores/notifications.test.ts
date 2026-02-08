import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { get } from 'svelte/store';

// We need to reset the module between tests to get fresh store instances
// notifications.ts uses a module-level singleton
let notifications: typeof import('./notifications').notifications;
let notificationCount: typeof import('./notifications').notificationCount;

beforeEach(async () => {
  vi.useFakeTimers();
  // Dynamic import to get fresh module state
  const mod = await import('./notifications');
  notifications = mod.notifications;
  notificationCount = mod.notificationCount;
  // Clear any existing notifications
  notifications.clear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('notifications store', () => {
  it('starts empty', () => {
    expect(get(notifications)).toEqual([]);
  });

  it('add() creates notification with defaults', () => {
    notifications.add('Hello');
    const items = get(notifications);
    expect(items).toHaveLength(1);
    expect(items[0].message).toBe('Hello');
    expect(items[0].type).toBe('info');
    expect(items[0].duration).toBe(4000);
  });

  it('add() returns unique IDs', () => {
    const id1 = notifications.add('First');
    const id2 = notifications.add('Second');
    expect(id1).not.toBe(id2);
  });

  it('custom type and duration options work', () => {
    notifications.add('Error!', { type: 'error', duration: 8000 });
    const items = get(notifications);
    expect(items[0].type).toBe('error');
    expect(items[0].duration).toBe(8000);
  });

  it('duration=0 creates persistent notification', () => {
    notifications.add('Persistent', { duration: 0 });
    vi.advanceTimersByTime(10000);
    const items = get(notifications);
    expect(items).toHaveLength(1);
  });

  it('trims to max 5 notifications', () => {
    for (let i = 0; i < 7; i++) {
      notifications.add(`Message ${i}`);
    }
    const items = get(notifications);
    expect(items).toHaveLength(5);
    // Should keep the most recent 5
    expect(items[0].message).toBe('Message 2');
    expect(items[4].message).toBe('Message 6');
  });

  it('dismiss(id) removes specific notification', () => {
    const id = notifications.add('To dismiss');
    notifications.add('Keep this');
    notifications.dismiss(id);
    const items = get(notifications);
    expect(items).toHaveLength(1);
    expect(items[0].message).toBe('Keep this');
  });

  it('dismiss with non-existent ID is no-op', () => {
    notifications.add('Keep');
    notifications.dismiss('non-existent-id');
    expect(get(notifications)).toHaveLength(1);
  });

  it('clear() removes all', () => {
    notifications.add('A');
    notifications.add('B');
    notifications.clear();
    expect(get(notifications)).toEqual([]);
  });

  it('info() sets correct type', () => {
    notifications.info('Info message');
    expect(get(notifications)[0].type).toBe('info');
  });

  it('success() sets correct type', () => {
    notifications.success('Success!');
    expect(get(notifications)[0].type).toBe('success');
  });

  it('warning() sets correct type', () => {
    notifications.warning('Warning!');
    expect(get(notifications)[0].type).toBe('warning');
  });

  it('error() sets correct type', () => {
    notifications.error('Error!');
    expect(get(notifications)[0].type).toBe('error');
  });

  it('auto-dismiss fires after duration', () => {
    notifications.add('Auto dismiss', { duration: 2000 });
    expect(get(notifications)).toHaveLength(1);
    vi.advanceTimersByTime(2000);
    expect(get(notifications)).toHaveLength(0);
  });

  it('notificationCount derived store tracks length', () => {
    expect(get(notificationCount)).toBe(0);
    notifications.add('A');
    expect(get(notificationCount)).toBe(1);
    notifications.add('B');
    expect(get(notificationCount)).toBe(2);
    notifications.clear();
    expect(get(notificationCount)).toBe(0);
  });
});
