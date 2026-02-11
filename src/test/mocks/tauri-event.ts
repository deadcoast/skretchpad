import { vi } from 'vitest';

type EventCallback = (event: { payload: unknown }) => void;

const listeners = new Map<string, Set<EventCallback>>();

export const listen = vi.fn(async (event: string, handler: EventCallback) => {
  let eventListeners = listeners.get(event);
  if (!eventListeners) {
    eventListeners = new Set();
    listeners.set(event, eventListeners);
  }
  eventListeners.add(handler);

  // Return unlisten function
  return () => {
    listeners.get(event)?.delete(handler);
  };
});

export const emit = vi.fn(async (_event: string, _payload?: unknown) => {});

export const once = vi.fn(async (event: string, handler: EventCallback) => {
  const wrappedHandler: EventCallback = (e) => {
    handler(e);
    listeners.get(event)?.delete(wrappedHandler);
  };

  let eventListeners = listeners.get(event);
  if (!eventListeners) {
    eventListeners = new Set();
    listeners.set(event, eventListeners);
  }
  eventListeners.add(wrappedHandler);

  return () => {
    listeners.get(event)?.delete(wrappedHandler);
  };
});

export function emitTestEvent(event: string, payload: unknown): void {
  const callbacks = listeners.get(event);
  if (callbacks) {
    for (const cb of callbacks) {
      cb({ payload });
    }
  }
}

export function clearListeners(): void {
  listeners.clear();
  listen.mockClear();
  emit.mockClear();
  once.mockClear();
}
