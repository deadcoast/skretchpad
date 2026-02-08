import { vi } from 'vitest';

export const save = vi.fn(async () => null);
export const open = vi.fn(async () => null);
export const ask = vi.fn(async () => false);
export const confirm = vi.fn(async () => false);
export const message = vi.fn(async () => {});
