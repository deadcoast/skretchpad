import { vi } from 'vitest';

type InvokeHandler = (args?: Record<string, unknown>) => unknown;

const handlers = new Map<string, InvokeHandler>();

export const invoke = vi.fn(async (cmd: string, args?: Record<string, unknown>) => {
  const handler = handlers.get(cmd);
  if (handler) {
    return handler(args);
  }
  return undefined;
});

export function mockInvokeHandler(cmd: string, handler: InvokeHandler): void {
  handlers.set(cmd, handler);
}

export function clearInvokeHandlers(): void {
  handlers.clear();
  invoke.mockClear();
}
