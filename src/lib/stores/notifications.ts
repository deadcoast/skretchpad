// src/lib/stores/notifications.ts

import { writable, derived } from 'svelte/store';

// ============================================================================
// TYPES
// ============================================================================

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface Notification {
  id: string;
  message: string;
  type: NotificationType;
  duration: number;
  action?: {
    label: string;
    callback: () => void;
  };
  createdAt: number;
}

// ============================================================================
// STORE
// ============================================================================

const DEFAULTS = {
  duration: 4000,
  maxNotifications: 5,
};

let nextId = 0;

function createNotificationStore() {
  const { subscribe, update } = writable<Notification[]>([]);

  function add(
    message: string,
    options: {
      type?: NotificationType;
      duration?: number;
      action?: { label: string; callback: () => void };
    } = {}
  ): string {
    const id = `notif-${++nextId}`;
    const notification: Notification = {
      id,
      message,
      type: options.type || 'info',
      duration: options.duration ?? DEFAULTS.duration,
      action: options.action,
      createdAt: Date.now(),
    };

    update((current) => {
      const next = [...current, notification];
      // Trim to max
      if (next.length > DEFAULTS.maxNotifications) {
        return next.slice(next.length - DEFAULTS.maxNotifications);
      }
      return next;
    });

    // Auto-dismiss after duration (0 = persistent)
    if (notification.duration > 0) {
      setTimeout(() => dismiss(id), notification.duration);
    }

    return id;
  }

  function dismiss(id: string) {
    update((current) => current.filter((n) => n.id !== id));
  }

  function clear() {
    update(() => []);
  }

  return {
    subscribe,
    add,
    dismiss,
    clear,
    // Convenience methods
    info: (
      msg: string,
      opts?: { duration?: number; action?: { label: string; callback: () => void } }
    ) => add(msg, { ...opts, type: 'info' }),
    success: (
      msg: string,
      opts?: { duration?: number; action?: { label: string; callback: () => void } }
    ) => add(msg, { ...opts, type: 'success' }),
    warning: (
      msg: string,
      opts?: { duration?: number; action?: { label: string; callback: () => void } }
    ) => add(msg, { ...opts, type: 'warning' }),
    error: (
      msg: string,
      opts?: { duration?: number; action?: { label: string; callback: () => void } }
    ) => add(msg, { ...opts, type: 'error' }),
  };
}

export const notifications = createNotificationStore();

// Derived store: notification count
export const notificationCount = derived(notifications, ($n) => $n.length);
